import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import ResumeTemplates, { getTemplateHtml } from '../components/ResumeTemplates';
import ShareEmailModal from '../components/ShareResume/ShareEmailModal';
import GrammarAnalysisModal from '../components/GrammarAnalysisModal';
import AtsAnalysisModal from '../components/AtsAnalysisModal';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Alert,
  IconButton,
  Snackbar,
  Menu,
  MenuItem,
  Tooltip,
  AppBar,
  Toolbar,
  Switch,
  FormControlLabel,
  InputAdornment,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import CodeIcon from '@mui/icons-material/Code';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import CategoryIcon from '@mui/icons-material/Category';

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

  const [showTemplates, setShowTemplates] = useState(id === 'new');
  const [step, setStep] = useState(id === 'new' ? 1 : 2); // 1: Choose template, 2: Edit resume
  const [editorFailed, setEditorFailed] = useState(false);
  const [showShareEmailModal, setShowShareEmailModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAnalyzingATS, setIsAnalyzingATS] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);

  const [templateChanged, setTemplateChanged] = useState(false);

  const handleInit = (evt, editor) => {
    editorRef.current = editor;
    
    // Initial content sync
    if (content) {
      editor.setContent(content);
    }
    
    // Set up a blur event listener instead of tracking every change
    editor.on('blur', () => {
      if (editor.getContent() !== content) {
        setContent(editor.getContent());
      }
    });
  };

  // Update the content when template changes
  useEffect(() => {
    if (editorRef.current && content && templateChanged) {
      editorRef.current.setContent(content);
      // Reset the template changed flag after updating the editor
      setTemplateChanged(false);
    }
  }, [content, templateChanged]);

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
      
      setContent(getBasicTemplate(template, userData));
    }
  }, [id, step, template, user]);

  // Add a template change effect to update content when template changes
  useEffect(() => {
    // Only apply when editing a resume (not on initial load)
    if (content && step === 2 && template) {
      // Don't regenerate for existing resumes immediately on load
      if (id !== 'new' && !templateChanged) {
        return;
      }
      
      // Extract user data from existing content if possible
      let userData = { name: user?.name || 'Your Name', email: user?.email || 'your.email@example.com' };
      
      try {
        // Try to extract name from the content
        const nameMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (nameMatch && nameMatch[1] && !nameMatch[1].includes('${name}')) {
          userData.name = nameMatch[1].trim();
        }
        
        // Try to extract email from the content
        const emailMatch = content.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
        if (emailMatch && emailMatch[1]) {
          userData.email = emailMatch[1].trim();
        }
      } catch (err) {
        console.log('Error extracting user data from content:', err);
      }
      
      // Regenerate the content with the new template
      setContent(getBasicTemplate(template, userData));
    }
  }, [template, content, user, id, step, templateChanged]);

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
      
      // Make sure we have the latest content from the editor
      let latestContent = content;
      if (editorRef.current) {
        latestContent = editorRef.current.getContent();
        setContent(latestContent);
      }
      
      const resumeData = {
        title,
        content: latestContent,
        template,
        jobTitle,
        targetCompany,
        targetIndustry
      };
      
      console.log('Saving resume with template:', template);
      console.log('Resume content length:', latestContent.length);
      
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
      setError('Failed to save resume: ' + (err.response?.data?.message || err.message));
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
          targetIndustry,
          template // Pass the current template to the API
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
          // Generate a fallback resume with placeholder content based on the current template
          const userData = { name: user?.name || 'Your Name', email: user?.email || 'your.email@example.com' };
          const fallbackContent = getBasicTemplate(template, userData);
          
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
    if (templateId === template) {
      return; // Already selected
    }
    
    console.log('Selected template:', templateId);
    setTemplate(templateId);
    setTemplateChanged(true);
    
    // If we're in edit mode (step 2), immediately apply the template
    if (step === 2) {
      // Extract user data from current content
      let userData = { name: user?.name || 'Your Name', email: user?.email || 'your.email@example.com' };
      
      try {
        // Try to extract name and email from current content
        const currentContent = editorRef.current ? editorRef.current.getContent() : content;
        
        const nameMatch = currentContent.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (nameMatch && nameMatch[1] && !nameMatch[1].includes('${name}')) {
          userData.name = nameMatch[1].trim();
        }
        
        const emailMatch = currentContent.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
        if (emailMatch && emailMatch[1]) {
          userData.email = emailMatch[1].trim();
        }
      } catch (err) {
        console.log('Error extracting user data from content:', err);
      }
      
      // Generate new content with the selected template
      const newContent = getBasicTemplate(templateId, userData);
      setContent(newContent);
      
      // Update the editor content if available
      if (editorRef.current) {
        editorRef.current.setContent(newContent);
      }
      
      // Show success message
      setMessage(`Template changed to ${templateId.charAt(0).toUpperCase() + templateId.slice(1)}`);
      setTimeout(() => setMessage(''), 3000);
    }
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

  // Template generation function
  const getBasicTemplate = (template, userData) => {
    const name = userData?.name || 'Your Name';
    const email = userData?.email || 'your.email@example.com';
    
    if (template === 'creative') {
      return `<div style="font-family: 'Roboto', sans-serif; max-width: 800px; margin: 0 auto; padding: 30px;">
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="width: 120px; height: 120px; border-radius: 50%; background-color: #9c27b0; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <h1 style="margin: 0; color: white; font-size: 48px;">${name.charAt(0)}</h1>
          </div>
          <h1 style="margin: 0 0 10px; color: #9c27b0; font-size: 32px;">${name}</h1>
          <p style="margin: 5px 0; font-size: 16px; color: #666;">${email} | Phone: Your Phone | Location: Your Location</p>
        </div>
        <div style="margin-bottom: 20px; text-align: center;">
          <p style="background-color: #f3e5f5; padding: 15px; border-radius: 8px; color: #555; font-style: italic;">Creative professional with expertise in design, innovation, and problem-solving.</p>
        </div>
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 22px; color: #9c27b0; border-bottom: 2px solid #9c27b0; padding-bottom: 5px; display: inline-block;">Experience</h2>
          <div style="margin-bottom: 15px; padding: 10px 0;">
            <h3 style="margin: 0; font-size: 18px; color: #333;">Job Title</h3>
            <p style="margin: 5px 0 10px; font-style: italic; color: #666;">Company Name | Date - Present</p>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li style="margin-bottom: 8px;">Created innovative designs that increased engagement by 45%</li>
              <li style="margin-bottom: 8px;">Led a team of designers to deliver award-winning projects</li>
              <li style="margin-bottom: 8px;">Developed unique brand identities for various clients</li>
            </ul>
          </div>
        </div>
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 22px; color: #9c27b0; border-bottom: 2px solid #9c27b0; padding-bottom: 5px; display: inline-block;">Education</h2>
          <div style="padding: 10px 0;">
            <h3 style="margin: 0; font-size: 18px; color: #333;">Degree in Creative Field</h3>
            <p style="margin: 5px 0; font-style: italic; color: #666;">University Name | Year</p>
          </div>
        </div>
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 22px; color: #9c27b0; border-bottom: 2px solid #9c27b0; padding-bottom: 5px; display: inline-block;">Skills</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">
            <span style="background-color: #f3e5f5; padding: 8px 15px; border-radius: 20px; color: #9c27b0; font-weight: 500;">Skill 1</span>
            <span style="background-color: #f3e5f5; padding: 8px 15px; border-radius: 20px; color: #9c27b0; font-weight: 500;">Skill 2</span>
            <span style="background-color: #f3e5f5; padding: 8px 15px; border-radius: 20px; color: #9c27b0; font-weight: 500;">Skill 3</span>
            <span style="background-color: #f3e5f5; padding: 8px 15px; border-radius: 20px; color: #9c27b0; font-weight: 500;">Skill 4</span>
            <span style="background-color: #f3e5f5; padding: 8px 15px; border-radius: 20px; color: #9c27b0; font-weight: 500;">Skill 5</span>
          </div>
        </div>
      </div>`;
    } else if (template === 'modern') {
      return `<div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 30px;">
        <div style="display: flex; margin-bottom: 30px; flex-wrap: wrap;">
          <div style="background-color: #1976d2; width: 30%; padding: 30px; color: white; min-width: 200px; flex: 1;">
            <h1 style="margin: 0 0 20px; font-size: 28px;">${name}</h1>
            <p style="margin: 0 0 5px; font-size: 14px;">Email: ${email}</p>
            <p style="margin: 0 0 5px; font-size: 14px;">Phone: Your Phone</p>
            <p style="margin: 0 0 25px; font-size: 14px;">Location: Your Location</p>
            
            <h3 style="margin: 30px 0 15px; font-size: 18px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 10px;">Skills</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Skill 1</li>
              <li style="margin-bottom: 8px;">Skill 2</li>
              <li style="margin-bottom: 8px;">Skill 3</li>
              <li style="margin-bottom: 8px;">Skill 4</li>
              <li style="margin-bottom: 8px;">Skill 5</li>
            </ul>
            
            <h3 style="margin: 30px 0 15px; font-size: 18px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 10px;">Education</h3>
            <h4 style="margin: 0; font-size: 16px;">Degree Name</h4>
            <p style="margin: 5px 0 0; font-style: italic; font-size: 14px;">University Name</p>
            <p style="margin: 5px 0 0; font-size: 14px;">Graduation Year</p>
          </div>
          
          <div style="width: 70%; padding: 30px; min-width: 300px; flex: 2;">
            <h2 style="font-size: 20px; color: #1976d2; margin: 0 0 20px; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Professional Summary</h2>
            <p style="color: #444; line-height: 1.6;">A dedicated professional with expertise in the industry. Committed to delivering high-quality results and driving innovation in all projects.</p>
            
            <h2 style="font-size: 20px; color: #1976d2; margin: 30px 0 20px; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Work Experience</h2>
            
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0; font-size: 18px; color: #333;">Job Title</h3>
              <p style="margin: 5px 0; font-weight: 500; color: #666;">Company Name | Date - Present</p>
              <ul style="margin: 10px 0 0; padding-left: 20px; color: #444;">
                <li style="margin-bottom: 8px;">Led key initiatives that resulted in significant improvements</li>
                <li style="margin-bottom: 8px;">Collaborated with teams across departments to deliver successful projects</li>
                <li style="margin-bottom: 8px;">Implemented new strategies that increased efficiency by 30%</li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
    } else { // professional (default)
      return `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #333;">${name}</h1>
          <p style="margin: 5px 0;">${email} | Phone: Your Phone | Location: Your Location</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Summary</h2>
          <p>Experienced professional with skills in...</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Experience</h2>
          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0; font-size: 16px;">Job Title</h3>
            <p style="margin: 0; font-style: italic;">Company Name | Date - Present</p>
            <ul>
              <li>Accomplishment 1</li>
              <li>Accomplishment 2</li>
            </ul>
          </div>
        </div>
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Education</h2>
          <div>
            <h3 style="margin: 0; font-size: 16px;">Degree Name</h3>
            <p style="margin: 0; font-style: italic;">University Name | Graduation Year</p>
          </div>
        </div>
        <div>
          <h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Skills</h2>
          <p>Skill 1, Skill 2, Skill 3, Skill 4, Skill 5</p>
        </div>
      </div>`;
    }
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
      console.log('Downloading Word document for resume ID:', id, 'with template:', template);
      
      // Show loading indicator or message
      setError('Generating document, please wait...');
      
      // Make sure we have the latest content from the editor
      let latestContent = content;
      if (editorRef.current) {
        latestContent = editorRef.current.getContent();
        setContent(latestContent);
      }
      
      // Send the current content along with the request to ensure it matches what's in the editor
      const response = await axios({
        method: 'post',
        url: `/api/resume/${id}/export`,
        data: {
          content: latestContent,
          template: template,
          format: 'docx',
          title: title
        },
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
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
      link.setAttribute('download', `${title || 'Resume'}_${template}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      // Show success message
      setMessage('Resume downloaded successfully with ' + template.charAt(0).toUpperCase() + template.slice(1) + ' template!');
      setTimeout(() => setMessage(''), 3000);
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px'
          }}
        >
          <LinearProgress />
        </Box>
        <Box sx={{ position: 'relative', mt: -5 }}>
          <CircularProgress 
            size={80} 
            thickness={3} 
            sx={{ 
              animation: 'pulse 1.5s infinite ease-in-out',
              '@keyframes pulse': {
                '0%': { opacity: 0.8, transform: 'scale(0.95)' },
                '50%': { opacity: 1, transform: 'scale(1.05)' },
                '100%': { opacity: 0.8, transform: 'scale(0.95)' },
              }
            }} 
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DescriptionIcon 
              sx={{ 
                fontSize: 40,
                animation: 'fadeIn 1.5s infinite alternate',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0.6 },
                  '100%': { opacity: 1 },
                }
              }} 
            />
          </Box>
        </Box>
        <Typography variant="h5" sx={{ mt: 4, fontWeight: 500, letterSpacing: 0.5 }}>
          Loading Resume...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Just a moment while we prepare your document
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 0 }}>
      <ShareEmailModal 
        open={showShareEmailModal} 
        onClose={() => setShowShareEmailModal(false)}
        resumeId={id}
        resumeTitle={title}
      />
      <GrammarAnalysisModal
        open={showGrammarModal}
        onClose={() => setShowGrammarModal(false)}
        analysis={grammarAnalysis}
      />
      <AtsAnalysisModal
        open={showAtsModal}
        onClose={() => setShowAtsModal(false)}
        analysis={atsAnalysis}
      />
      
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Button
            startIcon={<ArrowBackIcon />}
            sx={{ 
              mr: 2,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateX(-3px)'
              }
            }}
            onClick={() => navigate('/dashboard')}
          >
            Back
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveResume}
            disabled={saving}
            sx={{ 
              mx: 1,
              px: 2,
              boxShadow: 2,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              },
              '&:active': {
                transform: 'translateY(1px)',
                boxShadow: 1
              }
            }}
          >
            {saving ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Saving...
              </>
            ) : 'Save'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadDocument}
            sx={{ 
              mx: 1,
              px: 2,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Download
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShareViaEmail}
            sx={{ 
              mx: 1,
              px: 2,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Share
          </Button>
        </Toolbar>
      </AppBar>
      
      {/* Template Selection Bar */}
      {step === 2 && (
        <Paper 
          elevation={2} 
          sx={{ 
            mb: 0, 
            borderRadius: 0,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            bgcolor: 'background.paper', 
            p: 2,
            borderBottom: showTemplates ? 1 : 0,
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Current Template: <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </Box>
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="secondary"
                onClick={() => setShowTemplates(!showTemplates)}
                startIcon={showTemplates ? null : <DescriptionIcon />}
                endIcon={showTemplates ? null : null}
                sx={{ 
                  py: 1,
                  px: 2,
                  background: showTemplates ? 'grey.500' : 'linear-gradient(45deg, #3f51b5, #2196f3)',
                  boxShadow: 1,
                  '&:hover': {
                    background: showTemplates ? 'grey.600' : 'linear-gradient(45deg, #303f9f, #1976d2)',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                {showTemplates ? 'Close Template Selection' : 'Change Template'}
              </Button>
            </Box>
          </Box>

          {showTemplates && (
            <Box sx={{ py: 2, px: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={3} sx={{ mt: 0 }}>
                <Grid item xs={12} sm={4}>
                  <Paper 
                    elevation={template === 'professional' ? 4 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: template === 'professional' ? '2px solid' : '1px solid',
                      borderColor: template === 'professional' ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 3
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleTemplateSelect('professional')}
                  >
                    {template === 'professional' && (
                      <Box sx={{ 
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}>
                        ✓
                      </Box>
                    )}
                    <Box 
                      sx={{ 
                        height: 150, 
                        bgcolor: 'grey.100', 
                        mb: 2, 
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1
                      }}
                    >
                      <Box sx={{ height: '20%', bgcolor: 'grey.300', width: '70%', mx: 'auto', mb: 1 }} />
                      <Box sx={{ display: 'flex', height: '70%', gap: 1 }}>
                        <Box sx={{ width: '30%', bgcolor: 'primary.100' }} />
                        <Box sx={{ width: '70%' }}>
                          <Box sx={{ height: '20%', bgcolor: 'grey.300', mb: 1 }} />
                          <Box sx={{ height: '20%', bgcolor: 'grey.300', mb: 1, width: '80%' }} />
                          <Box sx={{ height: '20%', bgcolor: 'grey.300', width: '60%' }} />
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" align="center">
                      Professional
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Classic, corporate-friendly design
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Paper 
                    elevation={template === 'creative' ? 4 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: template === 'creative' ? '2px solid' : '1px solid',
                      borderColor: template === 'creative' ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 3
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleTemplateSelect('creative')}
                  >
                    {template === 'creative' && (
                      <Box sx={{ 
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'secondary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}>
                        ✓
                      </Box>
                    )}
                    <Box 
                      sx={{ 
                        height: 150, 
                        bgcolor: 'grey.100', 
                        mb: 2, 
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1
                      }}
                    >
                      <Box sx={{ height: '30%', bgcolor: 'secondary.light', borderRadius: '50%', width: '30%', mx: 'auto', mb: 1 }} />
                      <Box sx={{ display: 'flex', height: '60%', gap: 1, flexDirection: 'column' }}>
                        <Box sx={{ height: '30%', bgcolor: 'grey.300', width: '80%', mx: 'auto', borderRadius: 10 }} />
                        <Box sx={{ height: '30%', display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Box sx={{ height: '100%', width: '20%', bgcolor: 'secondary.100', borderRadius: 1 }} />
                          <Box sx={{ height: '100%', width: '20%', bgcolor: 'secondary.200', borderRadius: 1 }} />
                          <Box sx={{ height: '100%', width: '20%', bgcolor: 'secondary.300', borderRadius: 1 }} />
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" align="center">
                      Creative
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Modern design for creative fields
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Paper 
                    elevation={template === 'modern' ? 4 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: template === 'modern' ? '2px solid' : '1px solid',
                      borderColor: template === 'modern' ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 3
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleTemplateSelect('modern')}
                  >
                    {template === 'modern' && (
                      <Box sx={{ 
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'info.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}>
                        ✓
                      </Box>
                    )}
                    <Box 
                      sx={{ 
                        height: 150, 
                        bgcolor: 'grey.100', 
                        mb: 2, 
                        borderRadius: 1,
                        display: 'flex',
                        p: 1
                      }}
                    >
                      <Box sx={{ width: '40%', bgcolor: 'primary.dark', mr: 1 }} />
                      <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ height: '25%', bgcolor: 'grey.300' }} />
                        <Box sx={{ height: '25%', bgcolor: 'grey.300', width: '80%' }} />
                        <Box sx={{ height: '25%', bgcolor: 'grey.300', width: '60%' }} />
                      </Box>
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" align="center">
                      Modern
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Contemporary, balanced layout
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      )}
      
      <Box sx={{ width: '100%', height: 'calc(100vh - 64px)' }}>
        <Snackbar
          open={!!message}
          autoHideDuration={3000}
          onClose={() => setMessage('')}
          message={message}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
        
        {error && (
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            {error}
          </Alert>
        )}
        
        {step === 1 && (
          <Grid container sx={{ height: '100%' }}>
            <Grid item xs={12} sx={{ p: 4 }}>
              <Paper elevation={3} sx={{ p: 4, mb: 6, borderRadius: 2 }}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    Template Selection
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Choose a template that best represents your professional style.
                  </Typography>
                  
                  <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <Paper 
                        elevation={template === 'professional' ? 4 : 1}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: template === 'professional' ? '2px solid' : '1px solid',
                          borderColor: template === 'professional' ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: 3
                          },
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onClick={() => handleTemplateSelect('professional')}
                      >
                        {template === 'professional' && (
                          <Box sx={{ 
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}>
                            ✓
                          </Box>
                        )}
                        <Box 
                          sx={{ 
                            height: 150, 
                            bgcolor: 'grey.100', 
                            mb: 2, 
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            p: 1
                          }}
                        >
                          <Box sx={{ height: '20%', bgcolor: 'grey.300', width: '70%', mx: 'auto', mb: 1 }} />
                          <Box sx={{ display: 'flex', height: '70%', gap: 1 }}>
                            <Box sx={{ width: '30%', bgcolor: 'primary.100' }} />
                            <Box sx={{ width: '70%' }}>
                              <Box sx={{ height: '20%', bgcolor: 'grey.300', mb: 1 }} />
                              <Box sx={{ height: '20%', bgcolor: 'grey.300', mb: 1, width: '80%' }} />
                              <Box sx={{ height: '20%', bgcolor: 'grey.300', width: '60%' }} />
                            </Box>
                          </Box>
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold" align="center">
                          Professional
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Classic, corporate-friendly design
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Paper 
                        elevation={template === 'creative' ? 4 : 1}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: template === 'creative' ? '2px solid' : '1px solid',
                          borderColor: template === 'creative' ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: 3
                          },
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onClick={() => handleTemplateSelect('creative')}
                      >
                        {template === 'creative' && (
                          <Box sx={{ 
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            bgcolor: 'secondary.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}>
                            ✓
                          </Box>
                        )}
                        <Box 
                          sx={{ 
                            height: 150, 
                            bgcolor: 'grey.100', 
                            mb: 2, 
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            p: 1
                          }}
                        >
                          <Box sx={{ height: '30%', bgcolor: 'secondary.light', borderRadius: '50%', width: '30%', mx: 'auto', mb: 1 }} />
                          <Box sx={{ display: 'flex', height: '60%', gap: 1, flexDirection: 'column' }}>
                            <Box sx={{ height: '30%', bgcolor: 'grey.300', width: '80%', mx: 'auto', borderRadius: 10 }} />
                            <Box sx={{ height: '30%', display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Box sx={{ height: '100%', width: '20%', bgcolor: 'secondary.100', borderRadius: 1 }} />
                              <Box sx={{ height: '100%', width: '20%', bgcolor: 'secondary.200', borderRadius: 1 }} />
                              <Box sx={{ height: '100%', width: '20%', bgcolor: 'secondary.300', borderRadius: 1 }} />
                            </Box>
                          </Box>
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold" align="center">
                          Creative
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Modern design for creative fields
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Paper 
                        elevation={template === 'modern' ? 4 : 1}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: template === 'modern' ? '2px solid' : '1px solid',
                          borderColor: template === 'modern' ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: 3
                          },
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onClick={() => handleTemplateSelect('modern')}
                      >
                        {template === 'modern' && (
                          <Box sx={{ 
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            bgcolor: 'info.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}>
                            ✓
                          </Box>
                        )}
                        <Box 
                          sx={{ 
                            height: 150, 
                            bgcolor: 'grey.100', 
                            mb: 2, 
                            borderRadius: 1,
                            display: 'flex',
                            p: 1
                          }}
                        >
                          <Box sx={{ width: '40%', bgcolor: 'primary.dark', mr: 1 }} />
                          <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ height: '25%', bgcolor: 'grey.300' }} />
                            <Box sx={{ height: '25%', bgcolor: 'grey.300', width: '80%' }} />
                            <Box sx={{ height: '25%', bgcolor: 'grey.300', width: '60%' }} />
                          </Box>
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold" align="center">
                          Modern
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Contemporary, balanced layout
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  {id === 'new' && step === 1 && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="large"
                      onClick={proceedToEditor}
                      sx={{ mt: 4, px: 4 }}
                    >
                      Continue with Selected Template
                    </Button>
                  )}
                  
                  {step === 2 && (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="medium"
                      onClick={() => setShowTemplates(false)}
                      sx={{ mt: 3 }}
                    >
                      Close Template Selection
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {step === 2 && (
          <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
            {/* Editor Section - 2/3 of width */}
            <Box sx={{ width: '66.666%', height: '100%', position: 'relative' }}>
              {editorFailed ? (
                <Box sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  bgcolor: 'background.paper'
                }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'error.light',
                    mb: 3
                  }}>
                    <CodeIcon sx={{ fontSize: 40, color: 'error.contrastText' }} />
                  </Box>
                  <Typography variant="h5" color="error" gutterBottom fontWeight="medium">
                    Editor Failed to Load
                  </Typography>
                  <Typography paragraph color="text.secondary" sx={{ maxWidth: 450, mb: 3 }}>
                    There was a problem loading the rich text editor. This could be due to network issues or browser compatibility.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.location.reload()}
                    startIcon={<CloudUploadIcon />}
                    sx={{ 
                      px: 3,
                      py: 1.2,
                      boxShadow: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    Refresh Page
                  </Button>
                </Box>
              ) : (
                <Box sx={{ height: '100%', position: 'relative' }}>
                  <Editor
                    apiKey="w9wb2nr9fpk741lb6kzvabnhlzj7aimkgqbt1jdvnwi9qgky"
                    init={{
                      height: '100%',
                      menubar: true,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                      ],
                      toolbar: 'undo redo | formatselect | ' +
                        'bold italic backcolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                      content_style: `
                        body { 
                          font-family: Helvetica, Arial, sans-serif; 
                          font-size: 14px; 
                          padding: 20px; 
                          min-height: calc(100vh - 160px);
                          max-width: 800px;
                          margin: 0 auto;
                        }
                        h1, h2, h3 { margin-top: 1em; margin-bottom: 0.5em; }
                        p { margin: 0.5em 0; }
                        ul, ol { margin: 0.5em 0; padding-left: 2em; }
                      `,
                      skin: 'oxide',
                      resize: false,
                      branding: false,
                      statusbar: true,
                      relative_urls: false,
                      remove_script_host: false,
                      convert_urls: false,
                      setup: function(editor) {
                        editor.on('init', function() {
                          // Make the editor container take the full height
                          const container = editor.getContainer();
                          container.style.display = 'flex';
                          container.style.flexDirection = 'column';
                          container.style.height = '100%';
                          
                          // Ensure the editable area fills the remaining space
                          const editorArea = editor.getContentAreaContainer();
                          editorArea.style.flex = '1';
                        });
                      }
                    }}
                    initialValue={content}
                    onInit={handleInit}
                    onEditorChange={(content) => {
                      setContent(content);
                    }}
                    onLoadError={handleEditorLoadError}
                  />
                </Box>
              )}
            </Box>

            {/* AI Tools and Controls - 1/3 of width */}
            <Box 
              sx={{ 
                width: '33.333%', 
                height: '100%',
                bgcolor: 'background.paper',
                borderLeft: '1px solid',
                borderColor: 'divider',
                overflow: 'auto'
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SmartToyIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Resume Tools
                </Typography>

                <TextField
                  fullWidth
                  label="Resume Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  margin="normal"
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Job Title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  margin="normal"
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Target Company"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  margin="normal"
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Target Industry"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  margin="normal"
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CategoryIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Resume Analysis
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Card variant="outlined" sx={{ 
                      height: '100%',
                      transition: 'all 0.3s',
                      '&:hover': { boxShadow: 2 }
                    }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          ATS Score
                        </Typography>
                        {atsScore ? (
                          <>
                            <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                              {atsScore}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={atsScore} 
                              sx={{ mt: 1, height: 6, borderRadius: 3 }} 
                              color={atsScore > 70 ? "success" : atsScore > 40 ? "warning" : "error"}
                            />
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                            Not analyzed
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined" sx={{ 
                      height: '100%',
                      transition: 'all 0.3s',
                      '&:hover': { boxShadow: 2 }
                    }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Grammar Score
                        </Typography>
                        {grammarScore ? (
                          <>
                            <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                              {grammarScore}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={grammarScore} 
                              sx={{ mt: 1, height: 6, borderRadius: 3 }} 
                              color={grammarScore > 70 ? "success" : grammarScore > 40 ? "warning" : "error"}
                            />
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                            Not analyzed
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  onClick={analyzeATS}
                  disabled={isAnalyzingATS}
                  sx={{ 
                    mb: 2,
                    py: 1.2,
                    borderWidth: '2px',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderWidth: '2px',
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {isAnalyzingATS ? (
                    <>
                      <CircularProgress size={20} color="primary" sx={{ mr: 1 }} />
                      Analyzing...
                    </>
                  ) : 'Analyze ATS Score'}
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SpellcheckIcon />}
                  onClick={checkGrammar}
                  disabled={isCheckingGrammar}
                  sx={{ 
                    mb: 2,
                    py: 1.2,
                    borderWidth: '2px',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderWidth: '2px',
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {isCheckingGrammar ? (
                    <>
                      <CircularProgress size={20} color="primary" sx={{ mr: 1 }} />
                      Checking...
                    </>
                  ) : 'Check Grammar'}
                </Button>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  AI Resume Generator
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<SmartToyIcon />}
                  onClick={generateAIResume}
                  disabled={isGeneratingAI}
                  sx={{ 
                    py: 1.5,
                    background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0, #7b1fa2)',
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    },
                    '&:active': {
                      transform: 'translateY(1px)',
                      boxShadow: 1
                    }
                  }}
                >
                  {isGeneratingAI ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                      Generating...
                    </>
                  ) : (
                    'Generate AI Resume'
                  )}
                </Button>

                <Box sx={{ mt: 4 }} />

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Actions
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveResume}
                  disabled={saving}
                  color="primary"
                  sx={{ 
                    mb: 2,
                    py: 1.2,
                    boxShadow: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    },
                    '&:active': {
                      transform: 'translateY(1px)',
                      boxShadow: 1
                    }
                  }}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Saving...
                    </>
                  ) : 'Save Resume'}
                </Button>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadDocument}
                    >
                      Download
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ShareIcon />}
                      onClick={handleShareViaEmail}
                    >
                      Share
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ResumeEditor;