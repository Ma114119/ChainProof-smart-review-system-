// =================================================================
// FILE: src/components/Navbar.js (UPDATED & FIXED)
// =================================================================
// A cleaner, more professional navbar that reads the user role directly
// from localStorage. All links are now fully visible for every role.

import React, { useContext, useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { clearAuthData } from "../services/api";
import {
  FaTachometerAlt, FaUserCircle, FaWallet, FaCompass,
  FaSignOutAlt, FaBuilding, FaComments, FaCog, FaUsers,
  FaShieldAlt, FaBook, FaSun, FaMoon, FaHome,
  FaMoneyBillWave, FaEnvelope, FaChartBar, FaCogs, FaPenFancy
} from 'react-icons/fa';

function Navbar() {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'public');
  const isAuthenticated = userRole !== 'public';

  // Re-read role whenever auth state changes (login/logout events)
  useEffect(() => {
    const syncRole = () => setUserRole(localStorage.getItem('userRole') || 'public');
    window.addEventListener('authChanged', syncRole);
    window.addEventListener('storage', syncRole);
    return () => {
      window.removeEventListener('authChanged', syncRole);
      window.removeEventListener('storage', syncRole);
    };
  }, []);

  const logout = () => {
    clearAuthData();
    setUserRole('public');
    window.dispatchEvent(new Event('authChanged'));
    navigate('/login');
  };

  const activeLinkStyle = {
    color: 'var(--button-bg)',
    fontWeight: 'bold',
  };

  // Renders the correct links based on user role
  const renderLinks = () => {
    if (isAuthenticated) {
      let mainLinks = [];

      switch (userRole) {
        case 'customer':
          mainLinks = [
            { to: "/customer/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
            { to: "/customer/profile", label: "Profile", icon: <FaUserCircle /> },
            { to: "/customer/review", label: "Write Review", icon: <FaPenFancy /> },
            { to: "/customer/wallet", label: "Wallet", icon: <FaWallet /> },
            { to: "/customer/inbox", label: "Inbox", icon: <FaEnvelope /> },
            { to: "/explore", label: "Explore", icon: <FaCompass /> },
          ];
          break;
        case 'owner':
          mainLinks = [
            { to: "/business/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
            { to: "/business/profile", label: "Business Profile", icon: <FaBuilding /> },
            { to: "/business/wallet", label: "Wallet", icon: <FaWallet /> },
            { to: "/business/reviews", label: "Reviews", icon: <FaComments /> },
            { to: "/business/inbox", label: "Inbox", icon: <FaEnvelope /> },
            { to: "/business/manage", label: "Manage", icon: <FaCog /> },
          ];
          break;
        case 'admin':
          mainLinks = [
            { to: "/admin/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
            { to: "/admin/users", label: "Users", icon: <FaUsers /> },
            { to: "/admin/businesses", label: "Businesses", icon: <FaBuilding /> },
            { to: "/admin/reviews", label: "Moderation", icon: <FaShieldAlt /> },
            { to: "/admin/financials", label: "Financials", icon: <FaMoneyBillWave /> },
            { to: "/admin/inbox", label: "Inbox", icon: <FaEnvelope /> },
            { to: "/admin/settings", label: "Settings", icon: <FaCogs /> },
            { to: "/admin/analytics", label: "Analytics", icon: <FaChartBar /> },
          ];
          break;
        default:
          break;
      }

      return (
        <>
          {mainLinks.map(link => (
            <NavLink key={link.to} to={link.to} style={({isActive}) => ({...styles.navItem, ...(isActive ? activeLinkStyle : {})})}>
              {link.icon} {link.label}
            </NavLink>
          ))}
          <button onClick={logout} style={{...styles.navItem, ...styles.logoutButton, background: 'none', border: 'none'}}>
            <FaSignOutAlt /> Logout
          </button>
        </>
      );

    } else { // Public (logged out) links
      return (
        <>
          <NavLink to="/" style={({isActive}) => ({...styles.navItem, ...(isActive ? activeLinkStyle : {})})}>
            <FaHome style={styles.navIcon} /> Home
          </NavLink>
          <NavLink to="/explore" style={({isActive}) => ({...styles.navItem, ...(isActive ? activeLinkStyle : {})})}>
            <FaCompass style={styles.navIcon} /> Explore
          </NavLink>
          <NavLink to="/review-guidelines" style={({isActive}) => ({...styles.navItem, ...(isActive ? activeLinkStyle : {})})}>
            <FaBook style={styles.navIcon} /> Guidelines
          </NavLink>
          <NavLink to="/login" style={{...styles.navItem, ...styles.loginButton}}>Login</NavLink>
          <NavLink to="/register" style={{...styles.navItem, ...styles.registerButton}}>Sign Up</NavLink>
        </>
      );
    }
  };

  return (
    <header style={styles.navbar}>
      <style>{logoGlowStyles}</style>
      <div style={styles.logo} onClick={() => navigate("/")} className="logo-glow">
        <img src="/chainproof-logo.png" alt="ChainProof" style={styles.logoImg} />
        <span className="logo-text">ChainProof</span>
      </div>
      <nav style={styles.navLinks}>
        {renderLinks()}
      </nav>
      <button style={styles.themeToggle} onClick={toggleTheme}>
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>
    </header>
  );
}

// Professional Styles for the Navbar
const logoGlowStyles = `
  .logo-glow { transition: all 0.3s ease; }
  .logo-glow:hover .logo-text { filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.8)); }
  .logo-glow .logo-text { background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 0 30px rgba(34, 211, 238, 0.5); }
`;
const styles = {
    navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2.5rem", backgroundColor: "var(--card-bg)", color: "var(--header-text)", boxShadow: "var(--shadow)", position: "sticky", top: 0, zIndex: 1000 },
    logo: { fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer", color: "var(--header-text)", display: 'flex', alignItems: 'center', gap: '0.5rem' },
    logoImg: { height: 48, width: 'auto', flexShrink: 0 },
    navLinks: { display: "flex", gap: "1.2rem", alignItems: "center", flexWrap: 'wrap', justifyContent: 'center' },
    navItem: { textDecoration: "none", color: "var(--text-color)", fontWeight: 500, fontSize: "0.95rem", cursor: "pointer", padding: "0.5rem 0", borderBottom: "2px solid transparent", transition: "color 0.2s ease, border-color 0.2s ease", display: 'flex', alignItems: 'center', gap: '0.5rem' },
    navIcon: { fontSize: '1rem', flexShrink: 0, color: 'inherit' },
    loginButton: { marginLeft: '1rem' },
    registerButton: { backgroundColor: 'var(--button-bg)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', borderBottom: 'none' },
    themeToggle: { fontSize: "1.2rem", cursor: "pointer", background: 'none', border: 'none', color: 'var(--text-color)' },
    logoutButton: { color: '#EF4444' }
};

export default Navbar;
