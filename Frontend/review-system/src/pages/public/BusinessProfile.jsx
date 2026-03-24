import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPublicBusiness, fetchPublicReviews, addBookmark, removeBookmark, fetchMyBookmarks } from '../../services/api';
import {
    FaStar,
    FaRegStar,
    FaStarHalfAlt,
    FaBookmark,
    FaRegBookmark,
    FaMapMarkerAlt,
    FaGlobe,
    FaPhone,
    FaEnvelope,
    FaExclamationTriangle,
    FaPenAlt,
    FaCheckCircle,
    FaLink,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';

function maskBlockchainHash(hash) {
    if (!hash || typeof hash !== 'string') return '—';
    const t = hash.trim();
    if (t.length <= 14) return t;
    return `${t.slice(0, 6)}…${t.slice(-4)}`;
}

function BusinessProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewsPaged, setReviewsPaged] = useState({ results: [], count: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [chainModalHash, setChainModalHash] = useState(null);

  const userRole = localStorage.getItem('userRole') || 'public';
  const isLoggedIn = userRole === 'customer';

  useEffect(() => {
    setReviewPage(1);
  }, [id]);

  const mapReviewRow = (r) => ({
    id: r.id,
    user: r.user,
    rating: r.rating,
    comment: r.content,
    date: r.created_at,
    blockchain_hash: r.blockchain_hash,
    userProfilePicture: r.user_profile_picture_url || null,
    owner_reply: r.owner_reply || '',
    owner_replied_at: r.owner_replied_at || null,
  });

  const normalizeReviewsResponse = (data) => {
    if (data && Array.isArray(data.results) && typeof data.count === 'number') {
      return { results: data.results.map(mapReviewRow), count: data.count };
    }
    const arr = Array.isArray(data) ? data : [];
    return { results: arr.map(mapReviewRow), count: arr.length };
  };

  const loadBusiness = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const fetches = [fetchPublicBusiness(id)];
      if (isLoggedIn) fetches.push(fetchMyBookmarks());
      const results = await Promise.all(fetches);
      const bizData = results[0];
      const bookmarksData = isLoggedIn ? results[1] : null;

      if (bookmarksData) {
        setIsBookmarked(bookmarksData.some((b) => b.business_id === parseInt(id, 10)));
      }

      const rb = bizData.rating_breakdown || {};
      const ratingBreakdown = {
        5: rb['5'] ?? rb[5] ?? 0,
        4: rb['4'] ?? rb[4] ?? 0,
        3: rb['3'] ?? rb[3] ?? 0,
        2: rb['2'] ?? rb[2] ?? 0,
        1: rb['1'] ?? rb[1] ?? 0,
      };

      setBusiness({
        id: bizData.id,
        name: bizData.name,
        description: bizData.description,
        type: bizData.category,
        location: bizData.address,
        website: bizData.website_url || '',
        phone: bizData.phone_number || '',
        email: bizData.email || '',
        averageRating: bizData.avg_rating || 0,
        totalReviews: bizData.total_reviews || 0,
        isClaimed: true,
        gallery: bizData.gallery_image_urls || [],
        ratingBreakdown,
      });
    } catch (err) {
      console.error('Failed to load business:', err);
    } finally {
      setLoading(false);
    }
  }, [id, isLoggedIn]);

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const data = await fetchPublicReviews(id, { page: reviewPage, page_size: 10, ordering: '-created_at' });
      setReviewsPaged(normalizeReviewsResponse(data));
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setReviewsPaged({ results: [], count: 0 });
    } finally {
      setReviewsLoading(false);
    }
  }, [id, reviewPage]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleToggleBookmark = async () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/business/${id}` } });
      return;
    }
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(parseInt(id));
        setIsBookmarked(false);
      } else {
        await addBookmark(parseInt(id));
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleWriteReviewClick = () => {
    if (isLoggedIn) {
      navigate(`/customer/review/${id}`);
    } else {
      navigate('/login', { state: { from: `/business/${id}` } });
    }
  };

  const renderOnChainControl = (hash) => {
    if (!hash) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setChainModalHash(hash);
        }}
        style={styles.onChainBadge}
        aria-label="View on-chain verification details"
      >
        <FaLink style={{ fontSize: '0.7rem' }} />
        <span>On-chain</span>
      </button>
    );
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <>
        {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} />)}
        {halfStar && <FaStarHalfAlt key="half" />}
        {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`empty-${i}`} />)}
      </>
    );
  };
  
  const hoverStyles = `
    .action-button-hover {
        transition: all 0.2s ease-in-out;
    }
    .action-button-hover:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow);
    }
  `;

  if (loading || !business) {
    return <div style={styles.loader}>Loading...</div>;
  }

  const reviewTotal = reviewsPaged.count || 0;
  const reviewPageSize = 10;
  const reviewTotalPages = Math.max(1, Math.ceil(reviewTotal / reviewPageSize));

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
        <style>{hoverStyles}</style>
        {chainModalHash && (
          <div
            style={styles.chainModalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chain-modal-title"
            onClick={() => setChainModalHash(null)}
          >
            <div style={styles.chainModal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.chainModalHeader}>
                <h3 id="chain-modal-title" style={styles.chainModalTitle}>On-chain verification</h3>
                <button type="button" style={styles.chainModalClose} onClick={() => setChainModalHash(null)} aria-label="Close">
                  <FaTimes />
                </button>
              </div>
              <div style={styles.chainVerifiedRow}>
                <FaCheckCircle style={{ color: '#10B981', fontSize: '1.25rem' }} />
                <span style={styles.chainVerifiedText}>Verified anchor</span>
              </div>
              <p style={styles.chainModalLead}>
                This review was fingerprinted at submission. The hash below is a tamper-evident anchor—if the text were changed later, it would not match this record.
              </p>
              <div style={styles.chainHashBox}>
                <span style={styles.chainHashLabel}>Anchored hash (masked)</span>
                <code style={styles.chainHashCode}>{maskBlockchainHash(chainModalHash)}</code>
              </div>
              <p style={styles.chainModalFootnote}>
                Only a cryptographic digest is stored on-chain; your full review text stays off-chain for privacy. Matching this hash to the platform record proves the review you read is the one that was originally submitted.
              </p>
            </div>
          </div>
        )}
        {/* Business Header */}
        <section style={styles.hero}>
            <p style={styles.businessType}>{business.type}</p>
            <div style={styles.titleWrapper}>
                <h1 style={styles.heroTitle}>{business.name}</h1>
                {business.isClaimed && <div style={styles.verifiedBadge}><FaCheckCircle/> Claimed by Owner</div>}
            </div>
            <div style={styles.ratingSummary}>
                <div style={styles.stars}>{renderStars(business.averageRating)}</div>
                <span>{business.averageRating} ({business.totalReviews} reviews)</span>
            </div>
            <div style={styles.heroActions}>
                <button onClick={handleWriteReviewClick} style={styles.actionButton} className="action-button-hover">
                    <FaPenAlt /> Write a Review
                </button>
                <button onClick={handleToggleBookmark} disabled={bookmarkLoading} style={{...styles.actionButton, ...styles.actionButtonSecondary, opacity: bookmarkLoading ? 0.7 : 1}} className="action-button-hover">
                    {isBookmarked ? <FaBookmark /> : <FaRegBookmark />} {bookmarkLoading ? '...' : (isBookmarked ? 'Bookmarked' : 'Bookmark')}
                </button>
            </div>
        </section>

        {/* Main Content */}
        <main style={styles.main}>
            <div style={styles.layoutGrid}>
                {/* Left Column - Reviews */}
                <div style={styles.reviewsContainer}>
                    <h2 style={styles.sectionTitle}>Customer Reviews</h2>
                    {reviewsLoading ? (
                        <p style={styles.reviewsLoadingHint}>Loading reviews…</p>
                    ) : (
                      reviewsPaged.results.map((review) => (
                        <div key={review.id} style={styles.reviewCard}>
                            <div style={styles.reviewHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {review.userProfilePicture ? (
                                        <img src={review.userProfilePicture} alt={review.user} style={styles.reviewerAvatar} />
                                    ) : (
                                        <div style={styles.reviewerAvatarPlaceholder}>{review.user.charAt(0).toUpperCase()}</div>
                                    )}
                                    <h3 style={styles.reviewUser}>
                                      {review.user}
                                      {renderOnChainControl(review.blockchain_hash)}
                                    </h3>
                                </div>
                                <div style={styles.reviewRating}>{renderStars(review.rating)}</div>
                            </div>
                            <p style={styles.reviewComment}>&ldquo;{review.comment}&rdquo;</p>
                            {review.owner_reply && (
                                <div style={styles.ownerReplyPublic}>
                                    <strong style={styles.ownerReplyLabel}>Response from the business</strong>
                                    <p style={styles.ownerReplyText}>{review.owner_reply}</p>
                                    {review.owner_replied_at && (
                                        <p style={styles.ownerReplyMeta}>
                                          {new Date(review.owner_replied_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}
                            <p style={styles.reviewDate}>Reviewed on: {new Date(review.date).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                    {!reviewsLoading && reviewTotal === 0 && (
                        <p style={styles.reviewsEmpty}>No reviews yet. Be the first to share your experience.</p>
                    )}
                    {!reviewsLoading && reviewTotalPages > 1 && (
                        <div style={styles.reviewPagination}>
                            <button
                                type="button"
                                disabled={reviewPage <= 1}
                                onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                                style={styles.reviewPageBtn}
                            >
                                <FaChevronLeft />
                            </button>
                            <span style={styles.reviewPageInfo}>
                                Page {reviewPage} of {reviewTotalPages} ({reviewTotal} reviews)
                            </span>
                            <button
                                type="button"
                                disabled={reviewPage >= reviewTotalPages}
                                onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                                style={styles.reviewPageBtn}
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column - Business Info */}
                <aside style={styles.sidebar}>
                    <div style={{...styles.sidebarCard, ...styles.aboutCard}}>
                        <h3 style={{...styles.sectionTitle, ...styles.aboutTitle}}>About</h3>
                        <p style={styles.description}>{business.description}</p>
                    </div>
                    <div style={styles.sidebarCard}>
                        <h3 style={styles.sectionTitle}>Contact & Location</h3>
                        <div style={styles.contactInfo}>
                            <p><FaMapMarkerAlt /> {business.location}</p>
                            {business.website && <p><FaGlobe /> <a href={business.website} target="_blank" rel="noopener noreferrer" style={styles.link}>{business.website}</a></p>}
                            <p><FaPhone /> <a href={`tel:${business.phone}`} style={styles.link}>{business.phone}</a></p>
                            <p><FaEnvelope /> <a href={`mailto:${business.email}`} style={styles.link}>{business.email}</a></p>
                        </div>
                        <button style={styles.reportButton} className="action-button-hover">
                            <FaExclamationTriangle /> Report this Business
                        </button>
                    </div>
                </aside>
            </div>

            {/* NEW Full-Width Section for Additional Details */}
            <section style={styles.additionalInfoSection}>
                <div style={styles.sidebarCard}>
                    <h3 style={styles.sectionTitle}>Rating Breakdown</h3>
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = business.ratingBreakdown[stars] ?? 0;
                        const pct = business.totalReviews > 0 ? (count / business.totalReviews) * 100 : 0;
                        return (
                        <div key={stars} style={styles.ratingBreakdownItem}>
                            <span>{stars} Stars</span>
                            <div style={styles.progressBarContainer}><div style={{...styles.progressBar, width: `${pct}%`}}></div></div>
                            <span>{count}</span>
                        </div>
                        );
                    })}
                </div>
                <div style={styles.sidebarCard}>
                    <h3 style={styles.sectionTitle}>Photo Gallery</h3>
                    <div style={styles.galleryGrid}>
                        {business.gallery.map((img, index) => <img key={index} src={img} alt={`Gallery image ${index+1}`} style={styles.galleryImage}/>)}
                    </div>
                </div>
            </section>
        </main>
    </div>
  );
};

const styles = {
    // Hero
    hero: {
        padding: "4rem 2rem",
        textAlign: "center",
        backgroundColor: "var(--hero-bg)",
        borderBottom: "1px solid var(--card-border)",
    },
    businessType: {
        fontSize: '1rem',
        fontWeight: '500',
        color: 'var(--button-bg)',
        textTransform: 'uppercase',
        marginBottom: '0.5rem',
    },
    titleWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: "1rem",
    },
    heroTitle: {
        fontSize: "2.8rem",
        fontWeight: "bold",
        color: "var(--hero-text)",
        margin: 0,
    },
    verifiedBadge: {
        backgroundColor: '#10B981',
        color: 'white',
        padding: '0.4rem 0.8rem',
        borderRadius: '20px',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    ratingSummary: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        fontSize: '1.1rem',
        marginBottom: '2rem',
    },
    stars: {
        color: 'var(--button-bg)',
        display: 'flex',
        gap: '0.25rem',
    },
    heroActions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
    },
    actionButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: 'center',
        gap: "0.5rem",
        padding: "0.8rem 1.5rem",
        backgroundColor: "var(--button-bg)",
        color: "white",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "600",
        border: 'none',
        cursor: 'pointer',
    },
    actionButtonSecondary: {
        backgroundColor: "var(--card-bg)",
        color: "var(--text-color)",
        border: "1px solid var(--card-border)",
    },
    // Main Layout
    main: {
        maxWidth: "1200px",
        margin: "2rem auto",
        padding: "0 2rem",
        marginBottom: "0rem",

    },
    layoutGrid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2.5rem',
        alignItems: 'start',
    },
    sectionTitle: {
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: "var(--header-text)",
        marginBottom: "1.5rem",
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--card-border)',
    },
    // Reviews
    reviewsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    reviewCard: {
        backgroundColor: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
    },
    reviewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    reviewUser: {
        fontSize: '1.1rem',
        fontWeight: '600',
        margin: 0,
    },
    reviewerAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid var(--card-border)',
        flexShrink: 0,
    },
    reviewerAvatarPlaceholder: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'var(--button-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1rem',
        flexShrink: 0,
    },
    reviewRating: {
        display: 'flex',
        gap: '0.25rem',
        color: 'var(--button-bg)',
    },
    reviewComment: {
        fontStyle: 'italic',
        opacity: 0.9,
        marginBottom: '1rem',
        lineHeight: 1.6,
    },
    reviewDate: {
        fontSize: '0.8rem',
        opacity: 0.7,
        textAlign: 'right',
    },
    reviewsLoadingHint: { opacity: 0.8, padding: '0.5rem 0' },
    reviewsEmpty: { opacity: 0.75, fontStyle: 'italic' },
    onChainBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        marginLeft: '0.5rem',
        padding: '0.2rem 0.5rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: '#e0f2fe',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(59, 130, 246, 0.35))',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        borderRadius: '6px',
        cursor: 'pointer',
        verticalAlign: 'middle',
    },
    ownerReplyPublic: {
        marginTop: '1rem',
        marginBottom: '0.75rem',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid var(--button-bg)',
        backgroundColor: 'var(--hero-bg)',
    },
    ownerReplyLabel: { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--button-bg)' },
    ownerReplyText: { margin: 0, lineHeight: 1.55, opacity: 0.95 },
    ownerReplyMeta: { margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.65 },
    reviewPagination: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '0.5rem',
        flexWrap: 'wrap',
    },
    reviewPageBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        border: '1px solid var(--card-border)',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-color)',
        cursor: 'pointer',
    },
    reviewPageInfo: { fontWeight: 600, opacity: 0.9, fontSize: '0.95rem' },
    chainModalOverlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '1rem',
    },
    chainModal: {
        maxWidth: '420px',
        width: '100%',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--shadow)',
        padding: '1.25rem 1.5rem',
    },
    chainModalHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
    },
    chainModalTitle: { margin: 0, fontSize: '1.15rem', color: 'var(--header-text)' },
    chainModalClose: {
        background: 'none',
        border: 'none',
        color: 'var(--text-color)',
        cursor: 'pointer',
        fontSize: '1.1rem',
        padding: '0.25rem',
    },
    chainVerifiedRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' },
    chainVerifiedText: { fontWeight: 700, color: '#10B981' },
    chainModalLead: { fontSize: '0.9rem', lineHeight: 1.55, opacity: 0.92, margin: '0 0 1rem 0' },
    chainHashBox: {
        backgroundColor: 'var(--hero-bg)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        border: '1px solid var(--card-border)',
    },
    chainHashLabel: { display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.65, marginBottom: '0.35rem' },
    chainHashCode: { fontSize: '0.85rem', wordBreak: 'break-all', color: 'var(--button-bg)' },
    chainModalFootnote: { fontSize: '0.78rem', lineHeight: 1.5, opacity: 0.7, margin: 0 },
    // Sidebar
    sidebar: {
        position: 'sticky',
        top: '100px',
        alignSelf: 'start',
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
    aboutCard: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1.5rem',
    },
    aboutTitle: {
        flex: '0 0 80px',
        margin: 0,
        padding: 0,
        border: 'none',
    },
    description: {
        lineHeight: 1.6,
        opacity: 0.9,
        margin: 0,
    },
    contactInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem',
    },
    link: {
        color: 'var(--button-bg)',
        textDecoration: 'none',
        fontWeight: '500',
    },
    reportButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: 'center',
        gap: "0.5rem",
        padding: "0.8rem",
        backgroundColor: "transparent",
        color: "#ef4444",
        border: "1px solid #ef4444",
        borderRadius: "8px",
        width: '100%',
        cursor: 'pointer',
        fontWeight: '600',
    },
    // Additional Info Section
    additionalInfoSection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2.5rem',
        marginTop: '2.5rem',
    },
    galleryGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.5rem',
    },
    galleryImage: {
        width: '100%',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '8px',
    },
    ratingBreakdownItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '0.5rem',
    },
    progressBarContainer: {
        flex: 1,
        height: '8px',
        backgroundColor: 'var(--hero-bg)',
        borderRadius: '4px',
    },
    progressBar: {
        height: '100%',
        backgroundColor: 'var(--button-bg)',
        borderRadius: '4px',
    },
    loader: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
    }
};

export default BusinessProfile;
