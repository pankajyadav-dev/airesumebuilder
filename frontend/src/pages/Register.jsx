import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Container, 
  Paper, 
  CircularProgress, 
  Alert, 
  Link as MuiLink, 
  Stack 
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated, authChecked } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authChecked, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (!authChecked) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h5" fontWeight="bold">
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Or{' '}
            <MuiLink component={Link} to="/login" variant="body2">
              sign in to your existing account
            </MuiLink>
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <Stack spacing={2}>
              <TextField
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                required
                fullWidth
                id="email-address"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <TextField
                required
                fullWidth
                name="confirm-password"
                label="Confirm Password"
                type="password"
                id="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Stack>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default Register; 