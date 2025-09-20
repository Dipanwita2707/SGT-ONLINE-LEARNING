import React, { useEffect, useState } from 'react';
import { Grid, Typography, Card, CardContent, CircularProgress, Alert, Box, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import axios from 'axios';
import { parseJwt } from '../../utils/jwt';
import { hasPermission } from '../../utils/permissions';
import { MdClass } from 'react-icons/md';
import GroupChatButton from '../../components/chat/GroupChatButton';
import GroupChatPanel from '../../components/chat/GroupChatPanel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Helper function to get permission label
const getPermissionLabel = (permission) => {
  switch(permission) {
    case 'manage_teachers': return 'Manage Teachers';
    case 'manage_students': return 'Manage Students';
    case 'manage_courses': return 'Manage Courses';
    case 'manage_videos': return 'Manage Videos';
    // Analytics label removed
    default: return permission;
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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState(null); // { courseId, sectionId, courseTitle }

  // Define available permissions
  const allPermissions = [
    'manage_teachers',
    'manage_students',
    'manage_courses',
    'manage_videos'
    // 'view_analytics' removed from dashboard
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch overview data
        const overviewResponse = await axios.get('/api/teacher/analytics/overview', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch courses
        const coursesResponse = await axios.get('/api/teacher/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const normalized = (coursesResponse.data || []).map(c => ({
          ...c,
          sectionId: c.sectionId || c.section || c.section?._id || null
        }));
        setDashboardData(overviewResponse.data);
        setCourses(normalized);
        const first = normalized.find(c => c.sectionId);
        if (first) setChatContext({ courseId: first._id, sectionId: first.sectionId, courseTitle: first.title });
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
    <Box sx={{ 
      background: 'transparent', // Allow gradient background to show through
      minHeight: '100vh',
      p: 0 // Remove default padding as it's handled by parent
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 600, 
          color: 'primary.main',
          mb: 1
        }}>
          Teacher Dashboard
        </Typography>
        
      </Box>
      <Typography variant="subtitle1" gutterBottom sx={{
        color: 'text.secondary',
        mb: 4
      }}>
        Welcome, {currentUser?.name || 'Teacher'}!
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                background: 'rgba(255, 255, 255, 0.95)',
              }
            }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Courses
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {dashboardData.courseCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  courses assigned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                background: 'rgba(255, 255, 255, 0.95)',
              }
            }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Students
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {dashboardData.studentCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  across all courses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                background: 'rgba(255, 255, 255, 0.95)',
              }
            }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Videos
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {dashboardData.videoCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  uploaded
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                background: 'rgba(255, 255, 255, 0.95)',
              }
            }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Forums
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {dashboardData.forumCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  active discussions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              p: 3, 
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                background: 'rgba(255, 255, 255, 0.95)',
              }
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                Your Permissions
              </Typography>
              
              {/* Debug section to show raw permissions */}
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: 'rgba(245, 245, 245, 0.8)', 
                borderRadius: 1,
                backdropFilter: 'blur(5px)'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Debug - Raw Permissions:</Typography>
                <Box component="pre" sx={{ 
                  overflowX: 'auto', 
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.75rem',
                  mt: 1,
                  p: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 0.5
                }}>
                  {JSON.stringify(currentUser.permissions || [], null, 2)}
                </Box>
                <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>User Object:</Typography>
                <Box component="pre" sx={{ 
                  overflowX: 'auto', 
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.75rem',
                  mt: 1,
                  p: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 0.5
                }}>
                  {JSON.stringify(currentUser || {}, null, 2)}
                </Box>
              </Box>
              
              <List>
                {allPermissions.map(permission => (
                  <ListItem key={permission}>
                    <ListItemIcon>
                      {hasPermission(currentUser, permission)
                        ? <CheckCircleIcon color="success" /> 
                        : <CancelIcon color="disabled" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={getPermissionLabel(permission)}
                      secondary={hasPermission(currentUser, permission)
                        ? "You have access to this feature" 
                        : "You don't have access to this feature"}
                      primaryTypographyProps={{
                        color: hasPermission(currentUser, permission)
                          ? 'text.primary' 
                          : 'text.disabled'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              p: 3, 
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                background: 'rgba(255, 255, 255, 0.95)',
              }
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                Assigned Courses
              </Typography>
              
              {courses.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  You don't have any courses assigned yet.
                </Typography>
              ) : (
                <List>
                  {courses.map(course => (
                    <React.Fragment key={course._id}>
                      <ListItem>
                        <ListItemIcon>
                          <MdClass />
                        </ListItemIcon>
                        <ListItemText 
                          primary={course.title}
                          secondary={`Course Code: ${course.courseCode}`}
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Card>
          </Grid>
        </Grid>
      )}
      <GroupChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        courseId={chatContext?.courseId}
        sectionId={chatContext?.sectionId}
        title={chatContext ? `Group Chat • ${chatContext.courseTitle}` : 'Group Chat'}
        currentUser={currentUser}
      />
    </Box>
  );
};

export default TeacherDashboardHome;
