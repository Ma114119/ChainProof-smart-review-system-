import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAdminWallet, setAdminWallet, fetchMyProfile, updateMyProfile, updateMyProfileWithPicture } from '../../services/api';
import { requestMetaMaskAccounts } from '../../utils/walletConnection';
import {
  FaEthereum,
  FaCopy,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaWallet,
  FaUser,
  FaCamera,
} from 'react-icons/fa';

function SiteSettings() {
  const [adminWallet, setAdminWalletState] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', username: '', email: '', phone: '', profile_picture_url: null });
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', username: '', phone: '' });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const profileFileInputRef = useRef(null);

  const showSuccess = (msg) => { setSuccessMsg(msg); setErrorMsg(''); setTimeout(() => setSuccessMsg(''), 4000); };
  const showError = (msg) => { setErrorMsg(msg); setSuccessMsg(''); setTimeout(() => setErrorMsg(''), 5000); };

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminWallet();
      setAdminWalletState(data.admin_wallet_address || '');
      setManualAddress(data.admin_wallet_address || '');
    } catch (err) {
      console.error('Failed to load admin wallet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const data = await fetchMyProfile();
      const p = {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
        profile_picture_url: data.profile_picture_url || null,
      };
      setProfileData(p);
      setProfileForm({ first_name: p.first_name, last_name: p.last_name, username: p.username, phone: p.phone });
      setProfilePicturePreview(p.profile_picture_url);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { loadWallet(); }, [loadWallet]);
  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append('first_name', profileForm.first_name);
        formData.append('last_name', profileForm.last_name);
        formData.append('username', profileForm.username);
        formData.append('phone', profileForm.phone);
        formData.append('profile_picture', profilePictureFile);
        await updateMyProfileWithPicture(formData);
      } else {
        await updateMyProfile(profileForm);
      }
      setProfileData(prev => ({ ...prev, ...profileForm }));
      setProfilePictureFile(null);
      setProfilePicturePreview(profileData.profile_picture_url);
      showSuccess('Profile updated successfully!');
      loadProfile();
    } catch (err) {
      showError(err?.data?.detail || err?.data?.username?.[0] || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    try {
      const accounts = await requestMetaMaskAccounts();
      if (!accounts || accounts.length === 0) {
        showError('No accounts found. Please add an account in MetaMask.');
        return;
      }
      const address = accounts[0];
      await setAdminWallet(address);
      setAdminWalletState(address);
      setManualAddress(address);
      showSuccess(`Admin wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (err) {
      showError('MetaMask connection cancelled or failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manualAddress || manualAddress.trim().length < 10) {
      showError('Please enter a valid wallet address.');
      return;
    }
    setIsSaving(true);
    try {
      await setAdminWallet(manualAddress.trim());
      setAdminWalletState(manualAddress.trim());
      showSuccess('Admin wallet address saved successfully!');
    } catch (err) {
      showError('Failed to save wallet address.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyAddress = () => {
    if (adminWallet) {
      navigator.clipboard.writeText(adminWallet);
      showSuccess('Address copied!');
    }
  };

  const hoverStyles = `
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .input-focus:focus { border-color: var(--button-bg); box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3); }
  `;

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', minHeight: '100vh', padding: '2rem' }}>
      <style>{hoverStyles}</style>
      <div style={styles.pageHeader}>
        <FaWallet style={styles.pageIcon} />
        <div>
          <h1 style={styles.pageTitle}>Site Settings</h1>
          <p style={styles.pageSubtitle}>Manage admin wallet and platform configuration.</p>
        </div>
      </div>

      {successMsg && <div style={styles.successBanner}><FaCheckCircle style={{marginRight: '0.5rem'}}/> {successMsg}</div>}
      {errorMsg && <div style={styles.errorBanner}><FaExclamationCircle style={{marginRight: '0.5rem'}}/> {errorMsg}</div>}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <FaEthereum style={{color: '#f6851b', fontSize: '1.5rem'}} />
          <h2 style={styles.cardTitle}>Admin MetaMask Wallet</h2>
        </div>
        <p style={styles.cardDescription}>
          Connect your MetaMask wallet as the admin wallet. This address will be visible to all customers and business
          owners so they can send coins and payments directly to you.
        </p>

        {loading ? (
          <div style={{textAlign: 'center', padding: '2rem', color: 'var(--button-bg)'}}><FaSpinner className="spin" style={{fontSize: '1.5rem'}} /></div>
        ) : (
          <>
            {adminWallet && (
              <div style={styles.currentWalletBox}>
                <p style={styles.currentWalletLabel}>Current Admin Wallet Address:</p>
                <div style={styles.walletAddressRow}>
                  <span style={styles.walletAddress}>{adminWallet}</span>
                  <button onClick={copyAddress} style={styles.copyBtn} title="Copy">
                    <FaCopy />
                  </button>
                </div>
                <p style={styles.walletNote}>✓ This address is visible to all users for payments.</p>
              </div>
            )}

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Connect via MetaMask</h3>
              <p style={{opacity: 0.8, marginBottom: '1rem'}}>Click below to open MetaMask and connect your wallet. This is the recommended method.</p>
              <button
                onClick={handleConnectMetaMask}
                disabled={isConnecting}
                style={styles.metamaskButton}
              >
                {isConnecting
                  ? <><FaSpinner className="spin" style={{marginRight: '0.5rem'}}/> Connecting...</>
                  : <><FaEthereum style={{marginRight: '0.5rem'}}/> {adminWallet ? 'Reconnect / Change Wallet' : 'Connect MetaMask Wallet'}</>
                }
              </button>
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Or Enter Address Manually</h3>
              <p style={{opacity: 0.8, marginBottom: '1rem'}}>If you cannot use MetaMask directly, enter your Ethereum wallet address below.</p>
              <div style={styles.manualInputRow}>
                <input
                  type="text"
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  placeholder="0x..."
                  style={styles.input}
                  className="input-focus"
                />
                <button onClick={handleSaveManual} disabled={isSaving} style={styles.saveButton}>
                  {isSaving ? <><FaSpinner className="spin" style={{marginRight: '0.5rem'}}/> Saving...</> : 'Save Address'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Admin Profile Management Card */}
      <div style={{...styles.card, marginTop: '2rem'}}>
        <div style={styles.cardHeader}>
          <FaUser style={{color: 'var(--button-bg)', fontSize: '1.5rem'}} />
          <h2 style={styles.cardTitle}>Admin Profile</h2>
        </div>
        <p style={styles.cardDescription}>
          Manage your admin account details. Update your name, username, phone, or profile picture.
        </p>

        {profileLoading ? (
          <div style={{textAlign: 'center', padding: '2rem', color: 'var(--button-bg)'}}><FaSpinner className="spin" style={{fontSize: '1.5rem'}} /></div>
        ) : (
          <form onSubmit={handleSaveProfile}>
            <div style={styles.profileSection}>
              <div style={styles.avatarSection}>
                <div style={styles.avatarWrapper}>
                  {(profilePicturePreview || profilePictureFile) ? (
                    <img src={profilePicturePreview || (profilePictureFile ? URL.createObjectURL(profilePictureFile) : null)} alt="Profile" style={styles.avatarImg} />
                  ) : (
                    <div style={styles.avatarPlaceholder}><FaUser size={40} /></div>
                  )}
                </div>
                <input type="file" ref={profileFileInputRef} accept="image/*" style={{display: 'none'}} onChange={e => { const f = e.target.files?.[0]; setProfilePictureFile(f || null); setProfilePicturePreview(f ? URL.createObjectURL(f) : profileData.profile_picture_url); }} />
                <button type="button" onClick={() => profileFileInputRef.current?.click()} style={styles.changePhotoBtn}>
                  <FaCamera style={{marginRight: '0.5rem'}} /> Change Photo
                </button>
              </div>
              <div style={styles.profileFields}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>First Name</label>
                    <input type="text" name="first_name" value={profileForm.first_name} onChange={handleProfileChange} style={styles.input} className="input-focus" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Last Name</label>
                    <input type="text" name="last_name" value={profileForm.last_name} onChange={handleProfileChange} style={styles.input} className="input-focus" />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Username</label>
                  <input type="text" name="username" value={profileForm.username} onChange={handleProfileChange} style={styles.input} className="input-focus" required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email</label>
                  <input type="text" value={profileData.email} style={{...styles.input, opacity: 0.8}} readOnly disabled />
                  <p style={styles.helperText}>Email cannot be changed.</p>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Phone</label>
                  <input type="text" name="phone" value={profileForm.phone} onChange={handleProfileChange} style={styles.input} className="input-focus" placeholder="e.g., 0300-1234567" />
                </div>
                <button type="submit" disabled={profileSaving} style={styles.saveButton}>
                  {profileSaving ? <><FaSpinner className="spin" style={{marginRight: '0.5rem'}}/> Saving...</> : <><FaCheckCircle style={{marginRight: '0.5rem'}}/> Save Profile</>}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' },
  pageIcon: { fontSize: '2.5rem', color: 'var(--button-bg)' },
  pageTitle: { fontSize: '2rem', fontWeight: 'bold', color: 'var(--header-text)', margin: 0 },
  pageSubtitle: { opacity: 0.7, margin: '0.25rem 0 0 0' },
  successBanner: { display: 'flex', alignItems: 'center', padding: '1rem', backgroundColor: '#10B981', color: 'white', borderRadius: '8px', marginBottom: '1.5rem' },
  errorBanner: { display: 'flex', alignItems: 'center', padding: '1rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '8px', marginBottom: '1.5rem' },
  card: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '2rem', boxShadow: 'var(--shadow)', maxWidth: '700px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
  cardTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--header-text)', margin: 0 },
  cardDescription: { opacity: 0.8, lineHeight: 1.6, marginBottom: '1.5rem' },
  currentWalletBox: { backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },
  currentWalletLabel: { fontWeight: '600', margin: '0 0 0.5rem 0', color: '#10B981' },
  walletAddressRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  walletAddress: { fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all', flex: 1 },
  copyBtn: { padding: '0.4rem 0.6rem', background: 'var(--button-bg)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', flexShrink: 0 },
  walletNote: { fontSize: '0.8rem', color: '#10B981', margin: '0.5rem 0 0 0' },
  section: { marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '600', color: 'var(--header-text)', marginBottom: '0.5rem' },
  metamaskButton: { display: 'flex', alignItems: 'center', padding: '0.85rem 2rem', backgroundColor: '#f6851b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  divider: { borderTop: '1px solid var(--card-border)', margin: '1.5rem 0' },
  manualInputRow: { display: 'flex', gap: '1rem', alignItems: 'center' },
  input: { flex: 1, padding: '0.8rem 1rem', backgroundColor: 'var(--bg-color)', border: '2px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  saveButton: { display: 'flex', alignItems: 'center', padding: '0.8rem 1.5rem', backgroundColor: 'var(--button-bg)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' },
  profileSection: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
  avatarSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  avatarWrapper: { width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--card-border)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: 'var(--hero-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)', opacity: 0.7 },
  changePhotoBtn: { display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', background: 'var(--hero-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', color: 'var(--text-color)', cursor: 'pointer', fontSize: '0.9rem' },
  profileFields: { flex: 1, minWidth: '280px' },
  formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  formGroup: { marginBottom: '1rem', flex: '1 1 200px' },
  formLabel: { display: 'block', marginBottom: '0.4rem', fontWeight: '500', fontSize: '0.9rem' },
  helperText: { fontSize: '0.8rem', opacity: 0.7, margin: '0.25rem 0 0 0' },
};

export default SiteSettings;
