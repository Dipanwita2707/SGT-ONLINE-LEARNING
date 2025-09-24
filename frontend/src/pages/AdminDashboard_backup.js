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
  const { user: contextUser, hasRole, activeRole } = useUserRole();
  const navigate = useNavigate();
  
  // Use context user if available, fallback to parsed JWT
  const user = contextUser || currentUser;
  
  // Notifications section state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  
  // Activity feed state
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeStudents: 0,
    totalTeachers: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
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
    
    // Fetch dashboard stats
    (async () => {
      try {
        setStatsLoading(true);
        const [usersRes, coursesRes, studentsRes, teachersRes] = await Promise.all([
          axios.get('/api/admin/users/count', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/courses/count', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/students/active/count', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/teachers/count', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setDashboardStats({
          totalUsers: usersRes.data.count || 0,
          totalCourses: coursesRes.data.count || 0,
          activeStudents: studentsRes.data.count || 0,
          totalTeachers: teachersRes.data.count || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setStatsLoading(false);
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

  // Helper function to render loading or empty state
  const renderLoadingOrEmpty = (loading, items, emptyMessage) => {
    if (loading) {
      return (
        <ListItem>
          <ListItemText 
            primary={<Skeleton variant="text" width="80%" />}
            secondary={<Skeleton variant="text" width="60%" />}
          />
        </ListItem>
      );
    }
    
    if (items.length === 0) {
      return (
        <ListItem>
          <ListItemText 
            primary={emptyMessage}
            primaryTypographyProps={{
              color: 'text.secondary',
              fontStyle: 'italic'
            }}
          />
        </ListItem>
      );
    }
    
    return null;
  };
  


  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[100]} 100%)`,
      position: 'relative'
    }}>
      <Sidebar currentUser={currentUser} />
      
      {/* Enhanced Header with Notification and Profile Icons */}
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
        padding: 1.5,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[8]
      }}>
        <RoleSwitcher />
        <NotificationBell token={token} />
        <Tooltip title="Account Settings">
          <IconButton 
            onClick={handleUserMenuOpen}
            size="medium"
            sx={{ 
              bgcolor: theme.palette.primary.main, 
              color: 'white',
              width: 44,
              height: 44,
              '&:hover': { 
                bgcolor: theme.palette.primary.dark,
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
              border: `1px solid ${theme.palette.divider}`,
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
          p: 3,
          pr: 5 // Extra right padding to avoid overlap with header
        }}
      >
        {isOnMainDashboard && (
          <>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.dark,
                fontWeight: 700,
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <DashboardIcon sx={{ fontSize: '2.5rem' }} />
              Admin Dashboard
            </Typography>
            
            {/* Dashboard Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                          {statsLoading ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : dashboardStats.totalUsers}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Users
                        </Typography>
                      </Box>
                      <PeopleIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, #047857 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                          {statsLoading ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : dashboardStats.totalCourses}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Courses
                        </Typography>
                      </Box>
                      <SchoolIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                          {statsLoading ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : dashboardStats.activeStudents}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Active Students
                        </Typography>
                      </Box>
                      <SchoolIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, #b45309 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                          {statsLoading ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : dashboardStats.totalTeachers}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Teachers
                        </Typography>
                      </Box>
                      <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Grid container spacing={3}>
              {/* Enhanced Notifications Section */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%', borderRadius: 3 }}>
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: theme.palette.primary.main }}><NotificationsActiveIcon /></Avatar>}
                    action={<IconButton onClick={() => navigate('/admin/notifications')}><OpenInNewIcon /></IconButton>}
                    title="Notifications"
                    subheader={`${Array.isArray(notifications) ? notifications.length : 0} active notifications`}
                    titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                  />
                  <Divider />
                  <CardContent sx={{ height: 300, overflow: 'auto', p: 0 }}>
                    <List dense>
                      {renderLoadingOrEmpty(notificationsLoading, notifications, "No notifications")}
                      
                      {!notificationsLoading && Array.isArray(notifications) && notifications.map(n => (
                        <ListItem 
                          key={n._id} 
                          selected={!n.read} 
                          sx={{
                            borderLeft: !n.read ? `4px solid ${theme.palette.primary.main}` : 'none',
                            bgcolor: !n.read ? `${theme.palette.primary.main}08` : 'transparent',
                            '&:hover': { bgcolor: theme.palette.action.hover }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography 
                                variant="body2" 
                                sx={{ fontWeight: n.read ? 400 : 600 }}
                              >
                                {n.message}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {new Date(n.createdAt).toLocaleString()}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Enhanced Activity Feed Section */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%', borderRadius: 3 }}>
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: theme.palette.success.main }}><EventNoteIcon /></Avatar>}
                    action={<IconButton><OpenInNewIcon /></IconButton>}
                    title="Recent Activity"
                    subheader={`${Array.isArray(activity) ? activity.length : 0} recent actions`}
                    titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                  />
                  <Divider />
                  <CardContent sx={{ height: 300, overflow: 'auto', p: 0 }}>
                    <List dense>
                      {renderLoadingOrEmpty(activityLoading, activity, "No recent activity")}
                      
                      {!activityLoading && Array.isArray(activity) && activity.map(a => (
                        <ListItem 
                          key={a._id} 
                          sx={{ 
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            '&:hover': { bgcolor: theme.palette.action.hover },
                            '&:last-child': { borderBottom: 'none' }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip 
                                  label={a.action} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ 
                                    textTransform: 'capitalize',
                                    fontWeight: 500
                                  }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  by {a.performedBy?.email || 'System'}
                                  {a.targetUser && <> → {a.targetUser.email}</>}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {new Date(a.createdAt).toLocaleString()}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Enhanced Assigned Sections & Classes */}
              <Grid item xs={12} lg={4}>
                <AssignedSectionsCard 
                  userId={currentUser?._id} 
                  userRole="admin"
                  title="Assigned Sections"
                />
              </Grid>
            </Grid>
          </>
        )}
        
        <Box sx={{ mt: isOnMainDashboard ? 4 : 0 }}>
          <Routes>
            <Route path="dashboard" element={<AnalyticsDashboard />} />
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
            <Route path="announcements" element={<AnnouncementPage role="admin" />} />
            {currentUser?.role === 'admin' && <Route path="user-roles" element={<UserRoleManagement />} />}
            {currentUser?.role === 'admin' && <Route path="roles" element={<RoleManagement />} />}
            <Route path="*" element={<Navigate to="/admin/dashboard" />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
