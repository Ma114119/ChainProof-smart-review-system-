import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyBusinesses, fetchStats, fetchMyProfile, updateMyProfile, fetchUnreadSupportCount } from '../../services/api';
import WalletAccountPicker from '../../components/WalletAccountPicker';
import { requestMetaMaskAccounts, shortenAddress } from '../../utils/walletConnection';
import { 
    FaCoins, 
    FaBuilding, 
    FaComments, 
    FaPlus, 
    FaSearch, 
    FaStar, 
    FaEdit, 
    FaCommentDots,
    FaSpinner,
    FaExclamationTriangle,
    FaChartBar,
    FaWallet,
    FaInfoCircle,
    FaChartLine,
    FaEnvelope
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const ConnectWalletPrompt = ({ onConnect, isConnecting }) => {
    return (
        <div style={styles.walletPromptCard}>
            <div style={styles.walletPromptIconContainer}>
                <FaWallet />
            </div>
            <div style={styles.walletPromptContent}>
                <h3 style={styles.walletPromptTitle}>Level Up Your Account!</h3>
                <p style={styles.walletPromptText}>
                    Connect your wallet to unlock the full power of ChainProof. Earn coin rewards and manage your business on the blockchain.
                </p>
            </div>
            <button onClick={onConnect} disabled={isConnecting} style={{...styles.connectWalletButton, opacity: isConnecting ? 0.7 : 1}} className="action-button-hover">
                {isConnecting ? 'Connecting...' : 'Connect Your Wallet'}
            </button>
        </div>
    );
};


// =================================================================
// Main Business Dashboard Component
// =================================================================

function BusinessDashboard() {
    const navigate = useNavigate();
    const [summaryData, setSummaryData] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [allChartData, setAllChartData] = useState({});
    const [recentActivity, setRecentActivity] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState({ id: 'all', name: 'All Businesses' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // NEW: State for wallet and notifications
    const [wallet, setWallet] = useState({ isConnected: false, address: '' });
    const [walletConnectedOnce, setWalletConnectedOnce] = useState(false);
    const [isConnectingWallet, setIsConnectingWallet] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [accountsToPick, setAccountsToPick] = useState(null);
    const [unreadSupportCount, setUnreadSupportCount] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [businessList, stats, profile, unreadRes] = await Promise.all([
                fetchMyBusinesses(),
                fetchStats(),
                fetchMyProfile(),
                fetchUnreadSupportCount().catch(() => ({ count: 0 })),
            ]);
            setUnreadSupportCount(unreadRes?.count ?? 0);

            const wa = profile?.wallet_address || '';
            const wco = profile?.wallet_connected_once || false;
            setWalletConnectedOnce(wco);
            if (wa) setWallet({ isConnected: true, address: wa });

            const normalizedBusinesses = businessList.map(b => ({
                id: b.id,
                name: b.name,
                avgRating: b.avg_rating || 0,
                totalReviews: b.total_reviews || 0,
                status: b.status,
                category: b.category,
            }));

            setSummaryData({
                coins: stats.coins || 0,
                businessCount: stats.businessCount || normalizedBusinesses.length,
                reviewCount: stats.reviewCount || normalizedBusinesses.reduce((a, b) => a + b.totalReviews, 0),
            });
            setBusinesses(normalizedBusinesses);

            // Build chart data: one entry per business + "all"
            const chartMap = { all: [] };
            normalizedBusinesses.forEach(b => { chartMap[b.id] = []; });
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            months.forEach(m => {
                chartMap.all.push({ month: m, reviews: 0 });
                normalizedBusinesses.forEach(b => chartMap[b.id].push({ month: m, reviews: 0 }));
            });
            setAllChartData(chartMap);

            // Recent reviews across all businesses as activity feed
            const activity = normalizedBusinesses.slice(0, 5).map((b, i) => ({
                id: i,
                businessName: b.name,
                user: 'Customer',
                rating: b.avgRating,
                comment: `${b.totalReviews} total review(s)`,
            }));
            setRecentActivity(activity);
        } catch (err) {
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type }), 5000);
    };

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
            setWalletConnectedOnce(true);
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

    const filteredBusinesses = useMemo(() => {
        return businesses.filter(b => 
            b.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [businesses, searchTerm]);

    const handleRowClick = (e, businessId) => {
        if (e.target.closest('button')) return;
        navigate(`/business/profile/${businessId}`); // Adjusted to match likely route structure
    };

    const handleAddBusiness = () => {
        navigate('/owner/manage/new');
    };

    const handleEditBusiness = (businessId) => {
        navigate(`/owner/manage/${businessId}`);
    };

    const handleViewFeedback = (businessId) => {
        navigate(`/owner/reviews/${businessId}`);
    };

    const animationStyles = `
        .stat-card-hover { transition: all 0.3s ease; }
        .stat-card-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .input-focus:focus-within { border-color: var(--button-bg); box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3); }
        .action-button-hover:hover { background-color: var(--hero-bg); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
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

    if (loading) {
        return <div style={styles.loader}><FaSpinner className="spin" /> Loading Dashboard...</div>;
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <FaExclamationTriangle style={styles.errorIcon} />
                <p>{error}</p>
                <button onClick={fetchData} style={styles.retryButton}>Retry</button>
            </div>
        );
    }

    const currentChartData = allChartData[selectedBusiness.id] || [];

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
                <div style={styles.heroContent}>
                    <FaChartLine style={styles.heroIcon} />
                    <h1 style={styles.heroTitle}>Business Dashboard</h1>
                    <p style={styles.heroSubtitle}>Here's an overview of your businesses and their performance.</p>
                </div>
            </section>

            <main style={styles.main}>
                {!wallet.isConnected && (
                    <ConnectWalletPrompt onConnect={handleConnectWallet} isConnecting={isConnectingWallet} />
                )}

                {/* Stats Cards */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard} className="stat-card-hover"><FaCoins style={styles.statIcon} /><div><p style={styles.statValue}>{summaryData.coins.toFixed(2)} RTC</p><p style={styles.statTitle}>Your Coins</p></div></div>
                    <div style={styles.statCard} className="stat-card-hover"><FaBuilding style={styles.statIcon} /><div><p style={styles.statValue}>{summaryData.businessCount}</p><p style={styles.statTitle}>Total Businesses</p></div></div>
                    <div style={styles.statCard} className="stat-card-hover"><FaComments style={styles.statIcon} /><div><p style={styles.statValue}>{summaryData.reviewCount}</p><p style={styles.statTitle}>Total Reviews</p></div></div>
                    {wallet.isConnected && (
                         <div style={styles.statCard} className="stat-card-hover">
                            <FaWallet style={styles.statIcon} />
                            <div>
                                <p style={styles.statTitle}>Wallet Connected</p>
                                <p style={styles.walletAddress}>{shortenAddress(wallet.address)}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Analytics Chart */}
                <div style={styles.chartContainer}>
                    <div style={styles.chartHeader}>
                        <h2 style={styles.sectionTitle}><FaChartBar/> Monthly Analytics for: {selectedBusiness.name}</h2>
                    </div>
                    <div style={styles.businessFilters}>
                        <button onClick={() => setSelectedBusiness({id: 'all', name: 'All Businesses'})} style={selectedBusiness.id === 'all' ? {...styles.filterButton, ...styles.filterButtonActive} : styles.filterButton}>All Businesses</button>
                        {businesses.map(biz => (
                            <button key={biz.id} onClick={() => setSelectedBusiness(biz)} style={selectedBusiness.id === biz.id ? {...styles.filterButton, ...styles.filterButtonActive} : styles.filterButton}>{biz.name}</button>
                        ))}
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={currentChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                            <XAxis dataKey="month" stroke="var(--text-color)" />
                            <YAxis stroke="var(--text-color)"/>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}/>
                            <Bar dataKey="reviews" fill="var(--button-bg)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div style={styles.layoutGrid}>
                    {/* Business List */}
                    <div style={styles.businessListContainer}>
                        <div style={styles.listHeader}>
                            <h2 style={styles.sectionTitle}>Your Businesses</h2>
                            <div style={{display: 'flex', gap: '1rem'}}>
                                <div style={{...styles.searchContainer}} className="input-focus">
                                    <FaSearch style={styles.searchIcon} />
                                    <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput}/>
                                </div>
                                <button onClick={handleAddBusiness} style={styles.addNewButton}><FaPlus /> Add New</button>
                            </div>
                        </div>
                        
                        <div style={styles.businessTable}>
                            <div style={styles.tableHeader}>
                                <div style={{flex: 3}}>Business Name</div>
                                <div style={{flex: 2}}>Average Rating</div>
                                <div style={{flex: 1}}>Reviews</div>
                                <div style={{flex: 2, textAlign: 'right'}}>Actions</div>
                            </div>
                            {filteredBusinesses.map(biz => (
                                <div key={biz.id} style={styles.tableRow} onClick={(e) => handleRowClick(e, biz.id)}>
                                    <div style={{flex: 3, fontWeight: '600'}}>{biz.name}</div>
                                    <div style={{flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem'}}><FaStar style={{color: 'var(--button-bg)'}}/> {biz.avgRating}</div>
                                    <div style={{flex: 1}}>{biz.totalReviews}</div>
                                    <div style={{flex: 2, display: 'flex', justifyContent: 'flex-end', gap: '0.5rem'}}>
                                        <button onClick={(e) => { e.stopPropagation(); handleEditBusiness(biz.id); }} style={styles.actionButton} className="action-button-hover" aria-label={`Edit ${biz.name}`}>
                                            <FaEdit/> Edit
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleViewFeedback(biz.id); }} style={styles.actionButton} className="action-button-hover" aria-label={`View feedback for ${biz.name}`}>
                                            <FaCommentDots/> Feedback
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Recent Activity Feed */}
                    <aside style={styles.sidebar}>
                        {unreadSupportCount > 0 && (
                            <Link to="/business/inbox" style={{ textDecoration: 'none', marginBottom: '1rem', display: 'block' }}>
                                <div style={styles.inboxNotifyCard}>
                                    <FaEnvelope style={{ fontSize: '1.5rem', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '600', color: 'var(--header-text)' }}>New message{unreadSupportCount > 1 ? 's' : ''} from admin</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>You have {unreadSupportCount} unread reply{unreadSupportCount > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            </Link>
                        )}
                        <div style={styles.activityContainer}>
                            <h2 style={styles.sectionTitle}>Recent Activity</h2>
                            {recentActivity.map(activity => (
                                <div key={activity.id} style={styles.activityItem}>
                                    <div style={styles.activityIcon}><FaComments/></div>
                                    <div>
                                        <p style={styles.activityText}><strong>{activity.user}</strong> left a {activity.rating}-star review for <strong>{activity.businessName}</strong>.</p>
                                        <p style={styles.activityComment}>"{activity.comment}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

const styles = {
    // --- UPDATED Hero Styles ---
    hero: {
        padding: "4rem 2rem",
        backgroundColor: "var(--hero-bg)",
        borderBottom: "1px solid var(--card-border)",
        textAlign: "center",
    },
    heroContent: {
        maxWidth: "1200px",
        margin: "0 auto",
    },
    heroIcon: {
        fontSize: "3.5rem",
        color: "var(--hero-text)",
        marginBottom: "1rem",
        opacity: 0.9,
    },
    heroTitle: {
        fontSize: "2.8rem",
        fontWeight: "bold",
        color: "var(--hero-text)",
        margin: "0 0 0.5rem 0",
    },
    heroSubtitle: {
        fontSize: "1.1rem",
        color: "var(--text-color)",
        opacity: 0.9,
        margin: 0,
    },
    
    // --- NEW styles for Wallet Connect Prompt ---
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
        display: "flex", alignItems: "center", justifyContent: 'center', gap: "0.75rem", padding: "0.9rem 2rem",
        backgroundColor: "var(--button-bg)", color: "white", borderRadius: "8px", textDecoration: "none",
        fontWeight: "600", border: 'none', cursor: 'pointer', fontSize: '1rem',
    },
    walletAddress: {
        fontSize: '0.9rem', fontFamily: 'monospace', margin: 0, fontWeight: 'bold', color: 'var(--button-bg)',
    },
    notification: {
        position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', padding: '1rem 1.5rem',
        borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', zIndex: 1000,
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)', fontSize: '0.95rem', minWidth: '350px'
    },
    notificationSuccess: { backgroundColor: '#10B981' },
    notificationError: { backgroundColor: '#EF4444' },
    notificationDismiss: {
        background: 'none', border: 'none', color: 'white', marginLeft: 'auto', paddingLeft: '1.5rem',
        fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1
    },
    // --- All other styles from your original code ---
    main: {maxWidth: "1200px",margin: "2rem auto",padding: "0 2rem",padding: "0 2rem 2rem 2rem",marginBottom: '0rem', },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem', },
    statCard: { backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem', },
    statIcon: { color: 'var(--button-bg)', fontSize: '2rem', backgroundColor: 'var(--hero-bg)', padding: '0.8rem', borderRadius: '50%', },
    statValue: { fontSize: '1.5rem', fontWeight: 'bold', margin: 0, },
    statTitle: { fontSize: '0.9rem', opacity: 0.8, margin: 0, },
    chartContainer: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '2rem', marginBottom: '2.5rem', },
    chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', },
    businessFilters: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', },
    filterButton: { padding: '0.5rem 1rem', backgroundColor: 'var(--hero-bg)', color: 'var(--text-color)', border: '1px solid var(--card-border)', borderRadius: '20px', cursor: 'pointer', },
    filterButtonActive: { backgroundColor: 'var(--button-bg)', color: 'white', borderColor: 'var(--button-bg)', },
    layoutGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem', alignItems: 'start', },
    businessListContainer: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '2rem', },
    listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', },
    sectionTitle: { fontSize: "1.5rem", fontWeight: "bold", color: "var(--header-text)", margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', },
    searchContainer: { display: "flex", alignItems: "center", gap: "0.5rem", width: "250px", backgroundColor: "var(--bg-color)", borderRadius: "8px", padding: "0.5rem 1rem", border: '2px solid var(--card-border)', },
    searchInput: { flex: 1, border: "none", outline: "none", backgroundColor: "transparent", color: "var(--text-color)", fontSize: "0.9rem", },
    searchIcon: { opacity: 0.5, },
    addNewButton: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", backgroundColor: "var(--button-bg)", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "600", border: 'none', },
    businessTable: { width: '100%', },
    tableHeader: { display: 'flex', padding: '0 1rem 1rem 1rem', borderBottom: '1px solid var(--card-border)', fontWeight: '600', opacity: 0.8, },
    tableRow: { display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--card-border)', cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.2s', },
    actionButton: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--card-border)", borderRadius: "8px", cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s ease-in-out', },
    sidebar: { position: 'sticky', top: '100px' },
    inboxNotifyCard: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-color)' },
    activityContainer: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '2rem', },
    activityItem: { display: 'flex', gap: '1rem', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', },
    activityIcon: { color: 'var(--button-bg)', fontSize: '1.2rem', },
    activityText: { margin: 0, lineHeight: 1.5, },
    activityComment: { margin: '0.5rem 0 0 0', fontStyle: 'italic', opacity: 0.8, fontSize: '0.9rem', },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '1.2rem', gap: '1rem', },
    errorContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem', },
    errorIcon: { fontSize: '3rem', color: '#ef4444', },
    retryButton: { padding: '0.8rem 1.5rem', backgroundColor: "var(--button-bg)", color: "white", border: 'none', borderRadius: '8px', cursor: 'pointer', }
};

export default BusinessDashboard;

