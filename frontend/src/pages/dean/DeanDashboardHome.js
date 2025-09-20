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
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  ArrowForwardIos as ArrowForwardIosIcon
} from '@mui/icons-material';
import axios from 'axios';
import { parseJwt } from '../../utils/jwt';

const DeanDashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    school: null,
    departments: 0,
    teachers: 0,
    courses: 0,
    students: 0
  });
  
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get dean's school info
      const userRes = await axios.get(`/api/admin/users/${currentUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const schoolId = userRes.data.school;
      
      if (schoolId) {
        // Get school details
        const schoolRes = await axios.get(`/api/schools/${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Get departments in this school
        const deptRes = await axios.get(`/api/departments?school=${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Get teachers in this school
        const teacherRes = await axios.get(`/api/admin/teachers?school=${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Get courses in this school
        const courseRes = await axios.get(`/api/admin/courses?school=${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setStats({
          school: schoolRes.data,
          departments: deptRes.data.length,
          teachers: teacherRes.data.length,
          courses: courseRes.data.length,
          students: 0 // TODO: Implement student count
        });
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
                onClick={() => window.location.href = navigateTo}
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, Dean {currentUser.firstName} {currentUser.lastName}
        </Typography>
        {stats.school && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" color="textSecondary">
              {stats.school.name}
            </Typography>
            <Chip 
              label={stats.school.code} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          </Box>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Departments"
            value={stats.departments}
            icon={<SchoolIcon />}
            color="rgba(67, 97, 238, 0.2)"
            gradient="linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)"
            avatarBgColor="#4361ee"
            textColor="#1565c0"
            description="Active departments"
            navigateTo="/dean/departments"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Teachers"
            value={stats.teachers}
            icon={<PeopleIcon />}
            color="rgba(56, 176, 0, 0.2)"
            gradient="linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
            avatarBgColor="#38b000"
            textColor="#2e7d32"
            description="Faculty members"
            navigateTo="/dean/teachers"
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
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Growth"
            value="+12%"
            icon={<TrendingUpIcon />}
            color="rgba(114, 9, 183, 0.2)"
            gradient="linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)"
            avatarBgColor="#7209b7"
            textColor="#9c27b0"
            description="This semester"
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
                <Button variant="outlined" fullWidth>
                  View All Departments
                </Button>
                <Button variant="outlined" fullWidth>
                  Manage Teachers
                </Button>
                <Button variant="outlined" fullWidth>
                  Course Overview
                </Button>
                <Button variant="outlined" fullWidth>
                  Analytics Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                School Information
              </Typography>
              {stats.school ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {stats.school.name}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Code:</strong> {stats.school.code}
                  </Typography>
                  {stats.school.description && (
                    <Typography variant="body2" color="textSecondary">
                      {stats.school.description}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography color="textSecondary">
                  No school assigned to your account.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeanDashboardHome;
