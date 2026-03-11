import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaGavel, FaFileSignature } from 'react-icons/fa';

// Collapsible Section Component
const Section = ({ section, index, toggleSection }) => {
  return (
    <div id={`section-${index}`} style={styles.sectionWrapper}>
      <h2 style={styles.sectionHeader} onClick={() => toggleSection(index)} className="section-header-hover">
        <span>{section.title}</span>
        <FaChevronDown style={{ transform: section.open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
      </h2>
      <div style={{...styles.sectionContent, maxHeight: section.open ? '1000px' : '0' }}>
        <div style={{padding: '0 1.5rem 1.5rem 1.5rem'}}>{section.content}</div>
      </div>
    </div>
  );
};

function TermsAndConditions() {
  const effectiveDate = "July 25, 2025";

  const initialSections = [
    {
      title: '1. Definitions',
      content: (
        <p>
          "Platform" refers to the AI-Driven Blockchain Review System. "We," "us," or "our" refers to the creators of the Platform. "User," "you," or "your" refers to any individual who accesses or uses the Platform. "Review" refers to any user-generated content submitted to the Platform. "Token" or "Coin" refers to the digital rewards earned by Users.
        </p>
      ),
      open: true,
    },
    {
      title: '2. User Obligations',
      content: (
        <>
          <p>By creating an account, you agree to provide accurate and complete information. You are responsible for maintaining the security of your account and wallet credentials. You must be at least 18 years of age to use this Platform. All activity conducted through your account is your responsibility.</p>
        </>
      ),
      open: false,
    },
    {
      title: '3. User-Generated Content',
      content: (
        <>
          <p>You retain ownership of the content you post. However, by submitting a Review, you grant us a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute your content on our Platform. You agree not to post content that is unlawful, hateful, or infringes on the rights of others.</p>
        </>
      ),
      open: false,
    },
    {
        title: '4. Tokens & Rewards System',
        content: (
          <>
            <p>Tokens are earned as rewards for contributing verified, high-quality reviews. The earning rate and criteria are determined by us and may change. Tokens are not a financial instrument and hold no guaranteed monetary value. We are not responsible for any loss of Tokens due to wallet mismanagement or market volatility.</p>
          </>
        ),
        open: false,
      },
      {
        title: '5. Intellectual Property',
        content: (
          <>
            <p>All software, text, images, trademarks, and logos on the Platform are the exclusive property of the Platform creators and are protected by intellectual property laws. You may not copy, reproduce, or distribute any part of the Platform without our prior written consent.</p>
          </>
        ),
        open: false,
      },
      {
        title: '6. Disclaimers and Limitation of Liability',
        content: (
          <>
            <p>The Platform is provided on an "as-is" and "as-available" basis. We make no warranties regarding uptime, reliability, or accuracy of the information presented. To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.</p>
          </>
        ),
        open: false,
      },
      {
        title: '7. Privacy & Data',
        content: (
          <>
            <p>Your privacy is important to us. Our collection and use of personal data in connection with your access to and use of the Platform is described in our <Link to="/privacy-policy" style={styles.link}>Privacy Policy</Link>.</p>
          </>
        ),
        open: false,
      },
      {
        title: '8. Termination and Suspension',
        content: (
          <>
            <p>We reserve the right to suspend or terminate your account at our discretion, without notice, for any conduct that we believe violates these Terms, is harmful to other users, or is fraudulent. Upon termination, your right to use the Platform and any accumulated Tokens may be forfeited.</p>
          </>
        ),
        open: false,
      },
      {
        title: '9. Governing Law & Dispute Resolution',
        content: (
          <>
            <p>These Terms shall be governed by and construed in accordance with the laws of the Government of Pakistan. Any disputes arising under these Terms will be resolved through binding arbitration in Islamabad.</p>
          </>
        ),
        open: false,
      },
      {
        title: '10. Changes to Terms',
        content: (
          <>
            <p>We may modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Platform after such changes constitutes your acceptance of the new Terms.</p>
          </>
        ),
        open: false,
      },
  ];

  const [sections, setSections] = useState(initialSections);

  const toggleSection = index => {
    setSections(sections.map((section, i) => {
      if (i === index) {
        section.open = !section.open; // Toggle the clicked section
      } else {
        section.open = false; // Close all other sections
      }
      return section;
    }));
  };

  const scrollToSection = (id) => {
    const sectionElement = document.getElementById(id);
    if (sectionElement) {
      const index = parseInt(id.split('-')[1]);
      // Open the target section and close others
      if (!sections[index].open) {
        toggleSection(index);
      }
      // Scroll after a short delay to allow the accordion to open
      setTimeout(() => {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  const hoverStyles = `
    .toc-link-hover:hover {
        color: var(--button-bg);
        filter: drop-shadow(0 0 10px var(--button-bg)); /* Increased glow */
        transform: translateX(5px);
    }
    .section-header-hover:hover {
        background-color: var(--hero-bg);
        color: var(--button-bg);
    }
  `;

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
      <style>{hoverStyles}</style>
      <section style={styles.hero}>
        <FaFileSignature style={styles.heroIcon}/>
        <h1 style={styles.heroTitle}>Terms and Conditions</h1>
        <p style={styles.heroSubtitle}>Last updated: {effectiveDate}</p>
      </section>

      <main style={styles.main}>
        <div style={styles.layoutGrid}>
          <aside style={styles.tocContainer}>
            <h3 style={styles.tocTitle}>Table of Contents</h3>
            <ul style={styles.tocList}>
              {sections.map((section, index) => (
                <li key={index} style={styles.tocItem}>
                  <a 
                    onClick={() => scrollToSection(`section-${index}`)} 
                    style={sections[index].open ? {...styles.tocLink, ...styles.tocLinkActive} : styles.tocLink} 
                    className="toc-link-hover"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <div style={styles.contentContainer}>
            <p style={styles.introText}>
              Welcome to our Platform. Please read these Terms and Conditions ("Terms") carefully before using our services. By accessing or using the Platform, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
            </p>
            {sections.map((section, index) => (
              <Section key={index} section={section} index={index} toggleSection={toggleSection} />
            ))}
            <div style={styles.contactFooter}>
              <p>Questions about these Terms? <Link to="/contact-us" style={styles.link}>Contact us</Link>.</p>
            </div>
          </div>
        </div>
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
    fontSize: "1rem",
    color: "var(--text-color)",
    opacity: 0.8,
  },
  // Main Layout
  main: {
    padding: "3rem 2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 3fr',
    gap: '3rem',
  },
  // Table of Contents (TOC)
  tocContainer: {
    position: 'sticky',
    top: '100px',
    alignSelf: 'start',
    backgroundColor: 'var(--card-bg)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--card-border)',
    boxShadow: 'var(--shadow)',
  },
  tocTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'var(--header-text)',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid var(--card-border)',
  },
  tocList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  tocItem: {
    marginBottom: '0.75rem',
  },
  tocLink: {
    color: 'var(--text-color)',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    opacity: 0.8,
    transition: 'all 0.2s ease-in-out',
    display: 'block',
    padding: '0.25rem 0',
  },
  tocLinkActive: {
    color: 'var(--button-bg)',
    opacity: 1,
    transform: 'translateX(5px)',
  },
  // Content
  contentContainer: {
    lineHeight: '1.7',
  },
  introText: {
    fontSize: '1.1rem',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    borderLeft: '4px solid var(--button-bg)',
    boxShadow: 'var(--shadow)',
  },
  sectionWrapper: {
    marginBottom: '1rem',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--card-border)',
    boxShadow: 'var(--shadow)',
  },
  sectionHeader: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--header-text)',
    padding: '1rem 1.5rem',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease-in-out',
  },
  sectionContent: {
    maxHeight: 0,
    overflow: 'hidden',
    transition: 'max-height 0.4s ease-in-out',
    borderTop: '1px solid var(--card-border)',
    color: 'var(--text-color)',
    opacity: 0.9,
  },
  link: {
    color: 'var(--button-bg)',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  contactFooter: {
    marginTop: '2rem',
    padding: '1.5rem',
    textAlign: 'center',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    border: '1px solid var(--card-border)',
    boxShadow: 'var(--shadow)',
  },
};

export default TermsAndConditions;
