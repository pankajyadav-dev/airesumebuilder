import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import ResumeTemplates, { getTemplateHtml } from '../components/ResumeTemplates';
import ShareEmailModal from '../components/ShareResume';
import GrammarAnalysisModal from '../components/GrammarAnalysisModal';
import AtsAnalysisModal from '../components/AtsAnalysisModal';
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
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [grammarAnalysis, setGrammarAnalysis] = useState(null);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [showGrammarModal, setShowGrammarModal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showTemplates, setShowTemplates] = useState(id === 'new');
  const [step, setStep] = useState(id === 'new' ? 1 : 2); // 1: Choose template, 2: Edit resume
  const [htmlMode, setHtmlMode] = useState(false);
  const [editorFailed, setEditorFailed] = useState(false);
  const [showShareEmailModal, setShowShareEmailModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAnalyzingATS, setIsAnalyzingATS] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);

  const handleInit = (evt, editor) => {
    editorRef.current = editor;
    
    // Set up a blur event listener instead of tracking every change
    editor.on('blur', () => {
      if (editor.getContent() !== content) {
        setContent(editor.getContent());
      }
    });
  }
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
      setIsGeneratingAI(true);
      setError('');
      
      // Validate required fields
      if (!jobTitle) {
        setError('Please enter a job title to generate an AI resume');
        setIsGeneratingAI(false);
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
<div class="resume" style="font-family: 'Roboto', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; line-height: 1.5; background: #fff; box-shadow: 0 1px 5px rgba(0,0,0,0.1);">
  <div class="header" style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
    <h1 style="margin: 0 0 10px; font-size: 32px; color: #1e40af; font-weight: 700;">${user?.name || 'Your Name'}</h1>
    <p style="margin: 0; color: #4b5563; font-size: 16px;">${user?.email || 'your.email@example.com'} | Phone: (123) 456-7890 | Location: City, State</p>
  </div>
  
  <div class="section" style="margin-bottom: 25px;">
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Professional Summary</h2>
    <p style="margin: 0; font-size: 16px; color: #4b5563;">Experienced ${jobTitle} with a proven track record in ${targetIndustry || 'the industry'}. Skilled in problem-solving, team collaboration, and delivering high-quality results. Seeking to leverage my expertise at ${targetCompany || 'a forward-thinking company'}.</p>
  </div>
  
  <div class="section" style="margin-bottom: 25px;">
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Experience</h2>
    <div class="job" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">${jobTitle}</h3>
        <span style="font-style: italic; color: #6b7280;">Jan 2020 - Present</span>
      </div>
      <p class="company" style="margin: 0 0 10px; font-weight: 500; color: #4b5563;">Previous Company</p>
      <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563;">
        <li style="margin-bottom: 8px;">Successfully implemented key projects resulting in 20% efficiency improvement</li>
        <li style="margin-bottom: 8px;">Collaborated with cross-functional teams to deliver solutions on time and within budget</li>
        <li style="margin-bottom: 8px;">Recognized for outstanding performance and innovative approaches to problem-solving</li>
      </ul>
    </div>
  </div>
  
  <div class="section" style="margin-bottom: 25px;">
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Education</h2>
    <div class="education" style="margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">Bachelor's Degree in Related Field</h3>
        <span style="font-style: italic; color: #6b7280;">2014 - 2018</span>
      </div>
      <p style="margin: 0; color: #4b5563;">University Name</p>
    </div>
  </div>
  
  <div class="section" style="margin-bottom: 25px;">
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 15px; padding-bottom: 8px; color: #1e40af; border-bottom: 1px solid #e5e7eb;">Skills</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
      <div style="background: #eff6ff; color: #1e40af; padding: 6px 12px; border-radius: 30px; font-size: 14px; font-weight: 500;">Skill 1</div>
      <div style="background: #eff6ff; color: #1e40af; padding: 6px 12px; border-radius: 30px; font-size: 14px; font-weight: 500;">Skill 2</div>
      <div style="background: #eff6ff; color: #1e40af; padding: 6px 12px; border-radius: 30px; font-size: 14px; font-weight: 500;">Skill 3</div>
      <div style="background: #eff6ff; color: #1e40af; padding: 6px 12px; border-radius: 30px; font-size: 14px; font-weight: 500;">Skill 4</div>
      <div style="background: #eff6ff; color: #1e40af; padding: 6px 12px; border-radius: 30px; font-size: 14px; font-weight: 500;">Skill 5</div>
    </div>
  </div>

  <div class="footer" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">
    <p style="margin: 0;">This resume was generated with ResumeAI - Customize it further to highlight your unique qualifications.</p>
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
      setIsGeneratingAI(false);
    }
  };

  const checkGrammar = async () => {
    try {
      setIsCheckingGrammar(true);
      setError('');
      
      const response = await axios.post('/api/ai/check-grammar', {
        resumeId: id
      });
      
      if (response.data.success) {
        const analysis = response.data.analysis;
        setGrammarScore(analysis.score);
        setGrammarAnalysis(analysis);
        setShowGrammarModal(true);
        setMessage(`Grammar check complete! Score: ${analysis.score}%`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error checking grammar:', err);
      setError('Failed to check grammar: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const analyzeATS = async () => {
    try {
      setIsAnalyzingATS(true);
      setError('');
      
      const response = await axios.post('/api/ai/analyze-ats', {
        resumeId: id,
        jobDescription: jobTitle ? `Job title: ${jobTitle}${targetIndustry ? `, Industry: ${targetIndustry}` : ''}` : undefined
      });
      
      if (response.data.success) {
        const analysis = response.data.analysis;
        setAtsScore(analysis.score);
        setAtsAnalysis(analysis);
        setShowAtsModal(true);
        setMessage(`ATS analysis complete! Score: ${analysis.score}%`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error analyzing ATS:', err);
      setError('Failed to analyze ATS compatibility: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsAnalyzingATS(false);
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

  const handleShareViaEmail = () => {
    if (!id || id === 'new') {
      setError('Please save your resume before sharing');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setShowShareEmailModal(true);
  };

  const handleDownloadDocument = async () => {
    if (!id || id === 'new') {
      setError('Please save your resume before downloading');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      console.log('Downloading Word document for resume ID:', id);
      
      // Show loading indicator or message
      setError('Generating document, please wait...');
      
      const response = await axios.get(`/api/resume/${id}/pdf?format=docx`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      });
      
      // Clear the loading message
      setError('');
      
      if (!response.data || response.data.size === 0) {
        throw new Error('No document data received');
      }
      
      console.log('Word document data received, size:', response.data.size);
      
      // Create a blob from the document data
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title || 'Resume'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading Word document:', err);
      
      let errorMessage = 'Failed to download Word document. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading && !content && step !== 1) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-t-4 border-blue-600 border-b-4 border-purple-600 animate-spin"></div>
            <div className="h-20 w-20 rounded-full border-r-4 border-blue-400 border-l-4 border-purple-400 animate-spin absolute top-0 left-0" 
              style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-8 text-center">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              Loading Your Resume
            </h3>
            <p className="text-gray-600">Please wait while we prepare your document...</p>
          </div>
          <div className="mt-6 w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse-slow rounded-full" 
              style={{width: '75%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 1 ? (
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col items-center mb-16">
              <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center mb-6">Create Your Resume</h1>
              <p className="text-xl text-gray-600 text-center max-w-2xl">Choose a professional template to showcase your skills and experience</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-12">
              <ResumeTemplates 
                selectedTemplate={template} 
                onSelectTemplate={handleTemplateSelect} 
              />
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={proceedToEditor}
                disabled={!template}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105
                         shadow-lg hover:shadow-xl"
              >
                Continue with {template.charAt(0).toUpperCase() + template.slice(1)} Template
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-2xl">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 border-b-2 border-transparent 
                             focus:border-blue-500 focus:outline-none w-full bg-transparent"
                    placeholder="Give your resume a title..."
                  />
                </div>
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                  <button
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className="flex-1 lg:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-medium
                             hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    {showAIPanel ? 'Hide AI Tools' : 'Show AI Tools'}
                  </button>
                  <button
                    onClick={handleShareViaEmail}
                    className="flex-1 lg:flex-none bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-lg text-sm font-medium
                             hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Share</span>
                  </button>
                  <button
                    onClick={handleDownloadDocument}
                    className="flex-1 lg:flex-none bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-lg text-sm font-medium
                             hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Word</span>
                  </button>
                  <button
                    onClick={saveResume}
                    disabled={saving}
                    className="flex-1 lg:flex-none bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium
                             hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105
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
              <div className="animate-fade-in bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-[1.01]" role="alert">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="block sm:inline font-medium">{error}</span>
                </div>
              </div>
            )}
            
            {message && (
              <div className="animate-fade-in bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-[1.01]" role="alert">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="block sm:inline font-medium">{message}</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className={`col-span-3 lg:col-span-${showAIPanel ? 2 : 3}`}>
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                  {editorFailed ? (
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
                        onInit={handleInit}
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
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 space-y-8 transition-all duration-300 hover:shadow-2xl">
                    <div>
                      <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">AI Resume Tools</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Resume Information
                          </h3>
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI Tools
                          </h3>
                          <div className="space-y-3">
                            <button
                              onClick={generateAIResume}
                              disabled={isGeneratingAI || !jobTitle}
                              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-medium
                                       hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105
                                       shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                              {isGeneratingAI ? (
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
                              disabled={isAnalyzingATS}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium
                                       hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition-all duration-300 transform hover:scale-105
                                       shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                              {isAnalyzingATS ? (
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
                              disabled={isCheckingGrammar}
                              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 rounded-lg text-sm font-medium
                                       hover:from-green-700 hover:to-green-600 disabled:opacity-50 transition-all duration-300 transform hover:scale-105
                                       shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                              {isCheckingGrammar ? (
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
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Resume Metrics
                          </h3>
                          <div className="space-y-4">
                            {atsScore !== null && (
                              <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">ATS Score</span>
                                  <span className="text-sm font-bold text-blue-600">{atsScore}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${atsScore}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <div className="text-xs text-blue-600">
                                    {atsScore >= 80 ? 'Great! Your resume is highly optimized for ATS systems.' :
                                    atsScore >= 60 ? 'Good! With a few tweaks, your resume can be even better.' :
                                    'Your resume needs improvement to pass ATS systems.'}
                                  </div>
                                  {atsAnalysis && (
                                    <button 
                                      onClick={() => setShowAtsModal(true)}
                                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                                    >
                                      View Details
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                            {grammarScore !== null && (
                              <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Grammar Score</span>
                                  <span className="text-sm font-bold text-green-600">{grammarScore}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${grammarScore}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <div className="text-xs text-green-600">
                                    {grammarScore >= 80 ? 'Excellent! Your resume has very few grammar issues.' :
                                    grammarScore >= 60 ? 'Good! Some minor grammar improvements would help.' :
                                    'Consider reviewing your resume for grammar issues.'}
                                  </div>
                                  {grammarAnalysis && (
                                    <button 
                                      onClick={() => setShowGrammarModal(true)}
                                      className="text-xs text-green-700 hover:text-green-900 font-semibold px-2 py-1 bg-green-100 hover:bg-green-200 rounded transition-colors"
                                    >
                                      View Details
                                    </button>
                                  )}
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
      
      {/* Share Email Modal */}
      <ShareEmailModal 
        isOpen={showShareEmailModal}
        onClose={() => setShowShareEmailModal(false)}
        resumeId={id}
        resumeTitle={title}
      />

      {/* ATS Analysis Modal */}
      {atsAnalysis && (
        <AtsAnalysisModal 
          isOpen={showAtsModal}
          onClose={() => setShowAtsModal(false)}
          analysis={atsAnalysis}
        />
      )}

      {/* Grammar Analysis Modal */}
      {grammarAnalysis && (
        <GrammarAnalysisModal 
          isOpen={showGrammarModal}
          onClose={() => setShowGrammarModal(false)}
          analysis={grammarAnalysis}
        />
      )}
    </div>
  );
}

export default ResumeEditor; 