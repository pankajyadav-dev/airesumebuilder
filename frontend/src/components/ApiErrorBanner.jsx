import React, { useState, useEffect } from 'react';

function ApiErrorBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in the banner after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for the animation to complete before removing from DOM
    setTimeout(() => {
      setDismissed(true);
    }, 300);
  };

  if (dismissed) {
    return null;
  }

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-3 shadow-lg transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-3 flex-shrink-0 bg-red-800 bg-opacity-30 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-lg">Connection Error</p>
            <p className="text-sm text-red-100">Cannot connect to the backend server. Please make sure the server is running at http://localhost:3000.</p>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="ml-auto bg-red-700 text-white p-1.5 rounded-full flex items-center justify-center hover:bg-red-800 transition-colors duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ApiErrorBanner; 