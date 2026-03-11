import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { fetchFinancials, updateExchangeRate, adminTransferCoins, fetchAdminPurchaseRequests, fetchAdminPayoutRequests, fetchAdminPaymentDetails, saveAdminPaymentDetails, adminCompletePurchaseRequest, adminCompletePayoutRequest, adminRejectPayoutRequest } from '../../services/api';
import { 
    FaCoins, FaUniversity, FaExchangeAlt, FaMoneyBillWave, FaChevronDown,
    FaCheckCircle, FaTimesCircle, FaCog, FaSpinner, FaPaperPlane, FaInfoCircle,
    FaSave, FaUniversity as FaBank
} from 'react-icons/fa';


/**
 * ----------------------------------------------------------------
 * REUSABLE CHILD COMPONENTS
 * ----------------------------------------------------------------
 */

const StatusBadge = ({ status }) => {
    const statusStyles = {
        Pending: { backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316' },
        Completed: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
        Rejected: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' },
    };
    return <span style={{...styles.statusBadge, ...statusStyles[status]}}>{status}</span>;
};

const KPICard = ({ title, value, icon, children }) => (
    <div style={styles.kpiCard} className="stat-card-hover">
        <div style={styles.kpiHeader}>
            {icon}
            <h3 style={styles.kpiTitle}>{title}</h3>
        </div>
        <p style={styles.kpiValue}>{value}</p>
        {children && <div style={styles.kpiBreakdown}>{children}</div>}
    </div>
);

const EmptyState = ({ message }) => (
    <div style={styles.emptyState}>
        <p>{message}</p>
    </div>
);

const Notification = ({ message, type, onDismiss }) => (
    <div style={{ ...styles.notification, ...(type === 'error' ? styles.notificationError : styles.notificationSuccess) }}>
        <FaInfoCircle style={{ marginRight: '0.75rem' }} />
        <span>{message}</span>
        <button onClick={onDismiss} style={styles.notificationDismiss}>&times;</button>
    </div>
);


/**
 * ----------------------------------------------------------------
 * MAIN DASHBOARD COMPONENT
 * ----------------------------------------------------------------
 */
const FinancialDashboard = () => {
    // State Management
    const [coinSupply, setCoinSupply] = useState(1000000);
    const [adminBalance, setAdminBalance] = useState(250000);
    const [exchangeRate, setExchangeRate] = useState(120);
    const [payoutRequests, setPayoutRequests] = useState([]);
    const [purchaseRequests, setPurchaseRequests] = useState([]);
    const [selectedPayoutId, setSelectedPayoutId] = useState(null);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [newExchangeRate, setNewExchangeRate] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [loading, setLoading] = useState(true);
    const transferCardRef = useRef(null);

    const [transferWallet, setTransferWallet] = useState('');
    const [transferAmount, setTransferAmount] = useState('');

    const [adminPaymentDetails, setAdminPaymentDetails] = useState({
        bankName: 'HBL',
        accountTitle: 'ChainProof Admin',
        accountNumber: '0123-4567-8901',
        mobilePaymentNumber: '0300-1234567',
        mobilePaymentTitle: 'Admin Name',
        mobilePaymentType: 'EasyPaisa',
    });

    // Data Fetching Effect - only purchase requests (owner buy) and payout requests (customer sell)
    useEffect(() => {
        const loadData = async () => {
            try {
                const [financials, purchases, payouts, paymentDetails] = await Promise.all([
                    fetchFinancials().catch(() => null),
                    fetchAdminPurchaseRequests().catch(() => []),
                    fetchAdminPayoutRequests().catch(() => []),
                    fetchAdminPaymentDetails().catch(() => null),
                ]);

                if (paymentDetails) {
                    setAdminPaymentDetails({
                        bankName: paymentDetails.bank_name || 'HBL',
                        accountTitle: paymentDetails.account_title || 'ChainProof Admin',
                        accountNumber: paymentDetails.account_number || '0123-4567-8901',
                        mobilePaymentNumber: paymentDetails.mobile_payment_number || '0300-1234567',
                        mobilePaymentTitle: paymentDetails.mobile_payment_title || 'Admin Name',
                        mobilePaymentType: paymentDetails.mobile_payment_type || 'EasyPaisa',
                    });
                }
                if (financials) {
                    setAdminBalance(financials.admin_balance ?? 20000);
                    setCoinSupply(financials.total_coin_supply ?? 20000);
                    setExchangeRate(financials.exchange_rate ?? 120);
                }

                // Owner purchase requests (owner buys coins from admin)
                setPurchaseRequests((purchases || []).map(r => ({
                    id: r.id,
                    requesterName: r.requester,
                    amountPkr: r.amount_paid_pkr,
                    coinsRequested: r.coins_requested,
                    walletAddress: r.wallet_address ? r.wallet_address.slice(0, 20) + '...' : '0x0',
                    fullWalletAddress: r.wallet_address || '',
                    paymentMethod: r.payment_method,
                    providerName: r.provider_name || '',
                    accountTitle: r.account_title || '',
                    accountNumber: r.account_number || '',
                    paymentProofUrl: r.payment_proof_url || null,
                    date: new Date(r.date),
                    status: r.status,
                })));

                // Customer payout requests (customer sells coins to admin)
                setPayoutRequests((payouts || []).map(r => ({
                    id: `payout-${r.id}`,
                    numericId: r.id,
                    customerName: r.customer,
                    bankName: r.provider_name || '—',
                    accountTitle: r.account_title || '—',
                    accountNumber: r.account_number || '—',
                    paymentMethod: r.payment_method,
                    coinsToSell: r.coins_to_sell,
                    status: r.status,
                })));
            } catch (err) {
                console.error('Failed to load financial data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Memoized calculations for performance
    const pendingPayoutCount = useMemo(() => payoutRequests.filter(r => r.status === 'Pending').length, [payoutRequests]);
    const pendingPurchaseCount = useMemo(() => purchaseRequests.filter(r => r.status === 'Pending').length, [purchaseRequests]);

    // Handler Functions
    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type });
        }, 4000);
    }, []);

    const handleDirectTransfer = useCallback(async (e) => {
        e.preventDefault();
        const amount = parseFloat(transferAmount);
        if (!amount || amount <= 0 || !transferWallet) return;

        if (amount > adminBalance) {
            showNotification('Insufficient admin balance for this transfer.', 'error');
            return;
        }
        try {
            const result = await adminTransferCoins(transferWallet, amount);
            setAdminBalance(result.admin_balance ?? adminBalance - amount);
            showNotification(`Successfully sent ${amount.toLocaleString()} RTC to wallet ${transferWallet.substring(0, 10)}...`, 'success');
            setTransferWallet('');
            setTransferAmount('');
        } catch (err) {
            showNotification(err?.data?.detail || err?.message || 'Transfer failed.', 'error');
        }
    }, [transferAmount, transferWallet, adminBalance, showNotification]);

    const handleApprovePayout = useCallback(async (requestId, numericId, coinsToBuy) => {
        try {
            const res = await adminCompletePayoutRequest(numericId);
            setPayoutRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'Completed' } : req));
            if (res?.admin_balance != null) setAdminBalance(res.admin_balance);
            setSelectedPayoutId(null);
            showNotification(`Payout approved. ${coinsToBuy.toLocaleString()} RTC added to admin wallet.`, 'success');
        } catch (e) {
            showNotification(e?.data?.detail || 'Failed', 'error');
        }
    }, [showNotification]);
    
    const handleRejectPayout = useCallback(async (requestId, numericId) => {
        try {
            await adminRejectPayoutRequest(numericId);
            setPayoutRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'Rejected' } : req));
            setSelectedPayoutId(null);
            showNotification(`Payout request has been rejected.`, 'success');
        } catch (e) {
            showNotification(e?.data?.detail || 'Failed to reject', 'error');
        }
    }, [showNotification]);

    const handlePayoutRowClick = useCallback((requestId) => {
        setSelectedPayoutId(prevId => (prevId === requestId ? null : requestId));
    }, []);

    const handlePurchaseRowClick = useCallback((requestId) => {
        setSelectedPurchaseId(prevId => (prevId === requestId ? null : requestId));
    }, []);
    
    const handleInitiatePurchaseTransfer = useCallback((request) => {
        const coinsToSend = request.coinsRequested ?? (request.usdAmount * exchangeRate);
        const walletAddr = request.fullWalletAddress || request.walletAddress || '';
        setTransferWallet(walletAddr);
        setTransferAmount(coinsToSend.toString());
        transferCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showNotification(`Transfer form pre-filled for ${request.requesterName}.`, 'success');
    }, [exchangeRate, showNotification]);

    const handleUpdateExchangeRate = useCallback(async (e) => {
        e.preventDefault();
        if (!newExchangeRate) return;
        const rate = parseInt(newExchangeRate, 10);
        if (rate < 1) {
            showNotification('Exchange rate must be at least 1.', 'error');
            return;
        }
        try {
            await updateExchangeRate(rate);
            setExchangeRate(rate);
            setNewExchangeRate('');
            setShowExchangeModal(false);
            showNotification(`Exchange rate updated: 1 RTC = ${rate} PKR.`, 'success');
        } catch (err) {
            showNotification(err?.data?.detail || err?.message || 'Failed to update rate.', 'error');
        }
    }, [newExchangeRate, showNotification]);

    // NEW HANDLER for updating payment details
    const handlePaymentDetailsChange = (e) => {
        const { name, value } = e.target;
        setAdminPaymentDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSavePaymentDetails = async (e) => {
        e.preventDefault();
        try {
            await saveAdminPaymentDetails(adminPaymentDetails);
            showNotification('Admin payment details saved. They will appear on owner wallet page.', 'success');
        } catch (err) {
            showNotification(err?.data?.detail || 'Failed to save.', 'error');
        }
    };

    // Render loading state
    if (loading) {
        return <div style={styles.loader}><FaSpinner className="spin" /> Loading Financial Data...</div>;
    }

    // Render main dashboard
    return (
        <div style={styles.dashboardContainer}>
            <style>{`
                .spin { animation: spin 1.2s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .stat-card-hover { transition: all 0.3s ease; border: 1px solid transparent; }
                .stat-card-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.08); border-color: var(--button-bg); }
                .payout-details {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.4s ease-in-out, padding 0.4s ease-in-out, opacity 0.3s ease-in-out;
                    opacity: 0;
                    padding: 0 1.5rem;
                }
                .payout-details.expanded {
                    max-height: 300px;
                    opacity: 1;
                    padding: 1.5rem;
                }
                .chevron-icon { transition: transform 0.3s ease; }
                .chevron-icon.expanded { transform: rotate(180deg); }
            `}</style>
            
            {notification.show && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ ...notification, show: false })} />}
            
            <header style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Financial Dashboard</h1>
                    <p style={styles.headerSubtitle}>Oversee coin transfers, payouts, and system economy.</p>
                </div>
            </header>

            <main style={styles.main}>
                <div style={styles.kpiGrid}>
                    <div style={styles.kpiCard} className="stat-card-hover">
                        <div style={styles.kpiHeader}><FaCoins style={styles.kpiIcon}/><h3 style={styles.kpiTitle}>Admin Wallet</h3></div>
                        <p style={styles.adminWalletValue}>{adminBalance.toLocaleString()} RTC</p>
                        <div style={styles.kpiBreakdown}>Total Supply: {coinSupply.toLocaleString()} RTC</div>
                    </div>
                    <KPICard title="Exchange Rate" value={`1 RTC = ${exchangeRate} PKR`} icon={<FaExchangeAlt style={styles.kpiIcon}/>}>
                        <button style={styles.updateRateButton} onClick={() => setShowExchangeModal(true)}><FaCog/> Update Rate</button>
                    </KPICard>
                    <KPICard title="Pending Payouts" value={pendingPayoutCount} icon={<FaMoneyBillWave style={styles.kpiIcon}/>}>
                        <span>{pendingPayoutCount} requests require action</span>
                    </KPICard>
                    <KPICard title="Pending Purchases" value={pendingPurchaseCount} icon={<FaUniversity style={styles.kpiIcon}/>}>
                        <span>{pendingPurchaseCount} requests require action</span>
                    </KPICard>
                </div>

                <div style={styles.mainGrid}>
                    <div style={styles.gridColumnLeft}>
                        <div ref={transferCardRef} style={styles.card}>
                            <h2 style={styles.sectionTitle}>Direct Coin Transfer</h2>
                            <form onSubmit={handleDirectTransfer}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Recipient Wallet Address</label>
                                    <input type="text" value={transferWallet} onChange={(e) => setTransferWallet(e.target.value)} style={styles.formInput} placeholder="0x..." required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Amount (RTC)</label>
                                    <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} style={styles.formInput} placeholder="Enter amount" required />
                                </div>
                                <div style={{ ...styles.tableSubText, textAlign: 'right', marginTop: '-1rem', marginBottom: '1.5rem' }}>
                                    Admin Balance: {adminBalance.toLocaleString()} RTC
                                </div>
                                <div style={styles.formActions}>
                                    <button type="submit" style={styles.primaryButton} disabled={!transferAmount || !transferWallet}>
                                        <FaPaperPlane /> Transfer Coins
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        {/* UPDATED Admin Payment Details Card */}
                        <div style={styles.card}>
                            <h2 style={styles.sectionTitle}>Admin Payment Details</h2>
                            <p style={styles.cardDescription}>This information will be shown to business owners for purchasing coins.</p>
                            <form onSubmit={handleSavePaymentDetails}>
                                <div style={styles.paymentDetailsGrid}>
                                    <div style={styles.paymentDetailsColumn}>
                                        <h3 style={styles.subHeader}><FaBank /> Bank Transfer</h3>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>Bank Name</label>
                                            <input type="text" name="bankName" value={adminPaymentDetails.bankName} onChange={handlePaymentDetailsChange} style={styles.formInput} />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>Account Title</label>
                                            <input type="text" name="accountTitle" value={adminPaymentDetails.accountTitle} onChange={handlePaymentDetailsChange} style={styles.formInput} />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>Account Number</label>
                                            <input type="text" name="accountNumber" value={adminPaymentDetails.accountNumber} onChange={handlePaymentDetailsChange} style={styles.formInput} />
                                        </div>
                                    </div>
                                    <div style={styles.paymentDetailsColumn}>
                                        <h3 style={styles.subHeader}><FaMoneyBillWave /> Mobile Payment</h3>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>Mobile Payment Type</label>
                                            <select name="mobilePaymentType" value={adminPaymentDetails.mobilePaymentType || 'EasyPaisa'} onChange={handlePaymentDetailsChange} style={styles.formInput}>
                                                <option value="EasyPaisa">EasyPaisa</option>
                                                <option value="JazzCash">JazzCash</option>
                                            </select>
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>EasyPaisa / JazzCash Number</label>
                                            <input type="text" name="mobilePaymentNumber" value={adminPaymentDetails.mobilePaymentNumber} onChange={handlePaymentDetailsChange} style={styles.formInput} />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>Account Title</label>
                                            <input type="text" name="mobilePaymentTitle" value={adminPaymentDetails.mobilePaymentTitle} onChange={handlePaymentDetailsChange} style={styles.formInput} />
                                        </div>
                                    </div>
                                </div>
                                <div style={styles.formActions}>
                                    <button type="submit" style={styles.primaryButton}>
                                        <FaSave /> Save Details
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div style={styles.gridColumnRight}>
                        <div style={styles.card}>
                            <h2 style={styles.sectionTitle}>Owner Coin Purchase Requests</h2>
                            <div style={styles.table}>
                                {purchaseRequests.length > 0 ? purchaseRequests.map(req => {
                                    const isExpanded = selectedPurchaseId === req.id;
                                    return (
                                        <div key={req.id} style={styles.expandableRowWrapper}>
                                            <div style={{...styles.tableRow, ...styles.clickableRow, ...(isExpanded && styles.expandedRow)}} onClick={() => handlePurchaseRowClick(req.id)}>
                                                <div style={{ flex: 3 }}>
                                                    <div style={styles.tableName}>{req.requesterName}</div>
                                                    <div style={styles.tableSubTextFaded}>{req.walletAddress}</div>
                                                </div>
                                                <div style={{ flex: 2, textAlign: 'center' }}>
                                                    <div style={styles.tableSubText}>Sent (PKR)</div>
                                                    <div style={styles.tableAmount}>{req.amountPkr?.toLocaleString() || '—'} PKR</div>
                                                </div>
                                                <div style={{ flex: 2, textAlign: 'center' }}>
                                                    <div style={styles.tableSubText}>Receives</div>
                                                    <div style={styles.tableAmount}>{req.coinsRequested?.toLocaleString()} RTC</div>
                                                </div>
                                                <div style={{ flex: 2, textAlign: 'right' }}>
                                                    <StatusBadge status={req.status} />
                                                    <div style={styles.tableSubText}>{req.date.toLocaleDateString()}</div>
                                                </div>
                                                <div style={{ flex: 1, textAlign: 'right' }}>
                                                    {req.status === 'Pending' && (
                                                        <>
                                                            <button style={styles.sendButton} onClick={(e) => { e.stopPropagation(); handleInitiatePurchaseTransfer(req); }}>Send</button>
                                                            <button style={{...styles.sendButton, marginLeft: '0.5rem', background: '#10B981'}} onClick={async (e) => { e.stopPropagation(); try { await adminCompletePurchaseRequest(req.id); setPurchaseRequests(prev => prev.map(p => p.id === req.id ? {...p, status: 'Completed'} : p)); showNotification('Purchase marked complete.'); } catch (err) { showNotification(err?.data?.detail || 'Failed', 'error'); } }}>Complete</button>
                                                        </>
                                                    )}
                                                    {req.status === 'Pending' && <FaChevronDown className={`chevron-icon ${isExpanded ? 'expanded' : ''}`} style={{marginLeft:'0.5rem'}} />}
                                                </div>
                                            </div>
                                            <div className={`payout-details ${isExpanded ? 'expanded' : ''}`} style={{ maxHeight: isExpanded ? 400 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                                                <h4 style={styles.detailTitle}>Owner Payment Details (for verification)</h4>
                                                <div style={styles.detailGrid}>
                                                    <div><strong>Payment Method:</strong> {req.paymentMethod || '—'}</div>
                                                    <div><strong>Bank/Provider:</strong> {req.providerName || '—'}</div>
                                                    <div><strong>Account Title:</strong> {req.accountTitle || '—'}</div>
                                                    <div><strong>Account Number:</strong> {req.accountNumber || '—'}</div>
                                                    <div><strong>Wallet:</strong> <code style={{fontSize:'0.8rem',wordBreak:'break-all'}}>{req.fullWalletAddress || req.walletAddress}</code></div>
                                                </div>
                                                {req.paymentProofUrl && (
                                                    <div style={{marginTop: '1rem'}}>
                                                        <h4 style={styles.detailTitle}>Payment Proof Screenshot</h4>
                                                        <a href={req.paymentProofUrl} target="_blank" rel="noopener noreferrer" style={{color: 'var(--button-bg)', marginBottom: '0.5rem', display: 'inline-block'}}>Open in new tab</a>
                                                        <img src={req.paymentProofUrl} alt="Payment proof" style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--card-border)'}} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : <EmptyState message="No owner purchase requests." />}
                            </div>
                        </div>

                        <div style={styles.card}>
                            <h2 style={styles.sectionTitle}>Customer Payout Requests</h2>
                            <div style={styles.table}>
                                {payoutRequests.length > 0 ? payoutRequests.map(req => {
                                    const isExpanded = selectedPayoutId === req.id;
                                    return (
                                        <div key={req.id} style={styles.expandableRowWrapper}>
                                            <div style={{...styles.tableRow, ...styles.clickableRow, ...(isExpanded && styles.expandedRow)}} onClick={() => handlePayoutRowClick(req.id)} aria-expanded={isExpanded}>
                                                <div style={{ flex: 3 }}><div style={styles.tableName}>{req.customerName}</div></div>
                                                <div style={{ flex: 2 }}><div style={styles.tableSubText}>Sells {req.coinsToSell.toLocaleString()} RTC</div></div>
                                                <div style={{ flex: 2, textAlign: 'right' }}><StatusBadge status={req.status} /></div>
                                                <div style={{ flex: 1, textAlign: 'right' }}>
                                                    {req.status === 'Pending' && <FaChevronDown className={`chevron-icon ${isExpanded ? 'expanded' : ''}`} />}
                                                </div>
                                            </div>
                                            <div className={`payout-details ${isExpanded ? 'expanded' : ''}`}>
                                                <h4 style={styles.detailTitle}>Payout Details</h4>
                                                <div style={styles.detailGrid}>
                                                    <div><strong>Bank:</strong> {req.bankName}</div>
                                                    <div><strong>Title:</strong> {req.accountTitle}</div>
                                                    <div><strong>Account #:</strong> {req.accountNumber}</div>
                                                </div>
                                                <div style={styles.payoutValueBox}>
                                                    <span>Amount to Pay (PKR)</span>
                                                    <strong>{(req.coinsToSell * exchangeRate).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} PKR</strong>
                                                </div>
                                                {req.status === 'Pending' && (
                                                    <div style={styles.detailActions}>
                                                        <button style={styles.rejectButton} onClick={() => handleRejectPayout(req.id, req.numericId)}><FaTimesCircle/> Reject</button>
                                                        <button style={styles.approveButton} onClick={() => handleApprovePayout(req.id, req.numericId, req.coinsToSell)}><FaCheckCircle/> Approve Payment</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }) : <EmptyState message="No customer payout requests." />}
                            </div>
                        </div>
                    </div>
                </div>

                {showExchangeModal && (
                     <div style={styles.modalOverlay} onClick={() => setShowExchangeModal(false)}>
                        <div style={styles.modal} onClick={e => e.stopPropagation()}>
                            <form onSubmit={handleUpdateExchangeRate}>
                                <div style={styles.modalHeader}>
                                    <h3 style={styles.modalTitle}>Set Exchange Rate</h3>
                                    <button type="button" onClick={() => setShowExchangeModal(false)} style={styles.closeModalButton}>
                                        <FaTimesCircle/>
                                    </button>
                                </div>
                                <div style={styles.modalContent}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>PKR per RTC (1 RTC = ? PKR)</label>
                                        <input type="number" value={newExchangeRate} onChange={(e) => setNewExchangeRate(e.target.value)} style={styles.formInput} placeholder="e.g. 120" autoFocus />
                                    </div>
                                    <p style={styles.modalInfo}>Current: 1 RTC = {exchangeRate} PKR</p>
                                </div>
                                <div style={styles.modalActions}>
                                    <button type="button" onClick={() => setShowExchangeModal(false)} style={styles.secondaryButton}>Cancel</button>
                                    <button type="submit" disabled={!newExchangeRate} style={styles.primaryButton}>Update Rate</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};


/**
 * ----------------------------------------------------------------
 * STYLES OBJECT
 * ----------------------------------------------------------------
 */
const styles = {
    // Main Page Layout
    dashboardContainer: { backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" },
    header: { padding: "2rem 2.5rem", backgroundColor: "var(--card-bg)", borderBottom: "1px solid var(--card-border)", flexShrink: 0 },
    headerTitle: { fontSize: "2rem", fontWeight: "bold", color: "var(--header-text)", margin: "0 0 0.25rem 0" },
    headerSubtitle: { fontSize: "1rem", color: "var(--text-color)", opacity: 0.8, margin: 0 },
    main: { maxWidth: "1600px", margin: "2rem auto", padding: "0 2rem 2rem 2rem", marginBottom: "0rem",},
    mainGrid: { display: 'grid', gridTemplateColumns: 'minmax(450px, 1fr) 1.5fr', gap: '2rem', alignItems: 'start' },
    gridColumnLeft: { display: 'flex', flexDirection: 'column', gap: '2rem' },
    gridColumnRight: { display: 'flex', flexDirection: 'column', gap: '2rem' },
    
    // KPI Cards
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' },
    kpiCard: { backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow)' },
    kpiHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
    kpiIcon: { fontSize: '1.5rem', color: 'var(--button-bg)' },
    kpiTitle: { margin: 0, fontSize: '1rem', fontWeight: '600', opacity: 0.8 },
    kpiValue: { fontSize: '2rem', fontWeight: 'bold', color: 'var(--header-text)', margin: '0 0 0.5rem 0' },
    kpiBreakdown: { marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 },
    adminWalletValue: { fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--header-text)', margin: '0 0 0.5rem 0' },
    updateRateButton: { background: 'none', border: '1px solid var(--card-border)', color: 'var(--text-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },

    // General Card & Form Styles
    card: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '2rem', border: '1px solid var(--card-border)', overflow: 'hidden' },
    sectionTitle: { fontSize: "1.4rem", fontWeight: "600", color: "var(--header-text)", marginTop: 0, marginBottom: "1.5rem", paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' },
    cardDescription: { fontSize: '0.9rem', opacity: 0.7, marginTop: '-1rem', marginBottom: '1.5rem' },
    subHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', color: 'var(--header-text)', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' },
    formGroup: { marginBottom: '1.5rem' },
    formLabel: { display: 'block', marginBottom: '0.5rem', fontWeight: '500', opacity: 0.9 },
    formInput: { width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--card-border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '1rem' },
    formActions: { display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' },
    
    // NEW Payment Details Grid
    paymentDetailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
    paymentDetailsColumn: {},

    // Table Styles
    table: { width: '100%', display: 'flex', flexDirection: 'column' },
    tableRow: { display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', gap: '1rem' },
    tableName: { fontWeight: '600', color: 'var(--header-text)' },
    tableAmount: { fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--header-text)' },
    tableSubText: { fontSize: '0.85rem', opacity: 0.7 },
    tableSubTextFaded: { fontSize: '0.85rem', opacity: 0.6, fontFamily: 'monospace' },
    statusBadge: { padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block' },
    
    // Expandable Row Styles
    expandableRowWrapper: { borderBottom: '1px solid var(--card-border)', transition: 'background-color 0.2s ease' },
    clickableRow: { cursor: 'pointer', borderBottom: 'none' },
    expandedRow: { backgroundColor: 'rgba(0,0,0,0.02)' },
    detailTitle: { margin: '0 0 1rem 0', color: 'var(--header-text)' },
    detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', marginBottom: '1.5rem', fontSize: '0.9rem' },
    payoutValueBox: { backgroundColor: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    detailActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' },
    
    // Buttons
    primaryButton: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 1.5rem", backgroundColor: "var(--button-bg)", color: "white", border: "none", borderRadius: "8px", fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
    secondaryButton: { padding: '0.8rem 1.5rem', backgroundColor: 'transparent', color: 'var(--text-color)', border: '1px solid var(--card-border)', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' },
    approveButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    rejectButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    sendButton: { padding: '0.5rem 1rem', backgroundColor: 'var(--button-bg)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' },
    
    // Modal & Notification
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', width: '450px', maxWidth: '90%', border: '1px solid var(--card-border)', boxShadow: '0 15px 30px rgba(0,0,0,0.2)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' },
    modalTitle: { margin: 0, color: 'var(--header-text)', fontSize: '1.5rem' },
    closeModalButton: { background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7 },
    modalContent: { padding: '0 1rem 1rem 1rem' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 1rem 1rem 1rem', borderTop: '1px solid var(--card-border)' },
    modalInfo: { marginTop: '1rem', opacity: 0.7, fontSize: '0.9rem', backgroundColor: 'var(--bg-color)', padding: '0.75rem', borderRadius: '6px' },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: '1rem', fontSize: '1.2rem', color: 'var(--text-color)' },
    notification: { position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', padding: '1rem 1.5rem', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', zIndex: 1000, boxShadow: '0 5px 15px rgba(0,0,0,0.2)', fontSize: '0.95rem', minWidth: '350px' },
    notificationSuccess: { backgroundColor: '#10B981' },
    notificationError: { backgroundColor: '#EF4444' },
    notificationDismiss: { background: 'none', border: 'none', color: 'white', marginLeft: 'auto', paddingLeft: '1.5rem', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 },
};

export default FinancialDashboard;
