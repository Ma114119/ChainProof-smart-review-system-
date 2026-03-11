import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaStar, FaArrowLeft, FaCoins, FaSpinner, FaInfoCircle, FaLightbulb, FaExternalLinkAlt } from 'react-icons/fa';
import { MdOutlineRateReview, MdOutlineTipsAndUpdates } from 'react-icons/md';
import { IoShieldCheckmark } from 'react-icons/io5';
import { fetchPublicBusinesses, fetchPublicBusiness, fetchAiSuggestion, submitReview } from '../../services/api';

// =================================================================
// Reusable Child Components & Helpers (Moved outside the main component)
// =================================================================

const Notification = ({ message, type, onDismiss }) => (
    <div style={{ ...styles.notification, ...(type === 'error' ? styles.notificationError : styles.notificationSuccess) }}>
        <FaInfoCircle style={{ marginRight: '0.75rem' }} />
        <span>{message}</span>
        <button onClick={onDismiss} style={styles.notificationDismiss}>&times;</button>
    </div>
);

// This is a simplified mock AI analysis. A real backend would have a sophisticated NLP model.
const mockAIAnalysis = (text) => {
    const issues = [];
    if (/\bfuck\b/i.test(text)) {
        issues.push({ word: "fuck", suggestion: "bad", reason: "Profanity" });
    }
    if (/\buseless\b/i.test(text)) {
        issues.push({ word: "useless", suggestion: "not helpful", reason: "Unconstructive" });
    }
    if (/\bhorrible\b/i.test(text)) {
        issues.push({ word: "horrible", suggestion: "disappointing", reason: "Overly Negative" });
    }
    return issues;
};


// =================================================================
// Main WriteReview Component
// =================================================================

function WriteReview() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  
  // --- State Management ---
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({
    rating: 0,
    comment: '',
    hoverRating: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });
  const [aiLoading, setAiLoading] = useState({ positive: false, negative: false, analysis: false });
  const [txHash, setTxHash] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(businessId || '');

  // --- Helper Functions ---
  const showNotification = useCallback((message, type = 'success') => {
      setNotification({ show: true, message, type });
      setTimeout(() => setNotification({ show: false, message: '', type }), 5000);
  }, []);

  const withTimeout = (promise, ms, timeoutMsg) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMsg)), ms)
      ),
    ]);

  // --- Data Fetching: load businesses list + selected business ---
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        if (businessId) {
          // Direct navigation to review a specific business
          const target = await fetchPublicBusiness(businessId);
          setBusiness({
            id: target.id,
            name: target.name,
            type: target.category,
            location: target.address,
            image: target.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(target.name)}&background=1E40AF&color=fff&size=300`,
          });
          setSelectedBusinessId(String(target.id));
        } else {
          // No businessId — load list so customer can pick
          const list = await fetchPublicBusinesses();
          setBusinesses(Array.isArray(list) ? list : []);
          if (list && list.length > 0) {
            const first = list[0];
            setBusiness({
              id: first.id,
              name: first.name,
              type: first.category,
              location: first.address,
              image: first.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(first.name)}&background=1E40AF&color=fff&size=300`,
            });
            setSelectedBusinessId(String(first.id));
          }
        }
      } catch (error) {
        showNotification("Could not load business details.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadBusinesses();
  }, [businessId, showNotification]);
  
  // --- AI Analysis Effect (runs as user types) ---
  useEffect(() => {
      const handler = setTimeout(() => {
          if (review.comment.length > 3) {
              setAiLoading(prev => ({ ...prev, analysis: true }));
              // Simulate API call for analysis
              setTimeout(() => {
                  const issues = mockAIAnalysis(review.comment);
                  setAiSuggestions(issues);
                  setAiLoading(prev => ({ ...prev, analysis: false }));
              }, 500);
          } else {
              setAiSuggestions([]);
          }
      }, 750); // Debounce for 750ms

      return () => {
          clearTimeout(handler);
      };
  }, [review.comment]);

  // --- Event Handlers ---
  const handleGenerateFullReview = async (type) => {
    setAiLoading(prev => ({ ...prev, [type]: true }));
    try {
      const result = await withTimeout(
        fetchAiSuggestion(business?.name || 'Business', business?.type || 'General', type),
        60000,
        'AI is taking longer than usual. Please try again in a moment.'
      );
      setReview(prev => ({ ...prev, comment: result.suggestion }));
      showNotification("AI has generated a review draft for you!", "success");
    } catch (err) {
      showNotification(err.message || "AI service unavailable. Please try again.", "error");
    } finally {
      setAiLoading(prev => ({ ...prev, [type]: false }));
    }
  };
  
  const handleAcceptSuggestion = useCallback((issue) => {
      const newComment = review.comment.replace(new RegExp(`\\b${issue.word}\\b`, 'i'), issue.suggestion);
      setReview(prev => ({ ...prev, comment: newComment }));
  }, [review.comment]);

  const handleInputChange = (e) => {
    setReview({ ...review, comment: e.target.value });
  };

  const handleSubmit = async (e, asFlagged = false) => {
    e.preventDefault();

    if (review.rating === 0) { showNotification('Please select a star rating before submitting.', 'error'); return; }
    if (review.comment.length < 20) { showNotification('Your review must be at least 20 characters long.', 'error'); return; }
    if (!selectedBusinessId) { showNotification('No business selected.', 'error'); return; }

    setSubmitting(true);
    try {
      const result = await submitReview(selectedBusinessId, {
        rating: review.rating,
        content: review.comment,
        status: asFlagged ? 'Flagged' : 'Approved',
      });

      if (result.blockchain_hash) {
        setTxHash(result.blockchain_hash);
        showNotification(`Review secured on blockchain! TX: ${result.blockchain_hash.slice(0, 18)}...`, 'success');
      } else {
        showNotification(asFlagged ? 'Review submitted for admin review.' : 'Review submitted successfully!', 'success');
      }

      setTimeout(() => navigate(`/customer/dashboard`), 3000);
    } catch (err) {
      showNotification(err.message || 'Failed to submit review. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  // --- Derived State ---
  const hasUnresolvedSuggestions = aiSuggestions.length > 0;
  
  // --- Dynamic Content & Styles ---
  const renderCommentWithSuggestions = useMemo(() => {
      if (aiSuggestions.length === 0) {
          return review.comment;
      }
      const regex = new RegExp(`\\b(${aiSuggestions.map(s => s.word).join('|')})\\b`, 'gi');
      const parts = review.comment.split(regex);

      return parts.map((part, index) => {
          const issue = aiSuggestions.find(s => s.word.toLowerCase() === part.toLowerCase());
          if (issue) {
              return (
                  <span key={index} style={styles.highlightedText} title={`Suggestion: "${issue.suggestion}". Reason: ${issue.reason}. Click to fix.`} onClick={() => handleAcceptSuggestion(issue)}>
                      {part}
                  </span>
              );
          }
          return part;
      });
  }, [review.comment, aiSuggestions, handleAcceptSuggestion]);


  if (loading) {
    return <div style={styles.fullScreenLoader}><FaSpinner className="spin" /></div>;
  }

  if (!business && businesses.length === 0) {
    return (
      <div style={styles.fullScreenLoader}>
        <div style={{textAlign:'center'}}>
          <p>No active businesses found to review.</p>
          <a href="/explore" style={{color:'var(--button-bg)'}}>Explore Businesses</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
        <style>{hoverStyles}</style>
        {notification.show && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ show: false, message: '' })} />}

        <section style={styles.hero}>
            <MdOutlineRateReview style={styles.heroIcon}/>
            <h1 style={styles.heroTitle}>Write a Review</h1>
            <p style={styles.heroSubtitle}>
              {business ? `Share your experience about "${business.name}" to help the community.` : 'Select a business and share your honest experience.'}
            </p>
        </section>

        <main style={styles.main}>
            <div style={styles.layoutGrid}>
                {/* Left Side: Review Form */}
                <form onSubmit={handleSubmit} style={styles.formContainer}>
                    <div style={styles.formHeader}>
                        <h2 style={styles.sectionTitle}>Your Review</h2>
                        <span style={styles.coinsBadge}><FaCoins /> Earns 1 Coin</span>
                    </div>

                    {!businessId && businesses.length > 0 && (
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Select Business</label>
                        <select
                          value={selectedBusinessId}
                          onChange={(e) => {
                            const selected = businesses.find(b => String(b.id) === e.target.value);
                            setSelectedBusinessId(e.target.value);
                            if (selected) setBusiness({ id: selected.id, name: selected.name, type: selected.category, location: selected.address, image: selected.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.name)}&background=1E40AF&color=fff&size=300` });
                          }}
                          style={{...styles.textarea, minHeight: 'auto', padding: '0.8rem 1rem', resize: 'none'}}
                          className="input-focus"
                        >
                          {businesses.map(b => <option key={b.id} value={String(b.id)}>{b.name} ({b.category})</option>)}
                        </select>
                      </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Overall Rating</label>
                        <div style={styles.starRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    style={star <= (review.hoverRating || review.rating) ? styles.starFilled : styles.star}
                                    onClick={() => setReview({ ...review, rating: star })}
                                    onMouseEnter={() => setReview({ ...review, hoverRating: star })}
                                    onMouseLeave={() => setReview({ ...review, hoverRating: 0 })}
                                >
                                    <FaStar />
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="review-text" style={styles.label}>
                            Share Your Experience
                            {aiLoading.analysis && <FaSpinner className="spin" style={{marginLeft: '10px', fontSize: '0.9rem'}}/>}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{...styles.textarea, ...styles.textareaDisplay}}>{renderCommentWithSuggestions}</div>
                            <textarea
                                id="review-text"
                                value={review.comment}
                                onChange={handleInputChange}
                                style={{...styles.textarea, ...styles.textareaEdit}}
                                placeholder="What did you like or dislike? Would you recommend this place?"
                                maxLength={500}
                                className="input-focus"
                            />
                        </div>
                        <div style={styles.charCount}>{review.comment.length}/500</div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Need help writing? Let AI generate a draft.</label>
                        <div style={styles.aiButtons}>
                            <button type="button" onClick={() => handleGenerateFullReview('positive')} disabled={aiLoading.positive || aiLoading.negative} style={{...styles.aiButton, opacity: (aiLoading.positive || aiLoading.negative) ? 0.5 : 1}} className="ai-button-hover ai-positive-hover">
                                {aiLoading.positive ? <FaSpinner className="spin"/> : <MdOutlineTipsAndUpdates />}
                                {aiLoading.positive ? 'Generating...' : 'Positive Suggestion'}
                            </button>
                            <button type="button" onClick={() => handleGenerateFullReview('negative')} disabled={aiLoading.positive || aiLoading.negative} style={{...styles.aiButton, opacity: (aiLoading.positive || aiLoading.negative) ? 0.5 : 1}} className="ai-button-hover ai-negative-hover">
                                {aiLoading.negative ? <FaSpinner className="spin"/> : <MdOutlineTipsAndUpdates />}
                                {aiLoading.negative ? 'Generating...' : 'Constructive Suggestion'}
                            </button>
                        </div>
                    </div>
                    
                    <div style={styles.submissionContainer}>
                        <button type="submit" style={submitting || hasUnresolvedSuggestions ? styles.submitButtonDisabled : styles.submitButton} disabled={submitting || hasUnresolvedSuggestions}>
                            {submitting ? <FaSpinner className="spin" /> : <IoShieldCheckmark />}
                            {submitting ? 'Processing (AI + Blockchain)...' : hasUnresolvedSuggestions ? 'Please Fix Suggestions' : 'Submit to Blockchain'}
                        </button>
                        {submitting && (
                          <p style={{fontSize: '0.8rem', opacity: 0.7, margin: '0.5rem 0 0 0', textAlign: 'center'}}>
                            AI is reviewing your content — this may take up to 30 seconds.
                          </p>
                        )}
                        {hasUnresolvedSuggestions && !submitting && (
                            <button type="button" onClick={(e) => handleSubmit(e, true)} style={styles.flagButton}>
                                Submit Anyway (as Flagged)
                            </button>
                        )}
                    </div>

                    {txHash && (
                        <div style={styles.txHashContainer}>
                            <IoShieldCheckmark style={{ color: '#10B981', fontSize: '1.5rem' }} />
                            <div>
                                <p style={styles.txHashTitle}>Blockchain Confirmation</p>
                                <p style={styles.txHashValue}>TX: {txHash}</p>
                            </div>
                        </div>
                    )}
                </form>

                {/* Right Side: Business Info & Tips */}
                <aside>
                    {business && (
                    <div style={styles.businessCard}>
                        <img src={business.image} alt={business.name} style={styles.businessImage} />
                        <div style={styles.businessContent}>
                            <h3 style={styles.cardTitle}>{business.name}</h3>
                            <p style={styles.businessType}>{business.type}</p>
                            <p style={styles.businessLocation}>{business.location}</p>
                            {businessId && <Link to={`/business/${businessId}`} style={styles.link}><FaArrowLeft /> Back to Business Profile</Link>}
                        </div>
                    </div>
                    )}
                    <div style={styles.tipsCard}>
                        <div style={styles.cardHeader}>
                            <IoShieldCheckmark />
                            <h3 style={styles.cardTitle}>Review Guidelines</h3>
                        </div>
                        <ul style={styles.list}>
                            <li>Be specific, honest, and respectful.</li>
                            <li>Keep your feedback constructive.</li>
                            <li>Avoid personal information and spam.</li>
                            <li><Link to="/review-guidelines" style={styles.link}>Read full guidelines</Link></li>
                        </ul>
                    </div>
                </aside>
            </div>
        </main>
    </div>
  );
}

const hoverStyles = `
    .spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .input-focus:focus {
        border-color: var(--button-bg);
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3);
    }
    .submit-button-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    .ai-button-hover:hover {
        transform: translateY(-2px);
    }
    .ai-positive-hover:hover {
        background-color: #10B981;
        color: white;
        border-color: #10B981;
        box-shadow: 0 0 10px #10B981;
    }
    .ai-negative-hover:hover {
        background-color: #EF4444;
        color: white;
        border-color: #EF4444;
        box-shadow: 0 0 10px #EF4444;
    }
`;

const styles = {
    hero: { padding: "4rem 2rem", textAlign: "center", backgroundColor: "var(--hero-bg)", borderBottom: "1px solid var(--card-border)", },
    heroIcon: { fontSize: "3.5rem", color: "var(--hero-text)", marginBottom: "1rem", },
    heroTitle: { fontSize: "2.8rem", fontWeight: "bold", color: "var(--hero-text)", marginBottom: "0.5rem", },
    heroSubtitle: { fontSize: "1.1rem", color: "var(--text-color)", opacity: 0.9, maxWidth: '600px', margin: '0 auto', },
    main: {         maxWidth: "1200px",
        margin: "2rem auto",
        padding: "0 2rem",
        padding: "0 2rem 2rem 2rem",
        marginBottom: '0rem', },
    layoutGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', },
    formContainer: { backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow)', },
    formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '1.5rem', },
    sectionTitle: { fontSize: "1.8rem", fontWeight: "bold", color: "var(--header-text)", margin: 0, },
    coinsBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--hero-bg)', color: 'var(--button-bg)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500', },
    inputGroup: { marginBottom: '1.5rem', },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '500', display: 'flex', alignItems: 'center' },
    starRating: { display: 'flex', gap: '0.5rem', },
    star: { color: 'var(--card-border)', cursor: 'pointer', fontSize: '2rem', transition: 'all 0.2s', },
    starFilled: { color: 'var(--button-bg)', cursor: 'pointer', fontSize: '2rem', transition: 'all 0.2s', },
    textarea: { 
        width: '100%', 
        minHeight: '150px', 
        padding: '0.8rem 1rem', 
        backgroundColor: 'var(--bg-color)', 
        border: '2px solid var(--card-border)', 
        borderRadius: '8px', 
        color: 'var(--text-color)', 
        fontSize: '1rem', 
        resize: 'vertical', 
        outline: 'none', 
        transition: 'all 0.2s ease-in-out',
        lineHeight: 1.6,
        fontFamily: 'inherit',
    },
    textareaDisplay: {
        minHeight: '150px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        color: 'transparent',
        caretColor: 'var(--text-color)',
    },
    textareaEdit: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'transparent',
        border: '2px solid transparent',
    },
    highlightedText: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: '4px',
        padding: '2px 0',
        cursor: 'pointer',
        color: 'var(--text-color)',
    },
    charCount: { textAlign: 'right', fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem', },
    aiButtons: { display: 'flex', gap: '0.5rem', },
    aiButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--hero-bg)', border: '1px solid var(--card-border)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease-in-out', },
    submissionContainer: { display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' },
    submitButton: { width: '100%', padding: '0.9rem', backgroundColor: 'var(--button-bg)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s ease-in-out', },
    submitButtonDisabled: { width: '100%', padding: '0.9rem', backgroundColor: 'var(--card-border)', color: 'var(--text-color)', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.6, },
    flagButton: { background: 'none', border: 'none', color: 'var(--button-bg)', cursor: 'pointer', marginTop: '0.5rem', fontWeight: '500' },
    txHashContainer: { display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: '8px', padding: '1rem', marginTop: '1rem', width: '100%' },
    txHashTitle: { margin: 0, fontWeight: '600', color: '#10B981', fontSize: '0.95rem' },
    txHashValue: { margin: '0.25rem 0 0 0', fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', opacity: 0.9 },
    fullScreenLoader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '2rem', color: 'var(--button-bg)', },
    notification: { position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', padding: '1rem 1.5rem', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', zIndex: 1000, boxShadow: '0 5px 15px rgba(0,0,0,0.2)', fontSize: '0.95rem', minWidth: '350px' },
    notificationSuccess: { backgroundColor: '#10B981' },
    notificationError: { backgroundColor: '#EF4444' },
    notificationDismiss: { background: 'none', border: 'none', color: 'white', marginLeft: 'auto', paddingLeft: '1.5rem', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 },
    businessCard: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden', marginBottom: '1.5rem', },
    businessImage: { width: '100%', height: '150px', objectFit: 'cover', },
    businessContent: { padding: '1.5rem', },
    cardTitle: { fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem", },
    businessType: { opacity: 0.7, marginBottom: '0.5rem', },
    businessLocation: { marginBottom: '1rem', },
    link: { color: 'var(--button-bg)', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', },
    tipsCard: { backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow)', },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', color: 'var(--header-text)', },
    list: { paddingLeft: '1.5rem', margin: '1rem 0 0 0', listStyle: 'disc', opacity: 0.9, },
};

export default WriteReview;

