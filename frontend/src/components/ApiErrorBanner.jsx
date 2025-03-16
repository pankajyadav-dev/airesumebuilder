import React, { useState } from 'react';

function ApiErrorBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 shadow-md fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-lg">Connection Error</p>
            <p className="text-sm text-white/90">
              Cannot connect to the backend server. Please ensure the server is running at{' '}
              <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-white">
                {import.meta.env.VITE_API_URL || 'http://localhost:3000'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => window.location.reload()}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Retry Connection
          </button>
          <button 
            onClick={() => setDismissed(true)}
            className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full flex items-center justify-center transition-colors duration-200"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiErrorBanner; 