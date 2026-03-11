import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyBusinesses, clearAuthData, fetchMyProfile, updateMyProfile, updateMyProfileWithPicture, changePassword, deleteMyAccount } from '../../services/api';
import WalletAccountPicker from '../../components/WalletAccountPicker';
import { requestMetaMaskAccounts, shortenAddress } from '../../utils/walletConnection';
import { 
    FaUserEdit, 
    FaLock, 
    FaWallet, 
    FaEnvelope, 
    FaTimes, 
    FaCheck, 
    FaEye, 
    FaEyeSlash,
    FaCamera,
    FaBell,
    FaTrashAlt,
    FaSignOutAlt,
    FaCheckCircle,
    FaCopy,
    FaShieldAlt,
    FaSpinner
} from 'react-icons/fa';

// Reusable Password Input Component
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

// Reusable Password Strength Meter
const PasswordStrengthMeter = ({ password }) => {
    const [strength, setStrength] = useState({ value: 0, color: '', label: '' });
    useEffect(() => {
        let score = 0;
        if (password.length > 7) score++;
        if (password.match(/[a-z]/)) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[^a-zA-Z0-9]/)) score++;
        const colors = ['#ef4444', '#f97316', '#facc15', '#a3e635', '#4ade80'];
        const labels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
        setStrength({ value: score, color: colors[score-1] || '', label: labels[score-1] || '' });
    }, [password]);

    if (!password) return null;
    return (
        <div style={styles.strengthContainer}>
            <div style={styles.strengthBar}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} style={{...styles.strengthSegment, backgroundColor: i < strength.value ? strength.color : 'var(--hero-bg)'}}></div>
                ))}
            </div>
            <p style={{...styles.strengthLabel, color: strength.color}}>{strength.label}</p>
        </div>
    );
};

function BusinessProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [business, setBusiness] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const [userData, setUserData] = useState({
    name: localStorage.getItem('username') || '',
    email: localStorage.getItem('email') || '',
    phone: '',
    profilePictureUrl: null,
    walletAddress: '',
    notifications: { newReview: true, reviewFlagged: true, coinRedemption: false },
  });
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({ ...userData });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [accountsToPick, setAccountsToPick] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const [profile, businesses] = await Promise.all([fetchMyProfile(), fetchMyBusinesses()]);
      const displayName = profile.display_name || profile.username;
      const walletAddress = profile.wallet_address || '';
      const fresh = {
        name: displayName,
        email: profile.email,
        phone: profile.phone || '',
        profilePictureUrl: profile.profile_picture_url || null,
        walletAddress,
        notifications: { newReview: true, reviewFlagged: true, coinRedemption: false },
      };
      setUserData(fresh);
      setFormData(fresh);
      if (profile.profile_picture_url) setProfilePicturePreview(profile.profile_picture_url);
      localStorage.setItem('username', displayName);
      if (walletAddress) localStorage.setItem('walletAddress', walletAddress);
      else localStorage.removeItem('walletAddress');
      if (businesses && businesses.length > 0) setBusiness(businesses[0]);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
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
        fd.append('phone', formData.phone || '');
        fd.append('profile_picture', profilePictureFile);
        const updated = await updateMyProfileWithPicture(fd);
        setUserData(prev => ({
          ...prev,
          name: formData.name,
          phone: formData.phone,
          profilePictureUrl: updated?.profile_picture_url || profilePicturePreview,
        }));
      } else {
        await updateMyProfile({ first_name: firstName, last_name: lastName, phone: formData.phone || '' });
        setUserData(prev => ({ ...prev, name: formData.name, phone: formData.phone }));
      }
      localStorage.setItem('username', formData.name);
      setProfilePictureFile(null);
      setEditMode(false);
      showSuccessMessage('Profile updated successfully!');
    } catch (err) {
      showSuccessMessage('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const connectMetaMask = async () => {
    setIsConnectingWallet(true);
    try {
      const accounts = await requestMetaMaskAccounts();
      if (!accounts || accounts.length === 0) {
        showSuccessMessage('No accounts found. Please add an account in MetaMask.');
        return;
      }
      if (accounts.length > 1) {
        setAccountsToPick(accounts);
        return;
      }
      await saveWalletAddress(accounts[0]);
    } catch (err) {
      showSuccessMessage('Wallet connection cancelled or failed.');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const saveWalletAddress = async (address) => {
    try {
      await updateMyProfile({ wallet_address: address });
      setUserData(prev => ({ ...prev, walletAddress: address }));
      setFormData(prev => ({ ...prev, walletAddress: address }));
      showSuccessMessage(`MetaMask connected: ${shortenAddress(address)}`);
    } catch (err) {
      showSuccessMessage('Failed to save wallet address.');
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
      showSuccessMessage('Wallet disconnected. You can connect a different wallet anytime.');
    } catch (err) {
      showSuccessMessage('Failed to disconnect wallet.');
    }
  };
  
  const handleCancel = () => {
    setFormData(userData);
    setProfilePictureFile(null);
    setProfilePicturePreview(userData.profilePictureUrl);
    setEditMode(false);
  };

  const handlePasswordUpdate = async () => {
    const { current, new: newPass, confirm } = passwordForm;
    if (!current || !newPass || !confirm) {
      showSuccessMessage('Please fill in all password fields.');
      return;
    }
    if (newPass !== confirm) {
      showSuccessMessage('New passwords do not match.');
      return;
    }
    if (newPass.length < 8) {
      showSuccessMessage('New password must be at least 8 characters.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword({ current_password: current, new_password: newPass, confirm_password: confirm });
      setPasswordForm({ current: '', new: '', confirm: '' });
      showSuccessMessage('Password updated successfully!');
    } catch (err) {
      const errData = err.data;
      if (errData?.current_password) {
        showSuccessMessage(errData.current_password[0]);
      } else if (errData?.new_password) {
        showSuccessMessage(errData.new_password[0]);
      } else {
        showSuccessMessage(err.message || 'Failed to update password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userData.walletAddress);
    showSuccessMessage('Wallet address copied to clipboard!');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action is irreversible.")) {
      try {
        await deleteMyAccount();
      } catch (err) {
        // Account may already be deleted or token expired
      } finally {
        clearAuthData();
        navigate('/login');
      }
    }
  };
  
  const handleSignOutEverywhere = () => {
    if (window.confirm("Are you sure you want to sign out of all sessions?")) {
      clearAuthData();
      navigate('/login');
    }
  };

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
    .avatar-hover:hover .upload-overlay-hover {
        opacity: 1;
    }
    /* Styles for the improved toggle switch */
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--card-border);
        transition: .4s;
        border-radius: 28px;
    }
    .slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }
    input:checked + .slider {
        background-color: var(--button-bg);
    }
    input:checked + .slider:before {
        transform: translateX(22px);
    }
  `;

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
      <section style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.avatarContainer} className="avatar-hover">
            {(profilePicturePreview || userData.profilePictureUrl) ? (
                <img src={profilePicturePreview || userData.profilePictureUrl} alt="Profile" style={styles.avatarImage} />
            ) : (
                <div style={styles.avatar}>{userData.name.charAt(0).toUpperCase()}</div>
            )}
            <label htmlFor="profile-upload" style={styles.uploadOverlay} className="upload-overlay-hover">
                <FaCamera />
                <input id="profile-upload" type="file" accept="image/*" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setProfilePictureFile(file);
                    setProfilePicturePreview(URL.createObjectURL(file));
                  }
                }} style={{display: 'none'}} />
            </label>
          </div>
          <h1 style={styles.headerName}>{userData.name}</h1>
          <p style={styles.headerEmail}><FaEnvelope /> {userData.email}</p>
          {business && <p style={{opacity: 0.8, marginTop: '0.5rem'}}><FaShieldAlt style={{marginRight: '0.5rem'}}/>{business.name}</p>}
        </div>
      </section>
      
      <main style={styles.main}>
        <div style={styles.layoutGrid}>
          <aside style={styles.sidebar}>
            <button onClick={() => setActiveTab('profile')} style={activeTab === 'profile' ? {...styles.sidebarButton, ...styles.sidebarButtonActive} : styles.sidebarButton} className="sidebar-button-hover"><FaUserEdit /> Profile</button>
            <button onClick={() => setActiveTab('security')} style={activeTab === 'security' ? {...styles.sidebarButton, ...styles.sidebarButtonActive} : styles.sidebarButton} className="sidebar-button-hover"><FaLock /> Security</button>
            <button onClick={() => setActiveTab('notifications')} style={activeTab === 'notifications' ? {...styles.sidebarButton, ...styles.sidebarButtonActive} : styles.sidebarButton} className="sidebar-button-hover"><FaBell /> Notifications</button>
            <button onClick={() => setActiveTab('account')} style={activeTab === 'account' ? {...styles.sidebarButton, ...styles.sidebarButtonActive} : styles.sidebarButton} className="sidebar-button-hover"><FaTrashAlt /> Account</button>
          </aside>
          
          <div style={styles.mainPanel}>
            {successMessage && <div style={styles.successBanner}><FaCheckCircle/> {successMessage}</div>}
          {errorMessage && <div style={{...styles.successBanner, backgroundColor: '#ef4444'}}>{errorMessage}</div>}
            
            {activeTab === 'profile' && (
              <div>
                <div style={styles.panelHeader}>
                  <h2 style={styles.panelTitle}>Personal Information</h2>
                  {!editMode && <button onClick={() => setEditMode(true)} style={styles.editButton}><FaUserEdit /> Edit</button>}
                </div>
                <div style={styles.formGrid}>
                  <div><label style={styles.label}>Full Name</label>{editMode ? <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={styles.input} className="input-focus" /> : <p style={styles.infoText}>{userData.name}</p>}</div>
                  <div><label style={styles.label}>Email Address</label>{editMode ? <input type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={styles.input} className="input-focus" /> : <p style={styles.infoText}>{userData.email}</p>}</div>
                  <div><label style={styles.label}>Phone Number</label>{editMode ? <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={styles.input} className="input-focus" /> : <p style={styles.infoText}>{userData.phone || 'Not provided'}</p>}</div>
                </div>
                {business && (
                  <div style={{marginTop: '2rem', padding: '1.5rem', background: 'var(--hero-bg)', borderRadius: '12px', border: '1px solid var(--card-border)'}}>
                    <h3 style={{margin: '0 0 1rem 0', color: 'var(--header-text)'}}>Your Business</h3>
                    <div style={styles.formGrid}>
                      <div><label style={styles.label}>Business Name</label><p style={styles.infoText}>{business.name}</p></div>
                      <div><label style={styles.label}>Category</label><p style={styles.infoText}>{business.category}</p></div>
                      <div><label style={styles.label}>Status</label><p style={{...styles.infoText, color: business.status === 'Active' ? '#10B981' : '#f97316', fontWeight: '600'}}>{business.status}</p></div>
                      <div><label style={styles.label}>Address</label><p style={styles.infoText}>{business.address}</p></div>
                      <div><label style={styles.label}>Avg. Rating</label><p style={styles.infoText}>{business.avg_rating} ★ ({business.total_reviews} reviews)</p></div>
                    </div>
                  </div>
                )}
                {editMode && (
                  <div style={styles.formActions}>
                    <button onClick={handleCancel} style={styles.cancelButton}><FaTimes /> Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} style={styles.saveButton}>
                      {isSaving ? <><FaShieldAlt style={{marginRight:'0.4rem'}}/> Saving...</> : <><FaCheck /> Save Changes</>}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <div style={styles.panelHeader}><h2 style={styles.panelTitle}>Security Settings</h2></div>
                <div style={styles.securitySection}>
                    <h3 style={styles.subTitle}>MetaMask Wallet</h3>
                    {userData.walletAddress ? (
                      <>
                        <div style={styles.walletAddressWrapper}>
                            <p style={{...styles.infoText, fontFamily: 'monospace', flex: 1, wordBreak: 'break-all'}} title={userData.walletAddress}>{shortenAddress(userData.walletAddress) || userData.walletAddress}</p>
                            <button onClick={handleCopyAddress} style={styles.copyButton} title="Copy Address"><FaCopy/></button>
                        </div>
                        <div style={{display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap'}}>
                          <button onClick={connectMetaMask} disabled={isConnectingWallet} style={{...styles.saveButton, background:'#f6851b', border:'none'}}>
                            {isConnectingWallet ? 'Connecting...' : '🦊 Switch Wallet'}
                          </button>
                          <button onClick={disconnectWallet} style={{...styles.cancelButton, borderColor: '#ef4444', color: '#ef4444'}} title="Disconnect this wallet from your account">
                            Disconnect Wallet
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{textAlign:'center', padding:'1.5rem 0'}}>
                        <p style={{marginBottom:'1rem', opacity:0.8}}>Connect your MetaMask to receive SRT coin rewards from business reviews.</p>
                        <button onClick={connectMetaMask} disabled={isConnectingWallet} style={{...styles.saveButton, background:'#f6851b', padding:'0.8rem 2rem', border:'none'}}>
                          {isConnectingWallet ? 'Connecting...' : '🦊 Connect MetaMask Wallet'}
                        </button>
                        <p style={{marginTop:'1rem', fontSize:'0.9rem', opacity:0.7}}>
                          Don&apos;t have MetaMask? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" style={{color:'var(--button-bg)'}}>Install from metamask.io</a>
                        </p>
                      </div>
                    )}
                </div>
                <div style={styles.securitySection}>
                    <h3 style={styles.subTitle}>Password Management</h3>
                    <div style={styles.securityFormGrid}>
                        <div><label style={styles.label}>Current Password</label><PasswordInput name="current" value={passwordForm.current} onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} /></div>
                        <div><label style={styles.label}>New Password</label><PasswordInput name="new" value={passwordForm.new} onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} /><PasswordStrengthMeter password={passwordForm.new} /></div>
                        <div><label style={styles.label}>Confirm New Password</label><PasswordInput name="confirm" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} /></div>
                    </div>
                    <div style={styles.formActions}><button onClick={handlePasswordUpdate} disabled={isChangingPassword} style={styles.saveButton}>
                      {isChangingPassword ? <><FaSpinner style={{marginRight:'0.4rem', animation:'spin 1s linear infinite'}}/> Updating...</> : 'Update Password'}
                    </button></div>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <div style={styles.panelHeader}><h2 style={styles.panelTitle}>Notification Preferences</h2></div>
                <div style={styles.notificationCard}>
                    <div style={styles.toggleItem}><div><h4 style={styles.notificationTitle}>New Review Received</h4><p style={styles.notificationDesc}>Get notified when a customer submits a new review.</p></div><label style={styles.switch}><input type="checkbox" checked={formData.notifications.newReview} onChange={(e) => setFormData({...formData, notifications: {...formData.notifications, newReview: e.target.checked}})}/><span className="slider"></span></label></div>
                    <div style={styles.toggleItem}><div><h4 style={styles.notificationTitle}>Review Flagged by AI</h4><p style={styles.notificationDesc}>Receive an alert if a review is flagged for violations.</p></div><label style={styles.switch}><input type="checkbox" checked={formData.notifications.reviewFlagged} onChange={(e) => setFormData({...formData, notifications: {...formData.notifications, reviewFlagged: e.target.checked}})}/><span className="slider"></span></label></div>
                    <div style={styles.toggleItem}><div><h4 style={styles.notificationTitle}>Coin Redemption Status</h4><p style={styles.notificationDesc}>Get updates on your coin redemption requests.</p></div><label style={styles.switch}><input type="checkbox" checked={formData.notifications.coinRedemption} onChange={(e) => setFormData({...formData, notifications: {...formData.notifications, coinRedemption: e.target.checked}})}/><span className="slider"></span></label></div>
                </div>
                <div style={styles.formActions}><button style={styles.saveButton}>Save Preferences</button></div>
              </div>
            )}

            {activeTab === 'account' && (
              <div>
                <div style={styles.panelHeader}><h2 style={styles.panelTitle}>Account Actions</h2></div>
                <div style={styles.dangerZone}>
                    <h3 style={styles.dangerTitle}>Danger Zone</h3>
                    <div style={styles.actionItem}>
                        <div><p><strong>Sign Out Everywhere</strong></p><p style={styles.actionDesc}>This will sign you out of all other active sessions on other devices.</p></div>
                        <button onClick={handleSignOutEverywhere} style={styles.dangerButton}>Sign Out</button>
                    </div>
                    <div style={styles.actionItem}>
                        <div><p><strong>Delete Your Account</strong></p><p style={styles.actionDesc}>Once you delete your account, there is no going back. Please be certain.</p></div>
                        <button onClick={handleDeleteAccount} style={styles.dangerButton}>Delete Account</button>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
    // Header
    header: {
        backgroundColor: 'var(--hero-bg)',
        padding: '2rem',
        textAlign: 'center',
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
    uploadOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: 0,
        transition: 'opacity 0.2s',
    },
    headerName: {
        fontSize: '2rem',
        fontWeight: 'bold',
        margin: 0,
    },
    headerEmail: {
        opacity: 0.8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
    },
    // Main Layout
    main: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    layoutGrid: {
        display: 'grid',
        gridTemplateColumns: '250px 1fr',
        gap: '2rem',
    },
    // Sidebar
    sidebar: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: 'var(--shadow)',
        alignSelf: 'start',
        position: 'sticky',
        top: '100px',
    },
    sidebarButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.75rem 1rem',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: 'var(--text-color)',
        textAlign: 'left',
        cursor: 'pointer',
        marginBottom: '0.5rem',
        fontWeight: '500',
        transition: 'all 0.2s ease-in-out',
    },
    sidebarButtonActive: {
        backgroundColor: 'var(--hero-bg)',
        color: 'var(--button-bg)',
        fontWeight: 'bold',
    },
    // Main Panel
    mainPanel: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: 'var(--shadow)',
    },
    panelHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--card-border)',
        marginBottom: '1.5rem',
    },
    panelTitle: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'var(--header-text)',
        margin: 0,
    },
    editButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--hero-bg)',
        border: '1px solid var(--card-border)',
        color: 'var(--text-color)',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
    },
    securityFormGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
    },
    input: {
        width: '100%',
        padding: '0.8rem 1rem',
        backgroundColor: 'var(--bg-color)',
        border: '2px solid var(--card-border)',
        borderRadius: '8px',
        color: 'var(--text-color)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.2s ease-in-out',
    },
    passwordInputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    eyeButton: {
        position: 'absolute',
        right: '1rem',
        background: 'none',
        border: 'none',
        color: 'var(--text-color)',
        cursor: 'pointer',
        opacity: 0.7,
    },
    infoText: {
        padding: '0.8rem 1rem',
        backgroundColor: 'var(--hero-bg)',
        borderRadius: '8px',
        margin: 0,
    },
    formActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--card-border)',
    },
    cancelButton: {
        padding: '0.75rem 1.5rem',
        backgroundColor: 'transparent',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        color: 'var(--text-color)',
        cursor: 'pointer',
        fontWeight: '500',
    },
    saveButton: {
        padding: '0.75rem 1.5rem',
        backgroundColor: 'var(--button-bg)',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    // Security
    securitySection: {
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--card-border)',
    },
    subTitle: {
        fontSize: '1.2rem',
        fontWeight: '600',
        color: 'var(--header-text)',
        marginBottom: '1rem',
    },
    walletAddressWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    copyButton: {
        padding: '0.8rem',
        backgroundColor: 'var(--hero-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        cursor: 'pointer',
        color: 'var(--text-color)',
    },
    // Notifications
    notificationCard: {
        backgroundColor: 'var(--hero-bg)',
        borderRadius: '8px',
        padding: '0 1.5rem',
    },
    toggleItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 0',
        borderBottom: '1px solid var(--card-border)',
    },
    notificationTitle: {
        fontWeight: '600',
        margin: 0,
    },
    notificationDesc: {
        fontSize: '0.9rem',
        opacity: 0.8,
        margin: '0.25rem 0 0 0',
    },
    switch: {
        position: 'relative',
        display: 'inline-block',
        width: '50px',
        height: '28px',
    },
    // Danger Zone
    dangerZone: {
        marginTop: '2rem',
        border: '2px solid #ef4444',
        borderRadius: '8px',
        padding: '1.5rem',
    },
    dangerTitle: {
        color: '#ef4444',
        margin: '0 0 1rem 0',
    },
    actionItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 0',
        borderBottom: '1px solid var(--card-border)',
    },
    actionDesc: {
        opacity: 0.8,
        fontSize: '0.9rem',
        margin: 0,
    },
    dangerButton: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#ef4444',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 'bold',
        flexShrink: 0,
        marginLeft: '1rem',
    },
    // etc
    strengthContainer: { marginTop: '0.5rem' },
    strengthBar: { display: 'flex', gap: '0.25rem', height: '5px' },
    strengthSegment: { flex: 1, borderRadius: '5px' },
    strengthLabel: { fontSize: '0.8rem', textAlign: 'right', marginTop: '0.25rem' },
    successBanner: { padding: '1rem', backgroundColor: '#10B981', color: 'white', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
};

export default BusinessProfile;
