import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchMyBusinesses, fetchReviews } from '../../services/api';
import { 
    FaStar, 
    FaSpinner,
    FaExclamationTriangle,
    FaSearch,
    FaReply,
    FaTimes,
    FaThumbsUp,
    FaChartPie,
    FaFlag,
    FaComments,
    FaSmile,
    FaFrown
} from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Review Detail Modal Component
const ReviewDetailModal = ({ review, onClose, onReply }) => {
    const [replyText, setReplyText] = useState(review.reply || '');
    const renderStars = (rating) => Array(5).fill(null).map((_, i) => <FaStar key={i} style={{ color: i < rating ? "#ffc107" : "var(--card-border)" }} />);

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>Review Details</h3>
                    <button onClick={onClose} style={styles.closeModalButton}><FaTimes/></button>
                </div>
                <div style={styles.modalContent}>
                    <div style={styles.modalReviewerInfo}>
                        <div><strong>Reviewer:</strong> {review.user}</div>
                        <div><strong>Date:</strong> {new Date(review.date).toLocaleDateString()}</div>
                        <div>{renderStars(review.rating)}</div>
                    </div>
                    <p style={styles.modalReviewText}>"{review.comment}"</p>
                    <div style={styles.aiInsights}>
                        <h4 style={styles.subTitle}>AI Insights</h4>
                        <p><strong>Quality Score:</strong> {review.ai.qualityScore}/100</p>
                        <p><strong>Detected Issues:</strong> {review.ai.issues.length > 0 ? review.ai.issues.join(', ') : 'None'}</p>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); onReply(review.id, replyText); }}>
                        <label style={styles.label}>Your Public Reply</label>
                        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} style={styles.modalTextarea} placeholder="Write your public reply here..." rows="4"/>
                        <div style={styles.modalActions}><button type="submit" style={styles.replyButton} className="action-button-hover"><FaReply/> Save Reply</button></div>
                    </form>
                </div>
            </div>
        </div>
    );
};

function ReviewsFeedback() {
  const { businessId: initialBusinessId } = useParams();
  const [businesses, setBusinesses] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [allAiInsights, setAllAiInsights] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const bizList = await fetchMyBusinesses();
      const normalizedBizList = bizList.map(b => ({ id: b.id, name: b.name }));
      setBusinesses(normalizedBizList);

      const firstId = initialBusinessId ? parseInt(initialBusinessId) : (normalizedBizList.length > 0 ? normalizedBizList[0].id : null);
      setSelectedBusinessId(firstId);

      // Fetch reviews for all businesses
      const reviewPromises = normalizedBizList.map(b =>
        fetchReviews(b.id).then(reviews => reviews.map(r => ({
          id: r.id,
          businessId: b.id,
          user: r.user,
          rating: r.rating,
          comment: r.content,
          date: r.created_at,
          likes: 0,
          liked: false,
          reply: null,
          blockchain_hash: r.blockchain_hash,
          ai: { qualityScore: r.status === 'Flagged' ? 35 : 90, issues: r.status === 'Flagged' ? ['AI-flagged spam'] : [] },
        })))
      );
      const reviewArrays = await Promise.all(reviewPromises);
      const allReviewsFlat = reviewArrays.flat();
      setAllReviews(allReviewsFlat);

      // Compute AI sentiment per business from real data
      const insights = {};
      normalizedBizList.forEach(b => {
        const bReviews = allReviewsFlat.filter(r => r.businessId === b.id);
        const total = bReviews.length || 1;
        const positive = Math.round((bReviews.filter(r => r.rating >= 4).length / total) * 100);
        const negative = Math.round((bReviews.filter(r => r.rating <= 2).length / total) * 100);
        insights[b.id] = { sentiment: { positive, negative, neutral: 100 - positive - negative } };
      });
      setAllAiInsights(insights);
    } catch (err) {
      setError("Failed to load review data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [initialBusinessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReplySubmit = (reviewId, replyText) => {
    setAllReviews(allReviews.map(r => r.id === reviewId ? {...r, reply: replyText} : r));
    setSelectedReview(null);
  };

  const handleLike = (e, reviewId) => {
    e.stopPropagation();
    setAllReviews(allReviews.map(r => {
        if (r.id === reviewId) {
            return {...r, likes: r.liked ? r.likes - 1 : r.likes + 1, liked: !r.liked };
        }
        return r;
    }));
  };

  const filteredReviews = useMemo(() => {
    let result = allReviews
      .filter(r => r.businessId === selectedBusinessId)
      .filter(r => r.rating >= filterRating)
      .filter(r => r.comment.toLowerCase().includes(searchTerm.toLowerCase()));

    if (sortBy === 'newest') result.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sortBy === 'highest') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'lowest') result.sort((a, b) => a.rating - b.rating);
    return result;
  }, [allReviews, searchTerm, filterRating, sortBy, selectedBusinessId]);

  const renderStars = (rating) => {
    return Array(5).fill(null).map((_, i) => <FaStar key={i} style={{ color: i < rating ? "#ffc107" : "var(--card-border)" }} />);
  };

  const hoverStyles = `
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .input-focus:focus-within { border-color: var(--button-bg); box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3); }
    .action-button-hover { transition: all 0.2s ease-in-out; }
    .action-button-hover:hover { transform: translateY(-2px); }
  `;

  if (loading) {
    return <div style={styles.loader}><FaSpinner className="spin" /> Loading Reviews...</div>;
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
  
  const currentSentiment = allAiInsights[selectedBusinessId] || { sentiment: { positive: 0, neutral: 0, negative: 0 } };
  const sentimentData = [
      { name: 'Positive', value: currentSentiment.sentiment.positive, fill: '#10B981' },
      { name: 'Negative', value: currentSentiment.sentiment.negative, fill: '#EF4444' },
      { name: 'Neutral', value: currentSentiment.sentiment.neutral, fill: '#6B7280' },
  ];

  const selectedBusinessName = businesses.find(b => b.id === selectedBusinessId)?.name;
  const avgRating = filteredReviews.length > 0 ? (filteredReviews.reduce((acc, r) => acc + r.rating, 0) / filteredReviews.length).toFixed(1) : 'N/A';

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
      <style>{hoverStyles}</style>
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Reviews & Feedback</h1>
        <p style={styles.heroSubtitle}>Manage and respond to customer reviews.</p>
      </section>

      <main style={styles.main}>
        <div style={styles.businessFilters}>
            {businesses.map(biz => (
                <button key={biz.id} onClick={() => setSelectedBusinessId(biz.id)} style={selectedBusinessId === biz.id ? {...styles.filterButton, ...styles.filterButtonActive} : styles.filterButton} className="action-button-hover">{biz.name}</button>
            ))}
        </div>

        <div style={styles.statsGrid}>
            <div style={styles.statCard}>
                <h3 style={styles.statTitle}><FaComments style={{color: 'var(--button-bg)'}}/> Total Reviews</h3>
                <p style={styles.statValue}>{filteredReviews.length}</p>
            </div>
            <div style={styles.statCard}>
                <h3 style={styles.statTitle}><FaStar style={{color: '#ffc107'}}/> Average Rating</h3>
                <p style={styles.statValue}>{avgRating}</p>
            </div>
            <div style={styles.statCard}>
                <h3 style={styles.statTitle}><FaSmile style={{color: '#10B981'}}/> Positive Sentiment</h3>
                <p style={styles.statValue}>{currentSentiment.sentiment.positive}%</p>
            </div>
            <div style={styles.statCard}>
                <h3 style={styles.statTitle}><FaFrown style={{color: '#EF4444'}}/> Negative Sentiment</h3>
                <p style={styles.statValue}>{currentSentiment.sentiment.negative}%</p>
            </div>
        </div>

        <div style={styles.layoutGrid}>
            {/* Left Column: AI Insights */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarCard}>
                    <h2 style={styles.sectionTitle}><FaChartPie/> AI Sentiment Analysis</h2>
                    <p style={styles.reviewCount}>{filteredReviews.length} Total Reviews for {selectedBusinessName}</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </aside>

            {/* Right Column: Reviews List */}
            <div style={styles.reviewsContainer}>
                <div style={styles.filterBar}>
                    <div style={{...styles.searchContainer}} className="input-focus">
                        <FaSearch style={styles.searchIcon} />
                        <input type="text" placeholder="Search reviews..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput}/>
                    </div>
                    <div style={styles.filterControls}>
                        <select value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))} style={styles.select}>
                            <option value="0">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars & Up</option>
                        </select>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
                            <option value="newest">Sort by Newest</option>
                            <option value="oldest">Sort by Oldest</option>
                        </select>
                    </div>
                </div>

                {filteredReviews.map(review => (
                    <div key={review.id} style={styles.reviewCard}>
                        <div style={styles.reviewContent} onClick={() => setSelectedReview(review)}>
                            <div style={styles.reviewHeader}>
                                <h3 style={styles.reviewUser}>{review.user}</h3>
                                <div style={styles.reviewRating}>{renderStars(review.rating)}</div>
                            </div>
                            <p style={styles.reviewDate}>{new Date(review.date).toLocaleDateString()}</p>
                            <p style={styles.reviewComment}>{review.comment}</p>
                            {review.reply && (
                                <div style={styles.ownerReply}>
                                    <strong>Your Reply:</strong>
                                    <p>{review.reply}</p>
                                </div>
                            )}
                        </div>
                        <div style={styles.reviewActions}>
                            <button onClick={(e) => handleLike(e, review.id)} style={review.liked ? {...styles.likeButton, ...styles.likeButtonActive} : styles.likeButton}>
                                <FaThumbsUp/> {review.likes}
                            </button>
                            <button onClick={() => setSelectedReview(review)} style={styles.actionButton} className="action-button-hover"><FaReply/> Respond</button>
                            {review.ai.issues.includes("AI-flagged spam") && <span style={styles.flaggedBadge}><FaFlag/> AI Flagged</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </main>
      {selectedReview && <ReviewDetailModal review={selectedReview} onClose={() => setSelectedReview(null)} onReply={handleReplySubmit} />}
    </div>
  );
}

const styles = {
    // Hero
    hero: {
        padding: "3rem 2rem",
        backgroundColor: "var(--hero-bg)",
        borderBottom: "1px solid var(--card-border)",
    },
    heroTitle: {
        fontSize: "2.2rem",
        fontWeight: "bold",
        color: "var(--hero-text)",
        margin: "0 0 0.5rem 0",
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: "1rem",
        color: "var(--text-color)",
        opacity: 0.9,
        margin: 0,
        textAlign: 'center',
    },
    // Main Layout
    main: {
        maxWidth: "1200px",
        margin: "2rem auto",
        padding: "0 2rem",
        marginBottom: '0rem',
        padding: "0 2rem 2rem 2rem",
    },
    businessFilters: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '2.5rem',
    },
    filterButton: {
        padding: '0.8rem 1.8rem',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-color)',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '1rem',
        boxShadow: 'var(--shadow)',
        transition: 'all 0.2s ease-in-out',
    },
    filterButtonActive: {
        backgroundColor: 'var(--button-bg)',
        color: 'white',
        borderColor: 'var(--button-bg)',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem',
    },
    statCard: {
        backgroundColor: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
    },
    statTitle: {
        fontSize: '1rem',
        fontWeight: '600',
        opacity: 0.8,
        margin: '0 0 0.5rem 0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    statValue: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: 'var(--header-text)',
        margin: 0,
    },
    layoutGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '2.5rem',
        alignItems: 'start',
    },
    sectionTitle: {
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: "var(--header-text)",
        marginBottom: "1.5rem",
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    // Sidebar (AI Insights)
    sidebar: {
        position: 'sticky',
        top: '100px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    sidebarCard: {
        backgroundColor: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
    },
    reviewCount: {
        textAlign: 'center',
        fontSize: '1.1rem',
        fontWeight: '500',
        opacity: 0.8,
        marginBottom: '1rem',
    },
    // Reviews List
    reviewsContainer: {},
    filterBar: {
        backgroundColor: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
    },
    searchContainer: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        width: "300px",
        backgroundColor: "var(--bg-color)",
        borderRadius: "8px",
        padding: "0.5rem 1rem",
        border: '2px solid var(--card-border)',
    },
    searchInput: {
        flex: 1,
        border: "none",
        outline: "none",
        backgroundColor: "transparent",
        color: "var(--text-color)",
        fontSize: "0.9rem",
    },
    searchIcon: {
        opacity: 0.5,
    },
    filterControls: {
        display: 'flex',
        gap: '1rem',
    },
    select: {
        backgroundColor: "var(--bg-color)",
        border: "1px solid var(--card-border)",
        padding: "0.75rem",
        borderRadius: "8px",
        color: 'var(--text-color)',
    },
    reviewCard: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        marginBottom: '1.5rem',
    },
    reviewContent: {
        padding: '1.5rem',
        cursor: 'pointer',
    },
    reviewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reviewUser: {
        fontSize: '1.1rem',
        fontWeight: '600',
        margin: 0,
    },
    reviewRating: {
        display: 'flex',
        gap: '0.25rem',
    },
    reviewDate: {
        fontSize: '0.8rem',
        opacity: 0.7,
        margin: '0.25rem 0 1rem 0',
    },
    reviewComment: {
        opacity: 0.9,
        lineHeight: 1.6,
    },
    ownerReply: {
        backgroundColor: 'var(--hero-bg)',
        padding: '1rem',
        borderRadius: '8px',
        marginTop: '1rem',
        borderLeft: '4px solid var(--button-bg)',
    },
    reviewActions: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--card-border)',
        backgroundColor: 'var(--hero-bg)',
    },
    likeButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: 0.8,
        background: 'none',
        border: 'none',
        color: 'var(--text-color)',
        cursor: 'pointer',
    },
    likeButtonActive: {
        color: '#10B981', // Green when liked
        opacity: 1,
    },
    actionButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        color: 'var(--text-color)',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        cursor: 'pointer',
        marginLeft: 'auto', // Pushes this button to the right
    },
    flaggedBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#f97316',
        fontWeight: '500',
    },
    // Modal
    modalOverlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    },
    modal: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        width: '600px',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--card-border)',
        padding: '1.5rem',
    },
    modalTitle: { margin: 0, color: 'var(--header-text)', fontSize: '1.5rem' },
    closeModalButton: { background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '1.2rem', cursor: 'pointer' },
    modalContent: {
        padding: '1.5rem',
    },
    modalReviewerInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '1rem',
    },
    modalReviewText: {
        backgroundColor: 'var(--hero-bg)',
        padding: '1rem',
        borderRadius: '8px',
        fontStyle: 'italic',
    },
    aiInsights: {
        marginTop: '1.5rem',
    },
    subTitle: {
        fontSize: '1.2rem',
        fontWeight: '600',
        color: 'var(--header-text)',
        marginBottom: '1rem',
    },
    label: {
        fontWeight: '500',
        marginBottom: '0.5rem',
        display: 'block',
    },
    modalTextarea: {
        width: '100%',
        padding: '0.8rem',
        borderRadius: '8px',
        border: '1px solid var(--card-border)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '1rem',
    },
    replyButton: {
        padding: '0.75rem 1.5rem',
        backgroundColor: 'var(--button-bg)',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
    },
    // Loader and Error
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem' },
    errorContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem' },
    errorIcon: { fontSize: '3rem', color: '#ef4444' },
    retryButton: { padding: '0.8rem 1.5rem', backgroundColor: "var(--button-bg)", color: "white", border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default ReviewsFeedback;


