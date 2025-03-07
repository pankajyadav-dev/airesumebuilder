import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Personal Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [github, setGithub] = useState('');
  
  // Education
  const [education, setEducation] = useState([]);
  
  // Experience
  const [experience, setExperience] = useState([]);
  
  // Skills
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  
  // Certifications
  const [certifications, setCertifications] = useState([]);
  
  // Achievements
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
      
      // Set user data
      setName(profileData.name || '');
      
      // Set personal details
      if (profileData.profile?.personalDetails) {
        setPhone(profileData.profile.personalDetails.phone || '');
        setAddress(profileData.profile.personalDetails.address || '');
        setWebsite(profileData.profile.personalDetails.website || '');
        setLinkedIn(profileData.profile.personalDetails.linkedIn || '');
        setGithub(profileData.profile.personalDetails.github || '');
      }
      
      // Set education
      setEducation(profileData.profile?.education || []);
      
      // Set experience
      setExperience(profileData.profile?.experience || []);
      
      // Set skills
      setSkills(profileData.profile?.skills || []);
      
      // Set certifications
      setCertifications(profileData.profile?.certifications || []);
      
      // Set achievements
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

  // Education functions
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">These details will be used for your resume.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="website"
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="linkedIn" className="block text-sm font-medium text-gray-700">
                LinkedIn
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="linkedIn"
                  id="linkedIn"
                  value={linkedIn}
                  onChange={(e) => setLinkedIn(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="github" className="block text-sm font-medium text-gray-700">
                GitHub
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="github"
                  id="github"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Education</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Add your educational background.</p>
          </div>
          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Education
          </button>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {education.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No education added yet.</p>
          ) : (
            <div className="space-y-6">
              {education.map((edu, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md relative">
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                  >
                    <span className="sr-only">Remove</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">Institution</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">Degree</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Field of Study</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) => updateEducation(index, 'field', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <div className="mt-1">
                        <input
                          type="date"
                          value={edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">End Date</label>
                      <div className="mt-1">
                        <input
                          type="date"
                          value={edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <div className="mt-1">
                        <textarea
                          rows={3}
                          value={edu.description}
                          onChange={(e) => updateEducation(index, 'description', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Experience Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Work Experience</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Add your professional experience.</p>
          </div>
          <button
            type="button"
            onClick={addExperience}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Experience
          </button>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {experience.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No experience added yet.</p>
          ) : (
            <div className="space-y-6">
              {experience.map((exp, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md relative">
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                  >
                    <span className="sr-only">Remove</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">Position</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => updateExperience(index, 'position', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <div className="mt-1">
                        <input
                          type="date"
                          value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">End Date</label>
                      <div className="mt-1">
                        <input
                          type="date"
                          value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <div className="mt-1">
                        <textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => updateExperience(index, 'description', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Skills</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">List your professional skills.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <input
              type="text"
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            <button
              type="button"
              onClick={addSkill}
              className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          
          {skills.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No skills added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span key={index} className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
                  >
                    <span className="sr-only">Remove</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Certifications</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Add your certifications and licenses.</p>
          </div>
          <button
            type="button"
            onClick={addCertification}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Certification
          </button>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {certifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No certifications added yet.</p>
          ) : (
            <div className="space-y-6">
              {certifications.map((cert, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md relative">
                  <button
                    type="button"
                    onClick={() => removeCertification(index)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                  >
                    <span className="sr-only">Remove</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">Certification Name</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Issuing Organization</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <div className="mt-1">
                        <input
                          type="date"
                          value={cert.date ? new Date(cert.date).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateCertification(index, 'date', e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Achievements</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">List your notable achievements.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <input
              type="text"
              placeholder="Add an achievement..."
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            <button
              type="button"
              onClick={addAchievement}
              className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          
          {achievements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No achievements added yet.</p>
          ) : (
            <ul className="list-disc pl-5 space-y-2">
              {achievements.map((achievement, index) => (
                <li key={index} className="text-gray-700 flex justify-between items-center">
                  <span>{achievement}</span>
                  <button
                    type="button"
                    onClick={() => removeAchievement(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <span className="sr-only">Remove</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveProfile}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

export default Profile; 