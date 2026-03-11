import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaUserShield } from 'react-icons/fa';

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

function PrivacyPolicy() {
  const effectiveDate = "July 25, 2025";

  const initialSections = [
    {
      title: '1. Information We Collect',
      content: (
        <>
          <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
          <h4>Personal Data</h4>
          <p>While using our Service, we may ask you to provide us with certain personally identifiable information, including but not limited to: your name, email address, and public wallet address.</p>
          <h4>Usage Data</h4>
          <p>We may also collect information on how the Service is accessed and used ("Usage Data"). This may include your computer's IP address, browser type, pages visited, and other diagnostic data.</p>
        </>
      ),
      open: true,
    },
    {
      title: '2. How We Use Your Data',
      content: (
        <p>We use the collected data for various purposes: to provide and maintain our Service, to notify you about changes, to provide customer support, to gather analysis to improve our Service, to monitor usage, and to detect and prevent technical issues and fraud.</p>
      ),
      open: false,
    },
    {
      title: '3. Cookies & Tracking Technologies',
      content: (
        <p>We use cookies and similar tracking technologies to track the activity on our Service and we hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>
      ),
      open: false,
    },
    {
      title: '4. Data Sharing & Disclosure',
      content: (
        <p>We may disclose your Personal Data in the good faith belief that such action is necessary to: comply with a legal obligation, protect and defend our rights or property, prevent or investigate possible wrongdoing in connection with the Service, or protect the personal safety of users or the public.</p>
      ),
      open: false,
    },
    {
      title: '5. Data Retention & Deletion',
      content: (
        <p>We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. You have the right to request the deletion of your personal data by contacting us.</p>
      ),
      open: false,
    },
    {
      title: '6. Your Rights & Choices',
      content: (
        <p>You have the right to access, update, or delete the information we have on you. You can also opt-out of receiving marketing communications from us. To exercise these rights, please contact us at <a href="fa22-bse-014@cuiatk.edu.pk" style={styles.link}>anas@cuiatk.com</a>.</p>
      ),
      open: false,
    },
    {
      title: '7. Security Measures',
      content: (
        <p>The security of your data is important to us. We use encryption and access controls to protect your information. While review content is immutable on the blockchain, we do not store personal identifiers directly on-chain to protect your privacy.</p>
      ),
      open: false,
    },
    {
      title: '8. Children’s Privacy',
      content: (
        <p>Our Service does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Child has provided us with Personal Data, please contact us.</p>
      ),
      open: false,
    },
    {
      title: '9. Changes to This Policy',
      content: (
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.</p>
      ),
      open: false,
    },
  ];

  const [sections, setSections] = useState(initialSections);

  const toggleSection = index => {
    setSections(sections.map((section, i) => {
      if (i === index) {
        section.open = !section.open;
      } else {
        section.open = false;
      }
      return section;
    }));
  };

  const scrollToSection = (id) => {
    const sectionElement = document.getElementById(id);
    if (sectionElement) {
      const index = parseInt(id.split('-')[1]);
      if (!sections[index].open) {
        toggleSection(index);
      }
      setTimeout(() => {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  const hoverStyles = `
    .toc-link-hover:hover {
        color: var(--button-bg);
        filter: drop-shadow(0 0 10px var(--button-bg));
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
        <FaUserShield style={styles.heroIcon}/>
        <h1 style={styles.heroTitle}>Privacy Policy</h1>
        <p style={styles.heroSubtitle}>Last updated: {effectiveDate}</p>
      </section>

      <main style={styles.main}>
        <div style={styles.layoutGrid}>
          <aside style={styles.tocContainer}>
            <h3 style={styles.tocTitle}>Table of Contents</h3>
            <ul style={styles.tocList}>
              {sections.map((section, index) => (
                <li key={index} style={styles.tocItem}>
                  <button 
                    onClick={() => scrollToSection(`section-${index}`)} 
                    style={sections[index].open ? {...styles.tocLink, ...styles.tocLinkActive} : styles.tocLink} 
                    className="toc-link-hover"
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div style={styles.contentContainer}>
            <p style={styles.introText}>
              Your privacy is critically important to us. This Privacy Policy document outlines the types of personal information that is received and collected by our Platform and how it is used.
            </p>
            {sections.map((section, index) => (
              <Section key={index} section={section} index={index} toggleSection={toggleSection} />
            ))}
            <div style={styles.contactFooter}>
              <p>If you have any questions about this Privacy Policy, please <Link to="/contact-us" style={styles.link}>Contact us</Link>.</p>
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
    // Resetting button styles to look like a link
    background: 'none',
    border: 'none',
    padding: '0.25rem 0',
    textAlign: 'left',
    width: '100%',
    // Original link styles
    color: 'var(--text-color)',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    opacity: 0.8,
    transition: 'all 0.2s ease-in-out',
    display: 'block',
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

export default PrivacyPolicy;
