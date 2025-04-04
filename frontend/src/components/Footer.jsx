import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        background: 'linear-gradient(90deg, #1a237e, #0d47a1)',
        color: 'white',
        position: 'relative',
        pt: 6,
        pb: 5
      }}
    >
      {/* Decorative top border */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '3px',
          background: 'linear-gradient(90deg, #2196f3, #9c27b0, #2196f3)'
        }} 
      />
      
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4} sx={{ transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
            <Typography 
              variant="h5" 
              fontWeight="bold" 
              sx={{ 
                mb: 2,
                background: 'linear-gradient(45deg, #42a5f5, #ab47bc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent'
              }}
            >
              ResumeAI
            </Typography>
            <Typography variant="body2" color="grey.300" sx={{ mb: 3 }}>
              Create professional resumes effortlessly with our AI-powered tools and templates. 
              Stand out from the crowd and land your dream job.
            </Typography>
            <Button 
              component={Link} 
              to="/resume/new" 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ 
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                borderRadius: 2,
                px: 2.5,
                py: 1,
                boxShadow: 3,
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'scale(1.05)'
                }
              }}
            >
              Create Resume
            </Button>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
              Quick Links
            </Typography>
            <Divider sx={{ mb: 2, borderColor: 'grey.700', width: '40px' }} />
            <List disablePadding>
              <ListItem 
                button 
                component={Link} 
                to="/" 
                sx={{ 
                  py: 0.5, 
                  px: 0, 
                  color: 'grey.300',
                  '&:hover': { 
                    color: 'white',
                    transform: 'translateX(5px)',
                  },
                  transition: 'all 0.2s'
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#90caf9' }}>
                  <HomeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItem>
              
              <ListItem 
                button 
                component={Link} 
                to="/dashboard" 
                sx={{ 
                  py: 0.5, 
                  px: 0, 
                  color: 'grey.300',
                  '&:hover': { 
                    color: 'white',
                    transform: 'translateX(5px)',
                  },
                  transition: 'all 0.2s'
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#90caf9' }}>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
              
              <ListItem 
                button 
                component={Link} 
                to="/resume/new" 
                sx={{ 
                  py: 0.5, 
                  px: 0, 
                  color: 'grey.300',
                  '&:hover': { 
                    color: 'white',
                    transform: 'translateX(5px)',
                  },
                  transition: 'all 0.2s'
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#90caf9' }}>
                  <DescriptionIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Create Resume" />
              </ListItem>
              
              <ListItem 
                button 
                component={Link} 
                to="/profile" 
                sx={{ 
                  py: 0.5, 
                  px: 0, 
                  color: 'grey.300',
                  '&:hover': { 
                    color: 'white',
                    transform: 'translateX(5px)',
                  },
                  transition: 'all 0.2s'
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#90caf9' }}>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItem>
            </List>
          </Grid>

 
          
          <Grid item xs={12} md={4} sx={{ transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
              Contact
            </Typography>
            <Divider sx={{ mb: 2, borderColor: 'grey.700', width: '40px' }} />
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'grey.300' }}>
                <EmailIcon sx={{ mr: 1.5, fontSize: 18, color: '#90caf9' }} />
                <Typography variant="body2">support@resumeai.com</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'grey.300' }}>
                <PhoneIcon sx={{ mr: 1.5, fontSize: 18, color: '#90caf9' }} />
                <Typography variant="body2">+1 (123) 456-7890</Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <IconButton 
                sx={{ 
                  color: 'grey.400', 
                  '&:hover': { 
                    color: 'white',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton 
                sx={{ 
                  color: 'grey.400', 
                  '&:hover': { 
                    color: 'white',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <TwitterIcon />
              </IconButton>
              <IconButton 
                sx={{ 
                  color: 'grey.400', 
                  '&:hover': { 
                    color: 'white',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <LinkedInIcon />
              </IconButton>
            </Stack>
          </Grid>

                    <Grid item xs={12} md={4} sx={{ transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
              Student Information
            </Typography>
            <Divider sx={{ mb: 2, borderColor: 'grey.700', width: '40px' }} />
            <Stack spacing={2}>
              {/* First Entry */}
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'grey.300' }}>
                <Typography variant="subtitle2" sx={{ color: '#90caf9', width: '100px' }}>Student 1:</Typography>
                <Box>
                  <Typography variant="body2">Pankaj Yadav | Reg: 12312698 | Roll number: A34 </Typography>
                </Box>
              </Box>
          
              {/* Second Entry */}
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'grey.300' }}>
                <Typography variant="subtitle2" sx={{ color: '#90caf9', width: '100px' }}>Student 2:</Typography>
                <Box>
                  <Typography variant="body2"> Sachin Burnwal  | Reg: 12309834  </Typography>
                </Box>
              </Box>
          
              {/* Third Entry */}
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'grey.300' }}>
                <Typography variant="subtitle2" sx={{ color: '#90caf9', width: '100px' }}>Student 3:</Typography>
                <Box>
                  <Typography variant="body2"> Manish Kalwani | Reg: 12300717 </Typography>
                </Box>
              </Box>
            </Stack>
          </Grid>
        </Grid>
        
                


        <Divider sx={{ mt: 4, mb: 3, borderColor: 'grey.700' }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="grey.400">
            &copy; {new Date().getFullYear()} ResumeAI. All rights reserved.
          </Typography>
          <Stack 
            direction="row" 
            spacing={3} 
            justifyContent="center" 
            sx={{ mt: 1.5 }}
          >
            <Typography 
              variant="body2" 
              color="grey.400" 
              sx={{ 
                cursor: 'pointer', 
                '&:hover': { color: 'grey.300' }
              }}
            >
              Privacy Policy
            </Typography>
            <Typography 
              variant="body2" 
              color="grey.400" 
              sx={{ 
                cursor: 'pointer', 
                '&:hover': { color: 'grey.300' }
              }}
            >
              Terms of Service
            </Typography>
            <Typography 
              variant="body2" 
              color="grey.400" 
              sx={{ 
                cursor: 'pointer', 
                '&:hover': { color: 'grey.300' }
              }}
            >
              Cookie Policy
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;