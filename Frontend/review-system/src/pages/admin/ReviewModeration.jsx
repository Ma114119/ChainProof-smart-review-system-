import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminReviews, updateReviewStatus, deleteAdminReview } from '../../services/api';
import { 
    FaComments, FaSpinner, FaExclamationTriangle, FaSearch, FaTimes, FaCheck, 
    FaShieldAlt, FaStar, 
    FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaUserShield, FaBrain, FaInfoCircle
} from 'react-icons/fa';

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

// --- Review Card Component (Now includes expandable details) ---
const ReviewCard = ({ review, isSelected, isExpanded, onToggleSelect, onExpand, onAction }) => {
    const renderStars = (rating) => Array(5).fill(null).map((_, i) => <FaStar key={i} style={{ color: i < rating ? "#ffc107" : "var(--card-border)" }} />);

    return (
        <div style={{...styles.reviewCard, ...(isExpanded && styles.reviewCardExpanded)}}>
            <div style={styles.cardHeader}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(review.id)} style={{marginRight: '1rem'}} />
                <h4 style={styles.cardBusinessName}>{review.businessName}</h4>
                <span style={{...styles.statusBadge, ...styles[review.status.toLowerCase()]}}>{review.status}</span>
            </div>
            <div style={styles.cardContent} onClick={() => onExpand(review.id)}>
                <p style={styles.cardComment}>"{review.comment}"</p>
                <div style={styles.cardFooter}>
                    <div style={styles.cardReviewer}>by <strong>{review.reviewer.name}</strong></div>
                    <div style={styles.cardRating}>{renderStars(review.rating)}</div>
                </div>
            </div>
            <div style={styles.aiRiskIndicator}>
                <FaBrain /> AI Risk Score: <span style={{color: review.ai.riskScore > 70 ? '#EF4444' : '#f97316', fontWeight: 'bold'}}>{review.ai.riskScore}%</span>
            </div>

            {/* EXPANDABLE DETAIL SECTION */}
            <div style={{...styles.detailSection, maxHeight: isExpanded ? '500px' : '0px', opacity: isExpanded ? 1 : 0}}>
                <div style={{padding: '1.5rem'}}>
                    {/* AI Insights */}
                    <h4 style={styles.subTitle}><FaBrain/> AI Signals</h4>
                    <div style={styles.aiInsightsGrid}>
                        <div><strong>Spam Score:</strong> <span style={{color: review.ai.spamScore > 50 ? '#EF4444' : '#10B981'}}>{review.ai.spamScore}/100</span></div>
                        <div><strong>Toxicity:</strong> {review.ai.toxicity}%</div>
                        <div><strong>Similarity:</strong> {review.ai.similarity}%</div>
                        <div><strong>Off-topic:</strong> {review.ai.offTopic}%</div>
                    </div>
                    
                    {/* Integrity Block */}
                    <h4 style={{...styles.subTitle, marginTop: '1.5rem'}}><FaShieldAlt/> Integrity & Proof</h4>
                    <div style={styles.integrityProof}><strong>Tx Hash:</strong> <a href="#" style={styles.link}>{review.integrity.txHash.substring(0, 20)}... <FaExternalLinkAlt size="0.7em"/></a></div>
                    <div style={styles.integrityProof}><strong>IPFS CID:</strong> <a href="#" style={styles.link}>{review.integrity.ipfsCid.substring(0, 20)}... <FaExternalLinkAlt size="0.7em"/></a></div>

                    {/* Actions */}
                    <h4 style={{...styles.subTitle, marginTop: '1.5rem'}}>Moderation Actions</h4>
                     <div style={styles.moderationActions}>
                        <button onClick={() => onAction([review.id], 'Approved')} style={{...styles.actionButton, backgroundColor: '#10B981', color: 'white'}}><FaCheck/> Approve</button>
                        <button onClick={() => onAction([review.id], 'Rejected')} style={{...styles.actionButton, backgroundColor: '#EF4444', color: 'white'}}><FaTimes/> Reject</button>
                     </div>
                </div>
            </div>
        </div>
    );
};


// =================================================================
// Main Page Component
// =================================================================
function ReviewModeration() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeQueue, setActiveQueue] = useState('AI-Flagged');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReviews, setSelectedReviews] = useState([]);
    const [expandedReviewId, setExpandedReviewId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [notification, setNotification] = useState(null);
    const reviewsPerPage = 10;

    const normalizeReview = (r) => {
        const riskScore = r.status === 'Flagged' ? 85 : r.status === 'Pending' ? 40 : 5;
        const queueStatus = r.status === 'Flagged' ? 'AI-Flagged' : r.status;
        return {
            id: r.id,
            businessName: r.business_name,
            reviewer: { name: r.user, trustScore: 80 },
            rating: r.rating,
            comment: r.content,
            date: r.created_at,
            status: queueStatus,
            ai: { riskScore, spamScore: riskScore, toxicity: 0, similarity: 0, offTopic: 0 },
            integrity: {
                txHash: r.blockchain_hash || '0x0000000000000000000000000000000000000000',
                ipfsCid: r.transaction_id || 'N/A',
            },
        };
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchAdminReviews();
            setReviews((data || []).map(normalizeReview));
        } catch (err) {
            setError('Failed to load reviews.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleModerationAction = async (reviewIds, action) => {
        const backendStatus = action === 'AI-Flagged' ? 'Flagged' : action;
        try {
            await Promise.all(reviewIds.map(id => updateReviewStatus(id, backendStatus)));
            setReviews(reviews.map(r => reviewIds.includes(r.id) ? { ...r, status: action } : r));
            setSelectedReviews([]);
            setExpandedReviewId(null);
            showNotification(`${reviewIds.length} review(s) have been ${action.toLowerCase()}.`, 'success');
        } catch (err) {
            showNotification('Failed to update review status.', 'error');
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedReviews(prev => 
            prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
        );
    };

    const handleExpandReview = (id) => {
        setExpandedReviewId(prevId => prevId === id ? null : id);
    };

    const filteredReviews = useMemo(() => {
        return reviews
            .filter(r => activeQueue === 'All' || r.status === activeQueue)
            .filter(r => (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()));
    }, [reviews, searchTerm, activeQueue]);

    const paginatedReviews = filteredReviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage);
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const hoverStyles = `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .input-focus:focus-within { border-color: var(--button-bg); box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3); }
    `;

    if (loading) {
        return <div style={styles.loader}><FaSpinner className="spin" /> Loading Reviews...</div>;
    }

    return (
        <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
            <style>{hoverStyles}</style>
            {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}

            <section style={styles.hero}>
                <div style={styles.heroContent}>
                    <FaShieldAlt style={styles.heroIcon} />
                    <h1 style={styles.heroTitle}>Review Moderation</h1>
                    <p style={styles.heroSubtitle}>Manage all user-submitted reviews to ensure quality and safety on the platform.</p>
                </div>
            </section>
            
            <main style={styles.main}>
                <div style={styles.reviewListContainer}>
                    <div style={styles.listHeader}>
                        <div style={styles.queues}>
                            <button onClick={() => setActiveQueue('All')} style={activeQueue === 'All' ? {...styles.queueButton, ...styles.queueButtonActive} : styles.queueButton}>All Reviews</button>
                            <button onClick={() => setActiveQueue('AI-Flagged')} style={activeQueue === 'AI-Flagged' ? {...styles.queueButton, ...styles.queueButtonActive} : styles.queueButton}>AI-Flagged</button>
                            <button onClick={() => setActiveQueue('User-Reported')} style={activeQueue === 'User-Reported' ? {...styles.queueButton, ...styles.queueButtonActive} : styles.queueButton}>User-Reported</button>
                            <button onClick={() => setActiveQueue('Approved')} style={activeQueue === 'Approved' ? {...styles.queueButton, ...styles.queueButtonActive} : styles.queueButton}>Approved</button>
                        </div>
                        <div style={styles.searchContainer} className="input-focus">
                            <FaSearch style={styles.searchIcon} />
                            <input type="text" placeholder="Search reviews by content or business..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput}/>
                        </div>
                    </div>
                    
                    <div style={styles.reviewGrid}>
                        {paginatedReviews.length > 0 ? paginatedReviews.map(review => (
                             <ReviewCard
                                key={review.id}
                                review={review}
                                isSelected={selectedReviews.includes(review.id)}
                                isExpanded={expandedReviewId === review.id}
                                onToggleSelect={handleToggleSelect}
                                onExpand={handleExpandReview}
                                onAction={handleModerationAction}
                             />
                        )) : (
                            <div style={styles.emptyState}>No reviews in this queue.</div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div style={styles.pagination}>
                            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} style={styles.pageButton}><FaChevronLeft/></button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} style={styles.pageButton}><FaChevronRight/></button>
                        </div>
                    )}
                </div>
            </main>

            {selectedReviews.length > 0 && (
                <div style={styles.bulkActionsBar}>
                    <span>{selectedReviews.length} review(s) selected</span>
                    <div style={styles.bulkActionButtons}>
                        <button onClick={() => handleModerationAction(selectedReviews, 'Approved')} style={styles.bulkActionButton}><FaCheck/> Approve</button>
                        <button onClick={() => handleModerationAction(selectedReviews, 'Rejected')} style={{...styles.bulkActionButton, ...styles.bulkActionReject}}><FaTimes/> Reject</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    // --- Hero & Main Layout ---
    hero: { padding: "4rem 2rem", backgroundColor: "var(--hero-bg)", borderBottom: "1px solid var(--card-border)", textAlign: 'center' },
    heroIcon: { fontSize: "3.5rem", color: "var(--hero-text)", marginBottom: "1rem" },
    heroContent: { maxWidth: "1200px", margin: "0 auto" },
    heroTitle: { fontSize: "2.8rem", fontWeight: "bold", color: "var(--hero-text)", margin: "0 0 0.5rem 0" },
    heroSubtitle: { fontSize: "1.1rem", color: "var(--text-color)", opacity: 0.9, margin: 0 },
    main: {         maxWidth: "1200px",
        margin: "2rem auto",
        padding: "0 2rem",
        padding: "0 2rem 2rem 2rem",
        marginBottom: '0rem', },
    
    // --- Review List ---
    reviewListContainer: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '2rem' },
    listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    queues: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
    queueButton: { padding: '0.75rem 1.5rem', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--card-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
    queueButtonActive: { backgroundColor: 'var(--button-bg)', color: 'white', borderColor: 'var(--button-bg)' },
    searchContainer: { display: "flex", alignItems: "center", gap: "0.5rem", width: "400px", maxWidth: '100%', backgroundColor: "var(--bg-color)", borderRadius: "8px", padding: "0.5rem 1rem", border: '2px solid var(--card-border)' },
    searchInput: { flex: 1, border: "none", outline: "none", backgroundColor: "transparent", color: "var(--text-color)", fontSize: "0.9rem" },
    searchIcon: { opacity: 0.5 },
    // UPDATED: Changed from grid to a flex column layout
    reviewGrid: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    emptyState: { textAlign: 'center', opacity: 0.7, padding: '3rem 0' },
    
    // --- Review Card ---
    reviewCard: { backgroundColor: 'var(--hero-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease-in-out' },
    reviewCardExpanded: { border: '1px solid var(--button-bg)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)' },
    cardHeader: { display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--card-border)' },
    cardBusinessName: { fontWeight: '600', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    cardContent: { padding: '1rem', flex: 1, cursor: 'pointer' },
    cardComment: { fontStyle: 'italic', opacity: 0.9, margin: '0 0 1rem 0' },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardReviewer: { fontSize: '0.9rem', opacity: 0.8 },
    cardRating: { display: 'flex', gap: '0.2rem', color: '#ffc107' },
    aiRiskIndicator: { backgroundColor: 'var(--card-bg)', padding: '0.75rem 1rem', borderTop: '1px solid var(--card-border)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    
    // --- Expandable Detail Section ---
    detailSection: { overflow: 'hidden', transition: 'max-height 0.4s ease-in-out, opacity 0.4s ease-in-out 0.1s', borderTop: '1px solid var(--card-border)' },
    subTitle: { fontSize: '1rem', fontWeight: '600', color: 'var(--header-text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' },
    aiInsightsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' },
    integrityProof: { fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.85rem', marginBlock: '0.5rem' },
    moderationActions: { display: 'flex', gap: '1rem' },
    actionButton: { padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    link: { color: 'var(--button-bg)', textDecoration: 'none', fontSize: '0.9rem' },
    
    // --- Status Badges & Pagination ---
    statusBadge: { padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
    'ai-flagged': { backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316' },
    'user-reported': { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' },
    approved: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
    rejected: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '1rem' },
    pageButton: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)'},
    
    // --- Bulk Actions Bar ---
    bulkActionsBar: { position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--header-bg)', color: 'var(--header-text)', padding: '1rem 2rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '2rem', zIndex: 50 },
    bulkActionButtons: { display: 'flex', gap: '1rem' },
    bulkActionButton: { padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    bulkActionReject: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' },

    // --- Loader & Notification ---
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem' },
    notification: { position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', padding: '1rem 1.5rem', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', zIndex: 1001 },
    notificationSuccess: { backgroundColor: '#10B981' },
    notificationDismiss: { background: 'none', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer', fontSize: '1.5rem' }
};

export default ReviewModeration;

