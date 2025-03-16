import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React from 'react';

/**
 * A wrapper component that protects routes requiring authentication
 * Redirects to login if user is not authenticated
 * Shows loading state while authentication is being checked
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, authChecked } = useAuth();

  // Show loading indicator while authentication status is being checked
  if (loading || !authChecked) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
          <div className="h-16 w-16 rounded-full border-r-4 border-l-4 border-purple-500 animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Verifying authentication...</p>
        <div className="mt-3 bg-gradient-to-r from-blue-500 to-purple-500 h-1 w-48 rounded animate-pulse"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected content if authenticated
  return children;
}

export default ProtectedRoute; 