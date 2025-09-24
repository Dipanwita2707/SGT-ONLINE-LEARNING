import React, { useEffect, useState } from 'react';
import { Grid, Typography, Paper, Card, CardContent, CircularProgress, Alert, Chip, Box, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar, IconButton } from '@mui/material';
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
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

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
    forumCount: 0,
    activeStudentCount: 0,
  });
  const [courses, setCourses] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);

  // Dashboard metric visibility toggles (to mimic the customization bar in the design)
  const [showStudents, setShowStudents] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showCourses, setShowCourses] = useState(true);
  const [showVideos, setShowVideos] = useState(true);

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
        
        // Normalize overview payload with safe fallbacks
        const ov = overviewResponse?.data || {};
        setDashboardData({
          courseCount: ov.courseCount ?? 0,
          studentCount: ov.studentCount ?? 0,
          videoCount: ov.videoCount ?? 0,
          forumCount: ov.forumCount ?? 0,
          activeStudentCount: ov.activeStudentCount ?? 0,
        });
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
          forumCount: 0,
          activeStudentCount: 0,
        });
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Reusable metric/card component to match the glowing cards design
  const StatCard = ({ title, value, color, icon, caption }) => (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 30px rgba(2, 6, 23, 0.08)',
        background: `linear-gradient(180deg, #ffffff 0%, #fafbff 100%)`,
        '&:before': {
          content: '""',
          position: 'absolute',
          right: -20,
          top: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${color}22 0%, ${color}00 60%)`,
          filter: 'blur(6px)'
        }
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: `${color}`, width: 48, height: 48, boxShadow: `0 8px 20px ${color}55` }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em', textShadow: `0 1px 0 #fff, 0 8px 24px ${color}55` }}>
            {value}
          </Typography>
          {caption && (
            <Typography variant="body2" color="text.secondary">{caption}</Typography>
          )}
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(2,6,23,0.06)'
            }}
          >
            <ChevronRightRoundedIcon sx={{ color: '#334155' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <div>
      {/* Customization bar */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid #e5e7eb',
          background: 'linear-gradient(180deg, #ffffff 0%, #f6f7fb 100%)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard Customization
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Toggle metrics visibility to customize your dashboard view
        </Typography>
        <Box sx={{ borderTop: '1px solid #e5e7eb', my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label="Total Students"
            color={showStudents ? 'primary' : 'default'}
            onClick={() => setShowStudents(v => !v)}
            variant={showStudents ? 'filled' : 'outlined'}
            icon={<Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2563eb' }} />}
          />
          <Chip
            label="Active Students"
            color={showActive ? 'success' : 'default'}
            onClick={() => setShowActive(v => !v)}
            variant={showActive ? 'filled' : 'outlined'}
            icon={<Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#16a34a' }} />}
          />
          <Chip
            label="Total Courses"
            color={showCourses ? 'warning' : 'default'}
            onClick={() => setShowCourses(v => !v)}
            variant={showCourses ? 'filled' : 'outlined'}
            icon={<Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b' }} />}
          />
          <Chip
            label="Total Videos"
            color={showVideos ? 'secondary' : 'default'}
            onClick={() => setShowVideos(v => !v)}
            variant={showVideos ? 'filled' : 'outlined'}
            icon={<Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#7c3aed' }} />}
          />
        </Box>
      </Paper>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {showStudents && (
            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                title="Students"
                value={dashboardData.studentCount}
                caption="Total registered students"
                color="#2563eb"
                icon={<PeopleIcon />}
              />
            </Grid>
          )}

          {showActive && (
            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                title="Active"
                value={dashboardData.activeStudentCount || 0}
                caption="Active students (last 10 min)"
                color="#16a34a"
                icon={<CheckCircleIcon />}
              />
            </Grid>
          )}

          {showCourses && (
            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                title="Courses"
                value={dashboardData.courseCount}
                caption="Total available courses"
                color="#f59e0b"
                icon={<MdClass />}
              />
            </Grid>
          )}

          {showVideos && (
            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                title="Videos"
                value={dashboardData.videoCount}
                caption="Total uploaded videos"
                color="#7c3aed"
                icon={<VideoLibraryIcon />}
              />
            </Grid>
          )}
          
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
