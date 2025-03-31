import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  AlertTitle, 
  IconButton, 
  Box, 
  Collapse, 
  Typography 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

function ApiErrorBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in the banner after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for the animation to complete before removing from DOM
    setTimeout(() => {
      setDismissed(true);
    }, 300);
  };

  if (dismissed) {
    return null;
  }

  return (
    <Collapse in={isVisible} timeout={300}>
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 9999,
        boxShadow: 3,
      }}>
        <Alert 
          severity="error" 
          variant="filled"
          icon={<ErrorOutlineIcon />}
          sx={{ 
            borderRadius: 0,
            background: 'linear-gradient(90deg, #d32f2f, #c2185b)',
            py: 1
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismiss}
              sx={{ 
                ml: 2,
                '&:hover': {
                  transform: 'scale(1.1)',
                  transition: 'transform 0.2s'
                }
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            Connection Error
          </AlertTitle>
          <Typography variant="body2">
            Cannot connect to the backend server. Please make sure the server is running at http://localhost:3000.
          </Typography>
        </Alert>
      </Box>
    </Collapse>
  );
}

export default ApiErrorBanner; 