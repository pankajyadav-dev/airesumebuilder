import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/resume');
        setResumes(response.data);
      } catch (err) {
        console.error('Error fetching resumes:', err);
        setError('Failed to load resumes');
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const handleDeleteResume = async (id) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        setDeletingId(id);
        await axios.delete(`/api/resume/${id}`);
        setResumes(resumes.filter(resume => resume._id !== id));
      } catch (err) {
        console.error('Error deleting resume:', err);
        setError('Failed to delete resume');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get template label
  const getTemplateLabel = (templateName) => {
    const templates = {
      'professional': { label: 'Professional', color: 'bg-blue-100 text-blue-800' },
      'modern': { label: 'Modern', color: 'bg-purple-100 text-purple-800' },
      'creative': { label: 'Creative', color: 'bg-pink-100 text-pink-800' },
      'minimalist': { label: 'Minimalist', color: 'bg-gray-100 text-gray-800' },
      'executive': { label: 'Executive', color: 'bg-indigo-100 text-indigo-800' },
      'technical': { label: 'Technical', color: 'bg-green-100 text-green-800' },
      'academic': { label: 'Academic', color: 'bg-yellow-100 text-yellow-800' },
      'simple': { label: 'Simple', color: 'bg-orange-100 text-orange-800' }
    };
    
    return templates[templateName] || { label: 'Custom', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-10">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Manage your resumes, create new ones, and track your progress all in one place
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-10 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-lg text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">My Resumes</h2>
        </div>
        <Link
          to="/resume/new"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg text-base font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Resume</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-md shadow-sm" role="alert">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Loading your resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-12 text-center border border-gray-100">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">You haven't created any resumes yet</h3>
          <p className="text-gray-600 mb-8">Get started by creating your first professional resume with our AI-powered tools</p>
          <Link
            to="/resume/new"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Resume
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => {
            const template = getTemplateLabel(resume.template);
            
            return (
              <div key={resume._id} className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col">
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200">
                      <Link to={`/resume/${resume._id}`}>
                        {resume.title}
                      </Link>
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${template.color}`}>
                      {template.label}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Updated: {formatDate(resume.updatedAt)}
                    </p>
                  </div>
                  
                  {resume.jobTitle && (
                    <p className="text-sm text-gray-600 mb-1 truncate">
                      <span className="font-medium">Position:</span> {resume.jobTitle}
                    </p>
                  )}
                  
                  {resume.targetCompany && (
                    <p className="text-sm text-gray-600 mb-1 truncate">
                      <span className="font-medium">Company:</span> {resume.targetCompany}
                    </p>
                  )}
                  
                  {resume.metrics && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {resume.metrics.atsScore > 0 && (
                        <div className="flex items-center space-x-1 text-xs">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md font-medium ${resume.metrics.atsScore >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ATS: {resume.metrics.atsScore}%
                          </span>
                        </div>
                      )}
                      {resume.metrics.grammarScore > 0 && (
                        <div className="flex items-center space-x-1 text-xs">
                          <span className="inline-flex items-center px-2 py-1 rounded-md font-medium bg-blue-100 text-blue-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Grammar: {resume.metrics.grammarScore}%
                          </span>
                        </div>
                      )}
                      {resume.metrics.plagiarismScore > 0 && (
                        <div className="flex items-center space-x-1 text-xs">
                          <span className="inline-flex items-center px-2 py-1 rounded-md font-medium bg-purple-100 text-purple-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Originality: {resume.metrics.plagiarismScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                  <Link
                    to={`/resume/${resume._id}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteResume(resume._id)}
                    disabled={deletingId === resume._id}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${
                      deletingId === resume._id 
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                        : 'text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200'
                    }`}
                  >
                    {deletingId === resume._id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;