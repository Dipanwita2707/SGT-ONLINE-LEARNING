import React, { useEffect, useState } from 'react';
import { Grid, Typography, Paper, Card, CardContent, CircularProgress, Alert, Chip, Box, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import axios from 'axios';
import { parseJwt } from '../../utils/jwt';
import { hasPermission } from '../../utils/permissions';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import { MdClass } from 'react-icons/md';
import BarChartIcon from '@mui/icons-material/BarChart';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// Helper function to get permission label
const getPermissionLabel = (permission) => {
  switch(permission) {
    case 'manage_teachers': return 'Manage Teachers';
    case 'manage_students': return 'Manage Students';
    case 'manage_courses': return 'Manage Courses';
    case 'manage_videos': return 'Manage Videos';
    case 'view_analytics': return 'View Analytics';
    case 'course_coordination': return 'Course Coordination (CC)';
    default: return permission;
  }
};

// Helper function to get permission icon
const getPermissionIcon = (permission) => {
  switch(permission) {
    case 'manage_teachers': return <PeopleIcon />;
    case 'manage_students': return <SchoolIcon />;
    case 'manage_courses': return <MdClass />;
    case 'manage_videos': return <VideoLibraryIcon />;
    case 'view_analytics': return <BarChartIcon />;
    case 'course_coordination': return <AdminPanelSettingsIcon />;
    default: return null;
  }
};

const TeacherDashboardHome = () => {
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    courseCount: 0,
    studentCount: 0,
    videoCount: 0,
    forumCount: 0
  });
  const [courses, setCourses] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);

  // Function to check if user is a Course Coordinator (CC) - simplified for quiz review only
  const isCC = () => {
    return teacherProfile?.coordinatedCourses && teacherProfile.coordinatedCourses.length > 0;
  };

  // Simplified permissions - CC role only affects quiz question access
  const getUserActualPermissions = () => {
    const permissions = [];
    
    // Base teacher permissions
    permissions.push('view_analytics');
    
    // If user has specific permissions in JWT, add those
    if (currentUser?.permissions && Array.isArray(currentUser.permissions)) {
      permissions.push(...currentUser.permissions);
    }
    
    // CC gets quiz coordination permission for question review
    if (isCC()) {
      permissions.push('course_coordination');
    }
    
    // Remove duplicates
    return [...new Set(permissions)];
  };

  // Define available permissions - simplified for CC role
  const getAvailablePermissions = () => {
    const basePermissions = [
      'view_analytics',
      'manage_videos'
    ];
    
    const ccPermissions = [
      'course_coordination' // Only for quiz question review
    ];
    
    return isCC() ? [...basePermissions, ...ccPermissions] : basePermissions;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const cacheHeaders = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
        
        // Fetch overview data
        const overviewResponse = await axios.get(`/api/teacher/analytics/overview?_t=${timestamp}`, {
          headers: { Authorization: `Bearer ${token}`, ...cacheHeaders }
        });
        
        // Fetch courses
        const coursesResponse = await axios.get(`/api/teacher/courses?_t=${timestamp}`, {
          headers: { Authorization: `Bearer ${token}`, ...cacheHeaders }
        });

        // Fetch teacher profile
        const profileResponse = await axios.get(`/api/teacher/profile?_t=${timestamp}`, {
          headers: { Authorization: `Bearer ${token}`, ...cacheHeaders }
        });
        
        setDashboardData(overviewResponse.data);
        setCourses(coursesResponse.data || []);
        setTeacherProfile(profileResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        // Use some default data in case of error
        setDashboardData({
          courseCount: 0,
          studentCount: 0,
          videoCount: 0,
          forumCount: 0
        });
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Teacher Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Welcome, {currentUser?.name || 'Teacher'}!
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Courses
                </Typography>
                <Typography variant="h3">
                  {dashboardData.courseCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  courses assigned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Students
                </Typography>
                <Typography variant="h3">
                  {dashboardData.studentCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  across all courses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Videos
                </Typography>
                <Typography variant="h3">
                  {dashboardData.videoCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  uploaded
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Forums
                </Typography>
                <Typography variant="h3">
                  {dashboardData.forumCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  active discussions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Your Permissions
              </Typography>
              
              {/* Show CC Status - only for quiz question management */}
              {isCC() && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    🎓 Course Coordinator (CC)
                  </Typography>
                  <Typography variant="body2">
                    You can review and approve quiz questions for coordinated courses
                  </Typography>
                </Box>
              )}
              
              {/* Show Teacher Role and Department */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Role & Department:</Typography>
                <Typography variant="body1">
                  <strong>Role:</strong> {currentUser?.role === 'teacher' ? 'Teacher' : currentUser?.role || 'Unknown'}
                  {isCC() && ' (Course Coordinator)'}
                </Typography>
                {teacherProfile?.department && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Department:</strong> {teacherProfile.department.name} 
                    {teacherProfile.department.code ? ` (${teacherProfile.department.code})` : ''}
                  </Typography>
                )}
                {teacherProfile?.department?.school && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>School:</strong> {teacherProfile.department.school.name}
                  </Typography>
                )}
              </Box>
              
              <List>
                {getAvailablePermissions().map(permission => {
                  const userPermissions = getUserActualPermissions();
                  const hasAccess = userPermissions.includes(permission) || hasPermission(currentUser, permission);
                  
                  return (
                    <ListItem key={permission}>
                      <ListItemIcon>
                        {hasAccess
                          ? <CheckCircleIcon color="success" /> 
                          : <CancelIcon color="disabled" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={getPermissionLabel(permission)}
                        secondary={hasAccess
                          ? (permission === 'course_coordination' ? "You are a Course Coordinator" : "You have access to this feature")
                          : "You don't have access to this feature"}
                        primaryTypographyProps={{
                          color: hasAccess ? 'text.primary' : 'text.disabled'
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Assigned Courses
              </Typography>
              
              {courses.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  You don't have any courses assigned yet.
                </Typography>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Total: {courses.length} course{courses.length !== 1 ? 's' : ''}
                  </Typography>
                  <List>
                    {courses.map(course => (
                      <React.Fragment key={course._id}>
                        <ListItem>
                          <ListItemIcon>
                            <MdClass />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1">{course.title}</Typography>
                                {course.coordinatorOnly && (
                                  <Chip 
                                    label="CC" 
                                    size="small" 
                                    color="primary" 
                                    variant="filled"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  Course Code: {course.courseCode}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Students: {course.studentsCount || 0} | Sections: {course.sectionsCount || 0}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Course Coordination (CC)
              </Typography>
              {!isCC() ? (
                <Typography variant="body1" color="text.secondary">
                  You are not assigned as a Course Coordinator.
                </Typography>
              ) : (
                <>
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.contrastText">
                      <strong>Quiz Management:</strong> As a Course Coordinator, you can review and approve quiz questions uploaded by teachers.
                    </Typography>
                  </Box>
                  <List>
                    {teacherProfile?.coordinatedCourses?.map(course => (
                      <React.Fragment key={course._id}>
                        <ListItem>
                          <ListItemIcon>
                            <AdminPanelSettingsIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Typography variant="subtitle1" color="primary">
                                {course.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  Course Code: {course.courseCode}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Role: Quiz Question Review & Approval
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    )) || (
                      <Typography variant="body2" color="text.secondary">
                        No coordinated courses assigned for quiz management.
                      </Typography>
                    )}
                  </List>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </div>
  );
};

export default TeacherDashboardHome;
