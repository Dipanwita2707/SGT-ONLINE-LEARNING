import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Tooltip,
  useTheme 
} from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  School as SchoolIcon,
  ExitToApp as LogoutIcon, 
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { parseJwt } from '../utils/jwt';
import { logoutUser } from '../utils/authService';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/admin/NotificationBell';
import StudentRoutes from '../routes/StudentRoutes';

const StudentDashboardPage = () => {
  const theme = useTheme();
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const navigate = useNavigate();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [user, setUser] = useState(null);
  
  // Parse user from localStorage if available
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
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
      <Sidebar currentUser={currentUser || user} />
      
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
          <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Student Portal
          </Typography>
        </Box>
        
        {/* Right side - Notifications and Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
        </Box>
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              mt: 1.5,
              borderRadius: 2,
              boxShadow: theme.shadows[8]
            }
          }}
        >
          <MenuItem 
            onClick={handleLogout}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.contrastText'
              }
            }}
          >
            <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
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
          ml: { sm: '240px' }, // Account for sidebar width
          transition: 'margin 0.3s ease-in-out'
        }}
      >
        <StudentRoutes user={user || currentUser} token={token} />
      </Box>
    </Box>
  );
};

export default StudentDashboardPage;
