import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Box, 
  Button, 
  Chip, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Avatar, 
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import axios from 'axios';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { parseJwt } from '../utils/jwt';
import { useUserRole } from '../contexts/UserRoleContext';
import { logoutUser } from '../utils/authService';
import RoleSwitcher from '../components/RoleSwitcher';
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

import RoleManagement from './admin/RoleManagement';
import UserRoleManagement from './admin/UserRoleManagement';
import UserRoleManagementTest from './admin/UserRoleManagementTest';
import UnlockRequests from './admin/UnlockRequests';
import AssignedSectionsCard from '../components/common/AssignedSectionsCard';


const AdminDashboard = () => {
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
  
  // User menu state

  
  // Check if we're on a sub-page
  const isOnMainDashboard = window.location.pathname === '/admin' || window.location.pathname === '/admin/';

  useEffect(() => {
    if (!token) return;
    
    // Fetch notifications
    (async () => {
      try {
        setNotificationsLoading(true);
        const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        setNotifications(res.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setNotificationsLoading(false);
      }
    })();
    
    // Fetch activity feed
    (async () => {
      try {
        setActivityLoading(true);
        const res = await axios.get('/api/admin/audit-logs/recent', { headers: { Authorization: `Bearer ${token}` } });
        setActivity(res.data);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setActivityLoading(false);
      }
    })();
  }, [token]);

  // Helper function to render loading or empty state
  const renderLoadingOrEmpty = (loading, items, emptyMessage) => {
    if (loading) {
      return (
        <ListItem>
          <ListItemText primary="Loading..." />
        </ListItem>
      );
    }
    
    if (items.length === 0) {
      return (
        <ListItem>
          <ListItemText primary={emptyMessage} />
        </ListItem>
      );
    }
    
    return null;
  };
  


  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <Sidebar currentUser={currentUser} />
      <Box sx={{ position: 'absolute', top: 16, right: 80, zIndex: 1201 }}>
        <NotificationBell token={token} />
      </Box>
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1201 }}>
        <RoleSwitcher />
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {isOnMainDashboard && (
          <>
            <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ mb: 4, fontWeight: 600 }}>
              <DashboardIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
              Admin Dashboard
            </Typography>
            
            <Grid container spacing={3}>
              {/* Notifications Section */}
              <Grid item xs={12} md={6} lg={4}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <NotificationsActiveIcon />
                      </Avatar>
                    }
                    action={
                      <IconButton aria-label="view all notifications" onClick={() => {}}>
                        <MoreVertIcon />
                      </IconButton>
                    }
                    title="Notifications"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <Divider />
                  <CardContent sx={{ height: 300, overflow: 'auto', p: 0 }}>
                    <List dense>
                      {renderLoadingOrEmpty(notificationsLoading, notifications, "No notifications")}
                      
                      {!notificationsLoading && notifications.map(n => (
                        <ListItem key={n._id} selected={!n.read} sx={{
                          borderLeft: !n.read ? '4px solid #3f51b5' : 'none',
                          bgcolor: !n.read ? 'rgba(63, 81, 181, 0.08)' : 'transparent'
                        }}>
                          <ListItemText
                            primary={<span style={{ fontWeight: n.read ? 400 : 700 }}>{n.message}</span>}
                            secondary={new Date(n.createdAt).toLocaleString()}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Activity Feed Section */}
              <Grid item xs={12} md={6} lg={4}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <EventNoteIcon />
                      </Avatar>
                    }
                    action={
                      <IconButton aria-label="view all activity">
                        <MoreVertIcon />
                      </IconButton>
                    }
                    title="Recent Activity"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <Divider />
                  <CardContent sx={{ height: 300, overflow: 'auto', p: 0 }}>
                    <List dense>
                      {renderLoadingOrEmpty(activityLoading, activity, "No recent activity")}
                      
                      {!activityLoading && activity.map(a => (
                        <ListItem key={a._id} sx={{ 
                          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                        }}>
                          <ListItemText
                            primary={
                              <Box>
                                <Chip 
                                  label={a.action} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ mr: 1, textTransform: 'capitalize' }}
                                />
                                <Typography component="span" variant="body2">
                                  by {a.performedBy?.email}
                                  {a.targetUser && <> → {a.targetUser.email}</>}
                                </Typography>
                              </Box>
                            }
                            secondary={new Date(a.createdAt).toLocaleString()}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Assigned Sections & Classes */}
              <Grid item xs={12}>
                <AssignedSectionsCard 
                  userId={currentUser?._id} 
                  userRole="admin"
                  title="My Assigned Sections & Teaching Assignments"
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
