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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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