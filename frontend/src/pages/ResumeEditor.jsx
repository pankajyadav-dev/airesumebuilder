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
      
      // Create a simple template HTML since getTemplateHtml is not available
      const getBasicTemplate = (template, userData) => {
        const name = userData?.name || 'Your Name';
        const email = userData?.email || 'your.email@example.com';
        
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
      };
      
      setContent(getBasicTemplate(template, userData));
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
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 6 }}>
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
          <Tooltip title="Toggle HTML Mode">
            <IconButton 
              onClick={toggleHtmlMode} 
              color={htmlMode ? 'primary' : 'default'}
              sx={{
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'rotate(20deg)'
                }
              }}
            >
              <CodeIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Snackbar
          open={!!message}
          autoHideDuration={3000}
          onClose={() => setMessage('')}
          message={message}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Resume Details
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Target Position Information
              </Typography>
              
              <TextField
                fullWidth
                label="Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WorkIcon />
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CategoryIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<SmartToyIcon />}
                onClick={generateAIResume}
                disabled={isGeneratingAI}
                sx={{ 
                  mt: 3,
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
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle2" gutterBottom>
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
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4, mb: 6, borderRadius: 2 }}>
              {/* Template Selection */}
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Template Selection
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Choose a template that best represents your professional style.
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {/* Professional Template */}
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
                        }
                      }}
                      onClick={() => handleTemplateSelect('professional')}
                    >
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
                  
                  {/* Creative Template */}
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
                        }
                      }}
                      onClick={() => handleTemplateSelect('creative')}
                    >
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
                  
                  {/* Modern Template */}
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
                        }
                      }}
                      onClick={() => handleTemplateSelect('modern')}
                    >
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
              </Box>
            </Paper>
            
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              {editorFailed ? (
                <Box sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  bgcolor: 'background.paper',
                  borderRadius: 2
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
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ px: 1, display: 'flex', alignItems: 'center' }}>
                    <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Resume Content
                    {htmlMode && (
                      <Chip 
                        label="HTML Mode" 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Typography>
                  <Box sx={{ 
                    height: '800px', 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mt: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    } 
                  }}>
                    {htmlMode ? (
                      <TextField
                        fullWidth
                        multiline
                        variant="outlined"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        sx={{ height: '100%' }}
                        InputProps={{
                          sx: { 
                            height: '100%', 
                            fontFamily: 'monospace', 
                            fontSize: '0.9rem',
                            '& .MuiOutlinedInput-input': { 
                              height: '100%', 
                              overflow: 'auto',
                              padding: 2
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none'
                            }
                          }
                        }}
                      />
                    ) : (
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
                          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; padding: 20px; }',
                          skin: 'oxide',
                          resize: false,
                          branding: false,
                          statusbar: true
                        }}
                        initialValue={content}
                        onInit={handleInit}
                        onEditorChange={(content) => {
                          setContent(content);
                        }}
                        onLoadError={handleEditorLoadError}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default ResumeEditor;