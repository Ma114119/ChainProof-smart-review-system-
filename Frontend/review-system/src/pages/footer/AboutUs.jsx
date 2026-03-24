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
  FaTwitter,
  FaQuoteLeft,
} from 'react-icons/fa';
import { MdOutlineToken } from 'react-icons/md';
import { SiHuggingface } from 'react-icons/si';

function AboutUs() {
  const teamMembers = [
    {
      name: 'Muhammad Anas',
      role: 'Blockchain, Backend & Frontend Developer',
      image: anasImage,
      bio: 'Led end-to-end delivery of ChainProof: Django REST APIs, JWT auth, PostgreSQL analytics, React dashboards, and Solidity review-reward contracts on a local Ethereum testnet. Focused on secure wallet flows and making on-chain verification understandable for everyday users.',
      skills: ['Django', 'React', 'Solidity', 'PostgreSQL'],
      socials: [
        { icon: <FaGithub />, url: 'https://github.com/Ma114119' },
        { icon: <FaLinkedin />, url: 'https://www.linkedin.com/in/muhammad-anas-b46894303/' },
        { icon: <FaWhatsapp />, url: 'https://wa.me/923350579760' },
        { icon: <FaFacebook />, url: 'https://www.facebook.com/m.anas.536796?mibextid=ZbWKwL' },
        { icon: <FaTwitter />, url: 'https://x.com/mansi114119?t=vkb4vjZfkFA35Fkz49p7iA&s=09' },
      ],
    },
    {
      name: 'Malaika Mushtaq',
      role: 'Architecture & UI/UX Designer',
      image: malaikaImage,
      bio: 'Shaped the information architecture and visual language of ChainProof so trust signals—AI moderation, blockchain status, and token rewards—read clearly across customer, owner, and admin journeys. Emphasized accessibility, consistent dark-theme patterns, and flows that reduce friction from signup to first verified review.',
      skills: ['UI/UX', 'System design', 'Prototyping'],
      socials: [
        { icon: <FaGithub />, url: 'https://github.com/Malaika' },
        { icon: <FaLinkedin />, url: 'https://www.linkedin.com/in/Malaika-Mushtaq' },
        { icon: <FaWhatsapp />, url: 'https://wa.me/923139308172' },
        { icon: <FaFacebook />, url: null },
        { icon: <FaTwitter />, url: null },
      ],
    },
  ];

  const timelineData = [
    {
      date: 'July 2025',
      title: 'Project proposal approved',
      icon: <FaFileContract />,
      description:
        'Our FYP vision—a transparent, AI-assisted review platform with on-chain proof—received departmental approval. Muhammad Anas and Malaika Mushtaq formalized scope, stack choices, and milestones with supervisor guidance.',
    },
    {
      date: 'August – September 2025',
      title: 'Smart contracts & core backend',
      icon: <FaCode />,
      description:
        'Review and reward logic was implemented in Solidity and exercised on a Ganache-style testnet. Parallel work delivered Django models, REST endpoints, and authentication so the app could grow from prototype to a full three-role system (customer, business owner, admin).',
    },
    {
      date: 'October – November 2025',
      title: 'Full platform & AI pipeline',
      icon: <FaRocket />,
      description:
        'The React SPA, owner dashboards, and admin tools were integrated with the API. Llama-based sentiment moderation was wired into the review lifecycle so only policy-aligned text reaches the chain—reducing spam and abuse without silencing honest feedback.',
    },
    {
      date: 'March 2026',
      title: 'Final delivery & handover',
      icon: <FaAward />,
      description:
        'End-to-end testing, documentation, and evaluation materials were completed. ChainProof is delivered as a working capstone: verifiable reviews, token incentives, and a clear path for future mainnet or production hardening.',
    },
  ];

  const partners = [
    {
      name: 'Ethereum',
      Icon: FaEthereum,
      blurb:
        'ChainProof anchors review commitments and reward events on an EVM-compatible test network so stakeholders can audit history without trusting a single database. Wallet-based identities reinforce accountability across the ecosystem.',
    },
    {
      name: 'Hugging Face',
      Icon: SiHuggingface,
      blurb:
        'Open-weight LLM tooling supports our moderation layer: reviews are analyzed for toxicity and manipulation patterns before approval. This keeps the bar high for on-chain content while staying explainable and tunable for supervisors and demos.',
    },
  ];

  const testimonials = [
    {
      quote:
        'This project is a strong blend of software engineering and emerging tech. On-chain verification of reviews addresses a real trust gap, and the AI moderation layer shows thoughtful systems design—not just a blockchain veneer.',
      name: 'Dr. Yaser Ali Shah',
      role: 'Project Supervisor',
      initials: 'YA',
    },
    {
      quote:
        'Seeing reviews flow from draft to AI check to blockchain gave us a clear story for evaluation: every layer has a purpose. The split between customer, owner, and admin roles makes the whole platform testable and realistic.',
      name: 'FYP evaluation panel',
      role: 'Department review (representative feedback)',
      initials: 'EV',
    },
    {
      quote:
        'As a user story, ChainProof makes abstract ideas concrete—wallet connect, token balance, and “verified on chain” labels turn decentralization into something you can click through in a browser. That clarity matters for adoption.',
      name: 'Peer testing cohort',
      role: 'Beta usability sessions',
      initials: 'PT',
    },
  ];

  const hoverStyles = `
    .team-social-link-hover {
      transition: all 0.3s ease;
    }
    .team-social-link-hover:hover {
      transform: scale(1.12);
      filter: drop-shadow(0 0 10px var(--button-bg));
    }
    .team-card-about {
      transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
    }
    .team-card-about:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
    }
    .advantage-card-hover {
      transition: all 0.3s ease;
    }
    .advantage-card-hover:hover {
        transform: translateY(-10px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    .about-timeline-line {
      background: linear-gradient(180deg, var(--button-bg), var(--card-border), var(--button-bg));
      opacity: 0.85;
    }
    .timeline-item-container::before {
        content: '';
        position: absolute;
        top: 22px;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, var(--button-bg), #4a9eff);
        border: 3px solid var(--card-bg);
        border-radius: 50%;
        z-index: 2;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
    }
    .timeline-item-left::before {
        left: -8px;
    }
    .timeline-item-right::before {
        right: -8px;
    }
    .timeline-card-inner {
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
      border: 1px solid var(--card-border);
    }
    .timeline-card-inner:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
      border-color: rgba(59, 130, 246, 0.35);
    }
    .partner-card-about {
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .partner-card-about:hover {
      transform: translateY(-5px);
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.28);
      border-color: rgba(59, 130, 246, 0.4);
    }
    .testimonial-card-about {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .testimonial-card-about:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
    }
    @media (max-width: 768px) {
      .timeline-item-container { width: 100% !important; left: 0 !important; padding-left: 2.5rem !important; padding-right: 1rem !important; }
      .timeline-item-container::before { left: 6px !important; right: auto !important; }
      .about-timeline-line { left: 14px !important; transform: none !important; }
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

        {/* 5. Our Team */}
        <section style={{ ...styles.section, backgroundColor: 'var(--hero-bg)' }}>
          <h2 style={styles.sectionTitle}>Our Team</h2>
          <p style={styles.sectionSubtitle}>
            The people behind ChainProof—from smart contracts and APIs to the interfaces that make trust visible.
          </p>
          <div style={styles.teamGrid}>
            {teamMembers.map((member, index) => (
              <div key={index} style={styles.teamCard} className="team-card-about">
                <div style={styles.teamImageContainer}>
                  <img src={member.image} alt={member.name} style={styles.teamImage} />
                  <div style={styles.teamImageOverlay} />
                </div>
                <div style={styles.teamContent}>
                  <h3 style={styles.teamName}>{member.name}</h3>
                  <p style={styles.teamRole}>{member.role}</p>
                  <div style={styles.skillRow}>
                    {member.skills.map((s) => (
                      <span key={s} style={styles.skillTag}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <p style={styles.teamBio}>{member.bio}</p>
                  <div style={styles.teamSocials}>
                    {member.socials.map((social, i) =>
                      social.url ? (
                        <a
                          key={i}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.teamSocialLink}
                          className="team-social-link-hover"
                          aria-label={`${member.name} social link`}
                        >
                          {social.icon}
                        </a>
                      ) : (
                        <span key={i} style={styles.teamSocialPlaceholder} title="Link shared when available">
                          {social.icon}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Our Story / Timeline */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Our Story</h2>
          <p style={styles.sectionSubtitle}>
            From approved proposal to finished FYP: how ChainProof moved from idea to a working, demonstrable platform.
          </p>
          <div style={styles.timeline}>
            <div className="about-timeline-line" style={styles.timelineLine} />
            {timelineData.map((item, index) => (
              <div
                key={index}
                style={{
                  ...styles.timelineItem,
                  ...(index % 2 === 0 ? styles.timelineItemLeft : styles.timelineItemRight),
                }}
                className={
                  index % 2 === 0
                    ? 'timeline-item-container timeline-item-left'
                    : 'timeline-item-container timeline-item-right'
                }
              >
                <div className="timeline-card-inner" style={styles.timelineContent}>
                  <div style={styles.timelineIconWrap}>{item.icon}</div>
                  <p style={styles.timelineDate}>{item.date}</p>
                  <h3 style={{ ...styles.cardTitle, marginTop: '0.25rem' }}>{item.title}</h3>
                  <p style={styles.timelineBody}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Partners & Integrations */}
        <section style={{ ...styles.section, backgroundColor: 'var(--hero-bg)' }}>
          <h2 style={styles.sectionTitle}>Partners & Integrations</h2>
          <p style={styles.sectionSubtitle}>
            Technologies we built on—not logos for decoration, but layers you can trace through the product demo.
          </p>
          <div style={styles.partnersGrid}>
            {partners.map(({ name, Icon, blurb }) => (
              <div key={name} className="partner-card-about" style={styles.partnerCard}>
                <div style={styles.partnerIconCircle}>
                  <Icon style={styles.partnerIconInCard} aria-hidden />
                </div>
                <h3 style={styles.partnerCardTitle}>{name}</h3>
                <p style={styles.partnerBlurb}>{blurb}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Testimonials */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Testimonials</h2>
          <p style={styles.sectionSubtitle}>
            Perspectives that shaped how we presented ChainProof—supervision, evaluation, and hands-on testing.
          </p>
          <div style={styles.testimonialsGrid}>
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card-about" style={styles.testimonialCard}>
                <FaQuoteLeft style={styles.testimonialQuoteIcon} aria-hidden />
                <div style={styles.testimonialHeader}>
                  <div style={styles.testimonialAvatar}>{t.initials}</div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={styles.testimonialName}>{t.name}</p>
                    <p style={styles.testimonialMeta}>{t.role}</p>
                  </div>
                </div>
                <p style={styles.testimonialText}>{t.quote}</p>
              </div>
            ))}
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
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow)',
    textAlign: 'center',
    border: '1px solid var(--card-border)',
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
    fontSize: '0.9rem',
    color: 'var(--text-color)',
    opacity: 0.88,
    marginBottom: '1rem',
    lineHeight: 1.55,
    textAlign: 'left',
  },
  skillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    justifyContent: 'center',
    marginBottom: '0.75rem',
  },
  skillTag: {
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    padding: '0.25rem 0.55rem',
    borderRadius: '999px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: 'var(--button-bg)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
  },
  teamSocials: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.25rem',
    flexWrap: 'wrap',
  },
  teamSocialLink: {
    color: '#fff',
    fontSize: '1.45rem',
  },
  teamSocialPlaceholder: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '1.45rem',
    cursor: 'default',
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
    padding: '1.35rem 1.5rem',
    position: 'relative',
    borderRadius: '12px',
    backgroundColor: 'var(--card-bg)',
    boxShadow: 'var(--shadow)',
    textAlign: 'left',
  },
  timelineIconWrap: {
    fontSize: '1.75rem',
    color: 'var(--button-bg)',
    marginBottom: '0.5rem',
    opacity: 0.95,
  },
  timelineDate: {
    fontWeight: '600',
    color: 'var(--button-bg)',
    marginBottom: '0.15rem',
    fontSize: '0.95rem',
  },
  timelineBody: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    opacity: 0.88,
    margin: 0,
  },
  partnersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.75rem',
    maxWidth: '920px',
    margin: '0 auto',
    textAlign: 'left',
  },
  partnerCard: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '14px',
    padding: '1.75rem',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--card-border)',
  },
  partnerIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  partnerIconInCard: {
    fontSize: '1.85rem',
    color: 'var(--button-bg)',
  },
  partnerCardTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    margin: '0 0 0.65rem 0',
    color: 'var(--text-color)',
  },
  partnerBlurb: {
    margin: 0,
    fontSize: '0.92rem',
    lineHeight: 1.65,
    opacity: 0.88,
    color: 'var(--text-color)',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1100px',
    margin: '0 auto',
    textAlign: 'left',
  },
  testimonialCard: {
    padding: '1.5rem 1.35rem',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '14px',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--card-border)',
    borderLeft: '4px solid var(--button-bg)',
    position: 'relative',
    overflow: 'hidden',
  },
  testimonialQuoteIcon: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    fontSize: '2.5rem',
    color: 'var(--button-bg)',
    opacity: 0.12,
  },
  testimonialHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    marginBottom: '1rem',
  },
  testimonialAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--button-bg), #6366f1)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  testimonialName: {
    fontWeight: 700,
    margin: 0,
    fontSize: '1rem',
    color: 'var(--text-color)',
  },
  testimonialMeta: {
    margin: '0.15rem 0 0 0',
    fontSize: '0.8rem',
    opacity: 0.7,
    color: 'var(--text-color)',
  },
  testimonialText: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: 1.65,
    opacity: 0.9,
    color: 'var(--text-color)',
  },
};

export default AboutUs;
