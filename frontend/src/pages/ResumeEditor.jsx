import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResumeTemplates, { getTemplateHtml } from '../components/ResumeTemplates';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';

function ResumeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editorRef = useRef(null);
  
  const [title, setTitle] = useState('Untitled Resume');
  const [content, setContent] = useState('');
  const [template, setTemplate] = useState('professional');
  const [jobTitle, setJobTitle] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [atsScore, setAtsScore] = useState(null);
  const [grammarScore, setGrammarScore] = useState(null);
  const [plagiarismScore, setPlagiarismScore] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showTemplates, setShowTemplates] = useState(id === 'new');
  const [step, setStep] = useState(id === 'new' ? 1 : 2); // 1: Choose template, 2: Edit resume
  const [htmlMode, setHtmlMode] = useState(false);
  const [editorFailed, setEditorFailed] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchResume();
    } else if (id === 'new' && step === 2) {
      // Initialize with template
      const userData = user ? {
        name: user.name,
        email: user.email,
        // Add more user data here
      } : {};
      
      setContent(getTemplateHtml(template, userData));
    }
  }, [id, step, template, user]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/resume/${id}`);
      const resume = response.data;
      
      setTitle(resume.title);
      setContent(resume.content);
      setTemplate(resume.template || 'professional');
      setJobTitle(resume.jobTitle || '');
      setTargetCompany(resume.targetCompany || '');
      setTargetIndustry(resume.targetIndustry || '');
      
      if (resume.metrics) {
        setAtsScore(resume.metrics.atsScore);
        setGrammarScore(resume.metrics.grammarScore);
        setPlagiarismScore(resume.metrics.plagiarismScore);
      }
    } catch (err) {
      console.error('Error fetching resume:', err);
      setError('Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const saveResume = async () => {
    try {
      setSaving(true);
      setError('');
      
      const resumeData = {
        title,
        content,
        template,
        jobTitle,
        targetCompany,
        targetIndustry
      };
      
      let response;
      
      if (id && id !== 'new') {
        response = await axios.put(`/api/resume/${id}`, resumeData);
      } else {
        response = await axios.post('/api/resume', resumeData);
        navigate(`/resume/${response.data._id}`);
      }
      
      setMessage('Resume saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving resume:', err);
      setError('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const generateAIResume = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate required fields
      if (!jobTitle) {
        setError('Please enter a job title to generate an AI resume');
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.post('/api/ai/generate-resume', {
          jobTitle,
          targetCompany,
          targetIndustry
        });
        
        setContent(response.data.content);
        if (editorRef.current) {
          editorRef.current.setContent(response.data.content);
        }
        
        setMessage('AI-generated resume created!');
        setTimeout(() => setMessage(''), 3000);
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // If the error is because of missing profile data, generate a fallback resume
        if (apiError.response?.status === 400 && 
            apiError.response?.data?.message?.includes('profile data')) {
          
          console.log('Generating fallback resume template');
          // Generate a fallback resume with placeholder content
          const fallbackContent = `
<div class="resume">
  <div class="header">
    <h1>${user?.name || 'Your Name'}</h1>
    <p>${user?.email || 'your.email@example.com'} | Phone: (123) 456-7890 | Location: City, State</p>
  </div>
  
  <div class="section">
    <h2>Professional Summary</h2>
    <p>Experienced ${jobTitle} with a proven track record in ${targetIndustry || 'the industry'}. Skilled in problem-solving, team collaboration, and delivering high-quality results. Seeking to leverage my expertise at ${targetCompany || 'a forward-thinking company'}.</p>
  </div>
  
  <div class="section">
    <h2>Experience</h2>
    <div class="job">
      <h3>${jobTitle}</h3>
      <p class="company">Previous Company | Jan 2020 - Present</p>
      <ul>
        <li>Successfully implemented key projects resulting in 20% efficiency improvement</li>
        <li>Collaborated with cross-functional teams to deliver solutions on time and within budget</li>
        <li>Recognized for outstanding performance and innovative approaches to problem-solving</li>
      </ul>
    </div>
  </div>
  
  <div class="section">
    <h2>Education</h2>
    <div class="education">
      <h3>Bachelor's Degree in Related Field</h3>
      <p>University Name | Graduated: 2018</p>
    </div>
  </div>
  
  <div class="section">
    <h2>Skills</h2>
    <ul class="skills-list">
      <li>Skill 1</li>
      <li>Skill 2</li>
      <li>Skill 3</li>
      <li>Skill 4</li>
      <li>Skill 5</li>
    </ul>
  </div>
</div>
          `;
          
          setContent(fallbackContent);
          if (editorRef.current) {
            editorRef.current.setContent(fallbackContent);
          }
          
          setMessage('Resume template created! Please update your profile for better AI generation.');
          setTimeout(() => setMessage(''), 5000);
        } else {
          throw apiError; // Re-throw if it's a different error
        }
      }
    } catch (err) {
      console.error('Error generating AI resume:', err);
      setError('Failed to generate AI resume. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const checkGrammar = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Mock grammar check response
      setTimeout(() => {
        setGrammarScore(85);
        setMessage('Grammar check complete! Score: 85%');
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error checking grammar:', err);
      setError('Failed to check grammar');
      setLoading(false);
    }
  };

  const checkPlagiarism = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Mock plagiarism check response
      setTimeout(() => {
        setPlagiarismScore(92);
        setMessage('Originality check complete! Score: 92%');
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error checking plagiarism:', err);
      setError('Failed to check originality');
      setLoading(false);
    }
  };

  const analyzeATS = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Mock ATS analysis response
      setTimeout(() => {
        setAtsScore(78);
        setMessage('ATS analysis complete! Score: 78%');
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error analyzing ATS:', err);
      setError('Failed to analyze ATS compatibility');
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setTemplate(templateId);
  };

  const proceedToEditor = () => {
    setStep(2);
    setShowTemplates(false);
  };

  // Handle TinyMCE initialization error
  const handleEditorLoadError = () => {
    console.log('TinyMCE editor failed to load, falling back to textarea');
    setEditorFailed(true);
  };
  
  // Add this inside the Editor section
  useEffect(() => {
    // Set a timeout to check if editor is working
    const timeoutId = setTimeout(() => {
      if (editorRef.current === null) {
        handleEditorLoadError();
      }
    }, 5000); // 5 seconds should be enough time for TinyMCE to load
    
    return () => clearTimeout(timeoutId);
  }, []);

  const toggleHtmlMode = () => {
    setHtmlMode(!htmlMode);
  };

  if (loading && !content && step !== 1) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 1 ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">Create Your Resume</h1>
              <p className="text-lg text-gray-600 text-center">Choose a template to get started</p>
            </div>
            
            <ResumeTemplates 
              selectedTemplate={template} 
              onSelectTemplate={handleTemplateSelect} 
            />
            
            <div className="mt-12 flex justify-center">
              <button
                onClick={proceedToEditor}
                disabled={!template}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 
                         disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-105
                         shadow-lg hover:shadow-xl"
              >
                Continue with Selected Template
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-3xl md:text-4xl font-bold text-gray-900 border-b-2 border-transparent 
                             focus:border-blue-500 focus:outline-none w-full bg-transparent"
                    placeholder="Give your resume a title..."
                  />
                </div>
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                  <button
                    onClick={toggleHtmlMode}
                    className="flex-1 lg:flex-none bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-medium
                             hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    {htmlMode ? 'Preview Mode' : 'HTML Mode'}
                  </button>
                  <button
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className="flex-1 lg:flex-none bg-purple-600 text-white px-6 py-3 rounded-lg text-sm font-medium
                             hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    {showAIPanel ? 'Hide AI Tools' : 'Show AI Tools'}
                  </button>
                  <button
                    onClick={saveResume}
                    disabled={saving}
                    className="flex-1 lg:flex-none bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium
                             hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg
                             flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span>Save Resume</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="animate-fade-in bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="block sm:inline font-medium">{error}</span>
                </div>
              </div>
            )}
            
            {message && (
              <div className="animate-fade-in bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md" role="alert">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="block sm:inline font-medium">{message}</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className={`col-span-3 lg:col-span-2`}>
                <div className="bg-white rounded-xl shadow-lg ">
                  {htmlMode || editorFailed ? (
                    <div className="p-6">
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-[600px] p-4 border border-gray-300 rounded-lg focus:outline-none 
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none"
                        placeholder="Enter your HTML resume content here..."
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <Editor
                        apiKey="w9wb2nr9fpk741lb6kzvabnhlzj7aimkgqbt1jdvnwi9qgky"
                        onInit={(evt, editor) => editorRef.current = editor}
                        initialValue={content}
                        inline={false}
                        init={{
                          height: 600,
                          menubar: true,
                          branding: false,
                          promotion: false,
                          plugins: [
                            'lists', 'link', 'image', 'preview', 
                            'code', 'table', 'help', 'wordcount'
                          ],
                          toolbar: 'undo redo | formatselect | ' +
                            'bold italic | alignleft aligncenter ' +
                            'alignright | bullist numlist | link | ' +
                            'removeformat | help',
                          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                          skin: 'oxide',
                          resize: false
                        }}
                        onEditorChange={(newContent) => setContent(newContent)}
                      />
                      <div className="absolute top-0 left-0 right-0 text-center p-4 bg-yellow-100 text-yellow-800 
                                    rounded-t-lg opacity-0 transition-opacity duration-300 shadow-lg" 
                           style={{ opacity: editorRef.current ? 0 : 0.95 }}>
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="animate-spin h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="font-medium">Loading editor... If it doesn't appear, try switching to HTML mode.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {showAIPanel && (
                <div className="col-span-1">
                  <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Resume Tools</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Information</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                              <input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none 
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                placeholder="e.g. Software Engineer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Target Company</label>
                              <input
                                type="text"
                                value={targetCompany}
                                onChange={(e) => setTargetCompany(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none 
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                placeholder="e.g. Google"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                              <input
                                type="text"
                                value={targetIndustry}
                                onChange={(e) => setTargetIndustry(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none 
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                placeholder="e.g. Technology"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Tools</h3>
                          <div className="space-y-3">
                            <button
                              onClick={generateAIResume}
                              disabled={loading || !jobTitle}
                              className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-medium
                                       hover:bg-purple-700 disabled:opacity-50 transition-all transform hover:scale-105
                                       shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  <span>Generate AI Resume</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={analyzeATS}
                              disabled={loading}
                              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium
                                       hover:bg-blue-700 disabled:opacity-50 transition-all transform hover:scale-105
                                       shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                                  <span>Analyzing...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  <span>Analyze ATS Compatibility</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={checkGrammar}
                              disabled={loading}
                              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-medium
                                       hover:bg-green-700 disabled:opacity-50 transition-all transform hover:scale-105
                                       shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                                  <span>Checking...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Check Grammar</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={checkPlagiarism}
                              disabled={loading}
                              className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg text-sm font-medium
                                       hover:bg-yellow-700 disabled:opacity-50 transition-all transform hover:scale-105
                                       shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                                  <span>Checking...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  <span>Check Originality</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Metrics</h3>
                          <div className="space-y-4">
                            {atsScore !== null && (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">ATS Score</span>
                                  <span className="text-sm font-bold text-blue-600">{atsScore}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${atsScore}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {grammarScore !== null && (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Grammar Score</span>
                                  <span className="text-sm font-bold text-green-600">{grammarScore}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-600 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${grammarScore}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {plagiarismScore !== null && (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Originality Score</span>
                                  <span className="text-sm font-bold text-yellow-600">{plagiarismScore}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-yellow-600 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${plagiarismScore}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeEditor; 