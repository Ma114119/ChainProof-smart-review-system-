import React from 'react';
// import { Link } from 'react-router-dom'; // Removed unused import
import { FaStar, FaLightbulb, FaTimesCircle, FaCheckCircle, FaRegClock, FaCheck } from 'react-icons/fa';
import { IoShieldCheckmark } from 'react-icons/io5';

function ReviewGuidelines() {
  // Helper component for star ratings
  const StarRating = ({ count }) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar key={i} style={i < count ? styles.starFilled : styles.starEmpty} />
      );
    }
    return <div style={styles.starsContainer}>{stars}</div>;
  };

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
      {/* 1. Hero Section */}
      <section style={styles.hero}>
        <IoShieldCheckmark style={styles.heroIcon}/>
        <h1 style={styles.heroTitle}>Review Guidelines</h1>
        <p style={styles.heroSubtitle}>Help us maintain a trustworthy and helpful community by following these best practices.</p>
      </section>

      <main style={styles.main}>
        {/* 2. Writing Great Reviews - UPDATED */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Writing Great Reviews</h2>
          <div style={styles.grid}>
            <div style={styles.card}>
              <FaLightbulb style={styles.icon} />
              <h3 style={styles.cardTitle}>Be Specific</h3>
              <p>Mention details like what you ordered, the service quality, or what made your experience special.</p>
            </div>
            <div style={styles.card}>
              <FaLightbulb style={styles.icon} />
              <h3 style={styles.cardTitle}>Be Honest</h3>
              <p>Share your genuine experience, covering both the positive and negative aspects to provide a balanced view.</p>
            </div>
            <div style={styles.card}>
              <FaLightbulb style={styles.icon} />
              <h3 style={styles.cardTitle}>Be Helpful</h3>
              <p>Provide information that would help others make informed decisions. Think about what you would want to know.</p>
            </div>
            <div style={styles.card}>
              <FaLightbulb style={styles.icon} />
              <h3 style={styles.cardTitle}>Be Respectful</h3>
              <p>Even if your experience wasn't positive, maintain a constructive and respectful tone. Focus on facts over emotions.</p>
            </div>
            {/* ADDED TWO NEW CARDS */}
            <div style={styles.card}>
              <FaRegClock style={styles.icon} />
              <h3 style={styles.cardTitle}>Provide Context</h3>
              <p>Help others understand your situation, e.g., "visited for a family dinner on a Tuesday night."</p>
            </div>
            <div style={styles.card}>
              <FaCheck style={styles.icon} />
              <h3 style={styles.cardTitle}>Check Your Facts</h3>
              <p>Ensure that details like names, prices, or specific events you mention are accurate and fair.</p>
            </div>
          </div>
        </section>

        {/* 3. Do's and Don'ts */}
        <section style={{...styles.section, backgroundColor: "var(--hero-bg)"}}>
          <h2 style={styles.sectionTitle}>Do's and Don'ts</h2>
          <div style={styles.dosAndDontsGrid}>
            {/* Do's Card */}
            <div style={{...styles.card, ...styles.dosCard}}>
              <div style={styles.cardHeader}>
                <FaCheckCircle style={{color: '#10B981'}} />
                <h3 style={styles.cardTitle}>Do's</h3>
              </div>
              <ul style={styles.list}>
                <li>Be specific about your experience</li>
                <li>Keep your review factual and honest</li>
                <li>Focus on both positives and negatives</li>
                <li>Mention if you'd recommend the business</li>
                <li>Use proper grammar and punctuation</li>
              </ul>
            </div>
            {/* Don'ts Card */}
            <div style={{...styles.card, ...styles.dontsCard}}>
              <div style={styles.cardHeader}>
                <FaTimesCircle style={{color: '#EF4444'}} />
                <h3 style={styles.cardTitle}>Don'ts</h3>
              </div>
              <ul style={styles.list}>
                <li>Use offensive language or personal attacks</li>
                <li>Make exaggerated or false claims</li>
                <li>Include personal information (yours or others')</li>
                <li>Post reviews based on political views</li>
                <li>Post the same review multiple times</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Rating Guidance */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Rating Guidance</h2>
          <div style={styles.ratingGuideContainer}>
            <div style={styles.ratingLevel}><StarRating count={5} /><p><strong>5 Stars:</strong> Exceptional experience, highly recommend.</p></div>
            <div style={styles.ratingLevel}><StarRating count={4} /><p><strong>4 Stars:</strong> Very good experience, would recommend.</p></div>
            <div style={styles.ratingLevel}><StarRating count={3} /><p><strong>3 Stars:</strong> Average, with some room for improvement.</p></div>
            <div style={styles.ratingLevel}><StarRating count={2} /><p><strong>2 Stars:</strong> Below average experience.</p></div>
            <div style={styles.ratingLevel}><StarRating count={1} /><p><strong>1 Star:</strong> Very poor experience, would not recommend.</p></div>
          </div>
        </section>

        {/* 5. Additional Information */}
        <section style={{...styles.section, backgroundColor: "var(--hero-bg)"}}>
            <h2 style={styles.sectionTitle}>Important Information</h2>
            <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                    <h3 style={styles.cardTitle}>Content Moderation</h3>
                    <p>All reviews are analyzed by our AI to ensure they meet our guidelines before being published. Reviews that violate our policies may be flagged for revision or rejected.</p>
                </div>
                <div style={styles.infoCard}>
                    <h3 style={styles.cardTitle}>Tips for Business Owners</h3>
                    <p>We encourage you to respond professionally to all reviews. Use the feedback as an opportunity to improve your business and engage with your customers.</p>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  // Hero
  hero: {
    padding: "4rem 2rem",
    textAlign: "center",
    backgroundColor: "var(--hero-bg)",
    borderBottom: "1px solid var(--card-border)",
  },
  heroIcon: {
    fontSize: "3.5rem",
    color: "var(--hero-text)",
    marginBottom: "1rem",
  },
  heroTitle: {
    fontSize: "2.8rem",
    fontWeight: "bold",
    color: "var(--hero-text)",
    marginBottom: "0.5rem",
  },
  heroSubtitle: {
    fontSize: "1.1rem",
    color: "var(--text-color)",
    opacity: 0.9,
    maxWidth: '600px',
    margin: '0 auto',
  },
  // Main Layout
  main: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  section: {
    padding: "4rem 2rem",
  },
  sectionTitle: {
    fontSize: "2.2rem",
    fontWeight: "bold",
    marginBottom: "2.5rem",
    color: "var(--header-text)",
    textAlign: 'center',
  },
  // Cards
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: "var(--card-bg)",
    padding: "2rem",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "var(--shadow)",
    border: "1px solid var(--card-border)",
  },
  icon: {
    fontSize: "2rem",
    color: "var(--button-bg)",
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "0.75rem",
  },
  // Do's and Don'ts
  dosAndDontsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  dosCard: {
    borderLeft: '5px solid #10B981',
    textAlign: 'left',
  },
  dontsCard: {
    borderLeft: '5px solid #EF4444',
    textAlign: 'left',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.5rem',
  },
  list: {
    paddingLeft: '1.5rem',
    margin: '1rem 0 0 0',
    listStyle: 'disc',
  },
  // Rating Guidance
  ratingGuideContainer: {
    backgroundColor: 'var(--card-bg)',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: 'var(--shadow)',
  },
  ratingLevel: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 0',
    borderBottom: '1px solid var(--card-border)',
  },
  starsContainer: {
    display: 'flex',
    gap: '0.25rem',
    flexShrink: 0,
  },
  starFilled: {
    color: 'var(--button-bg)',
    fontSize: '1.2rem',
  },
  starEmpty: {
    color: 'var(--card-border)',
    fontSize: '1.2rem',
  },
  // Info Section
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  infoCard: {
    backgroundColor: 'var(--card-bg)',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid var(--card-border)',
    textAlign: 'left',
  },
};

export default ReviewGuidelines;
