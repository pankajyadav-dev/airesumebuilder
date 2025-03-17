import React from 'react';

const GrammarAnalysisModal = ({ isOpen, onClose, analysis }) => {
  if (!analysis || !isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 transform transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800">Grammar Analysis</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Grammar Score */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Score: {analysis.score}%</h3>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
              <div
                style={{ width: `${analysis.score}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  analysis.score >= 85 ? 'bg-green-500' : 
                  analysis.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              ></div>
            </div>
          </div>

          {/* Grammar Errors */}
          {analysis.errors && analysis.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Corrections ({analysis.errors.length})</h3>
              <div className="space-y-3">
                {analysis.errors.map((error, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex flex-col sm:flex-row mb-1">
                      <span className="font-medium w-20">Original:</span>
                      <span className="text-red-600">{error.original}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row mb-1">
                      <span className="font-medium w-20">Correction:</span>
                      <span className="text-green-600">{error.correction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrammarAnalysisModal; 