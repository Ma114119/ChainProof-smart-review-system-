// =================================================================
// FILE: src/routes/ProtectedRoute.js (NEW FILE)
// =================================================================
// This component protects your routes. It checks the role in localStorage
// and redirects the user if they don't have access.

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const userRole = localStorage.getItem("userRole") || 'public';

    // If the user's role is not in the list of allowed roles, redirect them.
    if (!allowedRoles.includes(userRole)) {
        // Redirect to login page if they are trying to access a protected route without the right role.
        return <Navigate to="/login" replace />;
    }

    // If the user has the correct role, show the page they are trying to access.
    return <Outlet />;
};

export default ProtectedRoute;