// =================================================================
// FILE: src/routes/AppRoutes.js (SIMPLIFIED)
// =================================================================
// The routes are now set up in a simple, direct way without protection,
// which is ideal for frontend development before backend logic is added.

import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// Public Pages
import Home from "../pages/public/Home";
import ExploreBusinesses from "../pages/public/ExploreBusinesses";
import BusinessPublicProfile from "../pages/public/BusinessProfile";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import ReviewGuidelines from "../pages/public/ReviewGuidelines";

// Footer Pages
import AboutUs from "../pages/footer/AboutUs";
import ContactUs from "../pages/footer/ContactUs";
import PrivacyPolicy from "../pages/footer/PrivacyPolicy";
import TermsConditions from "../pages/footer/TermsAndConditions";

// Customer Pages
import CustomerDashboard from "../pages/customer/Dashboard";
import CustomerProfile from "../pages/customer/Profile";
import CustomerReview from "../pages/customer/writeReview";
import CustomerWallet from "../pages/customer/RewardWallet";
import CustomerInbox from "../pages/customer/Inbox";

// Business Pages
import BusinessDashboard from "../pages/owner/BusinessDashboard";
import BusinessProfile from "../pages/owner/BusinessProfile";
import BusinessWallet from "../pages/owner/BusinessWallet";
import ReviewsFeedback from "../pages/owner/ReviewsFeedback";
import ManageBusiness from "../pages/owner/ManageBusiness";
import BusinessInbox from "../pages/owner/Inbox";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
import BusinessManagement from "../pages/admin/BusinessManagement";
import ReviewModeration from "../pages/admin/ReviewModeration";
import FinancialTransactions from "../pages/admin/FinancialTransactions";
import AdminInbox from "../pages/admin/Inbox";
import SiteSettings from "../pages/admin/SiteSettings";
import AnalyticsReports from "../pages/admin/AnalyticsReports";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProtectedRoute from "./ProtectedRoute";
import MessageNotificationPoller from "../components/MessageNotificationPoller";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', margin: 0, padding: 0 }}>
        <MessageNotificationPoller />
        <ScrollToTop />
        <Navbar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: 0, padding: 0, minHeight: 0 }}>
          <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<ExploreBusinesses />} />
        <Route path="/review-guidelines" element={<ReviewGuidelines />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/business/:id" element={<BusinessPublicProfile />} />

        {/* Footer Routes */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        {/* Customer Routes — protected */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/review" element={<CustomerReview />} />
          <Route path="/customer/review/:businessId" element={<CustomerReview />} />
          <Route path="/customer/wallet" element={<CustomerWallet />} />
          <Route path="/customer/inbox" element={<CustomerInbox />} />
        </Route>

        {/* Business Owner Routes — protected */}
        <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
          <Route path="/business/dashboard" element={<BusinessDashboard />} />
          <Route path="/business/profile" element={<BusinessProfile />} />
          <Route path="/business/wallet" element={<BusinessWallet />} />
          <Route path="/business/reviews" element={<ReviewsFeedback />} />
          <Route path="/business/manage" element={<ManageBusiness />} />
          <Route path="/business/inbox" element={<BusinessInbox />} />
        </Route>

        {/* Admin Routes — protected */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/businesses" element={<BusinessManagement />} />
          <Route path="/admin/reviews" element={<ReviewModeration />} />
          <Route path="/admin/financials" element={<FinancialTransactions />} />
          <Route path="/admin/inbox" element={<AdminInbox />} />
          <Route path="/admin/settings" element={<SiteSettings />} />
          <Route path="/admin/analytics" element={<AnalyticsReports />} />
        </Route>
      </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default AppRoutes;
