import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Avatar, 
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  useTheme
} from '@mui/material';
import axios from 'axios';
import ForumIcon from '@mui/icons-material/Forum';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { parseJwt } from '../utils/jwt';
import { logoutUser } from '../utils/authService';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/admin/NotificationBell';
import AnnouncementPage from './AnnouncementPage';
import AnalyticsDashboard from './admin/AnalyticsDashboard';
import EnhancedAnalytics from './admin/EnhancedAnalytics';
import TeacherManagement from './admin/TeacherManagement';
import StudentManagement from './admin/StudentManagement';
import CourseManagement from './admin/CourseManagement';
import SchoolManagement from './admin/SchoolManagement';
import DepartmentManagement from './admin/DepartmentManagement';
import SectionManagement from '../components/admin/SectionManagement';
import DeanManagement from './admin/DeanManagement';
import HODManagement from './admin/HODManagement';
import ForumModeration from './admin/ForumModeration';
import RoleManagement from './admin/RoleManagement';
import UnlockRequests from './admin/UnlockRequests';

const AdminDashboard = () => {
  const theme = useTheme();
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const navigate = useNavigate();
  
  // Notifications section state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  
  // Activity feed state
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  
  // Forum activity state
  const [forumActivity, setForumActivity] = useState([]);
  const [forumLoading, setForumLoading] = useState(true);
  
  // User menu state
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  // Check if we're on a sub-page
  const isOnMainDashboard = window.location.pathname === '/admin' || window.location.pathname === '/admin/';

  useEffect(() => {
    if (!token) return;
    
    // Fetch notifications
    (async () => {
      try {
        setNotificationsLoading(true);
        const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    })();
    
    // Fetch activity feed
    (async () => {
      try {
        setActivityLoading(true);
        const res = await axios.get('/api/admin/audit-logs/recent', { headers: { Authorization: `Bearer ${token}` } });
        setActivity(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        setActivity([]);
      } finally {
        setActivityLoading(false);
      }
    })();
    
    // Fetch forum activity
    (async () => {
      try {
        setForumLoading(true);
        const res = await axios.get('/api/admin/forum-activity/recent', { headers: { Authorization: `Bearer ${token}` } });
        setForumActivity(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching forum activity:', error);
        setForumActivity([]);
      } finally {
        setForumLoading(false);
      }
    })();
  }, [token]);

  // User menu handlers
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // Logout handler
  const handleLogout = async () => {
    handleUserMenuClose();
    const result = await logoutUser();
    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'relative'
    }}>
      <Sidebar currentUser={currentUser} />
      
      {/* Header with Notification and Profile Icons */}
      <Box sx={{ 
        position: 'fixed', 
        top: 20, 
        right: 20, 
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 3,
        padding: 1,
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 8px 32px rgba(1, 31, 75, 0.1)'
      }}>
        <NotificationBell token={token} />
        <Tooltip title="Account">
          <IconButton 
            onClick={handleUserMenuOpen}
            size="medium"
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              width: 44,
              height: 44,
              '&:hover': { 
                bgcolor: 'primary.dark',
                transform: 'scale(1.05)',
                boxShadow: theme.shadows[4]
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow: theme.shadows[8],
              minWidth: 120
            }
          }}
        >
          <MenuItem 
            onClick={handleLogout}
            sx={{
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3
        }}
      >
        {isOnMainDashboard && (
          <>
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              <DashboardIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
              Admin Dashboard
            </Typography>
            
            <Grid container spacing={3}>
              {/* Notifications Section */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><NotificationsActiveIcon /></Avatar>}
                    action={<IconButton onClick={() => navigate('/admin/notifications')}><OpenInNewIcon /></IconButton>}
                    title="Notifications"
                    subheader={`${Array.isArray(notifications) ? notifications.length : 0} active notifications`}
                  />
                  <Divider />
                  <CardContent sx={{ height: 300, overflow: 'auto', p: 0 }}>
                    <List dense>
                      {notificationsLoading ? (
                        <ListItem><ListItemText primary="Loading..." /></ListItem>
                      ) : (Array.isArray(notifications) && notifications.length === 0) ? (
                        <ListItem><ListItemText primary="No notifications" /></ListItem>
                      ) : (
                        Array.isArray(notifications) && notifications.map((n) => (
                          <ListItem key={n._id}>
                            <ListItemText
                              primary={n.message}
                              secondary={new Date(n.createdAt).toLocaleString()}
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Activity Feed Section */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'success.main' }}><EventNoteIcon /></Avatar>}
                    action={<IconButton><OpenInNewIcon /></IconButton>}
                    title="Recent Activity"
                    subheader={`${Array.isArray(activity) ? activity.length : 0} recent actions`}
                  />
                  <Divider />
                  <CardContent sx={{ height: 300, overflow: 'auto', p: 0 }}>
                    <List dense>
                      {activityLoading ? (
                        <ListItem><ListItemText primary="Loading..." /></ListItem>
                      ) : (Array.isArray(activity) && activity.length === 0) ? (
                        <ListItem><ListItemText primary="No recent activity" /></ListItem>
                      ) : (
                        Array.isArray(activity) && activity.map((a) => (
                          <ListItem key={a._id}>
                            <ListItemText
                              primary={`${a.action} by ${a.performedBy?.email || 'System'}`}
                              secondary={new Date(a.createdAt).toLocaleString()}
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Forum Activity Section */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><ForumIcon /></Avatar>}
                    action={<Button size="small" variant="contained" onClick={() => navigate('/admin/forum')}><ForumIcon sx={{ mr: 1 }} />Moderate</Button>}
                    title="Forum Activity"
                    subheader={`${Array.isArray(forumActivity) ? forumActivity.length : 0} active discussions`}
                  />
                  <Divider />
                  <CardContent sx={{ height: 300, overflow: 'auto', p: 0 }}>
                    <List dense>
                      {forumLoading ? (
                        <ListItem><ListItemText primary="Loading..." /></ListItem>
                      ) : (Array.isArray(forumActivity) && forumActivity.length === 0) ? (
                        <ListItem><ListItemText primary="No recent forum activity" /></ListItem>
                      ) : (
                        Array.isArray(forumActivity) && forumActivity.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={`${item.action} in ${item.forumTitle}`}
                              secondary={`${item.userName} (${item.userRole}) - ${new Date(item.timestamp).toLocaleString()}`}
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
        
        <Box sx={{ mt: isOnMainDashboard ? 4 : 0 }}>
          <Routes>
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="unlock-requests" element={<UnlockRequests />} />
            <Route path="teachers" element={<TeacherManagement currentUser={currentUser} />} />
            <Route path="students" element={<StudentManagement currentUser={currentUser} />} />
            <Route path="courses" element={<CourseManagement currentUser={currentUser} />} />
            <Route path="schools" element={<SchoolManagement />} />
            <Route path="departments" element={<DepartmentManagement />} />
            <Route path="sections" element={<SectionManagement user={currentUser} token={token} />} />
            <Route path="deans" element={<DeanManagement />} />
            <Route path="hods" element={<HODManagement />} />
            <Route path="enhanced-analytics" element={<EnhancedAnalytics />} />
            <Route path="forum/*" element={<ForumModeration currentUser={currentUser} />} />
            <Route path="announcements" element={<AnnouncementPage role="admin" />} />
            {currentUser?.role === 'admin' && <Route path="roles" element={<RoleManagement />} />}
            <Route path="*" element={<Navigate to="/admin" />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;