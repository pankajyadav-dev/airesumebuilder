import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper 
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function NotFound() {
  return (
    <ThemeProvider theme={theme}>
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.50'
        }}
      >
        <Container maxWidth="sm">
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
            <Typography variant="h1" color="primary" fontWeight="bold" fontSize="6rem">
              404
            </Typography>
            <Typography variant="h4" color="text.primary" fontWeight="bold" mt={2}>
              Page not found
            </Typography>
            <Typography variant="h6" color="text.secondary" mt={2} textAlign="center">
              Sorry, we couldn't find the page you're looking for.
            </Typography>
            <Button 
              component={Link} 
              to="/" 
              variant="contained" 
              startIcon={<HomeIcon />}
              sx={{ 
                mt: 4, 
                px: 3, 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'medium'
              }}
            >
              Go back home
            </Button>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default NotFound; 