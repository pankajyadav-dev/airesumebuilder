import { useState } from 'react';
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
  Paper
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
  const [message, setMessage] = useState('');
  // Always use DOCX format, no dropdown needed
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/share/email', {
        resumeId,
        recipientEmail,
        subject,
        message,
        documentFormat: 'docx', // Always use docx format
        template // Pass the template to the API
      });

      if (response.data.success) {
        setSuccess(response.data.mockMode 
          ? 'Email sharing simulation successful. In production, the email would be sent.' 
          : 'Resume shared successfully via email!');
        
        // Reset form after successful submission
        setTimeout(() => {
          setRecipientEmail('');
          setSubject(`Resume: ${resumeTitle || 'My Resume'}`);
          setMessage('');
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
          borderRadius: 3,
          boxShadow: 10,
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography 
          variant="h5" 
          component="div" 
          fontWeight="bold"
          sx={{ 
            background: 'linear-gradient(90deg, #1976d2, #9c27b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Share Resume via Email
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose} 
          aria-label="close"
          sx={{ 
            transition: 'transform 0.2s',
            '&:hover': { 
              transform: 'rotate(90deg)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, animation: 'pulse 2s ease-in-out' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, animation: 'pulse 2s ease-in-out' }}>
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
            placeholder="Add a personal message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <Paper 
            variant="outlined" 
            sx={{ 
              mt: 2, 
              mb: 2, 
              p: 2, 
              bgcolor: 'primary.50', 
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <DescriptionIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="primary.main">
              Your resume will be shared as a Word document (.docx)
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
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          sx={{ 
            px: 3,
            background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-2px)'
            }
          }}
        >
          {isLoading ? 'Sending...' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareEmailModal;