import React, { useState, useEffect } from 'react';
import { submitContactForm } from '../../services/api';
import {
  FaEnvelope,
  FaPaperPlane,
  FaBuilding,
  FaPhone,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChevronDown,
  FaPaperclip,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaGithub
} from 'react-icons/fa';

// FAQ Accordion Item Component
const FaqItem = ({ faq, index, toggleFAQ }) => {
  return (
    <div
      style={styles.faqItem}
      key={index}
      onClick={() => toggleFAQ(index)}
      className="faq-item-hover"
    >
      <div style={styles.faqQuestion}>
        <span>{faq.question}</span>
        <FaChevronDown style={{ transform: faq.open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
      </div>
      <div style={{...styles.faqAnswer, maxHeight: faq.open ? '200px' : '0', padding: faq.open ? '1rem' : '0 1rem' }}>
        <p>{faq.answer}</p>
      </div>
    </div>
  );
};


function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    attachment: null,
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [isRobot, setIsRobot] = useState(true); // State for robot checkbox

  const [faqs, setFaqs] = useState([
    {
      question: 'How do I earn coins for reviews?',
      answer: 'You earn coins automatically after your review is verified by our AI and successfully stored on the blockchain. High-quality reviews that receive likes from the community may earn bonus coins!',
      open: false
    },
    {
      question: 'Can a business delete my review?',
      answer: 'No. Once a review is on the blockchain, it is immutable, meaning it cannot be altered or deleted by anyone, including the business owner or our administrators. This ensures complete transparency.',
      open: false
    },
    {
      question: 'What is the coin redemption process?',
      answer: 'Coins can be used for various perks within our ecosystem, such as highlighting your own reviews or accessing premium features. We are also working on partnerships to allow you to redeem them for discounts and other real-world rewards.',
      open: false
    },
    {
      question: 'How do you detect fake reviews?',
      answer: 'We use a multi-layered approach. Our AI analyzes the text for patterns of spam and hate speech, while our blockchain system prevents Sybil attacks through wallet-based identity verification. This combination makes it extremely difficult to post fake reviews.',
      open: false
    }
  ]);

  const toggleFAQ = index => {
    setFaqs(faqs.map((faq, i) => {
      if (i === index) {
        faq.open = !faq.open;
      } else {
        faq.open = false;
      }
      return faq;
    }));
  };

  useEffect(() => {
    const validateForm = () => {
      const newErrors = {};
      if (!formData.name) newErrors.name = 'Name is required.';
      if (!formData.email) {
        newErrors.email = 'Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid.';
      }
      if (!formData.subject) newErrors.subject = 'Subject is required.';
      if (!formData.message || formData.message.length < 20) {
        newErrors.message = 'Message must be at least 20 characters long.';
      }
      if (formData.attachment && formData.attachment.size > 5 * 1024 * 1024) { // 5MB
        newErrors.attachment = 'File size cannot exceed 5MB.';
      }
      if (isRobot) {
        newErrors.robot = 'Please confirm you are not a robot.';
      }
      setErrors(newErrors);
      setIsFormValid(Object.keys(newErrors).length === 0);
    };
    validateForm();
  }, [formData, isRobot]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'attachment') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setStatus('submitting');
    try {
      await submitContactForm(
        { name: formData.name, email: formData.email, subject: formData.subject, message: formData.message },
        formData.attachment
      );
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', attachment: null });
      setIsRobot(true);
    } catch (err) {
      setStatus('error');
      console.error('Contact form error:', err);
    }
  };

  const hoverStyles = `
    .social-link-hover {
        transition: all 0.2s ease-in-out;
    }
    .social-link-hover:hover {
        transform: scale(1.1);
        filter: drop-shadow(0 0 8px var(--button-bg));
    }
    .spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .map-link-hover:hover .map-overlay-hover {
        opacity: 1;
    }
    .faq-item-hover {
        transition: all 0.2s ease-in-out;
    }
    .faq-item-hover:hover {
        border-color: var(--button-bg);
        transform: translateY(-3px);
    }
    .submit-button-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    .input-focus:focus {
        border-color: var(--button-bg);
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3);
    }
  `;

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
      <style>{hoverStyles}</style>
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Get In Touch</h1>
        <p style={styles.heroSubtitle}>Have a question or feedback? We'd love to hear from you. Reach out and we'll get back to you as soon as possible.</p>
      </section>

      <main>
        <section style={styles.section}>
          <div style={styles.contactGrid}>
            <div style={styles.formContainer}>
              <h2 style={styles.sectionTitle}>Send us a Message</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div style={styles.inputGroup}>
                  <label htmlFor="name" style={styles.label}>Full Name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} style={styles.input} placeholder="Ahmed Ali" className="input-focus" />
                  {errors.name && <p style={styles.errorText}>{errors.name}</p>}
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="email" style={styles.label}>Email Address</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} placeholder="you@example.com" className="input-focus" />
                  {errors.email && <p style={styles.errorText}>{errors.email}</p>}
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="subject" style={styles.label}>Subject</label>
                    <select id="subject" name="subject" value={formData.subject} onChange={handleChange} style={styles.input} className="input-focus">
                    <option value="">-- Please choose an option --</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Complaint / Issue">Complaint / Issue</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                  {errors.subject && <p style={styles.errorText}>{errors.subject}</p>}
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="message" style={styles.label}>Message</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleChange} style={styles.textarea} rows="6" placeholder="Your message here..." className="input-focus"></textarea>
                  {errors.message && <p style={styles.errorText}>{errors.message}</p>}
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="attachment" style={styles.label}>Attachment (Optional)</label>
                  <label htmlFor="attachment" style={styles.fileInputLabel}>
                    <FaPaperclip />
                    <span>{formData.attachment ? formData.attachment.name : 'Choose a file...'}</span>
                  </label>
                  <input type="file" id="attachment" name="attachment" onChange={handleChange} style={styles.fileInputHidden} />
                  {errors.attachment && <p style={styles.errorText}>{errors.attachment}</p>}
                </div>
                <div style={styles.inputGroup}>
                  <div style={styles.robotCheckContainer}>
                    <input type="checkbox" id="robot" checked={!isRobot} onChange={() => setIsRobot(!isRobot)} style={styles.robotCheckbox} />
                    <label htmlFor="robot" style={styles.robotCheckLabel}>I am not a robot</label>
                  </div>
                  {errors.robot && <p style={styles.errorText}>{errors.robot}</p>}
                </div>
                <button type="submit" style={isFormValid && status !== 'submitting' ? styles.submitButton : styles.submitButtonDisabled} disabled={!isFormValid || status === 'submitting'} className="submit-button-hover">
                  {status === 'submitting' ? <FaSpinner className="spin" /> : <FaPaperPlane />}
                  <span style={{marginLeft: '0.5rem'}}>{status === 'submitting' ? 'Sending...' : 'Send Message'}</span>
                </button>
                {status === 'success' && <div style={styles.successBanner}><FaCheckCircle /> Thanks, we’ll be in touch within 24 hrs!</div>}
                {status === 'error' && <div style={styles.errorBanner}><FaExclamationTriangle /> Something went wrong. Please try again.</div>}
              </form>
            </div>

            <div style={styles.infoContainer}>
              <h2 style={styles.sectionTitle}>Contact Information</h2>
              <div style={styles.infoBlock}>
                <div style={styles.infoIconWrapper}><FaBuilding style={styles.infoIcon} /></div>
                <div>
                  <h3 style={styles.cardTitle}>Our Office</h3>
                  <p>COMSATS University Islamabad, Attock Campus, Pakistan</p>
                </div>
              </div>
              <div style={styles.infoBlock}>
                <div style={styles.infoIconWrapper}><FaEnvelope style={styles.infoIcon} /></div>
                <div>
                  <h3 style={styles.cardTitle}>Email Us</h3>
                  <a href="mailto:support@chainproof.com" style={styles.link}>support@chainproof.com</a>
                </div>
              </div>
              <div style={styles.infoBlock}>
                <div style={styles.infoIconWrapper}><FaPhone style={styles.infoIcon} /></div>
                <div>
                  <h3 style={styles.cardTitle}>Call Us</h3>
                  <a href="tel:+923350579760" style={styles.link}>+92 335 0579760</a>
                </div>
              </div>
              <a href="https://www.openstreetmap.org/?mlat=33.75&mlon=72.36#map=15/33.75/72.36" target="_blank" rel="noopener noreferrer" style={styles.mapLink} className="map-link-hover">
                <div style={styles.mapOverlay} className="map-overlay-hover">
                    <FaMapMarkerAlt />
                    <span>View on Map</span>
                </div>
              </a>
              <div style={styles.socials}>
                <a href="https://www.facebook.com/m.anas.536796?mibextid=ZbWKwL" className="social-link-hover" style={styles.socialLink}><FaFacebook /></a>
                <a href="https://x.com/mansi114119?t=vkb4vjZfkFA35Fkz49p7iA&s=09" className="social-link-hover" style={styles.socialLink}><FaTwitter /></a>
                <a href="https://www.linkedin.com/in/muhammad-anas-b46894303/" className="social-link-hover" style={styles.socialLink}><FaLinkedin /></a>
                <a href="https://github.com/Ma114119" className="social-link-hover" style={styles.socialLink}><FaGithub /></a>
                <a href="https://wa.me/923350579760" target="_blank" rel="noopener noreferrer" className="social-link-hover" style={styles.socialLink}><FaWhatsapp /></a>
              </div>
            </div>
          </div>
        </section>

        <section style={{...styles.section, backgroundColor: "var(--hero-bg)"}}>
            <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
            <div style={styles.faqContainer}>
                {faqs.map((faq, index) => (
                    <FaqItem key={index} faq={faq} index={index} toggleFAQ={toggleFAQ} />
                ))}
            </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  // Hero
  hero: {
    padding: "5rem 2rem",
    textAlign: "center",
    backgroundColor: "var(--hero-bg)",
    color: "var(--text-color)",
  },
  heroTitle: {
    fontSize: "3rem",
    fontWeight: "bold",
    color: "var(--hero-text)",
    marginBottom: "1rem",
  },
  heroSubtitle: {
    fontSize: "1.2rem",
    color: "var(--text-color)",
    maxWidth: '600px',
    margin: '0 auto',
    opacity: 0.9,
  },
  // General
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
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "0.5rem",
  },
  // Contact Grid
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '3rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  formContainer: {
    backgroundColor: 'var(--card-bg)',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: 'var(--shadow)',
  },
  inputGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '0.8rem 1rem',
    backgroundColor: 'var(--bg-color)',
    border: '2px solid var(--card-border)',
    borderRadius: '8px',
    color: 'var(--text-color)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
  },
  textarea: {
    width: '100%',
    padding: '0.8rem 1rem',
    backgroundColor: 'var(--bg-color)',
    border: '2px solid var(--card-border)',
    borderRadius: '8px',
    color: 'var(--text-color)',
    fontSize: '1rem',
    resize: 'vertical',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
  },
  fileInputHidden: {
    display: 'none',
  },
  fileInputLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'var(--bg-color)',
    border: '2px dashed var(--card-border)',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--text-color)',
    opacity: 0.8,
    transition: 'all 0.2s ease-in-out',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  },
  robotCheckContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  robotCheckbox: {
    width: '1.2rem',
    height: '1.2rem',
  },
  robotCheckLabel: {
    fontWeight: '500',
  },
  submitButton: {
    width: '100%',
    padding: '0.9rem',
    backgroundColor: 'var(--button-bg)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in-out',
  },
  submitButtonDisabled: {
    width: '100%',
    padding: '0.9rem',
    backgroundColor: 'var(--card-border)',
    color: 'var(--text-color)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  successBanner: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#38a169',
    color: '#fff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  errorBanner: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#c53030',
    color: '#fff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  // Info Section
  infoContainer: {
    textAlign: 'left',
  },
  infoBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
    backgroundColor: 'var(--card-bg)',
    padding: '1.5rem',
    borderRadius: '12px',
  },
  infoIconWrapper: {
    backgroundColor: 'var(--button-bg)',
    color: '#fff',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoIcon: {
    fontSize: '1.5rem',
  },
  link: {
    color: 'var(--button-bg)',
    textDecoration: 'none',
    fontWeight: '500',
  },
  mapLink: {
    display: 'block',
    width: '100%',
    height: '250px',
    borderRadius: '12px',
    marginBottom: '2rem',
    position: 'relative',
    overflow: 'hidden',
    textDecoration: 'none',
    background: `url('https://placehold.co/600x400/e2e8f0/1e293b?text=COMSATS+University+Attock') center/cover`,
    border: '1px solid var(--card-border)',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  socials: {
    display: 'flex',
    gap: '1.5rem',
    justifyContent: 'center',
    backgroundColor: 'var(--card-bg)',
    padding: '1.5rem',
    borderRadius: '12px',
  },
  socialLink: {
    color: 'var(--text-color)',
    fontSize: '1.75rem',
  },
  // FAQ Section
  faqContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  faqItem: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '8px',
    marginBottom: '1rem',
    cursor: 'pointer',
    overflow: 'hidden',
    border: '1px solid var(--card-border)',
  },
  faqQuestion: {
    padding: '1.2rem',
    fontWeight: '600',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqAnswer: {
    maxHeight: 0,
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, padding 0.3s ease',
    textAlign: 'left',
    borderTop: '1px solid var(--card-border)',
  },
};

export default ContactUs;
