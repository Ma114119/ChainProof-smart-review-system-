// =================================================================
// Navbar — role-based links, theme toggle, mobile hamburger (<768px)
// =================================================================

import React, { useContext, useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { clearAuthData } from "../services/api";
import {
  FaTachometerAlt, FaUserCircle, FaWallet, FaCompass,
  FaSignOutAlt, FaBuilding, FaComments, FaCog, FaUsers,
  FaShieldAlt, FaBook, FaSun, FaMoon, FaHome,
  FaMoneyBillWave, FaEnvelope, FaChartBar, FaCogs, FaPenFancy,
  FaBars, FaTimes,
} from 'react-icons/fa';

const linkClass = ({ isActive }) =>
  `app-navbar__link${isActive ? " is-active" : ""}`;

const ctaClass = ({ isActive }) =>
  `app-navbar__link app-navbar__link--cta${isActive ? " is-active" : ""}`;

function Navbar() {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'public');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAuthenticated = userRole !== 'public';

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    const syncRole = () => setUserRole(localStorage.getItem('userRole') || 'public');
    window.addEventListener('authChanged', syncRole);
    window.addEventListener('storage', syncRole);
    return () => {
      window.removeEventListener('authChanged', syncRole);
      window.removeEventListener('storage', syncRole);
    };
  }, []);

  useEffect(() => {
    closeMobileNav();
  }, [location.pathname, closeMobileNav]);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const logout = () => {
    clearAuthData();
    setUserRole('public');
    window.dispatchEvent(new Event('authChanged'));
    closeMobileNav();
    navigate('/login');
  };

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
            { to: "/business/manage", label: "Manage Business", icon: <FaCog /> },
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
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={linkClass}
              onClick={closeMobileNav}
            >
              {link.icon} {link.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={logout}
            className="app-navbar__link app-navbar__link--logout"
          >
            <FaSignOutAlt /> Logout
          </button>
        </>
      );
    }

    return (
      <>
        <NavLink to="/" className={linkClass} onClick={closeMobileNav}>
          <FaHome style={{ flexShrink: 0 }} /> Home
        </NavLink>
        <NavLink to="/explore" className={linkClass} onClick={closeMobileNav}>
          <FaCompass style={{ flexShrink: 0 }} /> Explore
        </NavLink>
        <NavLink to="/review-guidelines" className={linkClass} onClick={closeMobileNav}>
          <FaBook style={{ flexShrink: 0 }} /> Guidelines
        </NavLink>
        <NavLink
          to="/login"
          className={({ isActive }) =>
            `app-navbar__link app-navbar__link--login${isActive ? " is-active" : ""}`
          }
          onClick={closeMobileNav}
        >
          Login
        </NavLink>
        <NavLink to="/register" className={ctaClass} onClick={closeMobileNav}>
          Sign Up
        </NavLink>
      </>
    );
  };

  return (
    <header className="app-navbar">
      <style>{logoGlowStyles}</style>
      <div className="app-navbar__row">
        <div
          className="app-navbar__brand logo-glow"
          onClick={() => {
            navigate("/");
            closeMobileNav();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/");
              closeMobileNav();
            }
          }}
        >
          <img src="/chainproof-logo.png" alt="" className="app-navbar__logo" />
          <span className="logo-text">ChainProof</span>
        </div>

        <nav
          className={`app-navbar__nav${mobileNavOpen ? " is-open" : ""}`}
          id="main-navigation"
          aria-label="Main navigation"
        >
          {renderLinks()}
        </nav>

        <div className="app-navbar__end">
          <button
            type="button"
            className="app-navbar__menu-btn"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="main-navigation"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <FaTimes /> : <FaBars />}
          </button>
          <button
            type="button"
            className="app-navbar__theme"
            onClick={toggleTheme}
            aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>

      <div
        className={`app-navbar__backdrop${mobileNavOpen ? " is-visible" : ""}`}
        onClick={closeMobileNav}
        aria-hidden="true"
      />
    </header>
  );
}

const logoGlowStyles = `
  .logo-glow { transition: all 0.3s ease; }
  .logo-glow:hover .logo-text { filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.8)); }
  .logo-glow .logo-text { background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 0 30px rgba(34, 211, 238, 0.5); }
`;

export default Navbar;
