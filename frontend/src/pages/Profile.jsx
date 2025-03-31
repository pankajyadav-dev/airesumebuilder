import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Snackbar,
  Button,
  TextField,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [github, setGithub] = useState('');
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [certifications, setCertifications] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/profile');
      const profileData = response.data;

      setName(profileData.name || '');

      if (profileData.profile?.personalDetails) {
        setPhone(profileData.profile.personalDetails.phone || '');
        setAddress(profileData.profile.personalDetails.address || '');
        setWebsite(profileData.profile.personalDetails.website || '');
        setLinkedIn(profileData.profile.personalDetails.linkedIn || '');
        setGithub(profileData.profile.personalDetails.github || '');
      }
      
      
      setEducation(profileData.profile?.education || []);
      
   
      setExperience(profileData.profile?.experience || []);
      
   
      setSkills(profileData.profile?.skills || []);

      setCertifications(profileData.profile?.certifications || []);
      

      setAchievements(profileData.profile?.achievements || []);
      
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      
      const profileData = {
        name,
        profile: {
          personalDetails: {
            phone,
            address,
            website,
            linkedIn,
            github
          },
          education,
          experience,
          skills,
          certifications,
          achievements
        }
      };
      
      await axios.put('/api/user/profile', profileData);
      
      setMessage('Profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addEducation = () => {
    setEducation([
      ...education,
      {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    ]);
  };

  const updateEducation = (index, field, value) => {
    const updatedEducation = [...education];
    updatedEducation[index][field] = value;
    setEducation(updatedEducation);
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Experience functions
  const addExperience = () => {
    setExperience([
      ...experience,
      {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    ]);
  };

  const updateExperience = (index, field, value) => {
    const updatedExperience = [...experience];
    updatedExperience[index][field] = value;
    setExperience(updatedExperience);
  };

  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // Skills functions
  const addSkill = () => {
    if (newSkill.trim() !== '') {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Certifications functions
  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        name: '',
        issuer: '',
        date: ''
      }
    ]);
  };

  const updateCertification = (index, field, value) => {
    const updatedCertifications = [...certifications];
    updatedCertifications[index][field] = value;
    setCertifications(updatedCertifications);
  };

  const removeCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Achievements functions
  const addAchievement = () => {
    if (newAchievement.trim() !== '') {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement('');
    }
  };

  const removeAchievement = (index) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const updateAchievement = (index, value) => {
    const updatedAchievements = [...achievements];
    updatedAchievements[index] = value;
    setAchievements(updatedAchievements);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        
        <Snackbar
          open={!!message}
          autoHideDuration={3000}
          onClose={() => setMessage('')}
          message={message}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 3, md: 4 }, 
                mb: 4, 
                borderRadius: 2,
                position: 'relative'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Profile Information
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={saveProfile}
                  disabled={saving}
                  sx={{ px: 3 }}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
                Complete your profile information to help build better resumes tailored to your experience.
              </Typography>

              {/* Personal Information */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, mb: 4 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      Personal Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      These details will be used for your resume.
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <PersonIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <LocationOnIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <LanguageIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="LinkedIn"
                        value={linkedIn}
                        onChange={(e) => setLinkedIn(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <LinkedInIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="GitHub"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <GitHubIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Education */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                        Education
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add your educational background.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={addEducation}
                    >
                      Add Education
                    </Button>
                  </Box>
                  
                  {education.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 6, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center'
                    }}>
                      <SchoolIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.primary" gutterBottom>
                        No education added
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Get started by adding your educational background.
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={addEducation}
                        sx={{ mt: 2 }}
                      >
                        Add Education
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {education.map((edu, index) => (
                        <Paper
                          key={index}
                          elevation={1}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: 'background.default',
                            position: 'relative',
                            '&:hover': {
                              boxShadow: 3,
                              '& .delete-button': {
                                opacity: 1,
                              },
                            },
                          }}
                        >
                          <IconButton
                            className="delete-button"
                            size="small"
                            color="error"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                            onClick={() => removeEducation(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Institution"
                                value={edu.institution}
                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Degree"
                                value={edu.degree}
                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Field of Study"
                                value={edu.field}
                                onChange={(e) => updateEducation(index, 'field', e.target.value)}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={edu.description}
                                onChange={(e) => updateEducation(index, 'description', e.target.value)}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {/* Experience */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
                        Work Experience
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add your professional experience.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={addExperience}
                    >
                      Add Experience
                    </Button>
                  </Box>
                  
                  {experience.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 6, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center'
                    }}>
                      <WorkIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.primary" gutterBottom>
                        No experience added
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Get started by adding your work experience.
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={addExperience}
                        sx={{ mt: 2 }}
                      >
                        Add Experience
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {experience.map((exp, index) => (
                        <Paper
                          key={index}
                          elevation={1}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: 'background.default',
                            position: 'relative',
                            '&:hover': {
                              boxShadow: 3,
                              '& .delete-button': {
                                opacity: 1,
                              },
                            },
                          }}
                        >
                          <IconButton
                            className="delete-button"
                            size="small"
                            color="error"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                            onClick={() => removeExperience(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Company"
                                value={exp.company}
                                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Position"
                                value={exp.position}
                                onChange={(e) => updateExperience(index, 'position', e.target.value)}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={exp.description}
                                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {/* Skills */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, mb: 4 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmojiEventsIcon sx={{ mr: 1, color: 'primary.main' }} />
                      Skills
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      List your professional skills.
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mb: 4 }}>
                    <TextField
                      fullWidth
                      label="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      sx={{ mr: 2 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={addSkill}
                      sx={{ minWidth: '100px' }}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  {skills.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 6, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center'
                    }}>
                      <EmojiEventsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.primary" gutterBottom>
                        No skills added
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Get started by adding your professional skills.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          onDelete={() => removeSkill(index)}
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            borderRadius: '16px',
                            py: 1,
                            fontSize: '0.9rem',
                            '&:hover': {
                              backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {/* Certifications */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <VerifiedIcon sx={{ mr: 1, color: 'primary.main' }} />
                        Certifications
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add your professional certifications.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={addCertification}
                    >
                      Add Certification
                    </Button>
                  </Box>
                  
                  {certifications.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 6, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center'
                    }}>
                      <VerifiedIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.primary" gutterBottom>
                        No certifications added
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Get started by adding your professional certifications.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {certifications.map((cert, index) => (
                        <Paper
                          key={index}
                          elevation={1}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: 'background.default',
                            position: 'relative',
                            '&:hover': {
                              boxShadow: 3,
                              '& .delete-button': {
                                opacity: 1,
                              },
                            },
                          }}
                        >
                          <IconButton
                            className="delete-button"
                            size="small"
                            color="error"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                            onClick={() => removeCertification(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Certification Name"
                                value={cert.name}
                                onChange={(e) => updateCertification(index, 'name', e.target.value)}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Issuer"
                                value={cert.issuer}
                                onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Date"
                                type="date"
                                value={cert.date ? new Date(cert.date).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateCertification(index, 'date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {/* Achievements */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, mb: 4 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmojiEventsIcon sx={{ mr: 1, color: 'primary.main' }} />
                      Achievements
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      List your notable achievements.
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mb: 4 }}>
                    <TextField
                      fullWidth
                      label="Add an achievement..."
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                      sx={{ mr: 2 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={addAchievement}
                      sx={{ minWidth: '100px' }}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  {achievements.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 6, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center'
                    }}>
                      <EmojiEventsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.primary" gutterBottom>
                        No achievements added
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Get started by adding your notable achievements.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {achievements.map((achievement, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'background.default',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              boxShadow: 1,
                              '& .delete-button': {
                                opacity: 1,
                              },
                            },
                          }}
                        >
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography>{achievement}</Typography>
                          </Box>
                          <IconButton
                            className="delete-button"
                            size="small"
                            color="error"
                            sx={{
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                            onClick={() => removeAchievement(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Profile; 