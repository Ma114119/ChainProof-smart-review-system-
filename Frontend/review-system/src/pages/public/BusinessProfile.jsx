import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
    FaCheckCircle
} from 'react-icons/fa';

function BusinessProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const userRole = localStorage.getItem('userRole') || 'public';
  const isLoggedIn = userRole === 'customer';

  const [reviews, setReviews] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const fetches = [fetchPublicBusiness(id), fetchPublicReviews(id)];
      if (isLoggedIn) fetches.push(fetchMyBookmarks());
      const results = await Promise.all(fetches);
      const [bizData, reviewData, bookmarksData] = results;

      if (bookmarksData) {
        setIsBookmarked(bookmarksData.some(b => b.business_id === parseInt(id)));
      }

      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      (reviewData || []).forEach(r => { if (breakdown[r.rating] !== undefined) breakdown[r.rating]++; });

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
        ratingBreakdown: breakdown,
        reviews: (reviewData || []).map(r => ({
          id: r.id,
          user: r.user,
          rating: r.rating,
          comment: r.content,
          date: r.created_at,
          blockchain_hash: r.blockchain_hash,
          userProfilePicture: r.user_profile_picture_url || null,
        })),
      });

      setReviews(reviewData || []);
    } catch (err) {
      console.error('Failed to load business:', err);
    } finally {
      setLoading(false);
    }
  }, [id, isLoggedIn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const renderBlockchainBadge = (hash) => hash ? (
    <span title={`TX: ${hash}`} style={{ fontSize: '0.75rem', color: '#10B981', marginLeft: '0.5rem' }}>⛓ On-chain</span>
  ) : null;

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

  const allReviews = business?.reviews || [];
  const reviewsToShow = showAllReviews ? allReviews : allReviews.slice(0, 3);

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
        <style>{hoverStyles}</style>
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
                    {reviewsToShow.map((review) => (
                        <div key={review.id} style={styles.reviewCard}>
                            <div style={styles.reviewHeader}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                    {review.userProfilePicture ? (
                                        <img src={review.userProfilePicture} alt={review.user} style={styles.reviewerAvatar} />
                                    ) : (
                                        <div style={styles.reviewerAvatarPlaceholder}>{review.user.charAt(0).toUpperCase()}</div>
                                    )}
                                    <h3 style={styles.reviewUser}>{review.user}{renderBlockchainBadge(review.blockchain_hash)}</h3>
                                </div>
                                <div style={styles.reviewRating}>{renderStars(review.rating)}</div>
                            </div>
                            <p style={styles.reviewComment}>"{review.comment}"</p>
                            <p style={styles.reviewDate}>Reviewed on: {new Date(review.date).toLocaleDateString()}</p>
                        </div>
                    ))}
                    {allReviews.length > 3 && !showAllReviews && (
                        <button onClick={() => setShowAllReviews(true)} style={styles.showMoreButton}>
                            Show All Reviews ({allReviews.length})
                        </button>
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
                    {Object.entries(business.ratingBreakdown).reverse().map(([stars, count]) => (
                        <div key={stars} style={styles.ratingBreakdownItem}>
                            <span>{stars} Stars</span>
                            <div style={styles.progressBarContainer}><div style={{...styles.progressBar, width: `${(count/business.totalReviews)*100}%`}}></div></div>
                            <span>{count}</span>
                        </div>
                    ))}
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
    showMoreButton: {
        width: '100%',
        padding: '0.8rem',
        backgroundColor: 'var(--hero-bg)',
        color: 'var(--text-color)',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
    },
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
