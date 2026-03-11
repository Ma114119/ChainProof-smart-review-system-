import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyReviews, fetchAdminWallet, customerRequestSellCoins, fetchCustomerBalance } from '../../services/api';
import { 
  FaCoins, 
  FaHistory, 
  FaArrowRight,
  FaArrowUp,
  FaSpinner,
  FaWallet,
  FaUniversity,
  FaMobileAlt,
  FaTimes,
  FaCheckCircle,
  FaCopy,
  FaEthereum,
  FaExclamationTriangle
} from 'react-icons/fa';
import { MdSecurity } from 'react-icons/md';

const MIN_COINS_TO_SEND = 50;

function RewardWallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendAmount, setSendAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountTitle: '', accountNumber: '' });
  const [mobileDetails, setMobileDetails] = useState({ accountTitle: '', accountNumber: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [adminWallet, setAdminWallet] = useState('');
  const [adminWalletLoading, setAdminWalletLoading] = useState(true);
  const [sendError, setSendError] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const [reviews, balanceData] = await Promise.all([
        fetchMyReviews(),
        fetchCustomerBalance().catch(() => ({ balance: 0 })),
      ]);
      const approvedReviews = (reviews || []).filter(r => r.status === 'Approved');
      const txns = approvedReviews.map(r => ({
        id: r.id,
        type: 'earned',
        amount: 1,
        description: `Review @ ${r.business_name}`,
        date: r.created_at ? r.created_at.slice(0, 10) : '',
        status: 'completed',
      }));
      setTransactions(txns);
      setBalance(balanceData?.balance ?? approvedReviews.length);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdminWallet = useCallback(async () => {
    try {
      setAdminWalletLoading(true);
      const data = await fetchAdminWallet();
      setAdminWallet(data.admin_wallet_address || '');
    } catch (err) {
      console.error('Failed to load admin wallet:', err);
    } finally {
      setAdminWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
    loadAdminWallet();
  }, [loadWalletData, loadAdminWallet]);

  const handleSendToAdmin = async (e) => {
    e.preventDefault();
    setSendError('');
    const amount = parseInt(sendAmount, 10);

    if (!amount || amount <= 0) {
      setSendError('Please enter a valid amount.');
      return;
    }
    if (amount > balance) {
      setSendError('Insufficient balance. You do not have enough coins.');
      return;
    }
    if (amount < MIN_COINS_TO_SEND) {
      setSendError(`Minimum send amount is ${MIN_COINS_TO_SEND} coins.`);
      return;
    }
    const pm = paymentMethod === 'bank' ? 'Bank' : paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash';
    const provider = paymentMethod === 'bank' ? bankDetails.bankName : (paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash');
    const title = paymentMethod === 'bank' ? bankDetails.accountTitle : mobileDetails.accountTitle;
    const number = paymentMethod === 'bank' ? bankDetails.accountNumber : mobileDetails.accountNumber;
    if (!title || !number) {
      setSendError('Please provide all payment details.');
      return;
    }

    setSubmitLoading(true);
    try {
      await customerRequestSellCoins({
        coins_to_sell: amount,
        payment_method: pm,
        provider_name: provider,
        account_title: title,
        account_number: number,
      });
      setShowSuccessModal(true);
      setTransactions(prev => [{
        id: Date.now(),
        type: 'sent',
        amount: -amount,
        description: 'Payout request to Admin',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      }, ...prev]);
      setSendAmount('');
      setBankDetails({ bankName: '', accountTitle: '', accountNumber: '' });
      setMobileDetails({ accountTitle: '', accountNumber: '' });
    } catch (err) {
      setSendError(err?.data?.detail || err?.message || 'Failed to submit request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const copyAdminWallet = () => {
    if (adminWallet) {
      navigator.clipboard.writeText(adminWallet);
    }
  };

  const hoverStyles = `
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .tab-button-hover:hover { background-color: var(--hero-bg); }
    .input-focus:focus { border-color: var(--button-bg); box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3); }
    .submit-button-hover:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
  `;

  const isInsufficientBalance = balance < MIN_COINS_TO_SEND;

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
      <style>{hoverStyles}</style>
      <section style={styles.hero}>
        <FaWallet style={styles.heroIcon}/>
        <h1 style={styles.heroTitle}>My Reward Wallet</h1>
        <p style={styles.heroSubtitle}>View your transaction history and manage your earned coins.</p>
      </section>

      <main style={styles.main}>
        <div style={styles.balanceCard}>
            <p style={styles.balanceLabel}>Total Balance</p>
            <div style={styles.balanceAmount}>
                <FaCoins />
                <span>{balance.toFixed(2)} RTC</span>
            </div>
            {isInsufficientBalance && (
              <div style={styles.warningBox}>
                <FaExclamationTriangle style={{marginRight: '0.5rem', flexShrink: 0}}/>
                <span>You need at least <strong>{MIN_COINS_TO_SEND} RTC</strong> to send coins. Write more reviews to earn coins!</span>
              </div>
            )}
            <div style={styles.walletActions}>
                <button
                  onClick={() => setActiveTab('send')}
                  disabled={isInsufficientBalance}
                  style={{...styles.actionButton, ...styles.sendButton, opacity: isInsufficientBalance ? 0.5 : 1, cursor: isInsufficientBalance ? 'not-allowed' : 'pointer'}}
                  className={isInsufficientBalance ? '' : 'submit-button-hover'}
                  title={isInsufficientBalance ? `Need ${MIN_COINS_TO_SEND} coins minimum` : 'Send coins to admin'}
                >
                    <FaArrowUp /> Send to Admin
                </button>
                <button onClick={() => navigate('/explore')} style={{...styles.actionButton, ...styles.earnButton}} className="submit-button-hover">
                    <FaArrowRight /> Write a Review & Earn
                </button>
            </div>
        </div>

        <div style={styles.walletContainer}>
            <div style={styles.tabs}>
                <button onClick={() => setActiveTab('transactions')} style={activeTab === 'transactions' ? {...styles.tabButton, ...styles.tabButtonActive} : styles.tabButton} className="tab-button-hover"><FaHistory /> Transactions</button>
                <button onClick={() => setActiveTab('send')} disabled={isInsufficientBalance} style={activeTab === 'send' ? {...styles.tabButton, ...styles.tabButtonActive} : {...styles.tabButton, opacity: isInsufficientBalance ? 0.5 : 1}} className="tab-button-hover"><FaArrowUp /> Send Coins</button>
                <button onClick={() => setActiveTab('security')} style={activeTab === 'security' ? {...styles.tabButton, ...styles.tabButtonActive} : styles.tabButton} className="tab-button-hover"><MdSecurity /> Security</button>
            </div>

            <div style={styles.tabContent}>
                {loading ? (
                    <div style={styles.loader}><FaSpinner className="spin" /></div>
                ) : (
                    <>
                    {activeTab === 'transactions' && (
                        <div>
                            {transactions.length > 0 ? transactions.map(tx => (
                                <div key={tx.id} style={styles.txItem}>
                                    <div style={tx.type === 'earned' ? styles.txIconEarned : styles.txIconSent}>
                                        {tx.type === 'earned' ? <FaArrowRight /> : <FaArrowUp />}
                                    </div>
                                    <div style={styles.txDetails}>
                                        <p style={styles.txDescription}>{tx.description}</p>
                                        <p style={styles.txDate}>{tx.date}</p>
                                    </div>
                                    <p style={tx.type === 'earned' ? styles.txAmountEarned : styles.txAmountSent}>
                                        {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} RTC
                                    </p>
                                </div>
                            )) : <p style={styles.formDescription}>No transactions yet.</p>}
                        </div>
                    )}

                    {activeTab === 'send' && (
                        <form onSubmit={handleSendToAdmin}>
                            <p style={styles.formDescription}>
                                Send coins to the admin to convert them to cash. Minimum <strong>{MIN_COINS_TO_SEND} RTC</strong> required.
                                Please provide your payment details below.
                            </p>

                            {/* Admin Wallet Address Box */}
                            <div style={styles.adminWalletBox}>
                                <div style={styles.adminWalletHeader}>
                                    <FaEthereum style={{color: '#f6851b', marginRight: '0.5rem'}}/>
                                    <strong>Admin MetaMask Wallet Address</strong>
                                </div>
                                {adminWalletLoading ? (
                                    <p style={{opacity: 0.7, margin: '0.5rem 0 0 0'}}>Loading...</p>
                                ) : adminWallet ? (
                                    <div style={styles.adminWalletAddressRow}>
                                        <span style={styles.adminWalletAddress}>{adminWallet}</span>
                                        <button type="button" onClick={copyAdminWallet} style={styles.copyBtn} title="Copy address">
                                            <FaCopy />
                                        </button>
                                    </div>
                                ) : (
                                    <p style={{opacity: 0.7, margin: '0.5rem 0 0 0'}}>Admin wallet not configured yet.</p>
                                )}
                                <p style={{fontSize: '0.8rem', opacity: 0.7, margin: '0.5rem 0 0 0'}}>
                                    You can send coins directly to this address via MetaMask or provide payment details below for cash conversion.
                                </p>
                            </div>

                            {sendError && (
                              <div style={styles.errorBox}>
                                <FaExclamationTriangle style={{marginRight: '0.5rem', flexShrink: 0}} />
                                {sendError}
                              </div>
                            )}

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Amount to Send (RTC) — Min: {MIN_COINS_TO_SEND} RTC</label>
                                <input
                                  type="number"
                                  value={sendAmount}
                                  onChange={(e) => { setSendAmount(e.target.value); setSendError(''); }}
                                  style={styles.input}
                                  className="input-focus"
                                  max={balance}
                                  min={MIN_COINS_TO_SEND}
                                  required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Payment Method to Receive Cash</label>
                                <div style={styles.paymentMethods}>
                                    <button type="button" onClick={() => setPaymentMethod('bank')} style={paymentMethod === 'bank' ? {...styles.paymentButton, ...styles.paymentButtonActive} : styles.paymentButton}><FaUniversity/> Bank Transfer</button>
                                    <button type="button" onClick={() => setPaymentMethod('easypaisa')} style={paymentMethod === 'easypaisa' ? {...styles.paymentButton, ...styles.paymentButtonActive} : styles.paymentButton}><FaMobileAlt/> EasyPaisa</button>
                                    <button type="button" onClick={() => setPaymentMethod('jazzcash')} style={paymentMethod === 'jazzcash' ? {...styles.paymentButton, ...styles.paymentButtonActive} : styles.paymentButton}><FaMobileAlt/> JazzCash</button>
                                </div>
                            </div>
                            {paymentMethod === 'bank' && (
                                <div style={styles.paymentDetailsGrid}>
                                    <div style={styles.inputGroup}><label style={styles.label}>Bank Name</label><input type="text" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} style={styles.input} className="input-focus" placeholder="e.g. HBL, UBL, etc." required/></div>
                                    <div style={styles.inputGroup}><label style={styles.label}>Account Title</label><input type="text" value={bankDetails.accountTitle} onChange={e => setBankDetails({...bankDetails, accountTitle: e.target.value})} style={styles.input} className="input-focus" placeholder="Account holder name" required/></div>
                                    <div style={styles.inputGroup}><label style={styles.label}>Account Number</label><input type="text" value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} style={styles.input} className="input-focus" placeholder="123456789" required/></div>
                                </div>
                            )}
                            {['easypaisa', 'jazzcash'].includes(paymentMethod) && (
                                <div style={styles.paymentDetailsGrid}>
                                    <div style={styles.inputGroup}><label style={styles.label}>Account Title</label><input type="text" value={mobileDetails.accountTitle} onChange={e => setMobileDetails({...mobileDetails, accountTitle: e.target.value})} style={styles.input} className="input-focus" placeholder="Account holder name" required/></div>
                                    <div style={styles.inputGroup}><label style={styles.label}>Account Number</label><input type="text" value={mobileDetails.accountNumber} onChange={e => setMobileDetails({...mobileDetails, accountNumber: e.target.value})} style={styles.input} className="input-focus" placeholder="03XX-XXXXXXX" required/></div>
                                </div>
                            )}
                            <button type="submit" style={{...styles.submitButton, opacity: isInsufficientBalance ? 0.5 : 1}} className="submit-button-hover" disabled={isInsufficientBalance || submitLoading}>
                              {submitLoading ? 'Submitting...' : 'Request Payment'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <div style={styles.securityCard}>
                                <h3 style={styles.cardTitle}>Backup Wallet</h3>
                                <p style={styles.formDescription}>Save your private key in a secure location. Losing it will result in permanent loss of access to your coins.</p>
                                <button style={styles.securityButton}>Export Private Key</button>
                            </div>
                            <div style={styles.securityCard}>
                                <h3 style={styles.cardTitle}>Change Password</h3>
                                <p style={styles.formDescription}>Update your wallet password regularly to keep your account secure.</p>
                                <button onClick={() => navigate('/customer/profile')} style={styles.securityButton}>Go to Profile Settings</button>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
      </main>

      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <FaCheckCircle style={styles.modalIcon} />
            <h2 style={styles.modalTitle}>Transaction Submitted!</h2>
            <p>Your request to convert {sendAmount} RTC has been sent. You will receive the payment within 24 hours.</p>
            <button onClick={() => setShowSuccessModal(false)} style={styles.modalButton}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
    hero: { padding: "4rem 2rem 6rem", textAlign: "center", backgroundColor: "var(--hero-bg)", borderBottom: "1px solid var(--card-border)" },
    heroIcon: { fontSize: "3.5rem", color: "var(--hero-text)", marginBottom: "1rem" },
    heroTitle: { fontSize: "2.8rem", fontWeight: "bold", color: "var(--hero-text)", marginBottom: "0.5rem" },
    heroSubtitle: { fontSize: "1.1rem", color: "var(--text-color)", opacity: 0.9 },
    main: { maxWidth: "900px", margin: "-4rem auto 4rem auto", padding: "0 1rem", position: 'relative', zIndex: 2, marginBottom: '0rem' },
    balanceCard: { marginTop: '70px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '2rem', textAlign: 'center', marginBottom: '2rem' },
    balanceLabel: { opacity: 0.8, margin: '0 0 0.5rem 0' },
    balanceAmount: { fontSize: '3rem', fontWeight: 'bold', color: 'var(--button-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' },
    warningBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#b45309', fontSize: '0.9rem', textAlign: 'left' },
    walletActions: { display: 'flex', gap: '1rem', justifyContent: 'center' },
    actionButton: { padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.2s, box-shadow 0.2s' },
    sendButton: { backgroundColor: '#ef4444', color: '#fff' },
    earnButton: { backgroundColor: 'var(--button-bg)', color: '#fff' },
    walletContainer: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden' },
    tabs: { display: 'flex', borderBottom: '1px solid var(--card-border)' },
    tabButton: { flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: '3px solid transparent', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '500', transition: 'all 0.2s ease-in-out' },
    tabButtonActive: { color: 'var(--button-bg)', borderBottomColor: 'var(--button-bg)' },
    tabContent: { padding: '2rem' },
    loader: { textAlign: 'center', fontSize: '1.5rem', color: 'var(--button-bg)' },
    txItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--card-border)' },
    txIconEarned: { color: '#10B981', fontSize: '1.5rem' },
    txIconSent: { color: '#EF4444', fontSize: '1.5rem' },
    txDetails: { flex: 1 },
    txDescription: { fontWeight: '500', margin: 0 },
    txDate: { fontSize: '0.8rem', opacity: 0.7, margin: '0.25rem 0 0 0' },
    txAmountEarned: { fontWeight: 'bold', color: '#10B981' },
    txAmountSent: { fontWeight: 'bold', color: '#EF4444' },
    formDescription: { marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 },
    adminWalletBox: { backgroundColor: 'var(--hero-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },
    adminWalletHeader: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: '600' },
    adminWalletAddressRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' },
    adminWalletAddress: { fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all', flex: 1 },
    copyBtn: { padding: '0.4rem 0.6rem', background: 'var(--button-bg)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' },
    errorBox: { display: 'flex', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.9rem' },
    paymentMethods: { display: 'flex', gap: '1rem' },
    paymentButton: { flex: 1, padding: '1rem', background: 'var(--hero-bg)', border: '2px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s ease-in-out', fontWeight: '500' },
    paymentButtonActive: { borderColor: 'var(--button-bg)', color: 'var(--footer-text)', backgroundColor: 'var(--button-bg)', boxShadow: '0 0 10px var(--button-bg)' },
    paymentDetailsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1.5rem' },
    inputGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '500' },
    input: { width: '100%', padding: '0.8rem 1rem', backgroundColor: 'var(--bg-color)', border: '2px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' },
    submitButton: { width: '100%', padding: '0.9rem', backgroundColor: 'var(--button-bg)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' },
    securityCard: { backgroundColor: 'var(--hero-bg)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--card-border)' },
    cardTitle: { fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem", color: 'var(--header-text)' },
    securityButton: { padding: '0.75rem 1.5rem', backgroundColor: 'var(--button-bg)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
    modalIcon: { fontSize: '3rem', color: '#10B981', marginBottom: '1rem' },
    modalTitle: { color: 'var(--header-text)', marginBottom: '1rem' },
    modalButton: { marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--button-bg)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};

export default RewardWallet;
