import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Badge, 
  Tooltip
} from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  School as TeacherIcon
} from '@mui/icons-material';
import { parseJwt } from '../utils/jwt';
import { logoutUser } from '../utils/authService';
import Sidebar from '../components/Sidebar';
import TeacherRoutes from '../routes/TeacherRoutes';

const TeacherDashboardPage = () => {
  const [token] = useState(localStorage.getItem('token'));
  const currentUser = parseJwt(token);
  const navigate = useNavigate();
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnread, setPrevUnread] = useState(0);
  const [blink, setBlink] = useState(false);
  const [annBlink, setAnnBlink] = useState(false);
  
  // Menu state
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  // Parse user from localStorage if available
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        // User data is already parsed in currentUser from token
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  // Poll unread notifications
  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await axios.get('/api/notifications/unread-count', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const count = res.data.unread || 0;
        setUnreadCount(count);
        
        if (count > prevUnread) {
          setBlink(true);
          setTimeout(() => setBlink(false), 5000);
        }
        setPrevUnread(count);
        
        if (count > 0) {
          const listRes = await axios.get('/api/notifications?page=1&limit=50', { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          const list = listRes.data.notifications || listRes.data || [];
          const hasAnn = list.some(n => !n.read && n.type === 'announcement');
          setAnnBlink(hasAnn);
        } else {
          setAnnBlink(false);
        }
      } catch (e) { 
        console.error('Error fetching notifications:', e);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [token, prevUnread]);

  // If no token or not a teacher, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const openNotifications = async (e) => {
    setNotifAnchor(e.currentTarget);
    try {
      const res = await axios.get('/api/notifications', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const list = res.data.notifications || res.data || [];
      setNotifications(list);
      if (unreadCount > 0) {
        await axios.patch('/api/notifications/mark-all/read', {}, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setUnreadCount(0);
        setAnnBlink(false);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
  };

  const closeNotifications = () => setNotifAnchor(null);

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

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
      
      {/* Full-width Fixed Header */}
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0,
        right: 0, 
        zIndex: 1400,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        px: 3
      }}>
        {/* Left side - Logo/Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TeacherIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Teacher Portal
          </Typography>
        </Box>

        {/* Right side - User actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Notification Bell */}
          <style>{`
            @keyframes bellPulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.25); }
              100% { transform: scale(1); }
            }
            @keyframes annGlow {
              0% { box-shadow: 0 0 0 0 rgba(255,0,0,0.7); }
              70% { box-shadow: 0 0 0 14px rgba(255,0,0,0); }
              100% { box-shadow: 0 0 0 0 rgba(255,0,0,0); }
            }
          `}</style>
          <Tooltip title="Notifications">
            <IconButton 
              onClick={openNotifications} 
              sx={{ 
                color: 'primary.main',
                ...(blink ? { animation: 'bellPulse 1s ease-in-out infinite' } : {}),
                ...(annBlink ? { position: 'relative', animation: 'annGlow 1.6s infinite' } : {})
              }}
            >
              <Badge 
                color="error" 
                badgeContent={unreadCount > 99 ? '99+' : unreadCount} 
                invisible={unreadCount === 0}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <IconButton onClick={handleUserMenuOpen} sx={{ color: 'primary.main' }}>
            <AccountIcon />
          </IconButton>
        </Box>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={closeNotifications}
          PaperProps={{ sx: { maxHeight: 400, width: 320 } }}
        >
          {notifications.length === 0 && <MenuItem disabled>No notifications</MenuItem>}
          {notifications.slice(0, 50).map(n => (
            <MenuItem key={n._id} onClick={closeNotifications} sx={!n.read ? { fontWeight: 600 } : {}}>
              <Box>
                <Typography variant="body2">{n.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleUserMenuClose}>
            <AccountIcon sx={{ mr: 1 }} />
            My Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          pt: 10, // Add top padding to account for fixed header (64px + margin)
          pl: 3,
          pr: 3,
          pb: 3,
          background: 'transparent' // Ensure no background color
        }}
      >
        <TeacherRoutes user={currentUser} token={token} />
      </Box>
    </Box>
  );
};

export default TeacherDashboardPage;
