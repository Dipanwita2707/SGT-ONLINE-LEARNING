import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, Toolbar, IconButton, Menu, MenuItem, Tooltip, Typography, useTheme } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SchoolIcon from '@mui/icons-material/School';
import { parseJwt } from '../utils/jwt';
import { logoutUser } from '../utils/authService';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import NotificationBell from '../components/admin/NotificationBell';
import ProfileDialog from '../components/common/ProfileDialog';
import AnnouncementManagementPage from './AnnouncementManagementPage';

// Import Dean Dashboard components
import DeanDashboardHome from './dean/DeanDashboardHome';
import DeanDepartments from './dean/DeanDepartments';
import DeanTeachers from './dean/DeanTeachers';
import DeanAnalytics from './dean/DeanAnalytics';
import DeanSchoolManagement from './dean/DeanSchoolManagement';
import DeanSectionAnalytics from './dean/DeanSectionAnalytics';

const DeanDashboard = () => {
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Allow only dean users to access the dean dashboard
  if (!currentUser || currentUser.role !== 'dean') {
    return <Navigate to="/login" />;
  }

  // Auto-redirect to dashboard if at the root dean path
  if (location.pathname === '/dean') {
    return <Navigate to="/dean/dashboard" replace />;
  }

  // User menu handlers
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // Profile dialog handlers
  const handleProfileOpen = () => {
    setProfileDialogOpen(true);
    handleUserMenuClose();
  };
  
  const handleProfileClose = () => {
    setProfileDialogOpen(false);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'relative'
    }}>
      {/* Main Dashboard Content */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden'
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
          <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Dean Portal
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
          <MenuItem onClick={handleProfileOpen}>
            <PersonIcon sx={{ mr: 1 }} />
            My Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>

      <Toolbar />
      
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Routes>
          <Route path="/dashboard" element={<DeanDashboardHome />} />
          <Route path="/departments" element={<DeanDepartments />} />
          <Route path="/sections" element={<DeanSectionAnalytics />} />
          <Route path="/school-management" element={<DeanSchoolManagement />} />
          <Route path="/teachers" element={<DeanTeachers />} />
          <Route path="/analytics" element={<DeanAnalytics />} />
          <Route path="/announcements" element={<AnnouncementManagementPage />} />
          <Route path="*" element={<Navigate to="/dean/dashboard" replace />} />
        </Routes>
      </Box>
      </Box>
      
      {/* Footer - positioned at the bottom of the page */}
      <Footer />
      
      {/* Profile Dialog */}
      <ProfileDialog 
        open={profileDialogOpen}
        onClose={handleProfileClose}
        user={currentUser}
      />
    </Box>
  );
};

export default DeanDashboard;
