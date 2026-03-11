import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { apiLogin, saveAuthData } from "../../services/api";

// Password Input Component with Visibility Toggle
const PasswordInput = ({ name, value, onChange, placeholder }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
      <div style={styles.passwordInputWrapper}>
        <input 
          type={isVisible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={styles.input} 
          className="input-focus" 
          required
        />
        <button 
          type="button" 
          onClick={() => setIsVisible(!isVisible)} 
          style={styles.eyeButton}
        >
          {isVisible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    );
  };

const ROLE_REDIRECTS = {
  admin: '/admin/dashboard',
  owner: '/business/dashboard',
  customer: '/customer/dashboard',
};

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(form.email, form.password);
      saveAuthData(data);
      window.dispatchEvent(new Event('authChanged'));
      navigate(ROLE_REDIRECTS[data.role] || '/');
    } catch (err) {
      setError(err.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hoverStyles = `
    .input-focus:focus {
        border-color: var(--button-bg);
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3);
    }
    .submit-button-hover:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;

  return (
    <div style={styles.pageContainer}>
        <style>{hoverStyles}</style>
        <div style={styles.formWrapper}>
            {/* Left Side: Form */}
            <div style={styles.formColumn}>
                <h2 style={styles.title}>Welcome Back!</h2>
                <p style={styles.subtitle}>Login to access your account and continue your journey.</p>
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="you@example.com" 
                            value={form.email} 
                            onChange={handleChange}
                            style={styles.input} 
                            className="input-focus"
                            required 
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <label style={styles.label}>Password</label>
                            <Link to="#" style={styles.forgotPasswordLink}>Forgot Password?</Link>
                        </div>
                        <PasswordInput 
                            name="password" 
                            value={form.password} 
                            onChange={handleChange} 
                            placeholder="••••••••" 
                        />
                    </div>
                    
                    {/* Remember Me Checkbox */}
                    <div style={styles.extraOptions}>
                        <label style={styles.checkboxContainer}>
                            <input type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} />
                            Remember me
                        </label>
                    </div>

                    {error && (
                      <div style={styles.errorBanner}>{error}</div>
                    )}

                    <button type="submit" style={styles.submitButton} className="submit-button-hover" disabled={loading}>
                        {loading ? <FaSpinner style={{animation: 'spin 1s linear infinite'}}/> : 'Login'}
                    </button>
                
                </form>

                <p style={styles.footerText}>
                    Don't have an account?{" "}
                    <Link to="/register" style={styles.link}>Register Now</Link>
                </p>
            </div>

            {/* Right: Intro Text */}
            <div style={styles.introColumn}>
                <h2 style={styles.introTitle}>Secure & Transparent</h2>
                <p style={styles.introText}>
                    Access your AI-powered, blockchain-secured review account. Continue contributing to our transparent feedback ecosystem and earn rewards for your valuable insights.
                </p>
            </div>
        </div>
    </div>
  );
};

const styles = {
    pageContainer: {
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem"
    },
    formWrapper: {
        display: "flex",
        maxWidth: "950px",
        width: "100%",
        boxShadow: "var(--shadow)",
        backgroundColor: "var(--card-bg)",
        borderRadius: "12px",
        overflow: "hidden",
    },
    formColumn: { 
        flex: 1.2, 
        padding: "2.5rem",
    },
    introColumn: {
        flex: 1,
        backgroundColor: "var(--hero-bg)",
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "left",
    },
    title: { 
        fontSize: "2rem", 
        fontWeight: "700", 
        color: "var(--header-text)", 
        marginBottom: "0.5rem" 
    },
    subtitle: {
        marginBottom: '2rem',
        opacity: 0.8,
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
        width: '90%',
        padding: '0.8rem 1rem',
        fontSize: '1rem',
        borderRadius: '8px',
        border: '2px solid var(--card-border)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        outline: 'none',
        transition: 'all 0.2s ease-in-out',
    },
    passwordInputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    eyeButton: {
        position: 'absolute',
        right: '1rem',
        background: 'none',
        border: 'none',
        color: 'var(--text-color)',
        cursor: 'pointer',
        opacity: 0.7,
    },
    extraOptions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
    },
    checkboxContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
    },
    forgotPasswordLink: {
        fontSize: '0.9rem',
        color: 'var(--button-bg)',
        textDecoration: 'none',
    },
    submitButton: {
        width: "100%",
        padding: "0.9rem",
        fontSize: "1rem",
        fontWeight: "600",
        backgroundColor: "var(--button-bg)",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        marginTop: "1rem",
        transition: "all 0.3s ease"
    },
    footerText: { 
        textAlign: "center", 
        marginTop: "1.5rem", 
        fontSize: "0.95rem" 
    },
    errorBanner: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid #EF4444',
        color: '#EF4444',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        fontSize: '0.9rem',
    },
    link: {
        color: "var(--button-bg)", 
        fontWeight: "600", 
        textDecoration: "none"
    },
    introTitle: { 
        fontSize: "2rem", 
        fontWeight: "700", 
        color: "var(--hero-text)", 
        marginBottom: "1rem" 
    },
    introText: { 
        fontSize: "1.1rem", 
        lineHeight: "1.6", 
        opacity: 0.9,
    },
};

export default Login;
