import React from 'react';

/**
 * Modal for user to select which MetaMask account to connect.
 * Use when eth_requestAccounts returns multiple accounts.
 */
export default function WalletAccountPicker({ accounts, onSelect, onCancel }) {
  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h3 style={titleStyle}>Select Your Wallet Account</h3>
        <p style={subtitleStyle}>Choose the account you want to connect to this profile. Each user should use their own account.</p>
        <div style={listStyle}>
          {accounts.map((addr) => (
            <button
              key={addr}
              type="button"
              style={accountButtonStyle}
              onClick={() => onSelect(addr)}
            >
              <code style={addressStyle}>{addr}</code>
            </button>
          ))}
        </div>
        <button type="button" style={cancelStyle} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};
const modalStyle = {
  backgroundColor: 'var(--card-bg)',
  borderRadius: '12px',
  padding: '1.5rem 2rem',
  maxWidth: '480px',
  width: '90%',
  maxHeight: '80vh',
  overflow: 'auto',
  border: '1px solid var(--card-border)',
};
const titleStyle = { margin: '0 0 0.5rem 0', fontSize: '1.25rem' };
const subtitleStyle = { margin: '0 0 1rem 0', opacity: 0.9, fontSize: '0.95rem' };
const listStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' };
const accountButtonStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  textAlign: 'left',
  backgroundColor: 'var(--hero-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  color: 'var(--text-color)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const addressStyle = { fontSize: '0.9rem', wordBreak: 'break-all' };
const cancelStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: 'transparent',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  color: 'var(--text-color)',
  cursor: 'pointer',
};
