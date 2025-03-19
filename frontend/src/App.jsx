import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeEditor from './pages/ResumeEditor';
import Profile from './pages/Profile';
import Account from './pages/Account';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ApiErrorBanner from './components/ApiErrorBanner';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Set default axios base URL
axios.defaults.baseURL = 'https://airesumebuilder-alpha.vercel.app';
axios.defaults.withCredentials = true;

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
    
    // Log requests for debugging
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
axios.interceptors.response.use(
  response => {
    // Log successful responses for debugging
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    // Log all errors for debugging
    console.error('API Error:', error);
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error - redirecting to login');
      // We'll let the ProtectedRoute component handle the redirect
    }
    
    // Handle CORS errors
    if (error.message === 'Network Error') {
      console.error('CORS or network error detected');
    }
    
    return Promise.reject(error);
  }
);

function AppContent() {
  const { apiAvailable, authChecked } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      {!apiAvailable && <ApiErrorBanner />}
      <main className="flex-grow pt-16">
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
          <Route 
            path="/account" 
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
