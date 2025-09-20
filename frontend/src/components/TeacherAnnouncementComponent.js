import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  useTheme
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Announcement as AnnouncementIcon,
  Send as SendIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';

const TeacherAnnouncementComponent = ({ user }) => {
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const theme = useTheme();
  const token = localStorage.getItem('token');

  // Fetch teacher's sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setSectionsLoading(true);
        const response = await axios.get('/api/teacher/sections', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSections(response.data);
      } catch (error) {
        console.error('Error fetching sections:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load sections. Please try again.',
          severity: 'error'
        });
      } finally {
        setSectionsLoading(false);
      }
    };

    fetchSections();
  }, [token]);

  // Handle section selection
  const handleSectionChange = (sectionId) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide both title and message.',
        severity: 'warning'
      });
      return;
    }

    if (selectedSections.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one section.',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/teacher/announcement', {
        title: title.trim(),
        message: message.trim(),
        targetSections: selectedSections
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({
        open: true,
        message: response.data.message || 'Announcement submitted for HOD approval successfully!',
        severity: 'success'
      });

      // Reset form
      setTitle('');
      setMessage('');
      setSelectedSections([]);
    } catch (error) {
      console.error('Error creating announcement:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create announcement. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total students in selected sections
  const getTotalStudents = () => {
    return sections
      .filter(section => selectedSections.includes(section._id))
      .reduce((total, section) => total + section.studentCount, 0);
  };

  if (sectionsLoading) {
    return (
      <Card 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CardContent>
          <CircularProgress color="primary" size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
            Loading your sections...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header Card */}
      <Card 
        sx={{ 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <CardContent sx={{ py: 2.5, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  borderRadius: 2,
                  p: 1.5,
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 16px ${theme.palette.primary.main}40`
                }}
              >
                <AnnouncementIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: 0.5,
                    mb: 0.5
                  }}
                >
                  Create Section Announcement
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500
                  }}
                >
                  Submit announcements for HOD approval
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Info Alert */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(33, 150, 243, 0.2)',
          '& .MuiAlert-icon': {
            color: theme.palette.info.main
          }
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Your announcement will be sent to your HOD for approval before being shared with students.
        </Typography>
      </Alert>

      {/* Main Form Card */}
      <Card 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            {/* Title Input */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.primary.dark }}>
                Announcement Title
              </Typography>
              <TextField
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter a clear title for your announcement"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Box>

            {/* Message Input */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.primary.dark }}>
                Announcement Message
              </Typography>
              <TextField
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                multiline
                rows={4}
                placeholder="Write your announcement message here..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Box>

            {/* Section Selection Header */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                    borderRadius: 2,
                    p: 1,
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SchoolIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
                  Select Sections
                </Typography>
              </Box>

              {sections.length === 0 ? (
                <Alert 
                  severity="warning"
                  sx={{ 
                    background: 'rgba(255, 193, 7, 0.1)',
                    borderRadius: 2,
                  }}
                >
                  No sections assigned to you. Please contact the administrator.
                </Alert>
              ) : (
                <Box>
                  <FormGroup>
                    {sections.map((section) => (
                      <Card 
                        key={section._id} 
                        sx={{ 
                          mb: 2,
                          background: selectedSections.includes(section._id) 
                            ? 'rgba(25, 118, 210, 0.08)' 
                            : 'rgba(255, 255, 255, 0.7)',
                          border: selectedSections.includes(section._id) 
                            ? `2px solid ${theme.palette.primary.light}` 
                            : '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                          }
                        }}
                      >
                        <CardContent sx={{ py: 2, px: 3 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedSections.includes(section._id)}
                                  onChange={() => handleSectionChange(section._id)}
                                  color="primary"
                                  sx={{ mr: 1 }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                                    {section.name}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                                    {section.department}
                                  </Typography>
                                </Box>
                              }
                            />
                            
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                icon={<PeopleIcon />}
                                label={`${section.studentCount} students`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 'bold', borderRadius: 2 }}
                              />
                              <Chip
                                icon={<AssignmentIcon />}
                                label={`${section.courses.length} courses`}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ fontWeight: 'bold', borderRadius: 2 }}
                              />
                            </Box>
                          </Box>
                          
                          {section.courses.length > 0 && (
                            <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                                <strong>Courses:</strong> {section.courses.map(course => course.title).join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </FormGroup>

                  {/* Summary */}
                  {selectedSections.length > 0 && (
                    <Alert 
                      severity="success" 
                      sx={{ 
                        mt: 3,
                        background: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(76, 175, 80, 0.3)'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        <strong>Summary:</strong> You have selected {selectedSections.length} section(s) 
                        with a total of {getTotalStudents()} students.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </Box>

            {/* Action Buttons */}
            <Box display="flex" gap={2} sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || selectedSections.length === 0 || !title.trim() || !message.trim()}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                sx={{ 
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {loading ? 'Submitting...' : 'Submit for HOD Approval'}
              </Button>
              
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setTitle('');
                  setMessage('');
                  setSelectedSections([]);
                }}
                disabled={loading}
                startIcon={<ClearIcon />}
                sx={{ 
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Clear Form
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontWeight: 500
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeacherAnnouncementComponent;