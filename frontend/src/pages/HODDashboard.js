import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, IconButton, Menu, MenuItem, Tooltip, Badge, Typography } from '@mui/material';
import axios from 'axios';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { parseJwt } from '../utils/jwt';
import { logoutUser } from '../utils/authService';
import { useUserRole } from '../contexts/UserRoleContext';
import Sidebar from '../components/Sidebar';
import RoleSwitcher from '../components/RoleSwitcher';
import DashboardRoleGuard from '../components/DashboardRoleGuard';

// Import HOD Dashboard components
import HODDashboardHome from './hod/HODDashboardHome';
import HODTeachers from './hod/HODTeachers';
import HODCourses from './hod/HODCourses';
import HODSections from './hod/HODSections';
import HODAnalytics from './hod/HODAnalytics';
import HODAnnouncements from './hod/HODAnnouncements';
import MyTeachingSections from '../components/common/MyTeachingSections';

import HODAnnouncementApproval from '../components/hod/HODAnnouncementApproval';
import HODQuizManagement from './hod/HODQuizManagement';
import HODCCManagement from './hod/HODCCManagement';
import HODVideoUnlockApproval from './hod/HODVideoUnlockApproval';
import TopHeaderBar from '../components/common/TopHeaderBar';

const HODDashboard = () => {
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { hasRole } = useUserRole();

  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await axios.get('/api/notifications/unread-count', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setUnreadCount(res.data.unread || 0);
      } catch (e) { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Allow only hod users to access the HOD dashboard
  const hasHODRole = currentUser && (
    currentUser.role === 'hod' || 
    (currentUser.roles && currentUser.roles.includes('hod')) ||
    currentUser.primaryRole === 'hod' ||
    hasRole('hod')
  );
  
  if (!hasHODRole) {
    return <Navigate to="/login" />;
  }

  // Auto-redirect to dashboard if at the root hod path
  if (location.pathname === '/hod') {
    return <Navigate to="/hod/dashboard" replace />;
  }



  const openNotifications = async (e) => {
    setNotifAnchor(e.currentTarget);
    try {
      const res = await axios.get('/api/notifications', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setNotifications(res.data.notifications || res.data || []);
      if (unreadCount > 0) {
        await axios.patch('/api/notifications/mark-all/read', {}, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setUnreadCount(0);
      }
    } catch (e) {/* ignore */}
  };

  const closeNotifications = () => setNotifAnchor(null);

  return (
    <DashboardRoleGuard requiredRole="hod">
      <Box sx={{ display: 'flex' }}>
        <Sidebar currentUser={currentUser} />
  <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f4f6f8', ml: '280px', display: 'flex', flexDirection: 'column' }}>
  <TopHeaderBar 
          title="Analytics Dashboard" 
          subtitle="Toggle metrics visibility to customize your dashboard view"
          right={
            <>
              <Tooltip title="Notifications">
                <IconButton onClick={openNotifications} color="inherit">
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <RoleSwitcher />
            </>
          }
        />

  {/* Main Content */}
  <Box component="main" sx={{ flexGrow: 1, pt: 3, pr: 3, pb: 3, pl: 0 }}>
  <Routes>
          <Route path="/dashboard" element={<HODDashboardHome />} />
          <Route path="/teachers" element={<HODTeachers />} />
          <Route path="/courses" element={<HODCourses />} />
          <Route path="/sections" element={<HODSections />} />
          <Route path="/analytics" element={<HODAnalytics />} />
          <Route path="/announcements" element={<HODAnnouncements user={currentUser} />} />
          <Route path="/announcement-approvals" element={<HODAnnouncementApproval token={token} />} />
          <Route path="/quiz-management" element={<HODQuizManagement />} />
          <Route path="/cc-management" element={<HODCCManagement />} />
          <Route path="/teaching-sections" element={<MyTeachingSections />} />
          <Route path="/video-unlock-requests" element={<HODVideoUnlockApproval token={token} user={currentUser} />} />
          <Route path="*" element={<Navigate to="/hod/dashboard" replace />} />
        </Routes>
        </Box>
      </Box>
    </Box>
    </DashboardRoleGuard>
  );
};

export default HODDashboard;
