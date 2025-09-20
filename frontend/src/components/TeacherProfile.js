import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  SupervisorAccount as HODIcon,
  AccountBalance as DeanIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Groups as GroupsIcon,
  MenuBook as CourseIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import axios from 'axios';

const TeacherProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/teacher/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Profile...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Teacher Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Personal Information Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {profile.personalInfo.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Teacher
                  </Typography>
                </Box>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={profile.personalInfo.email}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <BadgeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Teacher ID"
                    secondary={profile.personalInfo.teacherId || 'Not Assigned'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Join Date"
                    secondary={formatDate(profile.personalInfo.joinDate)}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {profile.personalInfo.canAnnounce ? 
                      <CheckIcon color="success" /> : 
                      <CancelIcon color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary="Announcement Permission"
                    secondary={
                      <Chip
                        label={profile.personalInfo.canAnnounce ? 'Enabled' : 'Disabled'}
                        color={profile.personalInfo.canAnnounce ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Department & Hierarchy Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} />
                Department & Hierarchy
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="School"
                    secondary={profile.school.name}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Department"
                    secondary={profile.department.name}
                  />
                </ListItem>

                <Divider sx={{ my: 1 }} />

                <ListItem>
                  <ListItemIcon>
                    <HODIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Head of Department (HOD)"
                    secondary={
                      profile.hod ? (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {profile.hod.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {profile.hod.email}
                          </Typography>
                          {profile.hod.teacherId && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              ID: {profile.hod.teacherId}
                            </Typography>
                          )}
                        </Box>
                      ) : 'Not Assigned'
                    }
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <DeanIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dean"
                    secondary={
                      profile.dean ? (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {profile.dean.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {profile.dean.email}
                          </Typography>
                        </Box>
                      ) : 'Not Assigned'
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Card */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Teaching Statistics
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Badge badgeContent={profile.statistics.totalSections} color="primary">
                      <GroupsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    </Badge>
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {profile.statistics.totalSections}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sections Assigned
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Badge badgeContent={profile.statistics.totalStudents} color="secondary">
                      <PersonIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                    </Badge>
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {profile.statistics.totalStudents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Students
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Badge badgeContent={profile.statistics.totalCourses} color="success">
                      <CourseIcon sx={{ fontSize: 40, color: 'success.main' }} />
                    </Badge>
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {profile.statistics.totalCourses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unique Courses
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Assigned Sections */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupsIcon sx={{ mr: 1 }} />
                Assigned Sections ({profile.assignedSections.length})
              </Typography>

              {profile.assignedSections.length === 0 ? (
                <Alert severity="info">
                  No sections assigned yet.
                </Alert>
              ) : (
                profile.assignedSections.map((section) => (
                  <Accordion key={section._id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="subtitle1" fontWeight="bold">
                          {section.name}
                        </Typography>
                        <Box display="flex" gap={1} mr={2}>
                          <Chip
                            icon={<PersonIcon />}
                            label={`${section.studentCount} students`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            icon={<CourseIcon />}
                            label={`${section.courseCount} courses`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Department: {section.department}
                      </Typography>
                      
                      {section.courses.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Courses:
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {section.courses.map((course) => (
                              <Chip
                                key={course._id}
                                label={`${course.title} (${course.courseCode})`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherProfile;