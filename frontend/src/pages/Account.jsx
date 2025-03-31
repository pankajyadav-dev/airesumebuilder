import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Grid,
  Modal,
  Alert,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    error: {
      main: '#d32f2f',
    },
  },
});

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

function Account() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteAccount();
      navigate('/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setError(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Navbar />
        
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h5" fontWeight="bold" mb={3}>
                Account Settings
              </Typography>
              
              <Box mb={4}>
                <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                  User Information
                </Typography>
                <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1">
                          {user?.name || 'Not available'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {user?.email || 'Not available'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>

              <Divider sx={{ my: 3 }} />
              
              <Box>
                <Card variant="outlined" sx={{ bgcolor: '#ffebee', border: '1px solid #ffcdd2' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" color="error.dark">
                          Delete Account
                        </Typography>
                        <Typography variant="body2" color="error.dark" sx={{ mt: 0.5 }}>
                          Once you delete your account, there is no going back. Please be certain.
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setShowDeleteModal(true)}
                        sx={{ 
                          textTransform: 'none',
                          borderRadius: 1.5
                        }}
                      >
                        Delete Account
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Paper>
        </Container>

        {/* Delete Account Confirmation Modal */}
        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          aria-labelledby="delete-account-modal"
        >
          <Box sx={modalStyle}>
            <Typography id="delete-account-modal" variant="h6" component="h2" fontWeight="bold" mb={1}>
              Delete Account
            </Typography>
            <Typography sx={{ mt: 2, mb: 3 }} color="text.secondary">
              Are you sure you want to delete your account? This action cannot be undone.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                sx={{ textTransform: 'none' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </ThemeProvider>
  );
}

export default Account;