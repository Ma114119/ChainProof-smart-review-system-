import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyBusinesses, fetchAdminPaymentDetails, fetchMyProfile, ownerRequestBuyCoins, fetchOwnerWalletBalance, fetchOwnerTransactions } from '../../services/api';
import { 
  FaCoins, 
  FaHistory, 
  FaSpinner,
  FaWallet,
  FaUniversity,
  FaMobileAlt,
  FaCheckCircle,
  FaArrowDown,
  FaArrowUp,
  FaEthereum,
  FaCopy,
} from 'react-icons/fa';

function BusinessWallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyAmount, setBuyAmount] = useState('');
  const [userPaymentDetails, setUserPaymentDetails] = useState({ paymentMethod: '', providerName: '', accountTitle: '', accountNumber: '' });
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [coinRate, setCoinRate] = useState(120);
  const [adminWallet, setAdminWallet] = useState('');
  const [adminWalletLoading, setAdminWalletLoading] = useState(true);
  const [adminPaymentDetails, setAdminPaymentDetails] = useState(null);
  const [myWalletAddress, setMyWalletAddress] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const [balanceRes, txnsRes] = await Promise.all([
        fetchOwnerWalletBalance().catch(() => ({ balance: 0 })),
        fetchOwnerTransactions().catch(() => []),
      ]);
      setBalance(balanceRes?.balance ?? 0);
      setTransactions(txnsRes || []);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdminPaymentDetails = useCallback(async () => {
    try {
      setAdminWalletLoading(true);
      const data = await fetchAdminPaymentDetails();
      setAdminWallet(data.admin_wallet_address || '');
      setAdminPaymentDetails(data);
      setCoinRate(data.pkr_per_rtc || 120);
    } catch (err) {
      console.error('Failed to load admin payment details:', err);
    } finally {
      setAdminWalletLoading(false);
    }
  }, []);

  const loadMyProfile = useCallback(async () => {
    try {
      const profile = await fetchMyProfile();
      setMyWalletAddress(profile.wallet_address || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
    loadAdminPaymentDetails();
    loadMyProfile();
  }, [loadWalletData, loadAdminPaymentDetails, loadMyProfile]);

  const handleBuyCoins = async (e) => {
    e.preventDefault();
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      alert("Please enter a valid amount to buy.");
      return;
    }
    if (!userPaymentDetails.paymentMethod) {
      alert("Please select payment method (JazzCash, EasyPaisa, or Bank).");
      return;
    }
    if (!userPaymentDetails.providerName || !userPaymentDetails.accountTitle || !userPaymentDetails.accountNumber) {
      alert("Please provide all your payment details for verification.");
      return;
    }
    if (!myWalletAddress) {
      alert("Please connect your MetaMask wallet first (Profile → Security).");
      return;
    }
    setSubmitLoading(true);
    try {
      const coins = parseInt(buyAmount, 10);
      const amountPkr = coins * coinRate;
      const payload = {
        coins_requested: coins,
        amount_paid_pkr: amountPkr,
        wallet_address: myWalletAddress,
        payment_method: userPaymentDetails.paymentMethod,
        provider_name: userPaymentDetails.providerName,
        account_title: userPaymentDetails.accountTitle,
        account_number: userPaymentDetails.accountNumber,
      };
      await ownerRequestBuyCoins(payload, paymentProofFile);
      setShowSuccessModal(true);
      setTransactions(prev => [{
        id: Date.now(),
        type: 'purchased',
        amount: parseFloat(buyAmount),
        description: 'Purchase request',
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
      }, ...prev]);
      setBuyAmount('');
      setUserPaymentDetails({ paymentMethod: '', providerName: '', accountTitle: '', accountNumber: '' });
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
    } catch (err) {
      alert(err?.data?.detail || err?.message || 'Failed to submit request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const copyAdminWallet = () => {
    if (adminWallet) navigator.clipboard.writeText(adminWallet);
  };

  const totalCost = (buyAmount ? parseFloat(buyAmount) * coinRate : 0).toFixed(2);

  const hoverStyles = `
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .input-focus:focus { border-color: var(--button-bg); box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3); }
    .submit-button-hover:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
  `;

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
      <style>{hoverStyles}</style>
      <section style={styles.hero}>
        <FaWallet style={styles.heroIcon}/>
        <h1 style={styles.heroTitle}>Business Wallet</h1>
        <p style={styles.heroSubtitle}>Purchase and manage coins to reward your customers for their valuable feedback.</p>
      </section>

      <main style={styles.main}>
        <div style={styles.topSection}>
            <div style={styles.balanceCard}>
                <p style={styles.balanceLabel}>Current Balance</p>
                <p style={styles.balanceAmount}>{balance.toFixed(2)} RTC</p>
            </div>
                <div style={styles.rateCard}>
                <p style={styles.rateLabel}>Current Rate</p>
                <p style={styles.rateAmount}>1 RTC = {coinRate} PKR</p>
            </div>
            {!myWalletAddress && (
                <p style={{gridColumn: '1/-1', color: '#f97316', textAlign: 'center', margin: 0}}>Connect your MetaMask wallet in Profile → Security to receive coins.</p>
            )}
        </div>

        <div style={styles.layoutGrid}>
          {/* Left Column: Buy Coins Form */}
          <div style={styles.formContainer}>
            <h2 style={styles.sectionTitle}>Buy Coins</h2>
            <form onSubmit={handleBuyCoins}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Amount of Coins to Buy</label>
                    <input type="number" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} style={styles.input} className="input-focus" min="1" step="1" placeholder="e.g., 100" required />
                </div>
                <div style={styles.totalCost}>
                    <p>Total Cost:</p>
                    <p style={styles.totalCostAmount}>{totalCost} PKR</p>
                </div>
                <h3 style={styles.subTitle}>Your Payment Details (for reversals)</h3>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Payment Method</label>
                    <select value={userPaymentDetails.paymentMethod} onChange={e => setUserPaymentDetails({...userPaymentDetails, paymentMethod: e.target.value})} style={styles.input} className="input-focus" required>
                        <option value="">Select...</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="Bank">Bank Transfer</option>
                    </select>
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Your Bank/Provider Name</label>
                    <input type="text" value={userPaymentDetails.providerName} onChange={e => setUserPaymentDetails({...userPaymentDetails, providerName: e.target.value})} style={styles.input} className="input-focus" placeholder="e.g., HBL, JazzCash, EasyPaisa, etc." required/>
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Your Account Title</label>
                    <input type="text" value={userPaymentDetails.accountTitle} onChange={e => setUserPaymentDetails({...userPaymentDetails, accountTitle: e.target.value})} style={styles.input} className="input-focus" placeholder="The name on your account" required/>
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Your Account/Phone Number</label>
                    <input type="text" value={userPaymentDetails.accountNumber} onChange={e => setUserPaymentDetails({...userPaymentDetails, accountNumber: e.target.value})} style={styles.input} className="input-focus" placeholder="Your bank or mobile account number" required/>
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Payment Proof Screenshot (Optional)</label>
                    <p style={{fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem'}}>Upload a screenshot of your EasyPaisa/JazzCash/bank statement as proof of payment. Admin will use this to verify your transfer.</p>
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; setPaymentProofFile(f || null); setPaymentProofPreview(f ? URL.createObjectURL(f) : null); }} style={styles.input} />
                    {paymentProofPreview && (
                        <div style={{marginTop: '0.75rem'}}>
                            <img src={paymentProofPreview} alt="Payment proof preview" style={{maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--card-border)'}} />
                            <button type="button" onClick={() => { setPaymentProofFile(null); setPaymentProofPreview(null); }} style={{marginTop: '0.5rem', fontSize: '0.85rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer'}}>Remove</button>
                        </div>
                    )}
                </div>
                <button type="submit" style={styles.submitButton} className="submit-button-hover" disabled={submitLoading}>
                  {submitLoading ? 'Submitting...' : 'Request to Buy Coins'}
                </button>
            </form>
          </div>

          {/* Right Column: Payment Instructions & History */}
          <div style={styles.rightColumn}>
            <div style={styles.paymentContainer}>
                <h2 style={styles.sectionTitle}>Payment Instructions</h2>
                <p style={styles.formDescription}>
                  After requesting to buy coins, please transfer the total amount to one of the admin accounts below.
                  Your balance will be updated upon confirmation.
                </p>

                {/* Admin MetaMask Wallet */}
                <div style={styles.adminWalletBox}>
                    <div style={styles.adminWalletHeader}>
                        <FaEthereum style={{color: '#f6851b', marginRight: '0.5rem'}}/>
                        <strong>Admin MetaMask Wallet</strong>
                    </div>
                    {adminWalletLoading ? (
                        <p style={{opacity: 0.7, margin: '0.5rem 0 0 0', fontSize: '0.9rem'}}>Loading...</p>
                    ) : adminWallet ? (
                        <div style={styles.adminWalletAddressRow}>
                            <span style={styles.adminWalletAddress}>{adminWallet}</span>
                            <button type="button" onClick={copyAdminWallet} style={styles.copyBtn} title="Copy address">
                                <FaCopy />
                            </button>
                        </div>
                    ) : (
                        <p style={{opacity: 0.7, margin: '0.5rem 0 0 0', fontSize: '0.9rem'}}>Admin wallet not configured yet.</p>
                    )}
                </div>

                <div style={styles.paymentOption}>
                    <h3 style={styles.paymentTitle}><FaUniversity/> Bank Transfer</h3>
                    <div style={styles.paymentDetailRow}><span style={styles.paymentDetailLabel}>Bank:</span> <span style={styles.paymentDetailValue}>{adminPaymentDetails?.bank_name || 'HBL'}</span></div>
                    <div style={styles.paymentDetailRow}><span style={styles.paymentDetailLabel}>Account Title:</span> <span style={styles.paymentDetailValue}>{adminPaymentDetails?.account_title || 'ChainProof Admin'}</span></div>
                    <div style={styles.paymentDetailRow}><span style={styles.paymentDetailLabel}>Account Number:</span> <span style={styles.paymentDetailValue}>{adminPaymentDetails?.account_number || '0123-4567-8901'}</span></div>
                </div>
                <div style={{...styles.paymentOption, borderBottom: 'none', marginBottom: 0}}>
                    <h3 style={styles.paymentTitle}><FaMobileAlt/> Mobile Payment ({adminPaymentDetails?.mobile_payment_type || 'EasyPaisa'})</h3>
                    <div style={styles.paymentDetailRow}><span style={styles.paymentDetailLabel}>Phone Number:</span> <span style={styles.paymentDetailValue}>{adminPaymentDetails?.mobile_payment_number || '0300-1234567'}</span></div>
                    <div style={styles.paymentDetailRow}><span style={styles.paymentDetailLabel}>Account Title:</span> <span style={styles.paymentDetailValue}>{adminPaymentDetails?.mobile_payment_title || 'Admin Name'}</span></div>
                </div>
            </div>

            <div style={styles.historyContainer}>
                <div style={styles.historyHeader}>
                    <h2 style={styles.sectionTitle}>Transaction History</h2>
                </div>
                {loading ? <div style={styles.loader}><FaSpinner className="spin" /></div> : (
                    <div style={styles.transactionList}>
                        {transactions.length === 0 ? (
                            <p style={{opacity: 0.7, textAlign: 'center', padding: '2rem 0'}}>No transactions yet.</p>
                        ) : transactions.map(tx => (
                            <div key={tx.id} style={styles.txItem}>
                                <div style={tx.type === 'purchased' ? styles.txIconPurchased : styles.txIconSpent}>
                                    {tx.type === 'purchased' ? <FaArrowDown /> : <FaArrowUp />}
                                </div>
                                <div style={styles.txDetails}>
                                    <p style={styles.txDescription}>{tx.description}</p>
                                    <p style={styles.txDate}>{tx.date}</p>
                                </div>
                                <p style={tx.type === 'purchased' ? styles.txAmountPurchased : styles.txAmountSpent}>
                                    {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} RTC
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      </main>

      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <FaCheckCircle style={styles.modalIcon} />
            <h2 style={styles.modalTitle}>Purchase Request Sent!</h2>
            <p>Your request has been sent to the admin. Please complete the payment. Your coins will be transferred to your wallet within 24 hours of payment confirmation. If not, the payment will be reversed to your account.</p>
            <button onClick={() => setShowSuccessModal(false)} style={styles.modalButton}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
    hero: { padding: "4rem 2rem", textAlign: "center", backgroundColor: "var(--hero-bg)", borderBottom: "1px solid var(--card-border)" },
    heroIcon: { fontSize: "3.5rem", color: "var(--hero-text)", marginBottom: "1rem" },
    heroTitle: { fontSize: "2.8rem", fontWeight: "bold", color: "var(--hero-text)", marginBottom: "0.5rem" },
    heroSubtitle: { fontSize: "1.1rem", color: "var(--text-color)", opacity: 0.9 },
    main: { maxWidth: "1200px", margin: "2rem auto", padding: "0 2rem 2rem 2rem", marginBottom: "0rem" },
    topSection: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' },
    balanceCard: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '2rem', textAlign: 'center' },
    balanceLabel: { opacity: 0.8, margin: '0 0 0.5rem 0' },
    balanceAmount: { fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--button-bg)' },
    rateCard: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '2rem', textAlign: 'center' },
    rateLabel: { opacity: 0.8, margin: '0 0 0.5rem 0' },
    rateAmount: { fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-color)' },
    layoutGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2.5rem', alignItems: 'start' },
    sectionTitle: { fontSize: "1.5rem", fontWeight: "bold", color: "var(--header-text)", marginBottom: "1.5rem" },
    subTitle: { fontSize: "1.2rem", fontWeight: "600", color: "var(--header-text)", marginBottom: "1rem", paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' },
    formContainer: { backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow)', position: 'sticky', top: '100px' },
    totalCost: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid var(--card-border)' },
    totalCostAmount: { fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--button-bg)' },
    inputGroup: { marginBottom: '1.5rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '500' },
    input: { width: '100%', padding: '0.8rem 1rem', backgroundColor: 'var(--bg-color)', border: '2px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' },
    submitButton: { width: '100%', padding: '0.9rem', backgroundColor: 'var(--button-bg)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' },
    rightColumn: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
    paymentContainer: { backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow)' },
    formDescription: { marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 },
    adminWalletBox: { backgroundColor: 'var(--hero-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },
    adminWalletHeader: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: '600' },
    adminWalletAddressRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' },
    adminWalletAddress: { fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', flex: 1 },
    copyBtn: { padding: '0.4rem 0.6rem', background: 'var(--button-bg)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', flexShrink: 0 },
    paymentOption: { paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)' },
    paymentTitle: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', fontWeight: '600', color: 'var(--header-text)', margin: '0 0 1rem 0' },
    paymentDetailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
    paymentDetailLabel: { opacity: 0.8 },
    paymentDetailValue: { fontWeight: '500' },
    historyContainer: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden' },
    historyHeader: { padding: '2rem 2rem 1rem 2rem', borderBottom: '1px solid var(--card-border)' },
    transactionList: { padding: '0 2rem 2rem 2rem' },
    txItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--card-border)' },
    txIconPurchased: { color: '#10B981', fontSize: '1.5rem' },
    txIconSpent: { color: '#ef4444', fontSize: '1.5rem' },
    txDetails: { flex: 1 },
    txDescription: { fontWeight: '500', margin: 0 },
    txDate: { fontSize: '0.8rem', opacity: 0.7, margin: '0.25rem 0 0 0' },
    txAmountPurchased: { fontWeight: 'bold', color: '#10B981' },
    txAmountSpent: { fontWeight: 'bold', color: '#ef4444' },
    loader: { textAlign: 'center', padding: '2rem', fontSize: '1.5rem', color: 'var(--button-bg)' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px' },
    modalIcon: { fontSize: '3rem', color: '#10B981', marginBottom: '1rem' },
    modalTitle: { color: 'var(--header-text)', marginBottom: '1rem' },
    modalButton: { marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--button-bg)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};

export default BusinessWallet;
