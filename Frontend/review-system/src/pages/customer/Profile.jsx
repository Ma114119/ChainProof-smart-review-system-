import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  fetchMyProfile,
  updateMyProfile,
  updateMyProfileWithPicture,
  fetchMyReviews,
  clearAuthData,
  changePassword,
  fetchMyBookmarks,
  removeBookmark,
} from '../../services/api';
import WalletAccountPicker from '../../components/WalletAccountPicker';
import { requestMetaMaskAccounts, shortenAddress } from '../../utils/walletConnection';
import { 
    FaUserEdit, 
    FaHistory, 
    FaCoins, 
    FaStar, 
    FaSignOutAlt, 
    FaLock, 
    FaWallet, 
    FaEnvelope, 
    FaTimes, 
    FaCheck, 
    FaEye, 
    FaEyeSlash,
    FaCamera,
    FaCopy,
    FaCheckCircle,
    FaBookmark,
    FaSpinner,
    FaEthereum,
    FaTrash,
    FaExclamationCircle
} from 'react-icons/fa';

// Password Input Component with Visibility Toggle
const PasswordInput = ({ value, onChange, name, placeholder }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div style={styles.passwordInputWrapper}>
      <input 
        type={isVisible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={styles.input} 
        className="input-focus" 
      />
      <button 
        type="button" 
        onClick={() => setIsVisible(!isVisible)} 
        style={styles.eyeButton}
      >
        {isVisible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
};

function CustomerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [accountsToPick, setAccountsToPick] = useState(null);

  const defaultUser = {
    name: localStorage.getItem('username') || 'User',
    email: localStorage.getItem('email') || '',
    joinDate: '',
    totalReviews: 0,
    coins: 0,
    avgRating: 0,
    walletAddress: '',
    profilePictureUrl: null,
  };

  const [userData, setUserData] = useState(defaultUser);
  const [formData, setFormData] = useState(defaultUser);

  const loadProfile = useCallback(async () => {
    try {
      const [profile, myReviews] = await Promise.all([fetchMyProfile(), fetchMyReviews()]);
      const displayName = profile.display_name || profile.username;
      const approved = (myReviews || []).filter(r => r.status === 'Approved');
      const avgR = approved.length > 0
        ? parseFloat((approved.reduce((a, r) => a + r.rating, 0) / approved.length).toFixed(1))
        : 0;
      const walletAddress = profile.wallet_address || '';
      const fresh = {
        name: displayName,
        email: profile.email,
        joinDate: profile.date_joined || '',
        totalReviews: myReviews.length,
        coins: approved.length,
        avgRating: avgR,
        walletAddress,
        profilePictureUrl: profile.profile_picture_url || null,
      };
      setUserData(fresh);
      setFormData(fresh);
      if (walletAddress) localStorage.setItem('walletAddress', walletAddress);
      else localStorage.removeItem('walletAddress');
      if (profile.profile_picture_url) setProfilePicturePreview(profile.profile_picture_url);
      localStorage.setItem('username', displayName);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  const loadBookmarks = useCallback(async () => {
    setBookmarksLoading(true);
    try {
      const data = await fetchMyBookmarks();
      setBookmarks(data || []);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setBookmarksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (activeTab === 'bookmarks') loadBookmarks();
  }, [activeTab, loadBookmarks]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const [firstName, ...rest] = (formData.name || '').split(' ');
      const lastName = rest.join(' ');

      if (profilePictureFile) {
        const fd = new FormData();
        fd.append('first_name', firstName);
        fd.append('last_name', lastName);
        fd.append('profile_picture', profilePictureFile);
        const updated = await updateMyProfileWithPicture(fd);
        setUserData(prev => ({
          ...prev,
          name: formData.name,
          profilePictureUrl: updated?.profile_picture_url || profilePicturePreview,
        }));
      } else {
        await updateMyProfile({ first_name: firstName, last_name: lastName });
        setUserData(prev => ({ ...prev, name: formData.name }));
      }

      localStorage.setItem('username', formData.name);
      setProfilePictureFile(null);
      setEditMode(false);
      showSuccess('Profile updated successfully!');
    } catch (err) {
      showError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(userData);
    setProfilePictureFile(null);
    setProfilePicturePreview(userData.profilePictureUrl);
    setEditMode(false);
  };

  const connectMetaMask = async () => {
    setIsConnectingWallet(true);
    try {
      const accounts = await requestMetaMaskAccounts();
      if (!accounts || accounts.length === 0) {
        showError('No accounts found. Please add an account in MetaMask.');
        return;
      }
      if (accounts.length > 1) {
        setAccountsToPick(accounts);
        return;
      }
      await saveWalletAddress(accounts[0]);
    } catch (err) {
      showError('Wallet connection cancelled or failed.');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const saveWalletAddress = async (address) => {
    try {
      await updateMyProfile({ wallet_address: address });
      setUserData(prev => ({ ...prev, walletAddress: address }));
      setFormData(prev => ({ ...prev, walletAddress: address }));
      showSuccess(`Wallet connected: ${shortenAddress(address)}`);
    } catch (err) {
      showError('Failed to save wallet address.');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleAccountPicked = (address) => {
    setAccountsToPick(null);
    saveWalletAddress(address);
  };

  const disconnectWallet = async () => {
    try {
      await updateMyProfile({ wallet_address: null });
      localStorage.removeItem('walletAddress');
      setUserData(prev => ({ ...prev, walletAddress: '' }));
      setFormData(prev => ({ ...prev, walletAddress: '' }));
      showSuccess('Wallet disconnected. You can connect a different wallet anytime.');
    } catch (err) {
      showError('Failed to disconnect wallet.');
    }
  };
  
  const handlePasswordUpdate = async () => {
    const { current_password, new_password, confirm_password } = passwordForm;
    if (!current_password || !new_password || !confirm_password) {
      showError('Please fill in all password fields.');
      return;
    }
    if (new_password !== confirm_password) {
      showError('New passwords do not match.');
      return;
    }
    if (new_password.length < 8) {
      showError('New password must be at least 8 characters.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword({ current_password, new_password, confirm_password });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      showSuccess('Password updated successfully!');
    } catch (err) {
      const errData = err.data;
      if (errData?.current_password) {
        showError(errData.current_password[0]);
      } else if (errData?.new_password) {
        showError(errData.new_password[0]);
      } else if (errData?.confirm_password) {
        showError(errData.confirm_password[0]);
      } else {
        showError(err.message || 'Failed to update password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userData.walletAddress);
    showSuccess('Wallet address copied to clipboard!');
  };

  const handleRemoveBookmark = async (businessId) => {
    try {
      await removeBookmark(businessId);
      setBookmarks(prev => prev.filter(b => b.business_id !== businessId));
      showSuccess('Bookmark removed.');
    } catch (err) {
      showError('Failed to remove bookmark.');
    }
  };

  const logout = () => {
    clearAuthData();
    navigate('/login');
  };

  const stats = [
    { icon: <FaHistory />, title: "Member Since", value: userData.joinDate ? new Date(userData.joinDate).toLocaleDateString() : 'N/A' },
    { icon: <FaCoins />, title: "Total Coins", value: userData.coins },
    { icon: <FaStar />, title: "Average Rating Given", value: userData.avgRating },
    { icon: <FaHistory />, title: "Reviews Written", value: userData.totalReviews }
  ];

  const hoverStyles = `
    .sidebar-button-hover:hover {
        background-color: var(--hero-bg);
        color: var(--button-bg);
        transform: translateX(5px);
    }
    .input-focus:focus {
        border-color: var(--button-bg);
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3);
    }
    .bookmark-card-hover {
        transition: all 0.3s ease;
    }
    .bookmark-card-hover:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;

  const avatarSrc = profilePicturePreview || userData.profilePictureUrl;

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', minHeight: '100vh', paddingBottom: '2rem' }}>
      <style>{hoverStyles}</style>
      {accountsToPick && (
        <WalletAccountPicker
          accounts={accountsToPick}
          onSelect={handleAccountPicked}
          onCancel={() => { setAccountsToPick(null); setIsConnectingWallet(false); }}
        />
      )}
      {/* Profile Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.avatarContainer}>
            {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" style={styles.avatarImage} />
            ) : (
                <div style={styles.avatar}>{userData.name.charAt(0).toUpperCase()}</div>
            )}
            {editMode && (
                <label htmlFor="profile-upload" style={styles.uploadButton}>
                    <FaCamera />
                    <input ref={fileInputRef} id="profile-upload" type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
                </label>
            )}
          </div>
          <h1 style={styles.headerName}>{userData.name}</h1>
          <p style={styles.headerEmail}><FaEnvelope /> {userData.email}</p>
          <div style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} style={styles.statCard}>
                <div style={styles.statIcon}>{stat.icon}</div>
                <div>
                  <p style={styles.statValue}>{stat.value}</p>
                  <p style={styles.statTitle}>{stat.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.layoutGrid}>
          {/* Sidebar */}
          <aside style={styles.sidebar}>
            <button onClick={() => setActiveTab('profile')} style={activeTab === 'profile' ? {...styles.sidebarButton, ...styles.sidebarButtonActive} : styles.sidebarButton} className="sidebar-button-hover">
              <FaUserEdit /> Profile Settings
            </button>
            <button onClick={() => setActiveTab('bookmarks')} style={activeTab === 'bookmarks' ? {...styles.sidebarButton, ...styles.sidebarButtonActive} : styles.sidebarButton} className="sidebar-button-hover">
              <FaBookmark /> My Bookmarks
            </button>
            <button onClick={() => setActiveTab('security')} style={activeTab === 'security' ? {...styles.sidebarButton, ...styles.sidebarButtonActive} : styles.sidebarButton} className="sidebar-button-hover">
              <FaLock /> Security
            </button>
            <button onClick={() => setActiveTab('wallet')} style={activeTab === 'wallet' ? {...styles.sidebarButton, ...styles.sidebarButtonActive} : styles.sidebarButton} className="sidebar-button-hover">
              <FaWallet /> Wallet
            </button>
            <button onClick={logout} style={{...styles.sidebarButton, ...styles.logoutButton}} className="sidebar-button-hover">
              <FaSignOutAlt /> Logout
            </button>
          </aside>
          
          {/* Main Panel */}
          <div style={styles.mainPanel}>
            {successMessage && (
              <div style={styles.successBanner}><FaCheckCircle/> {successMessage}</div>
            )}
            {errorMessage && (
              <div style={styles.errorBanner}><FaExclamationCircle/> {errorMessage}</div>
            )}
            
            {activeTab === 'profile' && (
              <div>
                <div style={styles.panelHeader}>
                  <h2 style={styles.panelTitle}>Personal Information</h2>
                  {!editMode && <button onClick={() => setEditMode(true)} style={styles.editButton}><FaUserEdit /> Edit Profile</button>}
                </div>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Full Name</label>
                    {editMode ? (
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={styles.input} className="input-focus" />
                    ) : (
                      <p style={styles.infoText}>{userData.name}</p>
                    )}
                  </div>
                  <div>
                    <label style={styles.label}>Email Address</label>
                    <p style={styles.infoText}>{userData.email}</p>
                  </div>
                </div>
                {editMode && (
                  <>
                    <div style={{marginTop: '1.5rem'}}>
                      <label style={styles.label}>Profile Picture</label>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem'}}>
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="Preview" style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--card-border)'}} />
                        ) : (
                          <div style={{width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--button-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem'}}>
                            {userData.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <label htmlFor="profile-upload-form" style={{...styles.editButton, cursor: 'pointer'}}>
                          <FaCamera /> Change Photo
                          <input id="profile-upload-form" type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
                        </label>
                      </div>
                    </div>
                    <div style={styles.formActions}>
                      <button onClick={handleCancel} style={styles.cancelButton}><FaTimes /> Cancel</button>
                      <button onClick={handleSave} disabled={isSaving} style={styles.saveButton}>
                        {isSaving ? <><FaSpinner className="spin" style={{marginRight:'0.5rem'}}/> Saving...</> : <><FaCheck /> Save Changes</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'bookmarks' && (
                <div>
                    <div style={styles.panelHeader}>
                        <h2 style={styles.panelTitle}>My Bookmarks</h2>
                    </div>
                    {bookmarksLoading ? (
                        <div style={{textAlign: 'center', padding: '2rem', fontSize: '1.5rem', color: 'var(--button-bg)'}}><FaSpinner className="spin"/></div>
                    ) : bookmarks.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '3rem', opacity: 0.6}}>
                            <FaBookmark style={{fontSize: '3rem', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem auto'}} />
                            <p>No bookmarks yet. Explore businesses and bookmark your favorites!</p>
                            <button onClick={() => navigate('/explore')} style={{...styles.saveButton, marginTop: '1rem'}}>Explore Businesses</button>
                        </div>
                    ) : (
                        <div style={styles.bookmarksGrid}>
                            {bookmarks.map(bookmark => (
                                <div key={bookmark.id} style={styles.bookmarkCard} className="bookmark-card-hover">
                                    <Link to={`/business/${bookmark.business_id}`} style={{textDecoration: 'none', color: 'var(--text-color)', flex: 1}}>
                                        <div style={styles.bookmarkAvatar}>
                                            {bookmark.business_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={styles.bookmarkContent}>
                                            <h3 style={styles.bookmarkName}>{bookmark.business_name}</h3>
                                            <p style={styles.bookmarkCategory}>{bookmark.business_category}</p>
                                            <p style={styles.bookmarkMeta}>
                                                ★ {bookmark.avg_rating} · {bookmark.total_reviews} reviews
                                            </p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => handleRemoveBookmark(bookmark.business_id)}
                                        style={styles.removeBookmarkButton}
                                        title="Remove bookmark"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <div style={styles.panelHeader}>
                  <h2 style={styles.panelTitle}>Security Settings</h2>
                </div>
                <div style={styles.securityFormGrid}>
                    <div>
                        <label style={styles.label}>Current Password</label>
                        <PasswordInput
                          name="current_password"
                          value={passwordForm.current_password}
                          onChange={e => setPasswordForm(prev => ({...prev, current_password: e.target.value}))}
                          placeholder="Enter current password"
                        />
                    </div>
                    <div>
                        <label style={styles.label}>New Password</label>
                        <PasswordInput
                          name="new_password"
                          value={passwordForm.new_password}
                          onChange={e => setPasswordForm(prev => ({...prev, new_password: e.target.value}))}
                          placeholder="Min 8 characters"
                        />
                    </div>
                    <div>
                        <label style={styles.label}>Confirm New Password</label>
                        <PasswordInput
                          name="confirm_password"
                          value={passwordForm.confirm_password}
                          onChange={e => setPasswordForm(prev => ({...prev, confirm_password: e.target.value}))}
                          placeholder="Repeat new password"
                        />
                    </div>
                </div>
                <div style={styles.formActions}>
                    <button onClick={handlePasswordUpdate} disabled={isChangingPassword} style={styles.saveButton}>
                      {isChangingPassword ? <><FaSpinner className="spin" style={{marginRight:'0.5rem'}}/> Updating...</> : 'Update Password'}
                    </button>
                </div>
              </div>
            )}
            
            {activeTab === 'wallet' && (
              <div>
                <div style={styles.panelHeader}>
                  <h2 style={styles.panelTitle}>Wallet Management</h2>
                </div>
                <div style={styles.walletInfoCard}>
                    <div>
                        <p style={styles.walletBalanceLabel}>Coin Balance</p>
                        <p style={styles.walletBalance}>{userData.coins} RTC</p>
                    </div>
                    <button onClick={() => navigate('/customer/wallet')} style={styles.walletButton}><FaWallet/> Go to Full Wallet</button>
                </div>
                {userData.walletAddress ? (
                  <>
                    <label style={styles.label}>Connected Wallet Address</label>
                    <div style={styles.walletAddressWrapper}>
                        <p style={{...styles.infoText, fontFamily: 'monospace', flex: 1, wordBreak: 'break-all', margin: 0}} title={userData.walletAddress}>{shortenAddress(userData.walletAddress) || userData.walletAddress}</p>
                        <button onClick={handleCopyAddress} style={styles.copyButton} title="Copy Address"><FaCopy/></button>
                    </div>
                    <div style={{display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap'}}>
                      <button onClick={connectMetaMask} disabled={isConnectingWallet} style={{...styles.saveButton, background:'#f6851b'}}>
                        {isConnectingWallet ? <><FaSpinner className="spin" style={{marginRight:'0.5rem'}}/> Connecting...</> : <><FaEthereum style={{marginRight:'0.5rem'}}/> Switch Wallet</>}
                      </button>
                      <button onClick={disconnectWallet} style={{...styles.cancelButton, borderColor: '#ef4444', color: '#ef4444'}} title="Disconnect this wallet from your account">
                        Disconnect Wallet
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{textAlign:'center', padding:'2rem 0'}}>
                    <FaEthereum style={{fontSize:'3rem', color:'#f6851b', display:'block', margin:'0 auto 1rem auto'}}/>
                    <p style={{marginBottom:'1rem', opacity:0.8}}>Connect your MetaMask wallet to earn and manage SRT coins from your reviews.</p>
                    <button onClick={connectMetaMask} disabled={isConnectingWallet} style={{...styles.saveButton, background:'#f6851b', padding:'0.8rem 2rem'}}>
                      {isConnectingWallet ? <><FaSpinner className="spin" style={{marginRight:'0.5rem'}}/> Connecting...</> : <><FaEthereum style={{marginRight:'0.5rem'}}/> Connect MetaMask Wallet</>}
                    </button>
                    <p style={{marginTop:'1rem', fontSize:'0.9rem', opacity:0.7}}>
                      Don&apos;t have MetaMask? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" style={{color:'var(--button-bg)'}}>Install from metamask.io</a> — then create or import a wallet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
    header: {
        backgroundColor: 'var(--hero-bg)',
        padding: '3rem 2rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--card-border)',
    },
    headerContent: {
        maxWidth: '800px',
        margin: '0 auto',
    },
    avatarContainer: {
        position: 'relative',
        width: '120px',
        height: '120px',
        margin: '0 auto 1rem auto',
    },
    avatar: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        backgroundColor: 'var(--button-bg)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '3.5rem',
        color: 'white',
        border: '4px solid var(--card-bg)',
    },
    avatarImage: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '4px solid var(--card-bg)',
    },
    uploadButton: {
        position: 'absolute',
        bottom: '5px',
        right: '5px',
        backgroundColor: 'var(--text-color)',
        color: 'var(--bg-color)',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: '2px solid var(--card-bg)',
    },
    headerName: { fontSize: '2rem', fontWeight: 'bold', margin: 0 },
    headerEmail: { opacity: 0.8, marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' },
    statCard: { backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow)' },
    statIcon: { color: 'var(--button-bg)', fontSize: '1.5rem' },
    statValue: { fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0 0.25rem 0' },
    statTitle: { fontSize: '0.8rem', opacity: 0.7, margin: 0 },
    main: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    layoutGrid: { display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' },
    sidebar: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '1rem', boxShadow: 'var(--shadow)', alignSelf: 'start', position: 'sticky', top: '100px' },
    sidebarButton: { display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', color: 'var(--text-color)', textAlign: 'left', cursor: 'pointer', marginBottom: '0.5rem', fontWeight: '500', transition: 'all 0.2s ease-in-out' },
    sidebarButtonActive: { backgroundColor: 'var(--hero-bg)', color: 'var(--button-bg)', fontWeight: 'bold' },
    logoutButton: { color: '#ef4444', marginTop: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' },
    mainPanel: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '2rem', boxShadow: 'var(--shadow)' },
    panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)', marginBottom: '1.5rem' },
    panelTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--header-text)', margin: 0 },
    editButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--hero-bg)', border: '1px solid var(--card-border)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' },
    securityFormGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '500' },
    input: { width: '100%', padding: '0.8rem 1rem', backgroundColor: 'var(--bg-color)', border: '2px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '1rem', outline: 'none', transition: 'all 0.2s ease-in-out', boxSizing: 'border-box' },
    passwordInputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    eyeButton: { position: 'absolute', right: '1rem', background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', opacity: 0.7 },
    infoText: { padding: '0.8rem 1rem', backgroundColor: 'var(--hero-bg)', borderRadius: '8px', margin: 0 },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' },
    cancelButton: { padding: '0.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', cursor: 'pointer', fontWeight: '500' },
    saveButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--button-bg)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' },
    // Bookmarks
    bookmarksGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' },
    bookmarkCard: { backgroundColor: 'var(--hero-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'stretch', position: 'relative' },
    bookmarkAvatar: { width: '100%', height: '80px', backgroundColor: 'var(--button-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 'bold' },
    bookmarkContent: { padding: '0.75rem 1rem' },
    bookmarkName: { fontWeight: '600', margin: '0 0 0.25rem 0', color: 'var(--header-text)' },
    bookmarkCategory: { fontSize: '0.8rem', opacity: 0.7, margin: '0 0 0.25rem 0' },
    bookmarkMeta: { fontSize: '0.8rem', color: 'var(--button-bg)', margin: 0 },
    removeBookmarkButton: { position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '6px', color: '#ef4444', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    // Wallet Tab
    walletInfoCard: { backgroundColor: 'var(--hero-bg)', borderRadius: '8px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    walletBalanceLabel: { opacity: 0.8, margin: 0 },
    walletBalance: { fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--button-bg)' },
    walletButton: { padding: '0.75rem 1.5rem', backgroundColor: 'var(--button-bg)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    walletAddressWrapper: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    copyButton: { padding: '0.8rem', backgroundColor: 'var(--hero-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-color)' },
    // Banners
    successBanner: { padding: '1rem', backgroundColor: '#10B981', color: 'white', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    errorBanner: { padding: '1rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
};

export default CustomerProfile;
