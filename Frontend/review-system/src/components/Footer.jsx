import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaLinkedin, FaGithub, FaRegEnvelope } from 'react-icons/fa';
import { MdLocationOn, MdPhone } from 'react-icons/md';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // --- Style Objects ---
  // Most styles are now handled by the <style> tag below for better performance and maintainability.
  const styles = {
    footerMainContainer: {
      backgroundColor: 'var(--footer-bg)',
      color: 'var(--footer-text)',
      padding: '5rem 2rem 0',
      marginTop: 0,
    },
    footerContentGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '3rem',
      maxWidth: '1400px',
      margin: '0 auto',
      paddingBottom: '4rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    footerSection: {
      display: 'flex',
      flexDirection: 'column',
    },
    footerBrand: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem',
    },
    logoImg: {
      height: 56,
      width: 'auto',
      flexShrink: 0,
    },
    logoText: {
      fontSize: '1.75rem',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 50%, #8b5cf6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))',
    },
    slogan: {
      fontSize: '0.95rem',
      lineHeight: '1.7',
      opacity: '0.8',
      marginBottom: '1.5rem',
      maxWidth: '350px',
    },
    socialIcons: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: 'auto',
    },
    socialIconLink: {
      fontSize: '1.5rem',
      color: 'var(--footer-text)',
      opacity: '0.7',
      transition: 'all 0.3s ease',
      padding: '0.5rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      marginBottom: '1rem',
      position: 'relative',
      paddingBottom: '0.75rem',
    },
    sectionTitleUnderline: {
        height: '3px',
        width: '40px',
        background: 'var(--button-bg)',
        borderRadius: '2px',
        boxShadow: '0 0 8px var(--button-bg)',
        marginBottom: '1.5rem',
    },
    linkList: {
      listStyle: 'none',
      padding: '0',
      margin: '0',
    },
    linkItem: {
      marginBottom: '0.85rem',
    },
    link: {
      color: 'var(--footer-text)',
      textDecoration: 'none',
      fontSize: '0.95rem',
      opacity: '0.8',
      transition: 'all 0.3s ease',
      display: 'inline-block',
    },
    contactItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      marginBottom: '1.25rem',
      fontSize: '0.95rem',
      opacity: '0.8',
    },
    contactIcon: {
      fontSize: '1.2rem',
      color: 'var(--button-bg)',
      marginTop: '0.2rem',
      flexShrink: '0',
    },
    copyright: {
      textAlign: 'center',
      padding: '2rem',
      fontSize: '0.9rem',
      opacity: '0.7',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    developerCredit: {
      display: 'block',
      marginTop: '0.75rem',
      fontSize: '0.8rem',
    },
  };

  return (
    <footer style={styles.footerMainContainer}>
      <style>{`
        .footer-social-icon:hover {
          opacity: 1;
          color: var(--button-bg);
          transform: translateY(-4px) scale(1.1);
          background-color: rgba(59, 130, 246, 0.1);
          filter: drop-shadow(0 0 10px var(--button-bg));
        }
        .footer-link:hover {
          opacity: 1;
          color: var(--button-bg);
          transform: translateX(5px);
          text-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
        }
      `}</style>
      <div style={styles.footerContentGrid}>
        {/* Brand Section */}
        <div style={styles.footerSection}>
          <div style={styles.footerBrand}>
            <img src="/chainproof-logo.png" alt="ChainProof" style={styles.logoImg} />
            <span style={styles.logoText}>ChainProof</span>
          </div>
          <p style={styles.slogan}>
            Revolutionizing online reviews with AI and blockchain technology for transparency and trust.
          </p>
          <div style={styles.socialIcons}>
            <a href="https://www.facebook.com/in/muhammad-anas-b46894303/" aria-label="Facebook" style={styles.socialIconLink} className="footer-social-icon"><FaFacebook /></a>
            <a href="https://www.twitter.com/in/muhammad-anas-b46894303/" aria-label="Twitter" style={styles.socialIconLink} className="footer-social-icon"><FaTwitter /></a>
            <a href="https://www.linkedin.com/in/muhammad-anas-b46894303/" aria-label="LinkedIn" style={styles.socialIconLink} className="footer-social-icon"><FaLinkedin /></a>
            <a href="https://www.github.com/in/muhammad-anas" aria-label="GitHub" style={styles.socialIconLink} className="footer-social-icon"><FaGithub /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div style={styles.footerSection}>
          <h3 style={styles.sectionTitle}>Quick Links</h3>
          <div style={styles.sectionTitleUnderline}></div>
          <ul style={styles.linkList}>
            <li style={styles.linkItem}><Link to="/" style={styles.link} className="footer-link">Home</Link></li>
            <li style={styles.linkItem}><Link to="/explore" style={styles.link} className="footer-link">Explore</Link></li>
            <li style={styles.linkItem}><Link to="/review-guidelines" style={styles.link} className="footer-link">Review Guidelines</Link></li>
            <li style={styles.linkItem}><Link to="/login" style={styles.link} className="footer-link">Login</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div style={styles.footerSection}>
          <h3 style={styles.sectionTitle}>Resources</h3>
          <div style={styles.sectionTitleUnderline}></div>
          <ul style={styles.linkList}>
            <li style={styles.linkItem}><Link to="/about" style={styles.link} className="footer-link">About Us</Link></li>
            <li style={styles.linkItem}><Link to="/contact" style={styles.link} className="footer-link">Contact Us</Link></li>
            <li style={styles.linkItem}><Link to="/privacy-policy" style={styles.link} className="footer-link">Privacy Policy</Link></li>
            <li style={styles.linkItem}><Link to="/terms-conditions" style={styles.link} className="footer-link">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div style={styles.footerSection}>
          <h3 style={styles.sectionTitle}>Contact Us</h3>
          <div style={styles.sectionTitleUnderline}></div>
          <div style={styles.contactItem}>
            <MdLocationOn style={styles.contactIcon} />
            <span>COMSATS University, Attock Campus, Pakistan</span>
          </div>
          <div style={styles.contactItem}>
            <FaRegEnvelope style={styles.contactIcon} />
            <span>m132119@gmail.com</span>
          </div>
          <div style={styles.contactItem}>
            <MdPhone style={styles.contactIcon} />
            <span>+92 335 0579760</span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={styles.copyright}>
        &copy; {currentYear} ChainProof. All rights reserved.
        <span style={styles.developerCredit}>
          Developed by Muhammad Anas & Malaika Mushtaq
        </span>
      </div>
    </footer>
  );
};

export default Footer;
