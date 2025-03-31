import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ShareEmailModal from '../components/ShareResume';
import { 
  Button, 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  IconButton, 
  Chip, 
  CircularProgress, 
  Alert, 
  Stack, 
  Paper
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
  },
});

function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResumeForSharing, setSelectedResumeForSharing] = useState(null);
  const [showShareEmailModal, setShowShareEmailModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/resume');
        setResumes(response.data);
      } catch (err) {
        console.error('Error fetching resumes:', err);
        setError('Failed to load resumes');
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const handleDeleteResume = async (id) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await axios.delete(`/api/resume/${id}`);
        setResumes(resumes.filter(resume => resume._id !== id));
      } catch (err) {
        console.error('Error deleting resume:', err);
        setError('Failed to delete resume');
      }
    }
  };

  const handleShareResume = (resume) => {
    setSelectedResumeForSharing(resume);
    setShowShareEmailModal(true);
  };

  const handleDownloadDocument = async (resumeId, resumeTitle) => {
    try {
      console.log('Downloading Word document for resume ID:', resumeId);
      
      // Show loading indicator or message
      setError('Generating document, please wait...');
      
      const response = await axios.get(`/api/resume/${resumeId}/pdf?format=docx`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      });
      
      // Clear the loading message
      setError('');
      
      // Create a blob from the document data
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resumeTitle || 'Resume'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading Word document:', err);
      setError('Failed to download Word document. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(to bottom right, #f0f4f8, #e3f2fd)',
        py: 4 
      }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
            <Typography variant="h4" component="h1" fontWeight="bold" 
              sx={{ 
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              My Resumes
            </Typography>
            <Button 
              component={Link} 
              to="/resume/new" 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1,
                background: 'linear-gradient(45deg, #1976d2, #1565c0)',
                textTransform: 'none',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'scale(1.03)',
                  transition: 'all 0.2s'
                },
              }}
            >
              Create New Resume
            </Button>
          </Box>

          {error && (
            <Alert severity="error" variant="filled" sx={{ mb: 4, boxShadow: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : resumes.length === 0 ? (
            <Paper 
              elevation={3} 
              sx={{ 
                py: 6, 
                px: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                borderRadius: 3
              }}
            >
              <ArticleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" mb={4}>
                You haven't created any resumes yet.
              </Typography>
              <Button 
                component={Link} 
                to="/resume/new" 
                variant="contained" 
                startIcon={<AddIcon />}
                sx={{ 
                  borderRadius: 8,
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #1976d2, #5c6bc0)',
                  textTransform: 'none',
                  fontWeight: 'medium',
                  boxShadow: 4,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'scale(1.05)',
                    transition: 'all 0.2s'
                  },
                }}
              >
                Create Your First Resume
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {resumes.map((resume) => (
                <Grid item xs={12} md={6} lg={4} key={resume._id}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      borderRadius: 3, 
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography 
                          component={Link} 
                          to={`/resume/${resume._id}`} 
                          variant="h6" 
                          color="primary"
                          sx={{ 
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            transition: 'color 0.2s',
                            '&:hover': { color: 'primary.dark' },
                            maxWidth: '80%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {resume.title}
                        </Typography>
                        <Chip 
                          label={formatDate(resume.updatedAt)} 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(0, 0, 0, 0.04)', 
                            fontWeight: 'medium',
                            fontSize: '0.7rem'
                          }} 
                        />
                      </Box>
                      
                      {resume.metrics && (
                        <Stack direction="row" spacing={1} mb={2}>
                          {resume.metrics.atsScore > 0 && (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label={`ATS: ${resume.metrics.atsScore}%`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {resume.metrics.grammarScore > 0 && (
                            <Chip
                              icon={<SpellcheckIcon />}
                              label={`Grammar: ${resume.metrics.grammarScore}%`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button 
                        component={Link}
                        to={`/resume/${resume._id}`}
                        variant="contained" 
                        color="primary"
                        size="small"
                        startIcon={<EditIcon />}
                        sx={{ flex: 1 }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="contained" 
                        color="success"
                        size="small"
                        onClick={() => handleShareResume(resume)}
                        startIcon={<ShareIcon />}
                        sx={{ flex: 1, mx: 1 }}
                      >
                        Share
                      </Button>
                      <Button 
                        variant="contained" 
                        color="secondary"
                        size="small"
                        onClick={() => handleDownloadDocument(resume._id, resume.title)}
                        startIcon={<DownloadIcon />}
                        sx={{ flex: 1 }}
                      >
                        Word
                      </Button>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteResume(resume._id)}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>

        {/* Share Email Modal */}
        {selectedResumeForSharing && (
          <ShareEmailModal 
            isOpen={showShareEmailModal}
            onClose={() => setShowShareEmailModal(false)}
            resumeId={selectedResumeForSharing._id}
            resumeTitle={selectedResumeForSharing.title}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default Dashboard; 