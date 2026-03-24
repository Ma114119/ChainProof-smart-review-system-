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
      lineHeight: '1.75',
      marginBottom: '1.5rem',
      maxWidth: '380px',
    },
    sloganLead: {
      display: 'block',
      marginBottom: '0.65rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      background: 'linear-gradient(120deg, #22d3ee 0%, #60a5fa 45%, #a78bfa 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    sloganRest: {
      display: 'block',
      opacity: 0.82,
      color: 'var(--footer-text)',
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
        .footer-social-icon {
          transition: color 0.25s ease, transform 0.25s ease, background-color 0.25s ease, filter 0.25s ease, box-shadow 0.25s ease;
        }
        .footer-social-icon:hover {
          opacity: 1;
          color: #22d3ee;
          transform: translateY(-5px) scale(1.12);
          background-color: rgba(34, 211, 238, 0.12);
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.25);
          filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.45));
        }
        .footer-link {
          position: relative;
          padding-bottom: 2px;
        }
        .footer-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 0;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #22d3ee, #8b5cf6);
          transition: width 0.28s ease;
        }
        .footer-link:hover {
          opacity: 1;
          color: #7dd3fc;
          transform: translateX(6px);
          text-shadow: 0 0 12px rgba(34, 211, 238, 0.35);
        }
        .footer-link:hover::after {
          width: 100%;
        }
        .footer-contact-link {
          transition: color 0.2s ease, opacity 0.2s ease;
        }
        .footer-contact-link:hover {
          color: #22d3ee;
          opacity: 1;
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
            <span style={styles.sloganLead}>Trust you can trace—not just read.</span>
            <span style={styles.sloganRest}>
              ChainProof pairs on-chain proof with AI moderation so genuine feedback stays visible, fair, and impossible to quietly rewrite. Built for people who are tired of fake stars and deleted complaints.
            </span>
          </p>
          <div style={styles.socialIcons}>
            <a href="https://www.facebook.com/m.anas.536796?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={styles.socialIconLink} className="footer-social-icon"><FaFacebook /></a>
            <a href="https://x.com/mansi114119" target="_blank" rel="noopener noreferrer" aria-label="Twitter" style={styles.socialIconLink} className="footer-social-icon"><FaTwitter /></a>
            <a href="https://www.linkedin.com/in/muhammad-anas-b46894303/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={styles.socialIconLink} className="footer-social-icon"><FaLinkedin /></a>
            <a href="https://github.com/Ma114119" target="_blank" rel="noopener noreferrer" aria-label="GitHub" style={styles.socialIconLink} className="footer-social-icon"><FaGithub /></a>
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
            <a href="mailto:chainproof.verify@gmail.com" className="footer-contact-link" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.9 }}>chainproof.verify@gmail.com</a>
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
