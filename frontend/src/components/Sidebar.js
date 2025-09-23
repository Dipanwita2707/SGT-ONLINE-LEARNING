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
  { text: 'Dashboard', icon: <DashboardIcon />, path: 'dashboard', color: '#4361ee' },
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
  
  return (
    <Drawer 
      variant="permanent" 
      sx={{ 
        width: 260, 
        flexShrink: 0, 
        [`& .MuiDrawer-paper`]: { 
          width: 260, 
          boxSizing: 'border-box',
          borderRight: 0,
          boxShadow: '2px 0px 20px rgba(0, 0, 0, 0.08)',
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)'
            : 'linear-gradient(180deg, #1c2536 0%, #111827 100%)'
        } 
      }}
    >
      <Toolbar sx={{ 
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        height: 80,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        px: 2
      }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          SGT Learning
        </Typography>
      </Toolbar>
      
      {/* User profile section */}
      <Box sx={{ 
        p: 2.5, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        mb: 1.5,
        pb: 2.5,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)'
      }}>
        <Avatar 
          sx={{ 
            width: 70, 
            height: 70, 
            bgcolor: roleColor,
            mb: 1.5,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
            border: '3px solid white'
          }}
        >
          {getInitials(currentUser?.name || currentUser?.email)}
        </Avatar>
        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#333', mb: 0.5 }}>
          {currentUser?.name || currentUser?.email}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'white',
            bgcolor: roleColor,
            px: 2,
            py: 0.5,
            borderRadius: 5,
            mt: 0.5,
            fontWeight: 500,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          {roleName}
        </Typography>
      </Box>
      
      <List sx={{ px: 1 }}>
        {menu.map((item, index) => {
          const isSelected = location.pathname === `${basePath}/${item.path}`;
              
          return (
            <ListItemButton 
              key={item.text} 
              onClick={() => navigate(`${basePath}/${item.path}`)}
              sx={{ 
                my: 0.5,
                borderRadius: 2,
                py: 1.2,
                ...(isSelected && {
                  bgcolor: alpha(item.color, 0.15),
                  '&:hover': {
                    bgcolor: alpha(item.color, 0.2),
                  },
                  borderRight: `3px solid ${item.color}`,
                  pl: item.highlight ? 1 : 2
                }),
                ...(item.highlight && !isSelected && {
                  borderLeft: `3px solid ${item.color}`,
                  pl: 1,
                }),
                '&:hover': {
                  bgcolor: alpha(item.color, 0.1),
                  transform: 'translateX(4px)',
                  boxShadow: `0 4px 12px ${alpha(item.color, 0.15)}`
                },
                position: 'relative',
                transition: 'all 0.25s ease-in-out',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected ? `0 4px 10px ${alpha(item.color, 0.2)}` : 'none',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: isSelected ? 1 : 0,
                  transition: 'opacity 0.3s ease'
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: isSelected ? item.color : 'inherit',
                minWidth: 40,
                transition: 'all 0.3s ease',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box display="flex" alignItems="center">
                    <Typography
                      variant="body1"
                      sx={{ 
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? item.color : 'inherit',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {item.text}
                    </Typography>
                    {item.isNew && (
                      <Badge 
                        sx={{ 
                          ml: 1.5,
                          "& .MuiBadge-badge": {
                            fontSize: '0.6rem',
                            height: 18,
                            padding: '0 6px',
                            backgroundColor: '#ff0066',
                            color: 'white',
                            fontWeight: 'bold',
                            borderRadius: 10,
                            boxShadow: '0 2px 6px rgba(255, 0, 102, 0.4)',
                            animation: 'pulse 2s infinite'
                          },
                          '@keyframes pulse': {
                            '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 102, 0.7)' },
                            '70%': { boxShadow: '0 0 0 6px rgba(255, 0, 102, 0)' },
                            '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 102, 0)' }
                          }
                        }}
                        badgeContent="NEW"
                      />
                    )}
                    {item.badge && (
                      <Badge 
                        sx={{ 
                          ml: 1.5,
                          "& .MuiBadge-badge": {
                            fontSize: '0.6rem',
                            height: 18,
                            padding: '0 6px',
                            backgroundColor: item.color || '#2e7d32',
                            color: 'white',
                            fontWeight: 'bold',
                            borderRadius: 10,
                            boxShadow: `0 2px 6px ${alpha(item.color || '#2e7d32', 0.4)}`,
                          }
                        }}
                        badgeContent={item.badge}
                      />
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          );
        })}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Box 
        sx={{ 
          p: 2.5, 
          textAlign: 'center', 
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)',
          mt: 2
        }}
      >
        <Typography 
          variant="caption" 
          sx={{
            color: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            fontWeight: 500,
            letterSpacing: '0.5px',
            fontSize: '0.7rem'
          }}
        >
          © {new Date().getFullYear()} SGT Learning Platform
          <Box component="span" sx={{ display: 'block', mt: 0.5, color: '#6366f1', fontWeight: 600 }}>
            Version 2.0
          </Box>
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
