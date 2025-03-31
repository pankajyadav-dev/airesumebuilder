import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const AtsAnalysisModal = ({ open, onClose, analysis }) => {
  if (!analysis) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #1976d2, #1565c0)',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            ATS Analysis
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Score: {analysis.score}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={analysis.score} 
            sx={{ height: 10, borderRadius: 5 }}
            color={
              analysis.score >= 85 ? "success" : 
              analysis.score >= 70 ? "warning" : "error"
            }
          />
        </Box>

        {/* Keywords */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Keywords
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {analysis.keywords.map((keyword, index) => (
                <Chip
                  key={index}
                  label={keyword}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Missing Keywords */}
        {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Missing Keywords
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {analysis.missingKeywords.map((keyword, index) => (
                <Chip
                  key={index}
                  label={keyword}
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AtsAnalysisModal; 