import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Tooltip,
  useTheme
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SchoolIcon from '@mui/icons-material/School';
import { parseJwt } from '../utils/jwt';
import { logoutUser } from '../utils/authService';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/admin/NotificationBell';
import ProfileDialog from '../components/common/ProfileDialog';
import AnnouncementPage from './AnnouncementPage';

// Import student pages
import StudentHomeDashboard from './student/StudentHomeDashboard';
import StudentCoursesPage from './student/StudentCoursesPage';
import StudentCourseVideos from './student/StudentCourseVideos';
import StudentCourseProgress from './student/StudentCourseProgress';
// Forum page imports removed
// import StudentForumPage from './student/StudentForumPage'; - REMOVED
// import StudentForumDetailPage from './student/StudentForumDetailPage'; - REMOVED
// import StudentUnansweredForumsPage from './student/StudentUnansweredForumsPage'; - REMOVED
import StudentQuizPage from './student/StudentQuizPage';
import StudentSection from '../components/student/StudentSection';
import QuizResults from '../components/student/QuizResults';
import Footer from '../components/Footer';

const StudentDashboard = () => {
  const theme = useTheme();
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const navigate = useNavigate();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    // Any initialization logic can go here if needed
  }, [token]);

  if (!currentUser || currentUser.role !== 'student') {
    return <Navigate to="/login" />;
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
          pb: 3
        }}
      >
        <Routes>
          <Route path="/" element={<StudentHomeDashboard />} />
          <Route path="/dashboard" element={<StudentHomeDashboard />} />
          <Route path="/courses" element={<StudentCoursesPage />} />
          <Route path="/section" element={<StudentSection user={currentUser} token={token} />} />
          <Route path="/course/:courseId/videos" element={<StudentCourseVideos />} />
          <Route path="/course/:courseId/video/:videoId" element={<StudentCourseVideos />} />
          <Route path="/course/:courseId/progress" element={<StudentCourseProgress />} />
          <Route path="/quiz-results" element={<QuizResults />} />
          <Route path="/course/:courseId/quiz/:attemptId" element={<StudentQuizPage user={currentUser} token={token} />} />
          {/* Forum routes removed */}
          {/* <Route path="/forums" element={<StudentForumPage />} /> - REMOVED */}
          {/* <Route path="/forum/:forumId" element={<StudentForumDetailPage />} /> - REMOVED */}
          {/* <Route path="/unanswered-forums" element={<StudentUnansweredForumsPage />} /> - REMOVED */}
          <Route path="/announcements" element={<AnnouncementPage role="student" />} />
          <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
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

export default StudentDashboard;
