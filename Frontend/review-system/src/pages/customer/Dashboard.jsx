import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar, FaCoins, FaHistory, FaPenAlt, FaSearch, FaArrowRight, FaWallet, FaInfoCircle, FaEnvelope } from 'react-icons/fa';
import { fetchMyReviews, fetchPublicBusinesses, fetchMyProfile, updateMyProfile, fetchUnreadSupportCount } from '../../services/api';
import WalletAccountPicker from '../../components/WalletAccountPicker';
import { requestMetaMaskAccounts, shortenAddress } from '../../utils/walletConnection';
import { MdDashboard, MdNotificationsActive } from 'react-icons/md';

// =================================================================
// Reusable Child Components
// =================================================================

const Notification = ({ message, type, onDismiss }) => (
    <div style={{ ...styles.notification, ...(type === 'error' ? styles.notificationError : styles.notificationSuccess) }}>
        <FaInfoCircle style={{ marginRight: '0.75rem' }} />
        <span>{message}</span>
        <button onClick={onDismiss} style={styles.notificationDismiss}>&times;</button>
    </div>
);

// NEW: Redesigned Wallet Connection Prompt
const ConnectWalletPrompt = ({ onConnect, isConnecting }) => {
    return (
        <div style={styles.walletPromptCard}>
            <div style={styles.walletPromptIconContainer}>
                <FaWallet />
            </div>
            <div style={styles.walletPromptContent}>
                <h3 style={styles.walletPromptTitle}>Level Up Your Account!</h3>
                <p style={styles.walletPromptText}>
                    Connect your wallet to unlock the full power of ChainProof. Earn coin rewards for your reviews and secure your contributions on the blockchain.
                </p>
            </div>
            <button onClick={onConnect} disabled={isConnecting} style={{...styles.connectWalletButton, opacity: isConnecting ? 0.7 : 1}} className="action-button-hover">
                {isConnecting ? 'Connecting...' : 'Connect Your Wallet'}
            </button>
        </div>
    );
};


// =================================================================
// Main Customer Dashboard Component
// =================================================================
function CustomerDashboard() {
  const navigate = useNavigate();
  
  // --- State Management ---
  const [userData, setUserData] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  
  const [wallet, setWallet] = useState({ isConnected: false, address: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [accountsToPick, setAccountsToPick] = useState(null);

  // --- Load real data from localStorage + API ---
  const loadData = useCallback(async () => {
    const username = localStorage.getItem('username') || 'User';
    const email = localStorage.getItem('email') || '';

    setUserData({
      name: username,
      email,
      joinDate: '',
      totalReviews: 0,
      coins: 0,
      avgRating: 0,
      walletAddress: null,
    });

    try {
      const [myReviews, bizList, profile, unreadRes] = await Promise.all([
        fetchMyReviews(),
        fetchPublicBusinesses(),
        fetchMyProfile(),
        fetchUnreadSupportCount().catch(() => ({ count: 0 })),
      ]);
      setUnreadSupportCount(unreadRes?.count ?? 0);

      const avgRating = myReviews.length > 0
        ? parseFloat((myReviews.reduce((a, r) => a + r.rating, 0) / myReviews.length).toFixed(1))
        : 0;

      const walletAddress = profile.wallet_address || '';
      const walletConnectedOnce = profile.wallet_connected_once || false;

      setUserData(prev => ({
        ...prev,
        totalReviews: myReviews.length,
        coins: myReviews.filter(r => r.status === 'Approved').length,
        avgRating,
        walletAddress,
        walletConnectedOnce,
      }));

      if (walletAddress) {
        setWallet({ isConnected: true, address: walletAddress });
      }

      setRecentReviews(myReviews.slice(0, 5).map(r => ({
        id: r.id,
        business: r.business_name,
        rating: r.rating,
        comment: r.content,
        date: r.created_at,
        likes: 0,
        blockchain_hash: r.blockchain_hash,
      })));

      // Recommendations: businesses the user hasn't reviewed
      const reviewedIds = new Set(myReviews.map(r => r.business));
      const recs = (bizList || []).filter(b => !reviewedIds.has(b.id)).slice(0, 3);
      setRecommendations(recs.map(b => ({
        id: b.id,
        name: b.name,
        type: b.category,
        image: b.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=1E40AF&color=fff&size=300`,
      })));

      setNotifications([
        { id: 1, message: `You have written ${myReviews.length} review(s). Keep going!`, read: false, time: 'Just now', link: '/customer/dashboard' },
      ]);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Helper Functions ---
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type }), 5000);
  };
  
  const renderStars = (rating) => {
    return Array(5).fill(null).map((_, i) => (
      <FaStar key={i} style={{ color: i < Math.floor(rating) ? "var(--button-bg)" : "var(--card-border)" }} />
    ));
  };
  
  // --- Wallet Connection Logic (real MetaMask, account picker when multiple) ---
  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    showNotification("Opening MetaMask - please select your account...", "success");
    try {
      const accounts = await requestMetaMaskAccounts();
      if (!accounts || accounts.length === 0) {
        showNotification("No accounts found. Please add an account in MetaMask.", "error");
        return;
      }
      if (accounts.length > 1) {
        setAccountsToPick(accounts);
        return;
      }
      await saveWalletToProfile(accounts[0]);
    } catch (err) {
      const w = err?.data?.wallet_address;
      let msg = (Array.isArray(w) ? w[0] : w) || err?.data?.detail || err?.message || "Wallet connection cancelled or failed.";
      if (typeof msg === 'string' && msg.toLowerCase().includes('already exists')) {
        msg = "This wallet is already connected to another account. Please use a different MetaMask account.";
      }
      showNotification(typeof msg === 'string' ? msg : "Wallet connection cancelled or failed.", "error");
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const saveWalletToProfile = async (address) => {
    try {
      await updateMyProfile({ wallet_address: address });
      setWallet({ isConnected: true, address });
      setUserData(prev => ({ ...prev, walletAddress: address, walletConnectedOnce: true }));
      showNotification(`Wallet connected: ${shortenAddress(address)}`, "success");
    } catch (err) {
      const w = err?.data?.wallet_address;
      let msg = (Array.isArray(w) ? w[0] : w) || err?.data?.detail || err?.message || "Failed to save wallet.";
      showNotification(typeof msg === 'string' ? msg : "Failed to save wallet.", "error");
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleAccountPicked = (address) => {
    setAccountsToPick(null);
    saveWalletToProfile(address);
  };


  const animationStyles = `
    .action-button-hover { transition: all 0.2s ease-in-out; }
    .action-button-hover:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
    .recommendation-card-hover { transition: all 0.2s ease-in-out; }
    .recommendation-card-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
    
    @keyframes pulseGlow {
      0%, 100% {
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        border-color: var(--card-border);
      }
      50% {
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25);
        border-color: rgba(59, 130, 246, 0.7);
      }
    }
  `;

  if (!userData) {
    return <div style={styles.loader}>Loading dashboard...</div>;
  }

  const progress = (userData.totalReviews / 10) * 100;

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
        <style>{animationStyles}</style>
        {accountsToPick && (
          <WalletAccountPicker
            accounts={accountsToPick}
            onSelect={handleAccountPicked}
            onCancel={() => { setAccountsToPick(null); setIsConnectingWallet(false); }}
          />
        )}
        {notification.show && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ ...notification, show: false })} />}

        <section style={styles.hero}>
            <MdDashboard style={styles.heroIcon}/>
            <h1 style={styles.heroTitle}>Welcome back, {userData.name}!</h1>
            <p style={styles.heroSubtitle}>Here's a summary of your activity and rewards.</p>
        </section>

        <main style={styles.main}>
            {/* Wallet Connect Prompt — show when disconnected; hide when connected; reappears if user disconnects */}
            {!wallet.isConnected && (
                <ConnectWalletPrompt onConnect={handleConnectWallet} isConnecting={isConnectingWallet} />
            )}

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}><FaCoins style={styles.statIcon} /><div><p style={styles.statValue}>{userData.coins}</p><p style={styles.statTitle}>Your Coins</p></div></div>
                <div style={styles.statCard}><FaStar style={styles.statIcon} /><div><p style={styles.statValue}>{(+(userData.avgRating || 0)).toFixed(1)}</p><p style={styles.statTitle}>Average Rating</p></div></div>
                <div style={styles.statCard}><FaHistory style={styles.statIcon} /><div><p style={styles.statValue}>{userData.totalReviews}</p><p style={styles.statTitle}>Reviews Written</p></div></div>
                
                {wallet.isConnected ? (
                    <div style={styles.statCard}>
                        <FaWallet style={styles.statIcon} />
                        <div>
                            <p style={styles.statTitle}>Wallet Connected</p>
                            <p style={styles.walletAddress}>{shortenAddress(wallet.address)}</p>
                        </div>
                    </div>
                ) : (
                    <div style={styles.statCard}>
                        <div style={{width: '100%'}}>
                            <p style={styles.statTitle}>Contributor Level</p>
                            <div style={styles.progressBarContainer}>
                                <div style={{...styles.progressBar, width: `${progress}%`}}></div>
                            </div>
                            <p style={styles.progressText}>{10 - userData.totalReviews} reviews to next level!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div style={styles.layoutGrid}>
                {/* Left Side: Recent Reviews */}
                <div style={styles.mainContent}>
                    <h2 style={styles.sectionTitle}>Your Recent Reviews</h2>
                    {recentReviews.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {recentReviews.map(review => (
                                <div key={review.id} style={styles.reviewCard}>
                                    <div style={styles.reviewHeader}>
                                        <h3 style={styles.reviewBusiness}>{review.business}</h3>
                                        <div style={styles.reviewRating}>{renderStars(review.rating)}</div>
                                    </div>
                                    <p style={styles.reviewComment}>"{review.comment}"</p>
                                    <p style={styles.reviewDate}>Reviewed on: {new Date(review.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>You haven't written any reviews yet.</p>
                    )}
                </div>

                {/* Right Side: Notifications & Actions */}
                <aside style={styles.sidebar}>
                    <div style={styles.sidebarCard}>
                      <h3 style={styles.sectionTitle}>Quick Actions</h3>
                      <div style={styles.actionsContainer}>
                        <Link to="/explore" style={styles.actionButton} className="action-button-hover"><FaSearch /> Explore Businesses</Link>
                        <button onClick={() => navigate('/customer/review')} style={{...styles.actionButton, ...styles.actionButtonSecondary}} className="action-button-hover"><FaPenAlt /> Write a New Review</button>
                      </div>
                    </div>
                    {unreadSupportCount > 0 && (
                      <Link to="/customer/inbox" style={{ textDecoration: 'none' }}>
                        <div style={styles.inboxNotifyCard}>
                          <FaEnvelope style={{ fontSize: '1.5rem', flexShrink: 0 }} />
                          <div>
                            <p style={{ margin: 0, fontWeight: '600', color: 'var(--header-text)' }}>New message{unreadSupportCount > 1 ? 's' : ''} from admin</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>You have {unreadSupportCount} unread reply{unreadSupportCount > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </Link>
                    )}
                    <div style={styles.sidebarCard}>
                      <h3 style={styles.sectionTitle}><MdNotificationsActive /> Notifications</h3>
                      {notifications.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          {notifications.map(notification => (
                            <Link to={notification.link} key={notification.id} style={{textDecoration: 'none'}}>
                                <div style={notification.read ? styles.notificationItemRead : styles.notificationItemUnread}>
                                    <p style={styles.notificationMessage}>{notification.message}</p>
                                    <p style={styles.notificationTime}>{notification.time}</p>
                                </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p>No new notifications.</p>
                      )}
                    </div>
                </aside>
            </div>

            {/* Recommendations Section */}
            <section style={{...styles.section, marginTop: '2.5rem'}}>
                <h2 style={styles.sectionTitle}>Recommended For You</h2>
                <div style={styles.recommendationsGrid}>
                    {recommendations.map(rec => (
                        <Link to={`/business/${rec.id}`} key={rec.id} style={styles.recommendationCard} className="recommendation-card-hover">
                            <img src={rec.image} alt={rec.name} style={styles.recommendationImage}/>
                            <div style={styles.recommendationContent}>
                                <h4 style={styles.recommendationName}>{rec.name}</h4>
                                <p style={styles.recommendationType}>{rec.type}</p>
                                <span style={styles.recommendationLink}>View Business <FaArrowRight/></span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    </div>
  );
};

const styles = {
    // --- UPDATED styles for Wallet Connect Prompt ---
    walletPromptCard: {
        backgroundColor: 'var(--hero-bg)',
        padding: '2rem',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.5rem',
        marginBottom: '2.5rem',
        border: '1px solid var(--card-border)',
        // New animation property
        animation: 'pulseGlow 2.5s infinite',
    },
    walletPromptIconContainer: {
        fontSize: '3rem',
        color: 'var(--button-bg)',
        backgroundColor: 'var(--card-bg)',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow)',
    },
    walletPromptContent: {},
    walletPromptTitle: {
        margin: '0 0 0.75rem 0',
        fontSize: '1.5rem',
        color: 'var(--header-text)',
        fontWeight: '700',
    },
    walletPromptText: {
        margin: 0,
        opacity: 0.8,
        lineHeight: 1.6,
        maxWidth: '600px',
    },
    connectWalletButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: 'center',
        gap: "0.75rem",
        padding: "0.9rem 2rem",
        backgroundColor: "var(--button-bg)",
        color: "white",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "600",
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem',
    },
    walletAddress: {
        fontSize: '0.9rem',
        fontFamily: 'monospace',
        margin: 0,
        fontWeight: 'bold',
        color: 'var(--button-bg)',
    },

    // --- Notification styles ---
    notification: {
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1000,
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        fontSize: '0.95rem',
        minWidth: '350px'
    },
    notificationSuccess: { backgroundColor: '#10B981' },
    notificationError: { backgroundColor: '#EF4444' },
    notificationDismiss: {
        background: 'none',
        border: 'none',
        color: 'white',
        marginLeft: 'auto',
        paddingLeft: '1.5rem',
        fontSize: '1.5rem',
        cursor: 'pointer',
        lineHeight: 1
    },

    // --- All other styles from your original code ---
    hero: {
        padding: "4rem 2rem",
        textAlign: "center",
        backgroundColor: "var(--hero-bg)",
        borderBottom: "1px solid var(--card-border)",
    },
    heroIcon: {
        fontSize: "3.5rem",
        color: "var(--hero-text)",
        marginBottom: "1rem",
    },
    heroTitle: {
        fontSize: "2.8rem",
        fontWeight: "bold",
        color: "var(--hero-text)",
        marginBottom: "0.5rem",
    },
    heroSubtitle: {
        fontSize: "1.1rem",
        color: "var(--text-color)",
        opacity: 0.9,
    },
    main: {
        maxWidth: "1200px",
        margin: "2rem auto",
        padding: "0 2rem",
        padding: "0 2rem 2rem 2rem",
        marginBottom: '0rem',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem',
    },
    statCard: {
        backgroundColor: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    statIcon: {
        color: 'var(--button-bg)',
        fontSize: '2rem',
        backgroundColor: 'var(--hero-bg)',
        padding: '0.8rem',
        borderRadius: '50%',
    },
    statValue: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        margin: 0,
    },
    statTitle: {
        fontSize: '0.9rem',
        opacity: 0.8,
        margin: 0,
    },
    progressBarContainer: {
        width: '100%',
        height: '8px',
        backgroundColor: 'var(--hero-bg)',
        borderRadius: '4px',
        marginTop: '0.5rem',
    },
    progressBar: {
        height: '100%',
        backgroundColor: 'var(--button-bg)',
        borderRadius: '4px',
    },
    progressText: {
        fontSize: '0.8rem',
        opacity: 0.7,
        margin: '0.5rem 0 0 0',
        textAlign: 'right',
    },
    layoutGrid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2.5rem',
    },
    mainContent: {},
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    section: {},
    sectionTitle: {
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: "var(--header-text)",
        marginBottom: "1.5rem",
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--card-border)',
    },
    reviewCard: {
        backgroundColor: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
    },
    reviewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    reviewBusiness: {
        fontSize: '1.2rem',
        fontWeight: '600',
        margin: 0,
    },
    reviewRating: {
        display: 'flex',
        gap: '0.25rem',
    },
    reviewComment: {
        fontStyle: 'italic',
        opacity: 0.9,
        marginBottom: '1rem',
    },
    reviewDate: {
        fontSize: '0.8rem',
        opacity: 0.7,
        textAlign: 'right',
    },
    sidebarCard: {
        backgroundColor: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
    },
    inboxNotifyCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.5rem',
        marginTop: '1rem',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    actionsContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1rem',
    },
    actionButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: 'center',
        gap: "0.5rem",
        padding: "0.8rem 1rem",
        backgroundColor: "var(--button-bg)",
        color: "white",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "600",
        border: 'none',
        cursor: 'pointer',
        textAlign: 'center',
    },
    actionButtonSecondary: {
        backgroundColor: "var(--card-bg)",
        color: "var(--text-color)",
        border: "1px solid var(--card-border)",
    },
    notificationItemUnread: {
        padding: '1rem',
        backgroundColor: "var(--hero-bg)",
        borderRadius: "8px",
        borderLeft: `4px solid var(--button-bg)`,
        color: 'var(--text-color)',
    },
    notificationItemRead: {
        padding: '1rem',
        borderRadius: "8px",
        borderLeft: `4px solid var(--card-border)`,
        color: 'var(--text-color)',
        opacity: 0.7,
    },
    notificationMessage: {
        margin: 0,
        fontWeight: '500',
    },
    notificationTime: {
        margin: '0.25rem 0 0 0',
        fontSize: '0.8rem',
    },
    recommendationsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
    },
    recommendationCard: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        textDecoration: 'none',
        color: 'var(--text-color)',
    },
    recommendationImage: {
        width: '100%',
        height: '150px',
        objectFit: 'cover',
    },
    recommendationContent: {
        padding: '1rem',
    },
    recommendationName: {
        fontWeight: '600',
        margin: '0 0 0.25rem 0',
    },
    recommendationType: {
        opacity: 0.7,
        fontSize: '0.9rem',
        margin: '0 0 1rem 0',
    },
    recommendationLink: {
        color: 'var(--button-bg)',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    loader: {
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    }
};

export default CustomerDashboard;

