import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Button,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  ArrowForwardIos as ArrowForwardIosIcon
} from '@mui/icons-material';
import axios from 'axios';
import { parseJwt } from '../../utils/jwt';
import { useNavigate } from 'react-router-dom';
import GroupChatButton from '../../components/chat/GroupChatButton';
import GroupChatPanel from '../../components/chat/GroupChatPanel';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const HODDashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    department: null,
    school: null,
    teachers: 0,
    courses: 0,
    students: 0,
    sections: 0,
    pendingApprovals: 0
  });

  const [hodCourses, setHodCourses] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState(null); // { courseId, sectionId, courseTitle }

  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const navigate = useNavigate();
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get HOD dashboard data from correct endpoint
      const dashboardRes = await axios.get('/api/hod/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats({
        department: dashboardRes.data.department,
        school: dashboardRes.data.department?.school,
        teachers: dashboardRes.data.statistics.teachers,
        courses: dashboardRes.data.statistics.courses,
        students: dashboardRes.data.statistics.students,
        sections: dashboardRes.data.statistics.sections,
        pendingApprovals: dashboardRes.data.statistics.pendingApprovals
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      // Fetch HOD courses to supply chat context (reuse /api/hod/courses)
      try {
        const coursesRes = await axios.get('/api/hod/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = coursesRes.data.courses || [];
        const normalized = list.map(c => ({
          ...c,
          // Prefer explicit sectionId field (added in backend), fallback gracefully
          sectionId: c.sectionId || (c.section && c.section._id) || c.section || null,
          title: c.title || c.courseTitle || 'Untitled Course'
        }));
        setHodCourses(normalized);
        const first = normalized.find(c => c.sectionId && c._id);
        if (first) {
          setChatContext({ courseId: first._id, sectionId: first.sectionId, courseTitle: first.title || 'Course' });
        } else {
          console.warn('[HOD DASHBOARD] No eligible course with sectionId found for chat context');
        }
        console.debug('[HOD DASHBOARD] Loaded courses for chat:', normalized.map(c => ({ id: c._id, title: c.title, sectionId: c.sectionId })));
        console.debug('[HOD DASHBOARD] Initial chatContext:', first ? { courseId: first._id, sectionId: first.sectionId, title: first.title } : null);
      } catch (e) {
        console.warn('Failed to load HOD courses for chat context:', e?.response?.data || e.message);
      }
    }
  };

  const StatCard = ({ title, value, icon, color, description, gradient, avatarBgColor, textColor, navigateTo }) => (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        borderRadius: 2,
        background: gradient,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 8px 16px ${color}`,
        }
      }}
    >
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        gap: 1,
        p: 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          width: '100%',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: avatarBgColor, mr: 2 }}>
              {icon}
            </Avatar>
            <Typography variant="h6" fontWeight={500}>{title}</Typography>
          </Box>
          {navigateTo && (
            <Tooltip title={`View all ${title.toLowerCase()}`}>
              <IconButton 
                color="primary" 
                onClick={() => navigate(navigateTo)}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.6)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            color: textColor,
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, HOD {currentUser.firstName} {currentUser.lastName}
        </Typography>
        {/* Course selector for chat context (only show if multiple eligible) */}
        {hodCourses.filter(c => c.sectionId).length > 1 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="hod-chat-course-label">Chat Course</InputLabel>
            <Select
              labelId="hod-chat-course-label"
              label="Chat Course"
              value={chatContext?.courseId || ''}
              onChange={(e) => {
                const sel = hodCourses.find(c => c._id === e.target.value);
                if (sel && sel.sectionId) {
                  setChatContext({ courseId: sel._id, sectionId: sel.sectionId, courseTitle: sel.title });
                }
              }}
            >
              {hodCourses.filter(c => c.sectionId).map(c => (
                <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {chatContext?.sectionId && (
          <GroupChatButton size="small" onClick={() => setChatOpen(true)} />
        )}
        {stats.department && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" color="textSecondary">
              {stats.department.name}
            </Typography>
            <Chip 
              label={stats.department.code} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
            {stats.school && (
              <Typography variant="body2" color="textSecondary">
                • {stats.school.name}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Teachers"
            value={stats.teachers}
            icon={<PeopleIcon />}
            color="rgba(56, 176, 0, 0.2)"
            gradient="linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
            avatarBgColor="#38b000"
            textColor="#2e7d32"
            description="Department faculty"
            navigateTo="/hod/teachers"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Courses"
            value={stats.courses}
            icon={<MenuBookIcon />}
            color="rgba(255, 158, 0, 0.2)"
            gradient="linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)"
            avatarBgColor="#ff9e00"
            textColor="#ed6c02"
            description="Active courses"
            navigateTo="/hod/courses"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Students"
            value={stats.students}
            icon={<GroupIcon />}
            color="rgba(67, 97, 238, 0.2)"
            gradient="linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)"
            avatarBgColor="#4361ee"
            textColor="#1565c0"
            description="Department students"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sections"
            value={stats.sections}
            icon={<AssignmentIcon />}
            color="rgba(114, 9, 183, 0.2)"
            gradient="linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)"
            avatarBgColor="#7209b7"
            textColor="#9c27b0"
            description="Active sections"
            navigateTo="/hod/sections"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pendingApprovals}
            icon={<TrendingUpIcon />}
            color="rgba(255, 158, 0, 0.2)"
            gradient="linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)"
            avatarBgColor="#ff9e00"
            textColor="#ed6c02"
            description="Awaiting review"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" fullWidth onClick={() => navigate('/hod/teachers')}>
                  Manage Teachers
                </Button>
                <Button variant="outlined" fullWidth onClick={() => navigate('/hod/courses')}>
                  View Courses
                </Button>
                <Button variant="outlined" fullWidth onClick={() => navigate('/hod/analytics')}>
                  Department Analytics
                </Button>
                <Button variant="contained" fullWidth onClick={() => navigate('/hod/announcements')} sx={{ bgcolor: '#1976d2' }}>
                  Create Announcement
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Department Information
              </Typography>
              {stats.department ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Department:</strong> {stats.department.name}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Code:</strong> {stats.department.code}
                  </Typography>
                  {stats.school && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>School:</strong> {stats.school.name}
                    </Typography>
                  )}
                  {stats.department.description && (
                    <Typography variant="body2" color="textSecondary">
                      {stats.department.description}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography color="textSecondary">
                  No department assigned to your account.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <GroupChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        courseId={chatContext?.courseId}
        sectionId={chatContext?.sectionId}
        title={chatContext && chatContext.courseTitle ? `Group Chat • ${chatContext.courseTitle}` : 'Group Chat'}
        currentUser={currentUser}
      />
    </Box>
  );
};

export default HODDashboardHome;
