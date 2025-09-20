import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Tooltip, 
  Typography,
  useTheme 
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import School from '@mui/icons-material/School';
import { parseJwt } from '../utils/jwt';
import { hasPermission } from '../utils/permissions';
import { logoutUser } from '../utils/authService';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import NotificationBell from '../components/admin/NotificationBell';
import ProfileDialog from '../components/common/ProfileDialog';

// Import Teacher Dashboard components
import TeacherDashboardHome from './teacher/TeacherDashboardHome';
import TeacherCourses from './teacher/TeacherCourses';
import TeacherCourseDetail from './teacher/TeacherCourseDetail';
import TeacherVideos from './teacher/TeacherVideos';
import TeacherStudents from './teacher/TeacherStudents';
// Forum imports removed
// import TeacherForums from './teacher/TeacherForums'; - REMOVED
// import TeacherForumDetail from './teacher/TeacherForumDetail'; - REMOVED
import TeacherAnalytics from './teacher/TeacherAnalytics';
import TeacherQuizzes from './teacher/TeacherQuizzes';
import QuizAnalytics from './teacher/QuizAnalytics';
import TeacherSections from '../components/teacher/TeacherSections';
import TeacherSectionAnalytics from '../components/teacher/TeacherSectionAnalytics';
import TeacherProfile from '../components/TeacherProfile';
import TeacherAnnouncementHistory from '../components/teacher/TeacherAnnouncementHistory';
import UnauthorizedPage from './UnauthorizedPage';
import AnnouncementPage from './AnnouncementPage';

const TeacherDashboard = () => {
  const theme = useTheme();
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  useEffect(() => {
    // Any initialization logic can go here if needed
  }, [token]);

  // Allow both teacher and admin users to access the teacher dashboard
  if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
    return <Navigate to="/login" />;
  }

  // Auto-redirect to dashboard if at the root teacher path
  if (location.pathname === '/teacher') {
    return <Navigate to="/teacher/dashboard" replace />;
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
  
  // Logout handler
  const handleLogout = async () => {
    handleUserMenuClose();
    const result = await logoutUser();
    if (result.success) {
      navigate('/login');
    }
  };

  // Create a protected route component that checks permissions
  const PermissionRoute = ({ element, permission }) => {
    // If no permission is required or user has permission, render the element
    if (!permission || hasPermission(currentUser, permission)) {
      return element;
    }
    // Otherwise, render the unauthorized page
    return <UnauthorizedPage />;
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
          <School sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Teacher Portal
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
            onClick={handleProfileOpen}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText'
              }
            }}
          >
            <PersonIcon sx={{ mr: 1.5, fontSize: 20 }} />
            My Profile
          </MenuItem>
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
          background: 'transparent' // Ensure no background color
        }}
      >
        <Routes>
          <Route path="/dashboard" element={<TeacherDashboardHome />} />
          <Route path="/profile" element={<TeacherProfile />} />
          <Route path="/courses" element={<TeacherCourses />} />
          <Route path="/sections" element={<TeacherSections user={currentUser} token={token} />} />
          <Route path="/section-analytics" element={<TeacherSectionAnalytics user={currentUser} token={token} />} />
          <Route path="/course/:courseId" element={<TeacherCourseDetail />} />
          <Route path="/videos" element={<PermissionRoute element={<TeacherVideos />} permission="manage_videos" />} />
          <Route path="/students" element={<PermissionRoute element={<TeacherStudents />} permission="manage_students" />} />
          {/* Forum routes removed */}
          {/* <Route path="/forums" element={<TeacherForums />} /> - REMOVED */}
          {/* <Route path="/forum/:forumId" element={<TeacherForumDetail />} /> - REMOVED */}
          <Route path="/quizzes" element={<TeacherQuizzes />} />
          <Route path="/quiz-analytics/:quizId" element={<QuizAnalytics />} />
          <Route path="/announcements" element={<AnnouncementPage role="teacher" teacherCourses={[]} userId={currentUser?._id} />} />
          <Route path="/announcements/history" element={<TeacherAnnouncementHistory token={token} />} />
          {/* Redirecting student-analytics to the main analytics dashboard */}
          <Route path="/student-analytics" element={<Navigate to="/analytics" replace />} />
          <Route path="/analytics" element={<PermissionRoute element={<TeacherAnalytics viewType="course" />} permission="view_analytics" />} />
          <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
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

export default TeacherDashboard;
