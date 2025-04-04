import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Divider,
  useScrollTrigger,
  Slide
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  // Check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = isAuthenticated ? [
    { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { name: 'New Resume', path: '/resume/new', icon: <AddIcon fontSize="small" /> },
    { name: 'Profile', path: '/profile', icon: <PersonIcon fontSize="small" /> },
    { name: 'Settings', path: '/account', icon: <SettingsIcon fontSize="small" /> }
  ] : [];

  const drawerContent = (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography 
          component={Link} 
          to="/" 
          variant="h6" 
          fontWeight="bold"
          sx={{ 
            textDecoration: 'none',
            background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          ResumeAI
        </Typography>
        <IconButton edge="end" onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              onClick={handleDrawerToggle}
              sx={{
                borderLeft: isActive(item.path) ? '4px solid' : '4px solid transparent',
                borderLeftColor: 'primary.main',
                backgroundColor: isActive(item.path) ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                pl: 2,
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive(item.path) ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.name} 
                primaryTypographyProps={{ 
                  fontWeight: isActive(item.path) ? 'medium' : 'regular',
                  color: isActive(item.path) ? 'primary.main' : 'text.primary'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isAuthenticated && (
        <>
          <Divider sx={{ mt: 2, mb: 2 }} />
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: 'primary.main',
                  mr: 2
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{user?.name || 'User'}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email || 'No email'}</Typography>
              </Box>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <>
      <HideOnScroll>
        <AppBar 
          position="fixed" 
          color="default" 
          elevation={0} 
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)', 
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            zIndex: (theme) => theme.zIndex.drawer + 1
          }}
        >
          <Container maxWidth="lg">
            <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
              {/* Logo */}
              <Typography 
                component={Link} 
                to="/" 
                variant="h5" 
                fontWeight="bold"
                sx={{ 
                  textDecoration: 'none',
                  background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                ResumeAI
              </Typography>

              {/* Desktop Nav Links */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 4 }}>
                {navItems.map((item) => (
                  <Button 
                    key={item.path}
                    component={Link}
                    to={item.path}
                    color={isActive(item.path) ? 'primary' : 'inherit'}
                    sx={{ 
                      mx: 1, 
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '3px',
                        backgroundColor: 'primary.main',
                        transform: isActive(item.path) ? 'scaleX(1)' : 'scaleX(0)',
                        transition: 'transform 0.3s',
                      },
                      '&:hover::after': {
                        transform: 'scaleX(1)'
                      },
                      fontWeight: isActive(item.path) ? 'medium' : 'regular'
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </Box>

              {/* Authentication Buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isAuthenticated ? (
                  <>
                    <Box 
                      sx={{ 
                        display: { xs: 'none', md: 'flex' }, 
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={handleProfileMenuOpen}
                    >
                      <Avatar 
                        sx={{ 
                          width: 36, 
                          height: 36, 
                          bgcolor: 'primary.main',
                          boxShadow: 2,
                          mr: 1
                        }}
                      >
                        {user?.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Typography variant="body2" fontWeight="medium" color="text.secondary" sx={{ mr: 2 }}>
                        Hello, {user?.name?.split(' ')[0] || 'User'}
                      </Typography>
                    </Box>
                    
                    <Menu
                      anchorEl={profileMenuAnchor}
                      open={Boolean(profileMenuAnchor)}
                      onClose={handleProfileMenuClose}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                      PaperProps={{
                        elevation: 3,
                        sx: {
                          minWidth: 180,
                          mt: 1,
                          borderRadius: 2,
                          '& .MuiMenuItem-root': {
                            px: 2,
                            py: 1.5,
                          },
                        },
                      }}
                    >
                      <MenuItem 
                        onClick={() => {
                          handleProfileMenuClose();
                          navigate('/profile');
                        }}
                      >
                        <PersonIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                        Profile
                      </MenuItem>
                      <MenuItem 
                        onClick={() => {
                          handleProfileMenuClose();
                          navigate('/account');
                        }}
                      >
                        <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                        Account Settings
                      </MenuItem>
                      <Divider />
                      <MenuItem onClick={handleLogout}>
                        <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                        Logout
                      </MenuItem>
                    </Menu>
{/*                     
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ display: { xs: 'none', md: 'flex' } }}
                      onClick={handleLogout}
                    >
                      Logout
                    </Button> */}
                  </>
                ) : (
                  <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Button 
                      component={Link} 
                      to="/login" 
                      color="inherit"
                      sx={{ mr: 2 }}
                    >
                      Login
                    </Button>
                    <Button 
                      component={Link} 
                      to="/register" 
                      variant="contained" 
                      color="primary"
                      sx={{ 
                        background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                        boxShadow: 2,
                        '&:hover': {
                          boxShadow: 4,
                        }
                      }}
                    >
                      Register
                    </Button>
                  </Box>
                )}
                
                {/* Mobile menu button */}
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="end"
                  onClick={handleDrawerToggle}
                  sx={{ display: { md: 'none' } }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Toolbar placeholder to push content below AppBar */}
      <Toolbar />
    </>
  );
}

export default Navbar;