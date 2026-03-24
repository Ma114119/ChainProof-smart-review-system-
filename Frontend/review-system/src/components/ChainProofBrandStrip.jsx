import React from 'react';

const logoSrc = `${process.env.PUBLIC_URL || ''}/chainproof-logo.png`;

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '1.2rem',
    marginBottom: '1.75rem',
    marginTop: 0,
    width: '100%',
  },
  wrapCompact: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '0.85rem',
    marginBottom: '1.1rem',
    width: '100%',
  },
  logoCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoImg: {
    height: 'clamp(120px, 26vw, 168px)',
    width: 'auto',
    maxWidth: 'min(100%, 320px)',
    objectFit: 'contain',
    display: 'block',
    filter: 'drop-shadow(0 0 24px rgba(34, 211, 238, 0.4)) drop-shadow(0 6px 18px rgba(59, 130, 246, 0.25))',
  },
  logoImgCompact: {
    height: 72,
    width: 'auto',
    maxWidth: '100%',
    objectFit: 'contain',
    display: 'block',
    filter: 'drop-shadow(0 0 14px rgba(34, 211, 238, 0.3))',
  },
  /** Login: logo + wordmark only, before intro copy */
  markOnlyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.85rem',
    marginBottom: '1.75rem',
    width: '100%',
  },
  logoImgMarkOnly: {
    height: 'clamp(100px, 22vw, 152px)',
    width: 'auto',
    maxWidth: 'min(100%, 280px)',
    objectFit: 'contain',
    display: 'block',
    filter: 'drop-shadow(0 0 22px rgba(34, 211, 238, 0.38)) drop-shadow(0 5px 16px rgba(59, 130, 246, 0.22))',
  },
  nameMarkOnly: {
    margin: 0,
    fontSize: 'clamp(1.5rem, 3.8vw, 1.95rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    background: 'linear-gradient(105deg, #22D3EE 0%, #06B6D4 35%, #A78BFA 85%, #8B5CF6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.4))',
  },
  markOnlyLine: {
    width: '100%',
    maxWidth: '280px',
    height: '2px',
    borderRadius: '2px',
    background:
      'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.35) 20%, rgba(139,92,246,0.55) 50%, rgba(34,211,238,0.35) 80%, transparent 100%)',
    boxShadow: '0 0 10px rgba(45,212,191,0.22)',
    marginTop: '0.15rem',
  },
  line: {
    height: '2px',
    borderRadius: '2px',
    background:
      'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.35) 20%, rgba(139,92,246,0.55) 50%, rgba(34,211,238,0.35) 80%, transparent 100%)',
    boxShadow: '0 0 12px rgba(45,212,191,0.25)',
  },
  inner: { padding: '0.15rem 0' },
  textCol: { minWidth: 0, textAlign: 'left' },
  name: {
    margin: 0,
    fontSize: 'clamp(1.65rem, 4vw, 2.05rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    background: 'linear-gradient(105deg, #22D3EE 0%, #06B6D4 35%, #A78BFA 85%, #8B5CF6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 20px rgba(34,211,238,0.45)) drop-shadow(0 0 32px rgba(45,212,191,0.2))',
  },
  tagline: {
    margin: '0.65rem 0 0 0',
    fontWeight: 600,
    color: '#22D3EE',
    letterSpacing: '0.01em',
    lineHeight: 1.45,
  },
  body: {
    margin: '1.2rem 0 1.1rem 0',
    fontSize: '0.88rem',
    lineHeight: 1.8,
    color: 'var(--text-color)',
    opacity: 0.78,
    maxWidth: '36em',
  },
};

function ChainProofBrandStrip({ compact = false, variant }) {
  if (variant === 'markOnly') {
    return (
      <div style={styles.markOnlyWrap}>
        <div style={styles.logoCenter}>
          <img src={logoSrc} alt="ChainProof" style={styles.logoImgMarkOnly} />
        </div>
        <div style={styles.nameMarkOnly}>ChainProof</div>
        <div style={styles.markOnlyLine} aria-hidden />
      </div>
    );
  }

  return (
    <div style={compact ? styles.wrapCompact : styles.wrap}>
      <div style={styles.logoCenter}>
        <img
          src={logoSrc}
          alt="ChainProof"
          style={compact ? styles.logoImgCompact : styles.logoImg}
        />
      </div>
      <div style={styles.line} aria-hidden />
      <div style={styles.inner}>
        <div style={styles.textCol}>
          <div style={styles.name}>ChainProof</div>
          <p style={{ ...styles.tagline, fontSize: compact ? '0.82rem' : '0.98rem' }}>
            Trust you can trace—not just read.
          </p>
          {!compact && (
            <p style={styles.body}>
              ChainProof pairs on-chain proof with AI moderation so genuine feedback stays visible, fair, and impossible to quietly
              rewrite. Built for people who are tired of fake stars and deleted complaints.
            </p>
          )}
        </div>
      </div>
      <div style={styles.line} aria-hidden />
    </div>
  );
}

export { ChainProofBrandStrip };
export default ChainProofBrandStrip;
