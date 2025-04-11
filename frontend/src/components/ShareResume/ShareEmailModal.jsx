import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Alert,
  Box,
  InputAdornment,
  CircularProgress,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import SubjectIcon from '@mui/icons-material/Subject';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';

const ShareEmailModal = ({ open, onClose, resumeId, resumeTitle, template = 'professional' }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState(`Resume: ${resumeTitle || 'My Resume'}`);
  const [message, setMessage] = useState(`Hello,\n\nI'm pleased to share my resume with you.\n\nBest regards,`);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipientEmail) {
      setError('Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get the resume content from the parent component or API
      // This step ensures we capture the most up-to-date content
      let resumeContent = '';
      try {
        const response = await axios.get(`/api/resume/${resumeId}`);
        resumeContent = response.data.resume.content;
      } catch (contentError) {
        console.warn('Could not fetch latest content, using stored content:', contentError);
      }
      
      // Clean up content to ensure it works well with document conversion
      // 1. Remove any <style> tags that might be causing issues
      let cleanedContent = resumeContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // 2. Remove any CSS comments
      cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // 3. Ensure consistent font sizing by applying directly to elements
      cleanedContent = cleanedContent.replace(/<([a-z][a-z0-9]*)[^>]*>/gi, (match, tag) => {
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'li', 'td'].includes(tag.toLowerCase())) {
          // If tag doesn't have a style attribute, add one
          if (!match.includes('style=')) {
            return match.replace(/>$/, ' style="font-size: 14px;">');
          }
          // If tag has a style attribute but no font-size, add font-size
          else if (!match.includes('font-size:')) {
            return match.replace(/style="([^"]*)"/i, 'style="$1; font-size: 14px;"');
          }
          // If tag has a style attribute with font-size, normalize it
          else {
            return match.replace(/font-size:\s*\d+px/i, 'font-size: 14px');
          }
        }
        return match;
      });

      const response = await axios.post('/api/share/email', {
        resumeId,
        recipientEmail,
        subject,
        message,
        documentFormat: 'docx', // Always use docx format
        template, // Pass the template to the API
        content: cleanedContent, // Send the cleaned content
        options: {
          fontSize: 14, // Ensure consistent font size of 14pt
          preserveTemplate: true, // Ensure template formatting is preserved
          fontFamily: 'Arial', // Consistent font family
          lineHeight: 1.5, // Proper line spacing for readability
          convertTablesToStyles: true, // For modern template with tables
          normalizeAllFontSizes: true // Explicitly request font size normalization
        }
      });

      if (response.data.success) {
        setSuccess(response.data.mockMode 
          ? 'Email sharing simulation successful. In production, the email would be sent.' 
          : 'Resume shared successfully via email!');
        
        // Reset form after successful submission
        setTimeout(() => {
          setRecipientEmail('');
          setSubject(`Resume: ${resumeTitle || 'My Resume'}`);
          setMessage(`Hello,\n\nI'm pleased to share my resume with you.\n\nBest regards,`);
          onClose();
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to share resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          <Typography variant="h6">
            Share Resume via Email
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          
          <IconButton 
            size="small"
            onClick={onClose} 
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="recipientEmail"
            label="Recipient Email"
            name="recipientEmail"
            autoComplete="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            fullWidth
            id="subject"
            label="Subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SubjectIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            fullWidth
            multiline
            rows={4}
            id="message"
            label="Message"
            name="message"
            placeholder="Add a personal message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <Paper 
            variant="outlined" 
            sx={{ 
              mt: 2, 
              mb: 2, 
              p: 2, 
              bgcolor: 'info.50', 
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon color="info" fontSize="small" />
              <Typography variant="subtitle2" color="info.main">
                Document Format
              </Typography>
            </Box>
            <Typography variant="body2" color="info.dark" sx={{ ml: 3 }}>
              Your resume will be sent as a .docx file with consistent 14pt font size in the {template} template format.
            </Typography>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ px: 3 }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          sx={{ 
            px: 3,
            bgcolor: 'primary.main',
            transition: 'all 0.3s',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'translateY(-2px)'
            }
          }}
        >
          {isLoading ? 'Sending...' : 'Send Resume'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareEmailModal;