import React from 'react';
import anasImage from '../../assets/anas.jpeg'; // Correctly imported image
import malaikaImage from '../../assets/malaika.png'; // Correctly imported image
import {
  FaShieldAlt,
  FaMedal,
  FaLightbulb,
  FaPen,
  FaEthereum,
  FaAward,
  FaFileContract,
  FaCode,
  FaRocket,
  FaGithub,
  FaLinkedin,
  FaUsers,
  FaWhatsapp,
  FaBullseye, // New icon for Mission
  FaEye,
  FaFacebook,
  FaTwitter,      // New icon for Vision
} from 'react-icons/fa';
import { MdOutlineToken } from 'react-icons/md';
import { SiHuggingface } from 'react-icons/si';

function AboutUs() {
  const teamMembers = [
    {
      name: "Muhammad Anas",
      role: "Blockchain, Backend & Frontend Developer",
      image: anasImage, // Use the imported image variable
      bio: "An aspiring software engineer focused on decentralized systems and secure backend architecture.",
      socials: [
        { icon: <FaGithub />, url: 'https://github.com/Ma114119' },
        { icon: <FaLinkedin />, url: 'https://www.linkedin.com/in/muhammad-anas-b46894303/' },
        { icon: <FaWhatsapp/>, url: 'https://wa.me/923350579760'},
        { icon: <FaFacebook/>, url: 'https://www.facebook.com/m.anas.536796?mibextid=ZbWKwL'},
        { icon: <FaTwitter/>, url: 'https://x.com/mansi114119?t=vkb4vjZfkFA35Fkz49p7iA&s=09'}
      ]
    },
    {
      name: "Malaika Mushtaq",
      role: "Archetecture Designer", // Updated role
      image: malaikaImage, // Use the imported image variable
      bio: "A creative developer passionate about building intelligent user interfaces and seamless user experiences.",
      socials: [
        { icon: <FaGithub />, url: 'https://github.com/Malaika' },
        { icon: <FaLinkedin />, url: 'https://www.linkedin.com/in/Malaika-Mushtaq' },
        { icon: <FaWhatsapp/>, url: 'https://wa.me/923139308172'}
      ]
    }
  ];

  const timelineData = [
    {
      date: 'July 2025',
      title: 'Project Proposal Approved',
      icon: <FaFileContract />,
      description: 'Our vision for a transparent review system received official approval, kicking off our development journey.'
    },
    {
      date: 'August 2025 (Projected)',
      title: 'Smart Contracts Deployed',
      icon: <FaCode />,
      description: 'The core logic of our review and reward system is deployed on the blockchain testnet.'
    },
    {
      date: 'October 2025 (Projected)',
      title: 'Beta Launch',
      icon: <FaRocket />,
      description: 'The platform opens to a select group of users for initial feedback and testing.'
    }
  ];

  // This style tag is a clean way to handle hover effects without a separate CSS file.
  const hoverStyles = `
    .team-social-link-hover {
      transition: all 0.3s ease;
    }
    .team-social-link-hover:hover {
      transform: scale(1.1);
      filter: drop-shadow(0 0 8px var(--button-bg));
    }
    .advantage-card-hover {
      transition: all 0.3s ease;
    }
    .advantage-card-hover:hover {
        transform: translateY(-10px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    .timeline-item-container::before {
        content: '';
        position: absolute;
        top: 20px;
        width: 15px;
        height: 15px;
        background-color: var(--bg-color);
        border: 3px solid var(--button-bg);
        border-radius: 50%;
        z-index: 1;
    }
    .timeline-item-left::before {
        left: -8px;
    }
    .timeline-item-right::before {
        right: -8px;
    }
  `;

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
      <style>{hoverStyles}</style> {/* Injecting hover styles */}
      
      {/* 1. Intro Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Built on Trust, powered by AI & Blockchain</h1>
          <p style={styles.heroSubtitle}>To revolutionize online reviews by ensuring every voice counts.</p>
        </div>
      </section>

      <main>
        {/* 2. Our Mission & Vision */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>The Heart of Our Project</h2>
          <p style={styles.sectionSubtitle}>
            We're not just building another platform; we're engineering a new standard for digital trust. Our goal is to dismantle the current system of unreliable online reviews and replace it with an ecosystem built on transparency and fairness.
          </p>
          <div style={styles.missionVisionGrid}>
            <div style={styles.missionCard}>
              <FaBullseye style={styles.backgroundIcon} />
              <div style={{position: 'relative', zIndex: 2}}>
                <h3 style={styles.cardTitle}>Our Mission</h3>
                <p>To build a transparent, secure, and incentivized review ecosystem. We empower consumers with trustworthy information and provide businesses with genuine, actionable feedback by merging AI-driven analysis with the immutable security of blockchain.</p>
              </div>
            </div>
            <div style={styles.visionCard}>
               <FaEye style={styles.backgroundIcon} />
               <div style={{position: 'relative', zIndex: 2}}>
                <h3 style={styles.cardTitle}>Our Vision</h3>
                <p>We envision a digital world where all online interactions are founded on verifiable trust. Our platform will set a new global standard for digital accountability, creating a fair, manipulation-proof marketplace for consumers and businesses alike.</p>
              </div>
            </div>
          </div>
          <div style={styles.principlesList}>
            <div style={styles.principleItem}><FaShieldAlt style={styles.icon} /><span>Transparency</span></div>
            <div style={styles.principleItem}><FaMedal style={styles.icon} /><span>Fairness</span></div>
            <div style={styles.principleItem}><FaLightbulb style={styles.icon} /><span>Innovation</span></div>
          </div>
        </section>

        {/* 3. How It Works - IMPROVED */}
        <section style={{...styles.section, backgroundColor: "var(--hero-bg)"}}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.workflowSteps}>
            <div style={styles.card}><FaPen style={styles.stepIcon} /><h3 style={styles.cardTitle}>1. Write Review</h3><p>Submit encrypted, AI-vetted reviews for authenticity.</p></div>
            <div style={styles.arrow}>&rarr;</div>
            <div style={styles.card}><FaEthereum style={styles.stepIcon} /><h3 style={styles.cardTitle}>2. Go On-Chain</h3><p>Approved reviews are permanently recorded on the blockchain.</p></div>
            <div style={styles.arrow}>&rarr;</div>
            <div style={styles.card}><MdOutlineToken style={styles.stepIcon} /><h3 style={styles.cardTitle}>3. Earn Tokens</h3><p>Receive tokens as a reward for high-quality contributions.</p></div>
            <div style={styles.arrow}>&rarr;</div>
            <div style={styles.card}><FaAward style={styles.stepIcon} /><h3 style={styles.cardTitle}>4. Redeem</h3><p>Use your earned tokens for benefits within our ecosystem.</p></div>
          </div>
        </section>

        {/* 4. Our Advantages - IMPROVED */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Our Advantages</h2>
          <div style={styles.advantagesGrid}>
            <div className="advantage-card-hover" style={styles.advantageCard}><FaShieldAlt style={styles.icon} /><h3 style={styles.cardTitle}>Trust & Security</h3><p>With immutable blockchain records, every review is permanent and verifiable. Say goodbye to fake or manipulated feedback.</p></div>
            <div className="advantage-card-hover" style={styles.advantageCard}><FaMedal style={styles.icon} /><h3 style={styles.cardTitle}>Quality & Fairness</h3><p>Our AI moderator filters spam and hate speech while incentivizing fair, high-quality reviews through our token system.</p></div>
            <div className="advantage-card-hover" style={styles.advantageCard}><FaUsers style={styles.icon} /><h3 style={styles.cardTitle}>Community-Driven</h3><p>Built on decentralized principles with wallet-based identities to ensure Sybil resistance and give users true ownership of their data.</p></div>
          </div>
        </section>

        {/* 5. Our Team - IMPROVED */}
        <section style={{...styles.section, backgroundColor: "var(--hero-bg)"}}>
          <h2 style={styles.sectionTitle}>Our Team</h2>
          <div style={styles.teamGrid}>
            {teamMembers.map((member, index) => (
              <div key={index} style={styles.teamCard}>
                <div style={styles.teamImageContainer}>
                    <img src={member.image} alt={member.name} style={styles.teamImage} />
                    <div style={styles.teamImageOverlay}></div>
                </div>
                <div style={styles.teamContent}>
                  <h3 style={styles.teamName}>{member.name}</h3>
                  <p style={styles.teamRole}>{member.role}</p>
                  <p style={styles.teamBio}>{member.bio}</p>
                  <div style={styles.teamSocials}>
                    {member.socials.map((social, i) => (
                      <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" style={styles.teamSocialLink} className="team-social-link-hover">
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Our Story / Timeline - IMPROVED */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Our Story</h2>
          <div style={styles.timeline}>
            <div style={styles.timelineLine}></div>
            {timelineData.map((item, index) => (
              <div key={index} style={{...styles.timelineItem, ...(index % 2 === 0 ? styles.timelineItemLeft : styles.timelineItemRight)}}
                   className={index % 2 === 0 ? "timeline-item-container timeline-item-left" : "timeline-item-container timeline-item-right"}>
                <div style={styles.timelineContent}>
                  <p style={styles.timelineDate}>{item.date}</p>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Partners & Integrations */}
        <section style={{...styles.section, backgroundColor: "var(--hero-bg)"}}>
          <h2 style={styles.sectionTitle}>Partners & Integrations</h2>
          <div style={styles.partnersGrid}>
            <FaEthereum title="Ethereum" style={styles.partnerIcon}/>
            <SiHuggingface title="Hugging Face" style={styles.partnerIcon}/>
          </div>
        </section>

        {/* 8. Testimonials */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Testimonials</h2>
          <div style={styles.testimonial}>
            <p style={styles.testimonialText}>"This project is a game-changer. The ability to verify reviews on the blockchain provides a level of trust we've never had before. A crucial step forward for digital accountability."</p>
            <p style={styles.testimonialAuthor}>— Dr. Yaser Ali Shah, Project Supervisor</p>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  // Hero Section
  hero: {
    padding: "4rem 2rem",
    textAlign: "center",
    backgroundColor: "var(--hero-bg)",
    color: "var(--hero-text)",
  },
  heroContent: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  heroTitle: {
    fontSize: "2.5rem",
    fontWeight: "700",
    marginBottom: "1rem",
  },
  heroSubtitle: {
    fontSize: "1.25rem",
    opacity: "0.9",
    color: "var(--text-color)"
  },
  // General Section
  section: {
    padding: "4rem 2rem",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: "600",
    marginBottom: "1rem",
    color: "var(--header-text)",
  },
  sectionSubtitle: {
    maxWidth: '700px',
    margin: '0 auto 3rem auto',
    fontSize: '1.1rem',
    lineHeight: '1.6',
    opacity: '0.8',
  },
  // Card
  card: {
    backgroundColor: "var(--card-bg)",
    color: "var(--text-color)",
    borderRadius: "12px",
    padding: "2rem",
    textAlign: "center",
    boxShadow: "var(--shadow)",
    flex: 1,
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "0.75rem",
  },
  icon: {
    color: "var(--button-bg)",
    marginBottom: "1rem",
    fontSize: "1.5rem",
  },
  // Mission & Vision
  missionVisionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
  },
  missionCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "12px",
    padding: "2rem",
    textAlign: "left",
    boxShadow: "var(--shadow)",
    position: 'relative',
    overflow: 'hidden',
    borderTop: '4px solid var(--button-bg)',
  },
  visionCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "12px",
    padding: "2rem",
    textAlign: "left",
    boxShadow: "var(--shadow)",
    position: 'relative',
    overflow: 'hidden',
    borderTop: '4px solid var(--button-bg)',
  },
  backgroundIcon: {
    position: 'absolute',
    right: '10px',
    bottom: '10px',
    fontSize: '8rem',
    color: 'var(--card-border)',
    opacity: 0.3,
    zIndex: 1,
  },
  principlesList: {
    display: "flex",
    justifyContent: "center",
    gap: "3rem",
    flexWrap: "wrap",
    marginTop: "3rem",
  },
  principleItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "1.1rem",
    fontWeight: "500",
  },
  // How it Works
  workflowSteps: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  arrow: {
    fontSize: '2rem',
    color: 'var(--button-bg)',
  },
  stepIcon: {
    fontSize: "2.5rem",
    color: "var(--button-bg)",
    marginBottom: "1rem",
  },
  // Advantages
  advantagesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  advantageCard: {
    backgroundColor: "var(--card-bg)",
    color: "var(--text-color)",
    borderRadius: "12px",
    padding: "2rem",
    textAlign: "center",
    boxShadow: "var(--shadow)",
  },
  // Team
  teamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    justifyContent: "center",
    maxWidth: "900px",
    margin: "0 auto",
  },
  teamCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "var(--shadow)",
    textAlign: "center",
  },
  teamImageContainer: {
    position: 'relative',
  },
  teamImage: {
    width: "100%",
    display: 'block',
    height: "300px",
    objectFit: "cover",
    backgroundColor: "var(--card-border)",
  },
  teamImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
  },
  teamContent: {
    padding: "1.5rem",
    marginTop: '-50px', // Pulls content up over the overlay
    position: 'relative',
    color: '#fff', // White text for better readability on overlay
  },
  teamName: {
    fontSize: "1.25rem",
    fontWeight: "600"
  },
  teamRole: {
    color: "var(--text-color)", // Use a lighter color for the role
    opacity: 0.9,
    fontWeight: "600",
    margin: "0.5rem 0",
  },
  teamBio: {
    fontSize: "0.9rem",
    color: "var(--text-color)",
    opacity: "0.8",
    marginBottom: "1rem",
  },
  teamSocials: {
    display: "flex",
    justifyContent: "center",
    gap: "1.5rem",
  },
  teamSocialLink: {
    color: "#fff", // White social icons
    fontSize: "1.5rem",
  },
  // Timeline
  timeline: {
    maxWidth: "800px",
    margin: "2rem auto",
    position: "relative",
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: 'var(--card-border)',
    transform: 'translateX(-50%)',
  },
  timelineItem: {
    padding: '10px 40px',
    position: 'relative',
    width: '50%',
  },
  timelineItemLeft: {
    left: 0,
  },
  timelineItemRight: {
    left: '50%',
  },
  timelineContent: {
    padding: '20px 30px',
    position: 'relative',
    borderRadius: '6px',
    backgroundColor: 'var(--card-bg)',
    boxShadow: 'var(--shadow)',
    textAlign: 'left',
  },
  timelineDate: {
    fontWeight: "600",
    color: "var(--button-bg)",
    marginBottom: "0.5rem",
  },
  // Partners
  partnersGrid: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "4rem",
    flexWrap: "wrap",
  },
  partnerIcon: {
    fontSize: "4rem",
    color: "var(--text-color)",
    opacity: "0.7",
  },
  // Testimonial
  testimonial: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem",
    backgroundColor: "var(--card-bg)",
    borderRadius: "8px",
    borderLeft: "5px solid var(--button-bg)",
    textAlign: "left",
    boxShadow: "var(--shadow)",
  },
  testimonialText: {
    fontStyle: "italic",
    fontSize: "1.1rem",
    marginBottom: "1rem",
    opacity: "0.9",
  },
  testimonialAuthor: {
    fontWeight: "600",
    textAlign: "right",
    color: "var(--text-color)",
  },
};

export default AboutUs;
