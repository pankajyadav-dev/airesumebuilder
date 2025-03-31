import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Button, 
  TextField, 
  Checkbox, 
  FormControlLabel, 
  Grid, 
  Box, 
  Typography, 
  Container, 
  Paper, 
  CircularProgress, 
  Alert, 
  Link as MuiLink 
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, authChecked } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authChecked, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
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
            Sign in to your account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Or{' '}
            <MuiLink component={Link} to="/register" variant="body2">
              create a new account
            </MuiLink>
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email-address"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <Grid container sx={{ mt: 2, mb: 2 }}>
              <Grid item xs>
                <FormControlLabel
                  control={<Checkbox value="remember" color="primary" />}
                  label="Remember me"
                />
              </Grid>
              <Grid item>
                <MuiLink href="#" variant="body2">
                  Forgot password?
                </MuiLink>
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, mb: 2 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default Login; 