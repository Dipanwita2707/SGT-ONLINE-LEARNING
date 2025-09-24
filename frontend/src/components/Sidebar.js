import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Divider,
  Collapse,
  ListItemButton,
  Box,
  Typography,
  Avatar,
  useTheme,
  alpha,
  Badge
} from '@mui/material';
import Chip from '@mui/material/Chip';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import { MdClass } from 'react-icons/md';
import BarChartIcon from '@mui/icons-material/BarChart';
import InsightsIcon from '@mui/icons-material/Insights';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CommentIcon from '@mui/icons-material/Comment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import FlagIcon from '@mui/icons-material/Flag';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import QuizIcon from '@mui/icons-material/Quiz';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HistoryIcon from '@mui/icons-material/History';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import GroupsIcon from '@mui/icons-material/Groups';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useNavigate, useLocation } from 'react-router-dom';
import { hasPermission } from '../utils/permissions';
import { useUserRole } from '../contexts/UserRoleContext';
import RoleSwitcher from './RoleSwitcher';

const Sidebar = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { activeRole, hasRole } = useUserRole();
  
  // CC status state for dynamic menu filtering
  const [ccStatus, setCCStatus] = useState({ isCC: false, coursesCount: 0 });
  
  // Check CC status when user role changes or component mounts
  useEffect(() => {
    const checkCCStatus = async () => {
      // Only check CC status if user has teacher role
      if (currentUser && (currentUser.role === 'teacher' || currentUser.roles?.includes('teacher'))) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/cc/status', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const status = await response.json();
            setCCStatus(status);
            console.log('🎯 CC Status Check:', status);
          } else {
            // Reset CC status on error
            setCCStatus({ isCC: false, coursesCount: 0 });
          }
        } catch (error) {
          console.error('Error checking CC status:', error);
          setCCStatus({ isCC: false, coursesCount: 0 });
        }
      } else {
        // Reset CC status for non-teachers
        setCCStatus({ isCC: false, coursesCount: 0 });
      }
    };

    checkCCStatus();
  }, [currentUser, activeRole]);
  
  // Different menus based on user role
  const adminMenu = [
  { text: 'Analytics', icon: <DashboardIcon />, path: 'dashboard', color: '#4361ee' },
  { text: 'Announcements', icon: <NotificationsActiveIcon />, path: 'announcements', color: '#1976d2' },
    { text: 'Teachers', icon: <PeopleIcon />, path: 'teachers', color: '#3a0ca3' },
    { text: 'Students', icon: <SchoolIcon />, path: 'students', color: '#7209b7' },
    { text: 'Courses', icon: <MdClass />, path: 'courses', color: '#f72585' },
    { text: 'Schools', icon: <AccountBalanceIcon />, path: 'schools', color: '#9c27b0' },
    { text: 'Departments', icon: <BusinessIcon />, path: 'departments', color: '#795548' },
    { text: 'Sections', icon: <GroupsIcon />, path: 'sections', color: '#ff5722' },
    { text: 'Deans', icon: <AccountBalanceIcon />, path: 'deans', color: '#673ab7' },
    { text: 'HODs', icon: <SupervisorAccountIcon />, path: 'hods', color: '#607d8b' },
    { text: 'Unlock Requests', icon: <AdminPanelSettingsIcon />, path: 'unlock-requests', color: '#e91e63', isNew: true },
    { text: 'Enhanced Analytics', icon: <InsightsIcon />, path: 'enhanced-analytics', color: '#4cc9f0' },
    { text: 'User Roles', icon: <SupervisorAccountIcon />, path: 'user-roles', color: '#38b000', isNew: true },
    { text: 'Role Permissions', icon: <AdminPanelSettingsIcon />, path: 'roles', color: '#607d8b' },
  ];
  
  const teacherMenu = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: 'dashboard', permission: null, color: '#4361ee' },
  { text: 'My Profile', icon: <PersonSearchIcon />, path: 'profile', permission: null, color: '#6c757d' },
  { text: 'Announcements', icon: <NotificationsActiveIcon />, path: 'announcements', permission: null, color: '#1976d2' },
  { text: 'Announcement History', icon: <HistoryIcon />, path: 'announcements/history', permission: null, color: '#ff9800' },
    { text: 'My Courses', icon: <MdClass />, path: 'courses', permission: null, color: '#f72585' },
    { text: 'My Sections', icon: <GroupsIcon />, path: 'sections', permission: null, color: '#ff5722' },
    { text: 'Live Classes', icon: <VideoCallIcon />, path: 'live-classes', permission: null, color: '#00c851', isNew: true },
    { text: 'Section Analytics', icon: <InsightsIcon />, path: 'section-analytics', permission: null, color: '#4cc9f0' },
    { text: 'Quizzes', icon: <QuizIcon />, path: 'quizzes', permission: null, color: '#e91e63' },
    { text: 'Quiz Unlock Requests', icon: <LockOpenIcon />, path: 'unlock-requests', permission: null, color: '#d32f2f', isNew: true },
    { text: 'Video Unlock Requests', icon: <VideoLibraryIcon />, path: 'video-unlock-requests', permission: null, color: '#ff6b6b', isNew: true },
    { text: 'Videos', icon: <VideoLibraryIcon />, path: 'videos', permission: 'manage_videos', color: '#7209b7' },
    { 
      text: 'Students', 
      icon: <SchoolIcon />, 
      path: 'students', 
      permission: 'manage_students', 
      color: '#3a0ca3',
      highlight: true 
    },
    { text: 'CC Management', icon: <SupervisorAccountIcon />, path: 'cc-management', permission: null, color: '#9c27b0', isNew: true },
    // Only showing the main Analytics Dashboard
    { 
      text: 'Analytics Dashboard', 
      icon: <AssessmentIcon />, 
      path: 'analytics', 
      permission: 'view_analytics', 
      color: '#38b000' 
    }
  ];
  
  const studentMenu = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: 'dashboard', color: '#4361ee' },
  { text: 'Announcements', icon: <NotificationsActiveIcon />, path: 'announcements', color: '#1976d2' },
    { text: 'My Courses', icon: <MdClass />, path: 'courses', color: '#f72585' },
    { text: 'My Section', icon: <GroupsIcon />, path: 'section', color: '#ff5722' },
    { text: 'Quiz Results', icon: <AssessmentIcon />, path: 'quiz-results', color: '#9c27b0' },
    { text: 'Live Classes', icon: <VideoCallIcon />, path: 'live-classes', color: '#00c851', isNew: true },
    { text: 'Videos', icon: <VideoLibraryIcon />, path: 'videos', color: '#7209b7' },
  ];
  
  // Dean menu
  const deanMenu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: 'dashboard', color: '#4361ee' },
    { text: 'Announcements', icon: <NotificationsActiveIcon />, path: 'announcements', color: '#1976d2' },
    { text: 'Unlock Requests', icon: <LockOpenIcon />, path: 'unlock-requests', color: '#d32f2f', isNew: true },
    { text: 'School Management', icon: <SupervisorAccountIcon />, path: 'school-management', color: '#6a1b9a' },
    { text: 'Departments', icon: <BusinessIcon />, path: 'departments', color: '#795548' },
    { text: 'Sections', icon: <GroupsIcon />, path: 'sections', color: '#ff5722' },
    { text: 'My Teaching Sections', icon: <SchoolIcon />, path: 'teaching-sections', color: '#2e7d32', badge: 'Teaching' },
    { text: 'Teachers', icon: <PeopleIcon />, path: 'teachers', color: '#3a0ca3' },
    { text: 'Analytics', icon: <BarChartIcon />, path: 'analytics', color: '#4cc9f0' },
  ];

  // CC menu
  const ccMenu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: 'dashboard', color: '#4361ee' },
    { text: 'Pending Reviews', icon: <AssignmentIcon />, path: 'reviews', color: '#ff9800' },
  ];

  // HOD menu
  const hodMenu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: 'dashboard', color: '#4361ee' },
    { text: 'Announcements', icon: <NotificationsActiveIcon />, path: 'announcements', color: '#1976d2' },
    { text: 'Announcement Approvals', icon: <AssignmentIcon />, path: 'announcement-approvals', color: '#ff9800' },
    { text: 'Video Unlock Requests', icon: <VideoLibraryIcon />, path: 'video-unlock-requests', color: '#d32f2f', isNew: true },
    { text: 'Quiz Management', icon: <QuizIcon />, path: 'quiz-management', color: '#e91e63' },
    { text: 'CC Management', icon: <SupervisorAccountIcon />, path: 'cc-management', color: '#9c27b0', isNew: true },
    { text: 'Sections', icon: <GroupsIcon />, path: 'sections', color: '#ff5722' },
    { text: 'My Teaching Sections', icon: <SchoolIcon />, path: 'teaching-sections', color: '#2e7d32', badge: 'Teaching' },
    { text: 'Teachers', icon: <PeopleIcon />, path: 'teachers', color: '#3a0ca3' },
    { text: 'Courses', icon: <MdClass />, path: 'courses', color: '#f72585' },
    { text: 'Analytics', icon: <BarChartIcon />, path: 'analytics', color: '#4cc9f0' },
  ];

  // Select menu based on active role (from context) or fallback to user role
  const currentRole = activeRole || currentUser?.role || currentUser?.primaryRole;
  let menu = [];
  let basePath = '';
  let roleName = '';
  let roleColor = '';
  
  console.log('🎯 Sidebar Role Selection:', {
    activeRole,
    userRole: currentUser?.role,
    primaryRole: currentUser?.primaryRole,
    selectedRole: currentRole
  });
  
  // Use strict role matching based on activeRole to prevent menu conflicts
  if (currentRole === 'admin' || currentRole === 'superadmin') {
    menu = adminMenu;
    basePath = '/admin';
    roleName = currentRole === 'superadmin' ? 'Super Admin' : 'Administrator';
    roleColor = currentRole === 'superadmin' ? '#7b1fa2' : '#3a0ca3';
  } else if (currentRole === 'dean') {
    menu = deanMenu;
    basePath = '/dean';
    roleName = 'Dean';
    roleColor = '#7b1fa2';
  } else if (currentRole === 'hod') {
    menu = hodMenu;
    basePath = '/hod';
    roleName = 'HOD';
    roleColor = '#c2185b';
  } else if (currentRole === 'teacher' || currentRole === 'cc') {
    // Filter teacher menu based on permissions and CC status
    menu = teacherMenu.filter(item => {
      // Special case: Hide CC Management if user is not currently a CC
      if (item.path === 'cc-management' && !ccStatus.isCC) {
        return false;
      }
      
      // Include if permission is null (always show) or user has the permission
      return item.permission === null || 
        (currentUser.permissions && hasPermission(currentUser, item.permission));
    });
    basePath = '/teacher';
    // Update role name based on actual CC status, not just activeRole
    roleName = ccStatus.isCC ? `Course Coordinator (${ccStatus.coursesCount} course${ccStatus.coursesCount !== 1 ? 's' : ''})` : 'Teacher';
    roleColor = ccStatus.isCC ? '#00796b' : '#38b000';
  } else if (currentRole === 'student') {
    menu = studentMenu;
    basePath = '/student';
    roleName = 'Student';
    roleColor = '#4cc9f0';
  }

  // Get initials for the avatar
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  // Determine dashboard title per role for the header brand
  const dashboardTitle = (
    currentRole === 'admin' || currentRole === 'superadmin' ? 'Admin Dashboard' :
    currentRole === 'dean' ? 'Dean Dashboard' :
    currentRole === 'hod' ? 'HOD Dashboard' :
    (currentRole === 'teacher' || currentRole === 'cc') ? 'Teacher Dashboard' :
    currentRole === 'student' ? 'Student Dashboard' : 'Dashboard'
  );

  const primaryDisplayName = currentUser?.name || (
    (currentRole === 'admin' || currentRole === 'superadmin') ? 'Admin' : roleName
  );

  return (
    <Drawer 
      variant="permanent" 
      sx={{ 
        width: 230, 
        flexShrink: 0, 
        [`& .MuiDrawer-paper`]: { 
          width: 230, 
          boxSizing: 'border-box',
          borderRight: 'none',
          boxShadow: '4px 0 8px rgba(0, 0, 0, 0.05)',
          borderRadius: 0,
          backgroundColor: '#0d1f44',
          backgroundImage: 'linear-gradient(180deg, #0d1f44 0%, #0f2f6b 50%, #0b214f 100%)',
          position: 'fixed',
          height: '100vh',
          zIndex: 1200,
          overflowY: 'auto',
          // Smooth, dark, thin scrollbar that blends with the sidebar
          scrollbarWidth: 'thin', // Firefox
          scrollbarColor: 'rgba(255,255,255,0.25) transparent', // Firefox
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: 8,
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(255,255,255,0.35)'
          }
        } 
      }}
    >
      {/* Logo Section - Compact Professional Design */}
      <Box sx={{ 
        height: 56,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box 
            sx={{ 
              width: 24, 
              height: 24, 
              backgroundColor: '#3b82f6',
              borderRadius: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ 
              width: 12, 
              height: 12, 
              backgroundColor: 'white',
              borderRadius: 0.5
            }} />
          </Box>
          <Typography variant="h6" sx={{ 
            color: 'white', 
            fontWeight: 600,
            fontSize: '16px',
            letterSpacing: '0.5px'
          }}>
            {dashboardTitle}
          </Typography>
        </Box>
      </Box>
      
      {/* User Profile Section - Compact */}
      <Box sx={{ 
        px: 2,
        py: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: '#3b82f6',
              color: 'white',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            {getInitials(currentUser?.name || currentUser?.email)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ 
              color: 'white', 
              mb: 0.5,
              fontSize: '13px',
              lineHeight: 1.2
            }}>
              {primaryDisplayName}
            </Typography>
            <Chip 
              size="small" 
              label={(currentRole === 'admin' || currentRole === 'superadmin' ? 'Administrator' : currentRole || 'User').toString().toUpperCase()} 
              sx={{ 
                height: 18,
                fontSize: '10px',
                color: 'rgba(255,255,255,0.8)',
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                '& .MuiChip-label': { px: 0.75, py: 0.25 }
              }}
            />
          </Box>
        </Box>
      </Box>
      
      {/* Navigation Menu - Professional and Compact */}
      <List sx={{ px: 1.5, py: 0.5, flex: 1 }}>
        {menu.map((item, index) => {
          // Highlight as selected for exact and nested paths (e.g., announcements/history)
          const target = `${basePath}/${item.path}`;
          const atRoot = location.pathname === basePath || location.pathname === `${basePath}/`;
          const isDashboardItem = item.path === 'dashboard';
          const isSelected = atRoot ? isDashboardItem : (location.pathname === target || location.pathname.startsWith(`${target}/`));
          const iconBg = `${item.color}33`; // ~20% opacity
          const iconBorder = `${item.color}55`;
              
          return (
            <ListItemButton 
              key={item.text} 
              onClick={() => navigate(`${basePath}/${item.path}`)}
              sx={{ 
                mb: 0.75,
                borderRadius: '14px',
                py: 1.2,
                px: 1.75,
                minHeight: 48,
                color: isSelected ? 'white' : 'rgba(255,255,255,0.85)',
                backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: isSelected ? `1px solid ${iconBorder}` : '1px solid transparent',
                boxShadow: isSelected 
                  ? '0 10px 26px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : 'none',
                '&:hover': {
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
                  color: 'white'
                },
                transition: 'all 0.2s ease',
                position: 'relative',
                '&::before': isSelected ? {
                  content: '""',
                  position: 'absolute',
                  left: -8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 4,
                  height: 36,
                  background: `linear-gradient(180deg, rgba(59,130,246,0.0) 0%, ${item.color || '#3b82f6'} 50%, rgba(59,130,246,0.0) 100%)`,
                  filter: 'blur(2px)',
                  borderRadius: 6
                } : {},
                '&::after': isSelected ? {
                  content: '""',
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: '60%',
                  backgroundColor: item.color || '#3b82f6',
                  borderRadius: 3,
                  boxShadow: `0 0 12px ${item.color}AA`
                } : {}
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 38,
                mr: 1,
                fontSize: '18px',
                color: 'inherit'
              }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${isSelected ? iconBorder : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.9)'
                  }}
                >
                  {item.icon}
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography
                    variant="body2"
                    sx={{ 
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.9rem',
                      letterSpacing: '0.2px'
                    }}
                  >
                    {item.text}
                  </Typography>
                }
              />
              {/* Right bubble removed to match clean design; using thin right accent via ::after */}
              {item.isNew && (
                <Box
                  sx={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    px: 1,
                    py: 0.2,
                    borderRadius: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  NEW
                </Box>
              )}
            </ListItemButton>
          );
        })}
      </List>
      
      {/* Professional Footer */}
      <Box 
        sx={{ 
          p: 3, 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.1)',
          mt: 'auto'
        }}
      >
        <Typography 
          variant="caption" 
          sx={{
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 500,
            letterSpacing: '0.5px',
            fontSize: '0.7rem',
            textAlign: 'center',
            display: 'block'
          }}
        >
          © {new Date().getFullYear()} SGT University
          <Box component="span" sx={{ 
            display: 'block', 
            mt: 0.5, 
            color: 'rgba(255,255,255,0.8)', 
            fontWeight: 600 
          }}>
            Learning Management System
          </Box>
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
