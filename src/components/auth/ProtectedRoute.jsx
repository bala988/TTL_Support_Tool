import React from 'react';
import { Navigate } from 'react-router-dom';
import { isSuperAdmin } from '../../utils/superAdmin';

const ProtectedRoute = ({ children, roles = [] }) => {
  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail");
  const userId = localStorage.getItem("userId");

  // Check if logged in
  if (!userId || !userEmail || !userRole) {
    return <Navigate to="/" />;
  }

  // Check if specific roles are required
  if (roles.length > 0) {
    // Special case for sales: allowing specific admin email
    if (roles.includes('sales')) {
        if (userRole === 'sales' || isSuperAdmin(userEmail)) {
            return children;
        }
        return <Navigate to="/" />;
    }

    if (!roles.includes(userRole)) {
      return <Navigate to="/" />;
    }
  }

  return children;
};

export default ProtectedRoute;
