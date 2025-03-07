import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set token in axios headers whenever it changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if API is available
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await axios.get('/api/health');
        setApiAvailable(true);
      } catch (err) {
        console.error('API health check failed:', err);
        setApiAvailable(false);
      }
    };

    checkApiHealth();
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!apiAvailable) {
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      // Check if we have a token in localStorage
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        
        try {
          console.log('Checking authentication with stored token...');
          const response = await axios.get('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          console.log('Auth check response:', response.data);
          
          if (response.data.authenticated && response.data.user) {
            // Ensure we're using the correct user ID field
            const userData = response.data.user;
            // Use _id if available, otherwise use id
            userData.id = userData._id || userData.id;
            setUser(userData);
          } else {
            // Clear invalid token
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.error('Auth check error:', err);
          // Clear invalid token
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      
      setLoading(false);
      setAuthChecked(true);
    };

    checkAuthStatus();
  }, [apiAvailable]);

  // Login function
  const login = async (email, password) => {
    if (!apiAvailable) {
      throw new Error('API is not available. Please check your connection.');
    }

    try {
      setError(null);
      // Use the alternative login endpoint
      const response = await axios.post('/api/auth/login-alt', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        
        // Set user data
        const userData = response.data.user;
        // Use _id if available, otherwise use id
        userData.id = userData._id || userData.id;
        setUser(userData);
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Register function
  const register = async (name, email, password) => {
    if (!apiAvailable) {
      throw new Error('API is not available. Please check your connection.');
    }

    try {
      setError(null);
      const response = await axios.post('/api/auth/register', { name, email, password });
      console.log('Register response:', response.data);
      
      if (response.data.success && response.data.user) {
        // After registration, login the user
        return login(email, password);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    if (!apiAvailable) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return;
    }

    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear the user on the client side even if the server request fails
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    apiAvailable,
    authChecked,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 