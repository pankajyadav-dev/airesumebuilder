import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      <div className="flex flex-col justify-center items-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-t-4 border-indigo-400 border-solid rounded-full animate-ping absolute top-0 opacity-30"></div>
        </div>
        <p className="mt-4 text-gray-600 animate-pulse">Verifying authentication...</p>
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