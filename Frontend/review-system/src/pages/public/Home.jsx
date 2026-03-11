import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBolt, FaGem, FaShieldAlt, FaPen, FaEthereum, FaAward, FaStore, FaQuoteLeft, FaBuilding } from "react-icons/fa";
import { BiSearch } from "react-icons/bi";

function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/explore?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/explore");
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
    .cta-hover {
        transition: all 0.2s ease-in-out;
    }
    .cta-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    .category-card-hover {
        transition: all 0.3s ease;
    }
    .category-card-hover:hover {
        transform: scale(1.05);
    }
  `;

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)"}}>
      <style>{hoverStyles}</style>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
            <h1 style={styles.title}>Trust, Verified by Technology</h1>
            <p style={styles.subtitle}>
            Share your voice. Build trust. Empower transparency — all backed by AI and Blockchain.
            </p>

            <form onSubmit={handleSearch} style={styles.searchContainer}>
                <BiSearch style={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search for a business, service, or product..."
                    style={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>

            <div style={styles.ctaButtons}>
                <Link to="/register" style={styles.cta} className="cta-hover">Get Started</Link>
                <Link to="/explore" style={styles.ctaOutline} className="cta-hover">Explore Businesses</Link>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Why Choose Our Platform?</h2>
        <div style={styles.grid}>
          <div style={styles.card} className="card-hover">
            <div style={styles.iconWrapper}><FaShieldAlt style={styles.icon} /></div>
            <h3 style={styles.cardTitle}>100% Verified Reviews</h3>
            <p>Each review is authenticated by our AI and permanently stored on the Blockchain to prevent any form of tampering or manipulation.</p>
          </div>
          <div style={styles.card} className="card-hover">
            <div style={styles.iconWrapper}><FaGem style={styles.icon} /></div>
            <h3 style={styles.cardTitle}>Fair Reward System</h3>
            <p>Your valuable insights deserve recognition. Earn crypto coins for your high-quality, verified contributions and redeem them for real rewards.</p>
          </div>
          <div style={styles.card} className="card-hover">
            <div style={styles.iconWrapper}><FaBolt style={styles.icon} /></div>
            <h3 style={styles.cardTitle}>Transparent & Secure</h3>
            <p>Businesses can’t delete or modify reviews. We provide a platform where real transparency empowers customers and rewards authenticity.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{...styles.section, backgroundColor: "var(--hero-bg)"}}>
        <h2 style={styles.sectionTitle}>A Simple, Powerful Process</h2>
        <div style={styles.workflowGrid}>
            <div style={styles.workflowStep}>
                <div style={styles.workflowIcon}><FaPen/></div>
                <h4>1. Write a Review</h4>
                <p>Share your honest experience about a business or service.</p>
            </div>
            <div style={styles.workflowStep}>
                <div style={styles.workflowIcon}><FaShieldAlt/></div>
                <h4>2. AI Verification</h4>
                <p>Our AI analyzes your review for authenticity and fairness.</p>
            </div>
            <div style={styles.workflowStep}>
                <div style={styles.workflowIcon}><FaEthereum/></div>
                <h4>3. Blockchain Lock</h4>
                <p>The verified review is permanently recorded on the blockchain.</p>
            </div>
            <div style={styles.workflowStep}>
                <div style={styles.workflowIcon}><FaAward/></div>
                <h4>4. Earn Rewards</h4>
                <p>Receive crypto coins as a thank you for your contribution.</p>
            </div>
        </div>
      </section>

      {/* Testimonials Section - NEW */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Trusted by Our Community</h2>
        <div style={styles.testimonialCard}>
            <FaQuoteLeft style={styles.quoteIcon} />
            <p style={styles.testimonialText}>"This project is a game-changer. The ability to verify reviews on the blockchain provides a level of trust we've never had before. A crucial step forward for digital accountability."</p>
            <p style={styles.testimonialAuthor}>— Dr. Yaser Ali Shah, Project Supervisor</p>
        </div>
      </section>

      {/* Featured Categories Section - NEW */}
      <section style={{...styles.section, backgroundColor: "var(--hero-bg)"}}>
        <h2 style={styles.sectionTitle}>Explore Popular Categories</h2>
        <div style={styles.grid}>
            <Link to="/explore?category=Restaurant" style={styles.categoryCard} className="category-card-hover">
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80" alt="Restaurants" style={styles.categoryImage} onError={(e) => { e.target.onerror = null; e.target.src = "https://picsum.photos/seed/restaurant/600/400"; }} />
                <div style={styles.categoryOverlay}><h3>Restaurants</h3></div>
            </Link>
            <Link to="/explore?category=Retail" style={styles.categoryCard} className="category-card-hover">
                <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80" alt="Retail" style={styles.categoryImage} onError={(e) => { e.target.onerror = null; e.target.src = "https://picsum.photos/seed/retail/600/400"; }} />
                <div style={styles.categoryOverlay}><h3>Retail</h3></div>
            </Link>
            <Link to="/explore?category=Services" style={styles.categoryCard} className="category-card-hover">
                <img src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80" alt="Services" style={styles.categoryImage} onError={(e) => { e.target.onerror = null; e.target.src = "https://picsum.photos/seed/services/600/400"; }} />
                <div style={styles.categoryOverlay}><h3>Services</h3></div>
            </Link>
        </div>
      </section>

      {/* For Businesses Section - NEW */}
      <section style={styles.section}>
        <div style={styles.businessCta}>
            <div style={styles.businessIcon}><FaBuilding/></div>
            <div>
                <h2 style={{...styles.sectionTitle, textAlign: 'left', marginBottom: '1rem'}}>Are You a Business Owner?</h2>
                <p style={{...styles.subtitle, textAlign: 'left', margin: '0 0 1.5rem 0'}}>Join our platform to get authentic, verified feedback from real customers and build a trustworthy reputation.</p>
                <Link to="/register" style={{...styles.cta, display: 'inline-block'}} className="cta-hover">Register Your Business</Link>
            </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  // Hero Section
  hero: {
    textAlign: "center",
    padding: "5rem 2rem",
    backgroundColor: "var(--hero-bg)",
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: "3rem",
    fontWeight: "bold",
    color: "var(--hero-text)",
    marginBottom: "1rem",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "var(--text-color)",
    marginBottom: "2.5rem",
    lineHeight: 1.6,
    maxWidth: '600px',
    margin: '0 auto 2.5rem auto',
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    maxWidth: "600px",
    margin: "0 auto 1.5rem",
    backgroundColor: "var(--card-bg)",
    padding: "0.5rem 0.5rem 0.5rem 1.5rem",
    borderRadius: "50px",
    boxShadow: "var(--shadow)",
  },
  searchIcon: {
    fontSize: '1.2rem',
    opacity: 0.5,
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
  ctaButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  cta: {
    padding: "0.8rem 1.8rem",
    backgroundColor: "var(--button-bg)",
    color: "#fff",
    borderRadius: "30px",
    textDecoration: "none",
    fontWeight: 500,
  },
  ctaOutline: {
    padding: "0.8rem 1.8rem",
    border: "2px solid var(--button-bg)",
    color: "var(--button-bg)",
    borderRadius: "30px",
    textDecoration: "none",
    fontWeight: 500,
  },
  // General Sections
  section: {
    padding: "4rem 2rem",
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: "2.2rem",
    fontWeight: "bold",
    marginBottom: "3rem",
    color: "var(--header-text)",
  },
  // Features Section
  grid: {
    display: "grid",
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: "2rem",
    maxWidth: '1100px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "12px",
    padding: "2rem",
    textAlign: "center",
    boxShadow: "var(--shadow)",
    border: '1px solid var(--card-border)',
  },
  iconWrapper: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'var(--hero-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem auto',
  },
  icon: {
    color: "var(--button-bg)",
    fontSize: '1.8rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
  },
  // How It Works
  workflowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '2rem',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  workflowStep: {
    textAlign: 'center',
  },
  workflowIcon: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    backgroundColor: 'var(--card-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem auto',
    fontSize: '2rem',
    color: 'var(--button-bg)',
    boxShadow: 'var(--shadow)',
  },
  // Testimonials
  testimonialCard: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    position: 'relative',
    border: '1px solid var(--card-border)',
  },
  quoteIcon: {
    position: 'absolute',
    top: '1.5rem',
    left: '1.5rem',
    fontSize: '2rem',
    color: 'var(--button-bg)',
    opacity: 0.5,
  },
  testimonialText: {
    fontSize: '1.2rem',
    fontStyle: 'italic',
    lineHeight: 1.7,
    marginBottom: '1.5rem',
  },
  testimonialAuthor: {
    fontWeight: 'bold',
  },
  // Categories
  categoryCard: {
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    height: '250px',
    display: 'block',
    boxShadow: 'var(--shadow)',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: '1.5rem',
    color: 'white',
  },
  // For Businesses
  businessCta: {
    backgroundColor: 'var(--hero-bg)',
    borderRadius: '12px',
    padding: '3rem',
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '3rem',
  },
  businessIcon: {
    fontSize: '5rem',
    color: 'var(--button-bg)',
  }
};

export default Home;
