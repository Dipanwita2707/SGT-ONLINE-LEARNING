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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import {
  Group as GroupIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import axios from 'axios';
import { parseJwt } from '../../utils/jwt';
import { useNavigate } from 'react-router-dom';

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
  const [courseCoordinators, setCourseCoordinators] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });
  
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('/api/hod/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(res.data || []);
    } catch (e) {
      setTeachers([]);
    }
  };
  const openAssignDialog = (course) => {
    setSelectedCourse(course);
    setSelectedTeacher(null);
    setAssignDialogOpen(true);
  };

  const handleAssignCC = async () => {
    if (!selectedCourse || !selectedTeacher) return;
    setBusy(true);
    try {
      await axios.post('/api/hod/courses/cc/assign', {
        courseId: selectedCourse._id,
        userId: selectedTeacher._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnack({ open: true, severity: 'success', message: 'Coordinator assigned/updated successfully' });
      setAssignDialogOpen(false);
      await fetchDashboardData();
    } catch (e) {
      setSnack({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to assign coordinator' });
    } finally {
      setBusy(false);
    }
  };

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
      setCourseCoordinators(dashboardRes.data.courseCoordinators || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, description }) => (
    <Card sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
      border: `1px solid ${color}30`
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: `${color}20`,
            color: color,
            mr: 2
          }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: color }}>
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {description && (
          <Typography variant="body2" color="textSecondary">
            {description}
          </Typography>
        )}
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
          Welcome back, HOD {currentUser.firstName} {currentUser.lastName}
        </Typography>
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
            icon={<GroupIcon />}
            color="#2e7d32"
            description="Department faculty"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Courses"
            value={stats.courses}
            icon={<BookIcon />}
            color="#ed6c02"
            description="Active courses"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Students"
            value={stats.students}
            icon={<GroupIcon />}
            color="#1976d2"
            description="Department students"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sections"
            value={stats.sections}
            icon={<AssignmentIcon />}
            color="#9c27b0"
            description="Active sections"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<TrendingUpIcon />}
            color="#ed6c02"
            description="Awaiting review"
          />
        </Grid>
      </Grid>

      {/* Quick Actions & Department Info */}
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

      {/* Course Coordinators Table */}
      <Box sx={{ mt: 5 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Course Coordinators
            </Typography>
            {courseCoordinators.length === 0 ? (
              <Typography color="textSecondary">No course coordinators assigned yet.</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Course</th>
                      <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Course Code</th>
                      <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Coordinator Name</th>
                      <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Teacher ID</th>
                      <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseCoordinators.map(course => {
                      const hasCC = course.coordinators && course.coordinators.length > 0;
                      return hasCC ? (
                        course.coordinators.map((cc, idx) => (
                          <tr key={course._id + '-' + cc._id}>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>{course.title}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>{course.courseCode}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>{cc.name}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>{cc.email}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>{cc.teacherId}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>
                              <Button size="small" variant="outlined" onClick={() => openAssignDialog(course)}>
                                Update
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr key={course._id + '-none'}>
                          <td style={{ padding: 8, border: '1px solid #eee' }}>{course.title}</td>
                          <td style={{ padding: 8, border: '1px solid #eee' }}>{course.courseCode}</td>
                          <td style={{ padding: 8, border: '1px solid #eee' }} colSpan={3}><em>No coordinator assigned</em></td>
                          <td style={{ padding: 8, border: '1px solid #eee' }}>
                            <Button size="small" variant="contained" onClick={() => openAssignDialog(course)}>
                              Assign
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Assign/Update Coordinator Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => !busy && setAssignDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign/Update Course Coordinator</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {selectedCourse ? `Course: ${selectedCourse.title} (${selectedCourse.courseCode})` : ''}
          </Typography>
          <Autocomplete
            options={teachers}
            getOptionLabel={(opt) => `${opt.name || ''} (${opt.teacherId || opt.email || ''})`}
            onChange={(_, val) => setSelectedTeacher(val)}
            renderInput={(params) => <TextField {...params} label="Select Teacher" placeholder="Search teachers" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleAssignCC} disabled={!selectedTeacher || busy} variant="contained">Assign</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <MuiAlert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} elevation={6} variant="filled">
          {snack.message}
        </MuiAlert>
      </Snackbar>
  </Box>
  );
};

export default HODDashboardHome;
