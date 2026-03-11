import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaSearch, FaStar, FaBuilding, FaUtensils, FaLaptopCode, FaConciergeBell, FaSpinner, FaChevronLeft, FaChevronRight, FaCheckCircle } from "react-icons/fa";
import { fetchPublicBusinesses } from "../../services/api";

function ExploreBusinesses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "All");
  const [sortBy, setSortBy] = useState("default");
  const [filterRating, setFilterRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [error, setError] = useState('');

  const businessesPerPage = 6;

  // Fetch from real API
  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPublicBusinesses(searchTerm, activeCategory);
      setAllBusinesses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeCategory]);

  // Sync URL params to state on mount
  useEffect(() => {
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    if (search != null) setSearchTerm(search || "");
    if (category != null) setActiveCategory(category || "All");
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => loadBusinesses(), 400);
    return () => clearTimeout(timer);
  }, [loadBusinesses]);

  // Derive unique categories from data
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(allBusinesses.map(b => b.category).filter(Boolean))];
    const icons = { All: <FaBuilding />, Restaurant: <FaUtensils />, Electronics: <FaLaptopCode />, Services: <FaConciergeBell />, Retail: <FaConciergeBell /> };
    return cats.map(c => ({ label: c, icon: icons[c] || <FaBuilding /> }));
  }, [allBusinesses]);

  const processedBusinesses = useMemo(() => {
    let result = allBusinesses.filter(b => b.avg_rating >= filterRating);
    if (sortBy === 'rating') result = [...result].sort((a, b) => b.avg_rating - a.avg_rating);
    else if (sortBy === 'reviews') result = [...result].sort((a, b) => b.total_reviews - a.total_reviews);
    return result;
  }, [allBusinesses, sortBy, filterRating]);

  // Pagination logic
  const indexOfLastBusiness = currentPage * businessesPerPage;
  const indexOfFirstBusiness = indexOfLastBusiness - businessesPerPage;
  const currentBusinesses = processedBusinesses.slice(indexOfFirstBusiness, indexOfLastBusiness);
  const totalPages = Math.ceil(processedBusinesses.length / businessesPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
    }
  };
  
  const hoverStyles = `
    .card-hover {
        transition: all 0.3s ease;
    }
    .card-hover:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    .input-focus:focus-within {
        border-color: var(--button-bg);
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3);
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
      <style>{hoverStyles}</style>
      <section style={styles.hero}>
        <h1 style={styles.title}>Explore Trusted Businesses</h1>
        <p style={styles.subtitle}>
          Discover companies with verified reviews powered by AI and Blockchain.
        </p>
        <div style={{...styles.searchContainer, ...styles.input}} className="input-focus">
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by business name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </section>

      <main style={styles.main}>
        <div style={styles.filterBar}>
            <div style={styles.categories}>
            {categories.map((cat, index) => (
                <button 
                    key={index} 
                    style={activeCategory === cat.label ? {...styles.catBtn, ...styles.catBtnActive} : styles.catBtn}
                    onClick={() => setActiveCategory(cat.label)}
                >
                {cat.icon} {cat.label}
                </button>
            ))}
            </div>
            <div style={styles.sortAndFilter}>
                <select onChange={(e) => setFilterRating(Number(e.target.value))} style={styles.select}>
                    <option value="0">Any Rating</option>
                    <option value="4">4 Stars & Up</option>
                    <option value="4.5">4.5 Stars & Up</option>
                </select>
                <select onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
                    <option value="default">Sort By</option>
                    <option value="rating">Highest Rated</option>
                    <option value="reviews">Most Reviewed</option>
                </select>
            </div>
        </div>

        {loading ? (
            <div style={styles.loader}><FaSpinner className="spin" /></div>
        ) : error ? (
            <p style={styles.noResult}>{error}</p>
        ) : processedBusinesses.length === 0 ? (
          <p style={styles.noResult}>
            No businesses found. Try a different search or filter!
          </p>
        ) : (
          <>
            <div style={styles.grid}>
                {currentBusinesses.map((biz) => (
                <div key={biz.id} style={styles.card} className="card-hover">
                    {biz.status === 'Active' && <div style={styles.verifiedBadge}><FaCheckCircle/> Active</div>}
                    <img
                      src={biz.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.name)}&background=1E40AF&color=fff&size=400`}
                      alt={biz.name}
                      style={styles.cardImage}
                    />
                    <div style={styles.cardContent}>
                        <div style={styles.cardCategory}>{biz.category}</div>
                        <h3 style={styles.cardTitle}>{biz.name}</h3>
                        <p style={styles.cardDesc}>{biz.description}</p>
                        <div style={styles.cardFooter}>
                            <div style={styles.rating}>
                                <FaStar /> {biz.avg_rating} ({biz.total_reviews} reviews)
                            </div>
                            <button
                                style={styles.viewBtn}
                                onClick={() => navigate(`/business/${biz.id}`)}
                            >
                                View Profile
                            </button>
                        </div>
                    </div>
                </div>
                ))}
            </div>
            {totalPages > 1 && (
                <div style={styles.pagination}>
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} style={styles.pageButton}>
                        <FaChevronLeft/>
                    </button>
                    <span style={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} style={styles.pageButton}>
                        <FaChevronRight/>
                    </button>
                </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  hero: {
    textAlign: "center",
    padding: "4rem 2rem",
    backgroundColor: "var(--hero-bg)",
  },
  title: {
    fontSize: "2.8rem",
    fontWeight: "bold",
    color: "var(--hero-text)",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "var(--text-color)",
    marginBottom: "2rem",
    opacity: 0.9,
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "var(--card-bg)",
    borderRadius: "50px",
    padding: "0.5rem 0.5rem 0.5rem 1.5rem",
    border: '2px solid var(--card-border)',
    transition: 'all 0.2s ease-in-out',
  },
  searchInput: {
    flex: 1,
    padding: "0.75rem",
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    color: "var(--text-color)",
    fontSize: "1rem",
  },
  searchIcon: {
    opacity: 0.5,
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '3rem 2rem',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: "3rem",
  },
  categories: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  catBtn: {
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    padding: "0.75rem 1.5rem",
    borderRadius: "30px",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-color)',
    transition: 'all 0.2s ease-in-out',
  },
  catBtnActive: {
    backgroundColor: 'var(--button-bg)',
    color: 'white',
    borderColor: 'var(--button-bg)',
  },
  sortAndFilter: {
    display: 'flex',
    gap: '1rem',
  },
  select: {
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    padding: "0.75rem",
    borderRadius: "8px",
    color: 'var(--text-color)',
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
  },
  card: {
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "16px",
    boxShadow: "var(--shadow)",
    overflow: 'hidden',
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: '#10B981',
    color: 'white',
    padding: '0.3rem 0.7rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  cardImage: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
  },
  cardContent: {
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    marginBottom: "0.25rem",
    color: "var(--header-text)",
  },
  cardCategory: {
    fontSize: "0.8rem",
    color: "var(--button-bg)",
    fontWeight: '500',
    marginBottom: "0.5rem",
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: "0.95rem",
    marginBottom: "1.5rem",
    opacity: 0.9,
    lineHeight: 1.6,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--card-border)',
    paddingTop: '1rem',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--button-bg)',
    fontWeight: '500',
  },
  viewBtn: {
    backgroundColor: "var(--button-bg)",
    color: "white",
    padding: "0.6rem 1.2rem",
    borderRadius: "25px",
    border: "none",
    cursor: "pointer",
    fontWeight: '500',
  },
  noResult: {
    textAlign: "center",
    fontSize: "1.1rem",
    marginTop: "3rem",
    opacity: 0.8,
  },
  loader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    fontSize: '2rem',
    color: 'var(--button-bg)',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '3rem',
  },
  pageButton: {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-color)',
  },
  pageInfo: {
    fontWeight: '500',
  }
};

export default ExploreBusinesses;
