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
  Paper,
  Avatar
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  Book as BookIcon,
  SupervisorAccount as SupervisorAccountIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { parseJwt } from '../../utils/jwt';
import AssignedSectionsCard from '../../components/common/AssignedSectionsCard';

const DeanDashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    school: null,
    departments: 0,
    teachers: 0,
    courses: 0,
    students: 0,
    hods: 0
  });
  
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use the dean overview API
      const response = await axios.get('/api/dean/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats({
        school: response.data.school,
        departments: response.data.stats.departments,
        teachers: response.data.stats.teachers,
        courses: response.data.stats.courses,
        students: response.data.stats.students,
        hods: response.data.stats.hods
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, description }) => (
    <Paper
      elevation={0}
      sx={{ 
        p: 3,
        height: '100%',
        background: `linear-gradient(135deg, ${color}08 0%, ${color}18 100%)`,
        border: `2px solid ${color}25`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${color}30`,
          border: `2px solid ${color}40`,
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ 
          bgcolor: `${color}20`,
          color: color,
          width: 56,
          height: 56,
          mr: 2
        }}>
          {icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 'bold', 
            color: color,
            lineHeight: 1,
            mb: 0.5 
          }}>
            {value}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'text.secondary',
            fontWeight: 500 
          }}>
            {title}
          </Typography>
        </Box>
      </Box>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {description}
        </Typography>
      )}
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Welcome back, Dean {currentUser.firstName} {currentUser.lastName}
        </Typography>
        {stats.school && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {stats.school.name}
            </Typography>
            <Chip 
              label={stats.school.code} 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold'
              }} 
            />
          </Box>
        )}
      </Paper>

      {/* Enhanced Stats Cards */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
        School Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard
            title="Departments"
            value={stats.departments}
            icon={<SchoolIcon />}
            color="#1976d2"
            description="Active academic departments"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard
            title="Department HODs"
            value={stats.hods}
            icon={<SupervisorAccountIcon />}
            color="#7b1fa2"
            description="Assigned heads of departments"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard
            title="Faculty Members"
            value={stats.teachers}
            icon={<GroupIcon />}
            color="#2e7d32"
            description="Active teaching staff"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard
            title="Courses"
            value={stats.courses}
            icon={<BookIcon />}
            color="#ed6c02"
            description="Active course offerings"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard
            title="Students"
            value={stats.students}
            icon={<PeopleIcon />}
            color="#d32f2f"
            description="Enrolled students"
          />
        </Grid>
      </Grid>

      {/* Quick Actions and Additional Info */}
      <Grid container spacing={3}>
        {/* Assigned Sections & Classes - Full Width */}
        <Grid item xs={12}>
          <AssignedSectionsCard 
            userRole="dean"
            title="My Assigned Sections & Teaching Assignments"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Manage Departments
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Assign HODs
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                View Faculty
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Analytics Dashboard
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              School Details
            </Typography>
            {stats.school ? (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">School Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {stats.school.name}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">School Code</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {stats.school.code}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Department Coverage</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {stats.hods}/{stats.departments} departments have assigned HODs
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Faculty-Student Ratio</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    1:{Math.round(stats.students / stats.teachers)} (Teacher:Student)
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary">
                No school information available.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeanDashboardHome;
