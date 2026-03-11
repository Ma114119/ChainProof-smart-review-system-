import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaBuilding, FaCamera, FaGoogle, FaFacebook, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { apiRegister, createBusiness, apiLogin, saveAuthData } from "../../services/api";

// =================================================================
// Reusable Child Components
// =================================================================

// --- Notification Banner ---
const Notification = ({ message, type, onDismiss }) => (
    <div style={{ ...styles.notification, ...(type === 'error' ? styles.notificationError : styles.notificationSuccess) }}>
        <FaInfoCircle style={{ marginRight: '0.75rem' }} />
        <span>{message}</span>
        <button onClick={onDismiss} style={styles.notificationDismiss}>&times;</button>
    </div>
);

// --- Password Strength Meter ---
const PasswordStrengthMeter = ({ password }) => {
    const [strength, setStrength] = useState({ value: 0, color: '', label: '' });

    useEffect(() => {
        let score = 0;
        if (password.length > 7) score++;
        if (password.match(/[a-z]/)) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[^a-zA-Z0-9]/)) score++;

        let color = '';
        let label = '';
        switch (score) {
            case 1: color = '#ef4444'; label = 'Very Weak'; break;
            case 2: color = '#f97316'; label = 'Weak'; break;
            case 3: color = '#facc15'; label = 'Medium'; break;
            case 4: color = '#a3e635'; label = 'Strong'; break;
            case 5: color = '#4ade80'; label = 'Very Strong'; break;
            default: color = 'var(--card-border)'; label = ''; break;
        }
        setStrength({ value: score, color, label });
    }, [password]);

    if (!password) return null;

    return (
        <div style={styles.strengthContainer}>
            <div style={styles.strengthBar}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} style={{...styles.strengthSegment, backgroundColor: i < strength.value ? strength.color : 'var(--hero-bg)'}}></div>
                ))}
            </div>
            <p style={{...styles.strengthLabel, color: strength.color}}>{strength.label}</p>
        </div>
    );
};

// --- Password Input with Visibility Toggle ---
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
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    );
};

// =================================================================
// Main Register Component
// =================================================================
function Register() {
  const navigate = useNavigate();
  
  // --- State Management ---
  // A cleaner, nested state that aligns with our database tables
  const [form, setForm] = useState({
      user: {
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          cnic: "",
          role: "customer",
          profilePicture: null,
      },
      business: {
          name: "",
          description: "",
          category: "",
          address: "",
          phoneNumber: "",
          websiteUrl: "",
          establishmentYear: ""
      }
  });

  const [errors, setErrors] = useState({ cnic: "", passwordMatch: "" });
  const [previewImage, setPreviewImage] = useState(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Utility Functions ---
  const showNotification = (message, type = 'error') => {
      setNotification({ show: true, message, type });
      setTimeout(() => setNotification({ show: false, message: '', type }), 5000);
  };

  // --- Effects for Real-time Validation ---
  useEffect(() => {
    if (form.user.password && form.user.confirmPassword && form.user.password !== form.user.confirmPassword) {
        setErrors(prev => ({...prev, passwordMatch: "Passwords do not match."}));
    } else {
        setErrors(prev => ({...prev, passwordMatch: ""}));
    }
  }, [form.user.password, form.user.confirmPassword]);

  // --- Event Handlers ---
  const handleChange = (section, e) => {
    const { name, value } = e.target;
    
    setForm(prevForm => ({
        ...prevForm,
        [section]: {
            ...prevForm[section],
            [name]: value
        }
    }));
    
    // CNIC validation
    if (name === "cnic") {
      if (value.length > 0 && !/^\d{5}-\d{7}-\d{1}$/.test(value)) {
        setErrors(prev => ({...prev, cnic: "CNIC must be in format XXXXX-XXXXXXX-X"}));
      } else {
        setErrors(prev => ({...prev, cnic: ""}));
      }
    }
  };

  const handleRoleChange = (role) => {
    setForm(prevForm => ({
        ...prevForm,
        user: { ...prevForm.user, role }
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setForm(prevForm => ({...prevForm, user: {...prevForm.user, profilePicture: file}}));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (errors.passwordMatch) { showNotification("Passwords do not match."); return; }
    if (errors.cnic) { showNotification("Please fix the CNIC format."); return; }
    if (!agreeToTerms) { showNotification("You must agree to the Terms and Conditions."); return; }

    setIsSubmitting(true);
    try {
      // Map 'business' role to 'owner' for the backend
      const backendRole = form.user.role === 'business' ? 'owner' : form.user.role;

      const userPayload = {
        full_name: form.user.fullName,
        email: form.user.email,
        password: form.user.password,
        cnic: form.user.cnic,
        role: backendRole,
      };

      await apiRegister(userPayload);

      // If owner, log in to get JWT then create the business
      if (backendRole === 'owner' && form.business.name) {
        const loginData = await apiLogin(form.user.email, form.user.password);
        saveAuthData(loginData);

        await createBusiness({
          name: form.business.name,
          description: form.business.description,
          category: form.business.category,
          address: form.business.address,
          phone_number: form.business.phoneNumber,
          website_url: form.business.websiteUrl,
          establishment_year: form.business.establishmentYear || null,
        });

        showNotification("Account & Business created! Redirecting...", 'success');
        setTimeout(() => navigate('/business/dashboard'), 2000);
      } else {
        showNotification("Account created! Redirecting to login...", 'success');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      const msg = err.data ? Object.values(err.data).flat().join(' ') : err.message;
      showNotification(msg || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Attempting to sign up with ${provider}...`);
    showNotification(`Social login with ${provider} is not yet implemented.`);
  };

  // --- Derived State for Form Validation ---
  const isBusiness = form.user.role === "business";
  const isFormValid = useMemo(() => {
    const userIsValid = form.user.fullName && form.user.email && form.user.password && form.user.confirmPassword && form.user.cnic;
    const businessIsValid = !isBusiness || (form.business.name && form.business.description && form.business.category && form.business.address && form.business.phoneNumber);
    return userIsValid && businessIsValid && !errors.cnic && !errors.passwordMatch && agreeToTerms;
  }, [form, errors, agreeToTerms, isBusiness]);


  const hoverStyles = `
    .input-focus:focus {
        border-color: var(--button-bg);
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3);
    }
    .submit-button-hover:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    .avatar-hover:hover .upload-overlay-hover {
        opacity: 1;
    }
  `;

  return (
    <div style={styles.pageContainer}>
        <style>{hoverStyles}</style>
        {notification.show && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ ...notification, show: false })} />}
        
        <div style={styles.formWrapper}>
            {/* Left Side: Form */}
            <div style={styles.formColumn}>
                <h2 style={styles.title}>Create Your Account</h2>
                <p style={styles.subtitle}>Join a community built on trust and transparency.</p>
                
                <form onSubmit={handleSubmit} noValidate>
                    <div style={styles.avatarUploader}>
                        <label htmlFor="profile-picture" style={styles.avatar} className="avatar-hover">
                            {previewImage ? <img src={previewImage} alt="Preview" style={styles.avatarImage}/> : (isBusiness ? <FaBuilding/> : <FaUser/>)}
                            <div style={styles.uploadOverlay} className="upload-overlay-hover"><FaCamera/></div>
                        </label>
                        <input type="file" id="profile-picture" onChange={handleImageChange} style={{display: 'none'}} accept="image/*"/>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Account Type</label>
                        <div style={styles.roleSelector}>
                            <button type="button" onClick={() => handleRoleChange('customer')} style={form.user.role === 'customer' ? {...styles.roleButton, ...styles.roleButtonActive} : styles.roleButton}><FaUser/> Customer</button>
                            <button type="button" onClick={() => handleRoleChange('business')} style={form.user.role === 'business' ? {...styles.roleButton, ...styles.roleButtonActive} : styles.roleButton}><FaBuilding/> Business Owner</button>
                        </div>
                    </div>

                    <div style={styles.inputGrid}>
                        <div style={styles.inputGroup}><label style={styles.label}>Full Name</label><input name="fullName" placeholder="Ahmed Ali" value={form.user.fullName} onChange={(e) => handleChange('user', e)} style={styles.input} className="input-focus" required /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Email</label><input name="email" type="email" placeholder="you@example.com" value={form.user.email} onChange={(e) => handleChange('user', e)} style={styles.input} className="input-focus" required /></div>
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>CNIC</label>
                        <input name="cnic" placeholder="Format: 12345-1234567-1" value={form.user.cnic} onChange={(e) => handleChange('user', e)} style={styles.input} className="input-focus" required />
                        {errors.cnic && <p style={styles.errorText}>{errors.cnic}</p>}
                    </div>

                    <div style={styles.inputGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <PasswordInput name="password" value={form.user.password} onChange={(e) => handleChange('user', e)} placeholder="••••••••" />
                            <PasswordStrengthMeter password={form.user.password} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Confirm Password</label>
                            <PasswordInput name="confirmPassword" value={form.user.confirmPassword} onChange={(e) => handleChange('user', e)} placeholder="••••••••" />
                            {errors.passwordMatch && <p style={styles.errorText}>{errors.passwordMatch}</p>}
                        </div>
                    </div>

                    {isBusiness && (
                        <div style={styles.businessSection}>
                            <h3 style={styles.sectionTitle}>Business Information</h3>
                            <div style={styles.inputGroup}><label style={styles.label}>Business Name</label><input name="name" placeholder="e.g., Gourmet Delight" value={form.business.name} onChange={(e) => handleChange('business', e)} style={styles.input} className="input-focus" required /></div>
                            <div style={styles.inputGroup}><label style={styles.label}>Business Description</label><textarea name="description" placeholder="A short description of your business..." value={form.business.description} onChange={(e) => handleChange('business', e)} style={{...styles.input, minHeight: '80px'}} className="input-focus" required /></div>
                            <div style={styles.inputGrid}>
                                <div style={styles.inputGroup}><label style={styles.label}>Business Type</label><input name="category" placeholder="e.g., Restaurant" value={form.business.category} onChange={(e) => handleChange('business', e)} style={styles.input} className="input-focus" required /></div>
                                <div style={styles.inputGroup}><label style={styles.label}>Location</label><input name="address" placeholder="City, Country" value={form.business.address} onChange={(e) => handleChange('business', e)} style={styles.input} className="input-focus" required /></div>
                            </div>
                            <div style={styles.inputGrid}>
                                <div style={styles.inputGroup}><label style={styles.label}>Contact Number</label><input name="phoneNumber" placeholder="+92 300 1234567" value={form.business.phoneNumber} onChange={(e) => handleChange('business', e)} style={styles.input} className="input-focus" required /></div>
                                <div style={styles.inputGroup}><label style={styles.label}>Establishment Year</label><input name="establishmentYear" placeholder="e.g., 2020" value={form.business.establishmentYear} onChange={(e) => handleChange('business', e)} style={styles.input} className="input-focus" type="number" min="1900" max={new Date().getFullYear()} /></div>
                            </div>
                            <div style={styles.inputGroup}><label style={styles.label}>Website URL (optional)</label><input name="websiteUrl" placeholder="https://example.com" value={form.business.websiteUrl} onChange={(e) => handleChange('business', e)} style={styles.input} className="input-focus" /></div>
                        </div>
                    )}
                    
                    <div style={styles.termsContainer}>
                        <input type="checkbox" id="terms" checked={agreeToTerms} onChange={() => setAgreeToTerms(!agreeToTerms)} style={{marginRight: '0.5rem'}}/>
                        <label htmlFor="terms">I agree to the <Link to="/terms-conditions" style={styles.link}>Terms and Conditions</Link></label>
                    </div>

                    <button type="submit" style={(!isFormValid || isSubmitting) ? {...styles.submitButton, ...styles.submitButtonDisabled} : styles.submitButton} className="submit-button-hover" disabled={!isFormValid || isSubmitting}>
                      {isSubmitting ? <FaSpinner style={{animation: 'spin 1s linear infinite'}}/> : 'Create Account'}
                    </button>
                
                    <div style={styles.divider}><span>OR</span></div>

                    <div style={styles.socialLoginContainer}>
                        <button type="button" onClick={() => handleSocialLogin('Google')} style={styles.socialButton}><FaGoogle/> Sign up with Google</button>
                        <button type="button" onClick={() => handleSocialLogin('Facebook')} style={styles.socialButton}><FaFacebook/> Sign up with Facebook</button>
                    </div>
                </form>

                <p style={styles.footerText}>
                    Already have an account?{" "}
                    <Link to="/login" style={styles.link}>Login</Link>
                </p>
            </div>

            {/* Right: Intro Text */}
            <div style={styles.introColumn}>
                <h2 style={styles.introTitle}>{isBusiness ? "Build a Trusted Brand" : "Become a Valued Contributor"}</h2>
                <p style={styles.introText}>
                    {isBusiness 
                        ? "Register your business to access a world of authentic, AI-verified customer feedback. Leverage the power of blockchain to build an undeniable reputation and connect with customers who value transparency."
                        : "Create your account to share your experiences, shape the community, and earn rewards. Your honest reviews, secured on the blockchain, help everyone make better decisions."
                    }
                </p>
            </div>
        </div>
    </div>
  );
};

// =================================================================
// Styles Object
// =================================================================
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
    notification: {
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1000,
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        fontSize: '0.95rem',
        minWidth: '350px'
    },
    notificationSuccess: { backgroundColor: '#10B981' },
    notificationError: { backgroundColor: '#EF4444' },
    notificationDismiss: {
        background: 'none',
        border: 'none',
        color: 'white',
        marginLeft: 'auto',
        paddingLeft: '1.5rem',
        fontSize: '1.5rem',
        cursor: 'pointer',
        lineHeight: 1
    },
    formWrapper: {
        display: "flex",
        maxWidth: "1100px",
        width: "100%",
        boxShadow: "var(--shadow)",
        backgroundColor: "var(--card-bg)",
        borderRadius: "12px",
        overflow: "hidden",
    },
    formColumn: { 
        flex: 1.5, 
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
    avatarUploader: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '1.5rem',
    },
    avatar: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: 'var(--hero-bg)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '3rem',
        color: 'var(--button-bg)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: '2px dashed var(--card-border)',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    uploadOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'opacity 0.2s',
    },
    roleSelector: {
        display: 'flex',
        gap: '1rem',
        backgroundColor: 'var(--hero-bg)',
        padding: '0.5rem',
        borderRadius: '8px',
    },
    roleButton: {
        flex: 1,
        padding: '0.75rem',
        background: 'none',
        border: 'none',
        borderRadius: '6px',
        color: 'var(--text-color)',
        cursor: 'pointer',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
    },
    roleButtonActive: {
        backgroundColor: 'var(--card-bg)',
        color: 'var(--button-bg)',
        boxShadow: 'var(--shadow)',
    },
    inputGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    inputGroup: {
        marginBottom: '1.2rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
    },
    input: {
        width: '100%',
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
    strengthContainer: {
        marginTop: '0.5rem',
    },
    strengthBar: {
        display: 'flex',
        gap: '0.25rem',
        height: '5px',
    },
    strengthSegment: {
        flex: 1,
        borderRadius: '5px',
    },
    strengthLabel: {
        fontSize: '0.8rem',
        textAlign: 'right',
        marginTop: '0.25rem',
    },
    errorText: { 
        color: "#ef4444", 
        fontSize: "0.8rem", 
        marginTop: "0.25rem",
    },
    businessSection: {
        borderTop: "1px solid var(--card-border)",
        paddingTop: "1.5rem",
        marginTop: "1.5rem"
    },
    sectionTitle: { 
        fontSize: "1.2rem", 
        fontWeight: "600", 
        color: "var(--header-text)",
        marginBottom: "1rem"
    },
    termsContainer: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.9rem',
        marginTop: '1rem',
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
    submitButtonDisabled: {
        backgroundColor: "var(--card-border)",
        cursor: "not-allowed",
        opacity: 0.7,
    },
    divider: {
        margin: '1.5rem 0',
        textAlign: 'center',
        color: 'var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    socialLoginContainer: {
        display: 'flex',
        gap: '1rem',
    },
    socialButton: {
        flex: 1,
        padding: '0.8rem',
        borderRadius: '8px',
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        color: 'var(--text-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
    },
    footerText: { 
        textAlign: "center", 
        marginTop: "1.5rem", 
        fontSize: "0.95rem" 
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

export default Register;

