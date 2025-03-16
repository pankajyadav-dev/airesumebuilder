import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeEditor from './pages/ResumeEditor';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ApiErrorBanner from './components/ApiErrorBanner';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Set default axios base URL and configuration
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
axios.defaults.withCredentials = true;
axios.defaults.timeout = 15000; // 15-second timeout

// Add request interceptor to include credentials and handle CORS
axios.interceptors.request.use(
  config => {
    // Ensure credentials are included
    config.withCredentials = true;
    
    // Add CORS headers
    config.headers['Content-Type'] = 'application/json';
    
    // Add token from localStorage if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Development logging only
    if (import.meta.env.DEV) {
      console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    }
    
    return config;
  },
  error => {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
axios.interceptors.response.use(
  response => {
    // Development logging only
    if (import.meta.env.DEV) {
      console.log(`Response from ${response.config.url}:`, response.status);
    }
    return response;
  },
  error => {
    // Handle response errors
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        if (import.meta.env.DEV) {
          console.log('Authentication error - redirecting to login');
        }
        // AuthContext will handle the redirect
      } else if (error.response.status === 403) {
        console.error('Permission denied');
      } else if (error.response.status === 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - no response received');
    } else {
      // Error in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

function AppContent() {
  const { apiAvailable, authChecked } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      {!apiAvailable && <ApiErrorBanner />}
      <main className="flex-grow container mx-auto px-4 py-8">
        {authChecked ? (
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume/new" 
              element={
                <ProtectedRoute>
                  <ResumeEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume/:id" 
              element={
                <ProtectedRoute>
                  <ResumeEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-500">
              Loading application...
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
