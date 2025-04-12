import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import InfoIcon from '@mui/icons-material/Info';

function ResumeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editorRef = useRef(null);
  const resizeRef = useRef(null);
  const [additionalInstruction, setAdditionalInstruction] = useState('');
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
  const [editorWidth, setEditorWidth] = useState(75);
  const [isResizing, setIsResizing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(id === 'new');
  const [step, setStep] = useState(id === 'new' ? 1 : 2);
  const [editorFailed, setEditorFailed] = useState(false);
  const [showShareEmailModal, setShowShareEmailModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAnalyzingATS, setIsAnalyzingATS] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [templateChanged, setTemplateChanged] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const contentTimeoutRef = useRef(null);

const handleEditorChange = useCallback((newContent) => {
  if (isStreaming) return;

  if (contentTimeoutRef.current) {
    clearTimeout(contentTimeoutRef.current);
  }

  contentTimeoutRef.current = setTimeout(() => {
    setContent(newContent);
    contentTimeoutRef.current = null;
  }, 10000);
}, [isStreaming]);

useEffect(() => {
  return () => {
    if (contentTimeoutRef.current) {
      clearTimeout(contentTimeoutRef.current);
    }
  };
}, []);

  const handleInit = (evt, editor) => {
    editorRef.current = editor;
    if (content) {
      editor.setContent(content);
    }
    editor.on('blur', () => {
      if (editor.getContent() !== content) {
        setContent(editor.getContent());
      }
    });
  };

  useEffect(() => {
    if (editorRef.current && content && (templateChanged || !isStreaming)) {
      editorRef.current.setContent(content);
      setTemplateChanged(false);
    }
  }, [content, templateChanged, isStreaming]);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchResume();
    } else if (id === 'new' && step === 2) {
      const userData = user ? {
        name: user.name,
        email: user.email,
      } : {};
      setContent(getBasicTemplate(template, userData));
    }
  }, [id, step, template, user]);

  useEffect(() => {
    if (content && step === 2 && template) {
      if (id !== 'new' && !templateChanged) {
        return;
      }
      let userData = { name: user?.name || 'Your Name', email: user?.email || 'your.email@example.com' };
      try {
        const nameMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (nameMatch && nameMatch[1] && !nameMatch[1].includes('${name}')) {
          userData.name = nameMatch[1].trim();
        }
        const emailMatch = content.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
        if (emailMatch && emailMatch[1]) {
          userData.email = emailMatch[1].trim();
        }
      } catch (err) {
        console.log('Error extracting user data from content:', err);
      }
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

  const streamContent = (fullContent) => {
    setIsStreaming(true);
    let accumulatedContent = '';
    const chars = fullContent.split('');
    let currentIndex = 0;
  
    const interval = setInterval(() => {
      if (currentIndex < chars.length) {
        accumulatedContent += chars[currentIndex];
        if (editorRef.current) {
          editorRef.current.setContent(accumulatedContent);
        }
        currentIndex++;
      } else {
        clearInterval(interval);
        setContent(fullContent);
        setIsStreaming(false);
        setMessage('AI-generated resume created!');
        setTimeout(() => setMessage(''), 30);
      }
    }, 10);
  };

  const generateAIResume = async () => {
    try {
      setIsGeneratingAI(true);
      setError('');
      if (!jobTitle) {
        setError('Please enter a job title to generate an AI resume');
        setIsGeneratingAI(false);
        return;
      }
      let latestContent = content;
      if (editorRef.current) {
        latestContent = editorRef.current.getContent();
        setContent(latestContent);
      }
      try {
        const response = await axios.post('/api/ai/generate-resume', {
          jobTitle,
          targetCompany,
          targetIndustry,
          template,
          currentContent: latestContent,
          additionalInstruction
        });
        streamContent(response.data.content);
      } catch (apiError) {
        console.error('API Error:', apiError);
        if (apiError.response?.status === 400 && 
            apiError.response?.data?.message?.includes('profile data')) {
          console.log('Generating fallback resume template');
          const userData = { name: user?.name || 'Your Name', email: user?.email || 'your.email@example.com' };
          const fallbackContent = getBasicTemplate(template, userData);
          streamContent(fallbackContent);
          setMessage('Resume template created! Please update your profile for better AI generation.');
          setTimeout(() => setMessage(''), 5000);
        } else {
          throw apiError;
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
      return;
    }
    console.log('Selected template:', templateId);
    setTemplate(templateId);
    setTemplateChanged(true);
    if (step === 2) {
      let userData = { name: user?.name || 'Your Name', email: user?.email || 'your.email@example.com' };
      try {
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
      const newContent = getBasicTemplate(templateId, userData);
      setContent(newContent);
      if (editorRef.current) {
        editorRef.current.setContent(newContent);
        editorRef.current.dispatch('TemplateChange', { template: templateId });
      }
      setMessage(`Template changed to ${templateId.charAt(0).toUpperCase() + templateId.slice(1)}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const proceedToEditor = () => {
    setStep(2);
    setShowTemplates(false);
  };

  const handleEditorLoadError = () => {
    console.log('TinyMCE editor failed to load, falling back to textarea');
    setEditorFailed(true);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (editorRef.current === null) {
        handleEditorLoadError();
      }
    }, 5000);
    return () => clearTimeout(timeoutId);
  }, []);

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
      return `<div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; padding: 0;">
        <table style="width: 100%; border-collapse: collapse; border: none;">
          <tr>
            <td style="width: 30%; background-color: #1976d2; color: white; padding: 30px; vertical-align: top;">
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
            </td>
            <td style="width: 70%; padding: 30px; vertical-align: top;">
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
            </td>
          </tr>
        </table>
      </div>`;
    } else {
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
    let latestContent = content;
    if (editorRef.current) {
      latestContent = editorRef.current.getContent();
      setContent(latestContent);
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
      setMessage('Generating document...');
      let latestContent = content;
      if (editorRef.current) {
        latestContent = editorRef.current.getContent();
        setContent(latestContent);
      }
      let cleanedContent = latestContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
      cleanedContent = cleanedContent.replace(/<([a-z][a-z0-9]*)[^>]*>/gi, (match, tag) => {
        const textElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'li', 'td', 'th', 'a', 'strong', 'em', 'b', 'i', 'u', 'label', 'small'];
        if (textElements.includes(tag.toLowerCase())) {
          if (!match.includes('style=')) {
            return match.replace(/>$/, ' style="font-size: 14px;">');
          } else if (!match.includes('font-size:')) {
            return match.replace(/style="([^"]*)"/i, 'style="$1; font-size: 14px;"');
          } else {
            return match.replace(/font-size:\s*\d+(\.\d+)?(px|pt|em|rem|%)/gi, 'font-size: 14px');
          }
        }
        if (tag.toLowerCase() === 'h1') {
          return match.replace(/font-size:[^;"}]*/gi, 'font-size: 18px').replace(/>$/, ' style="font-size: 18px;">');
        } else if (tag.toLowerCase() === 'h2') {
          return match.replace(/font-size:[^;"}]*/gi, 'font-size: 16px').replace(/>$/, ' style="font-size: 16px;">');
        }
        return match;
      });
      const response = await axios({
        method: 'post',
        url: `/api/resume/${id}/export`,
        data: {
          content: cleanedContent,
          template: template,
          format: 'docx',
          title: title,
          options: {
            fontSize: 14,
            preserveTemplate: true,
            fontFamily: 'Arial',
            lineHeight: 1.5,
            convertTablesToStyles: true
          }
        },
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      });
      setMessage('');
      if (!response.data || response.data.size === 0) {
        throw new Error('No document data received');
      }
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title || 'Resume'}_${template}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage(`Resume downloaded successfully with ${template.charAt(0).toUpperCase() + template.slice(1)} template!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error downloading Word document:', err);
      let errorMessage = 'Failed to download document. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResize = (e) => {
    if (isResizing) {
      const containerWidth = document.getElementById('editor-container').offsetWidth;
      const newEditorWidth = (e.clientX / containerWidth) * 100;
      if (newEditorWidth >= 30 && newEditorWidth <= 85) {
        setEditorWidth(newEditorWidth);
      }
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
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
    <Box sx={{ 
      bgcolor: isResizing ? 'rgba(25, 118, 210, 0.02)' : 'background.default', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      transition: isResizing ? 'none' : 'background-color 0.3s'
    }}>
      {isResizing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'transparent',
            zIndex: 9999,
            pointerEvents: 'none',
            '::after': {
              content: '""',
              position: 'absolute',
              left: `${editorWidth}%`,
              top: 0,
              width: '1px',
              height: '100%',
              bgcolor: 'primary.main',
              boxShadow: '0 0 8px rgba(25, 118, 210, 0.6)'
            }
          }}
        />
      )}
      <ShareEmailModal 
        open={showShareEmailModal} 
        onClose={() => setShowShareEmailModal(false)} 
        resumeId={id} 
        resumeTitle={title}
        template={template} 
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Chip
              icon={<DesignServicesIcon />}
              label={`${template.charAt(0).toUpperCase() + template.slice(1)} Template`}
              size="small"
              color={
                template === 'professional' ? 'default' : 
                template === 'creative' ? 'secondary' : 
                'primary'
              }
              sx={{ mr: 2 }}
            />
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveResume}
            disabled={saving}
            sx={{ 
              mx: 1,
              px: 2,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-2px)'
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
              borderWidth: '2px',
              transition: 'all 0.3s',
              '&:hover': {
                borderWidth: '2px',
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShareViaEmail}
            sx={{ 
              mx: 1,
              px: 2,
              borderWidth: '2px',
              transition: 'all 0.3s',
              '&:hover': {
                borderWidth: '2px',
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Share
          </Button>
        </Toolbar>
      </AppBar>
      
      {step === 2 && (
        <Paper 
          elevation={2} 
          sx={{ 
            mb: 0, 
            borderRadius: 0,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0
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
              <Box sx={{ mt: 3, mb: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <DesignServicesIcon fontSize="small" />
                  Choose Template Style
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select a template that matches your desired style and industry
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Paper
                    elevation={template === 'professional' ? 8 : 1}
                    onClick={() => handleTemplateSelect('professional')}
                    sx={{
                      flex: 1,
                      p: 1,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.3s',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: template === 'professional' ? '2px solid #1e88e5' : '2px solid transparent',
                      transform: template === 'professional' ? 'translateY(-4px)' : 'none',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    {template === 'professional' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bgcolor: '#1e88e5',
                          color: 'white',
                          p: 0.5,
                          px: 1,
                          borderBottomLeftRadius: 8,
                          zIndex: 1,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        SELECTED
                      </Box>
                    )}
                    <Box sx={{ height: 100, overflow: 'hidden', mb: 1, borderRadius: 1 }}>
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        background: 'linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '10px',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{ height: '20%', backgroundColor: '#1e3a8a', borderRadius: '2px', marginBottom: '6px' }}></div>
                        <div style={{ display: 'flex', gap: '6px', height: '10%' }}>
                          <div style={{ flex: 1, backgroundColor: '#bbdefb', borderRadius: '2px' }}></div>
                          <div style={{ flex: 1, backgroundColor: '#bbdefb', borderRadius: '2px' }}></div>
                        </div>
                        <div style={{ marginTop: '6px', height: '8%', backgroundColor: '#e0e0e0', borderRadius: '2px' }}></div>
                        <div style={{ marginTop: '6px', height: '8%', backgroundColor: '#e0e0e0', borderRadius: '2px' }}></div>
                        <div style={{ marginTop: '6px', height: '8%', backgroundColor: '#e0e0e0', borderRadius: '2px' }}></div>
                      </div>
                    </Box>
                    <Typography align="center" fontWeight={600} sx={{ mb: 0.5 }}>
                      Professional
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                      Traditional, clean layout ideal for corporate roles
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={template === 'creative' ? 8 : 1}
                    onClick={() => handleTemplateSelect('creative')}
                    sx={{
                      flex: 1,
                      p: 1,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.3s',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: template === 'creative' ? '2px solid #9c27b0' : '2px solid transparent',
                      transform: template === 'creative' ? 'translateY(-4px)' : 'none',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    {template === 'creative' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bgcolor: '#9c27b0',
                          color: 'white',
                          p: 0.5,
                          px: 1,
                          borderBottomLeftRadius: 8,
                          zIndex: 1,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        SELECTED
                      </Box>
                    )}
                    <Box sx={{ height: 100, overflow: 'hidden', mb: 1, borderRadius: 1 }}>
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        background: 'linear-gradient(180deg, #f8f0fc 0%, #f3e5f5 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '10px',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#9c27b0', marginBottom: '6px' }}></div>
                        <div style={{ height: '12%', width: '60%', backgroundColor: '#ce93d8', borderRadius: '2px', marginBottom: '6px' }}></div>
                        <div style={{ height: '8%', width: '80%', backgroundColor: '#e1bee7', borderRadius: '2px', marginBottom: '10px' }}></div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <div style={{ height: '10px', width: '30px', backgroundColor: '#f3e5f5', borderRadius: '10px' }}></div>
                          <div style={{ height: '10px', width: '40px', backgroundColor: '#f3e5f5', borderRadius: '10px' }}></div>
                          <div style={{ height: '10px', width: '35px', backgroundColor: '#f3e5f5', borderRadius: '10px' }}></div>
                        </div>
                      </div>
                    </Box>
                    <Typography align="center" fontWeight={600} sx={{ mb: 0.5 }}>
                      Creative
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                      Modern design for creative and design roles
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={template === 'modern' ? 8 : 1}
                    onClick={() => handleTemplateSelect('modern')}
                    sx={{
                      flex: 1,
                      p: 1,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.3s',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: template === 'modern' ? '2px solid #1976d2' : '2px solid transparent',
                      transform: template === 'modern' ? 'translateY(-4px)' : 'none',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    {template === 'modern' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bgcolor: '#1976d2',
                          color: 'white',
                          p: 0.5,
                          px: 1,
                          borderBottomLeftRadius: 8,
                          zIndex: 1,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        SELECTED
                      </Box>
                    )}
                    <Box sx={{ height: 100, overflow: 'hidden', mb: 1, borderRadius: 1 }}>
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex',
                        padding: '0',
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                      }}>
                        <div style={{ width: '30%', height: '100%', backgroundColor: '#1976d2', padding: '6px' }}>
                          <div style={{ height: '10%', width: '80%', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '2px', marginBottom: '6px' }}></div>
                          <div style={{ height: '8%', width: '90%', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '2px', marginBottom: '6px' }}></div>
                          <div style={{ height: '8%', width: '70%', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '2px' }}></div>
                        </div>
                        <div style={{ width: '70%', height: '100%', padding: '6px', backgroundColor: '#f5f5f5' }}>
                          <div style={{ height: '12%', width: '80%', backgroundColor: '#bbdefb', borderRadius: '2px', marginBottom: '6px' }}></div>
                          <div style={{ height: '8%', width: '90%', backgroundColor: '#e1f5fe', borderRadius: '2px', marginBottom: '6px' }}></div>
                          <div style={{ height: '8%', width: '60%', backgroundColor: '#e1f5fe', borderRadius: '2px' }}></div>
                        </div>
                      </div>
                    </Box>
                    <Typography align="center" fontWeight={600} sx={{ mb: 0.5 }}>
                      Modern
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                      Two-column layout with sidebar for technical roles
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}
      
      <Box sx={{ 
        width: '100%', 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
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
          <Grid container sx={{ height: '100%', overflow: 'auto' }}>
            <Grid item xs={12} sx={{ p: 4 }}>
              <Paper elevation={3} sx={{ p: 4, mb: 6, borderRadius: 2 }}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    Template Selection
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Choose a template that best represents your professional style.
                  </Typography>
                  
                  <Grid container spacing={4} sx={{ mt: 2 }}>
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
          <Box 
            id="editor-container"
            sx={{ 
              display: 'flex', 
              flex: 1,
              position: 'relative'
            }}
          >
            <Box sx={{ 
              width: `${editorWidth}%`, 
              position: 'relative'
            }}>
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
                <Box sx={{ 
                  height: '100%', 
                  position: 'relative',
                  transition: isStreaming ? 'all 0.2s ease-in-out' : 'none',
                  border: isStreaming ? '2px solid' : 'none',
                  borderColor: isStreaming ? 'primary.main' : 'transparent',
                  borderRadius: isStreaming ? 2 : 0,
                  boxShadow: isStreaming ? '0 0 10px rgba(25, 118, 210, 0.3)' : 'none'
                }}>
                  <Editor
                    apiKey="w9wb2nr9fpk741lb6kzvabnhlzj7aimkgqbt1jdvnwi9qgky"
                    init={{
                      min_height: 500,
                      height: 'auto',
                      menubar: true,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'wordcount'
                      ],
                      toolbar: 'undo redo | formatselect | ' +
                        'bold italic backcolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                      content_style: `
                        body {
                          font-family: Arial, sans-serif;
                          margin: 2px;
                          max-width: 1200px;
                          padding: 20px 30px;
                          min-height: 500px;
                          max-height: calc(100vh - 180px);
                          overflow-y: auto;
                          background-color: white;
                          box-shadow: 0 0 15px rgba(0,0,0,0.05);
                          border-radius: 8px;
                          transition: opacity 0.3s ease-in-out;
                        }
                        .streaming {
                          animation: fadeIn 0.5s ease-in-out;
                        }
                        @keyframes fadeIn {
                          from { opacity: 0.7; transform: translateY(5px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                        h1, h2, h3, h4, h5, h6 {
                          margin-top: 1.5em;
                          margin-bottom: 0.5em;
                          color: #1976d2;
                          font-weight: 600;
                        }
                        h1 { font-size: 28px; margin-top: 0; text-align: center; }
                        h2 { font-size: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px; }
                        h3 { font-size: 18px; }
                        p { margin: 0.5em 0; line-height: 1.6; }
                        ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
                        li { margin-bottom: 0.5em; }
                        .template-modern table { width: 100%; border-collapse: collapse; }
                        .template-modern td:first-child { background-color: #1976d2; color: white; width: 30%; vertical-align: top; padding: 15px; }
                        .template-modern td:last-child { width: 70%; vertical-align: top; padding: 15px; }
                        .template-creative .skill-tag { background-color: #f3e5f5; color: #9c27b0; padding: 4px 8px; border-radius: 10px; display: inline-block; margin: 3px; }
                      `,
                      setup: function(editor) {
                        editor.on('init', function() {
                          const container = editor.getContainer();
                          container.style.display = 'flex';
                          container.style.flexDirection = 'column';
                          container.style.borderRadius = '8px';
                          container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                          container.style.marginBottom = '20px';
                          container.style.height = 'calc(100vh - 120px)';
                          container.style.maxHeight = 'calc(100vh - 120px)';
                          container.style.overflow = 'hidden';
                          const editorIframe = editor.getContentAreaContainer().querySelector('iframe');
                          if (editorIframe) {
                            editorIframe.style.backgroundColor = '#ffffff';
                            editorIframe.style.minHeight = '500px';
                            editorIframe.style.maxHeight = 'calc(100vh - 230px)';
                          }
                          if (template) {
                            const body = editor.getBody();
                            body.classList.add(`template-${template}`);
                          }
                        });
                        editor.on('NodeChange SetContent KeyUp', function() {
                          const doc = editor.getDoc();
                          const body = doc.body;
                          body.style.maxHeight = 'calc(100vh - 230px)';
                          body.style.overflowY = 'auto';
                          const minHeight = 500;
                          const maxHeight = window.innerHeight - 230;
                          const iframe = editor.getContentAreaContainer().querySelector('iframe');
                          if (iframe) {
                            iframe.style.height = `${Math.min(Math.max(body.scrollHeight, minHeight), maxHeight)}px`;
                          }
                        });
                        editor.on('TemplateChange', function(e) {
                          const body = editor.getBody();
                          body.classList.remove('template-professional', 'template-creative', 'template-modern');
                          body.classList.add(`template-${e.template}`);
                        });
                      }
                    }}
                    initialValue={content}
                    onInit={handleInit}
                    onEditorChange={handleEditorChange}
                    // onEditorChange={(content) => {
                    //   if (!isStreaming) {
                    //     setContent(content);
                    //   }
                    // }}
                    onLoadError={handleEditorLoadError}
                  />
                  {isStreaming && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)', opacity: 0.8 },
                          '50%': { transform: 'scale(1.05)', opacity: 1 },
                          '100%': { transform: 'scale(1)', opacity: 0.8 },
                        },
                      }}
                    >
                      <SmartToyIcon fontSize="small" />
                      <Typography variant="caption" fontWeight="bold">
                        Generating...
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Box
              ref={resizeRef}
              sx={{
                width: '8px',
                backgroundColor: isResizing ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
                cursor: 'col-resize',
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                },
                '&:active': {
                  backgroundColor: 'rgba(25, 118, 210, 0.2)',
                },
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              onMouseDown={handleResizeStart}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: '4px',
                  height: '36px',
                  bgcolor: isResizing ? 'primary.main' : '#bdbdbd',
                  borderRadius: '2px',
                  transition: 'background-color 0.2s',
                  '&::before, &::after': {
                    content: '""',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '1px',
                    height: '36px',
                    bgcolor: isResizing ? 'primary.light' : '#e0e0e0'
                  },
                  '&::before': {
                    left: 'calc(50% - 2px)',
                  },
                  '&::after': {
                    left: 'calc(50% + 2px)',
                  }
                }}
              />
            </Box>

            <Box 
              sx={{ 
                width: `${100 - editorWidth}%`, 
                bgcolor: 'background.paper',
                borderLeft: '1px solid',
                borderColor: 'divider',
                boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 180px)',
                maxHeight: 'calc(100vh - 180px)',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  p: 3,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(to right, #fafafa, #f5f5f5)',
                }}
              >
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    fontSize: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <span role="img" aria-label="AI" style={{ fontSize: '1.6rem' }}>🤖</span>
                  AI Resume Tools
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enhance your resume with our powerful AI features
                </Typography>
              </Box>
              
              <Box sx={{ 
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                overflowY: 'auto',
                height: '100%'
              }}>
                <TextField
                  fullWidth
                  label="Resume Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />

                <TextField
                  fullWidth
                  label="Job Title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />

                <TextField
                  fullWidth
                  label="Target Company"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />

                <TextField
                  fullWidth
                  label="Target Industry"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CategoryIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />

                <Divider sx={{ my: 1 }} />
                <TextField
                  fullWidth
                  label="Additional Instructions"
                  value={additionalInstruction}
                  onChange={(e) => setAdditionalInstruction(e.target.value)}
                  size="small"
                  variant="outlined"
                  multiline
                  rows={3}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <InfoIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                  placeholder="E.g., Emphasize leadership skills, include specific certifications, or focus on technical expertise"
                />

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  AI Resume Generator
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<SmartToyIcon />}
                  onClick={generateAIResume}
                  disabled={isGeneratingAI || isStreaming}
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
                  {isGeneratingAI || isStreaming? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Generating...
                    </>
                  ) : (
                    'Generate AI Resume'
                  )}
                </Button>

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Resume Analysis Tools
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  color="info"
                  startIcon={<SpellcheckIcon />}
                  onClick={checkGrammar}
                  disabled={isCheckingGrammar || !id || id === 'new'}
                  sx={{ 
                    py: 1.5,
                    background: 'linear-gradient(45deg, #0288d1, #4fc3f7)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #0277bd, #29b6f6)',
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {isCheckingGrammar ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Checking Grammar...
                    </>
                  ) : (
                    `Check Grammar${grammarScore ? ` (${grammarScore}%)` : ''}`
                  )}
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<AssessmentIcon />}
                  onClick={analyzeATS}
                  disabled={isAnalyzingATS || !id || id === 'new'}
                  sx={{ 
                    py: 1.5,
                    background: 'linear-gradient(45deg, #388e3c, #66bb6a)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {isAnalyzingATS ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Analyzing ATS...
                    </>
                  ) : (
                    `Analyze ATS${atsScore ? ` (${atsScore}%)` : ''}`
                  )}
                </Button>

                {(grammarScore || atsScore) && (
                  <Card sx={{ mt: 2, bgcolor: 'grey.50', boxShadow: 1 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Analysis Summary
                      </Typography>
                      {grammarScore && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <SpellcheckIcon color="info" sx={{ mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">
                            Grammar Score: <strong>{grammarScore}%</strong>
                          </Typography>
                        </Box>
                      )}
                      {atsScore && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AssessmentIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">
                            ATS Score: <strong>{atsScore}%</strong>
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ResumeEditor;