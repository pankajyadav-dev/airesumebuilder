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
  Paper,
  Grid,
  Button,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const GrammarAnalysisModal = ({ open, onClose, analysis }) => {
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
              background: 'linear-gradient(to right, #2e7d32, #1b5e20)',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            Grammar Analysis
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

        {/* Grammar Errors */}
        {analysis.errors && analysis.errors.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Corrections ({analysis.errors.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analysis.errors.map((error, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2">Original:</Typography>
                    </Grid>
                    <Grid item xs={12} sm={10}>
                      <Typography color="error">{error.original}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2">Correction:</Typography>
                    </Grid>
                    <Grid item xs={12} sm={10}>
                      <Typography color="success.main">{error.correction}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
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

export default GrammarAnalysisModal; 