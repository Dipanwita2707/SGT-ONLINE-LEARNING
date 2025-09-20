import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Container, 
  Grid, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  CircularProgress, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  LinearProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { parseJwt } from '../../utils/jwt';

// Icons
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
// Forum icon import removed
// import ForumIcon from '@mui/icons-material/Forum'; - REMOVED
// Forum API import removed  
// import * as forumApi from '../../api/forumApi'; - REMOVED

const StudentHomeDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  
  const [courses, setCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  // Forum state removed
  // const [recentForums, setRecentForums] = useState([]); - REMOVED
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get student courses with progress info
        const coursesResponse = await axios.get('/api/student/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCourses(coursesResponse.data);
        
        // Get recent activity (watch history)
        const activityResponse = await axios.get('/api/student/watch-history?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setRecentActivity(activityResponse.data || []);
        
        // Forum functionality removed - no longer fetching forum data
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load your dashboard data');
        setLoading(false);
      }
    };
    
    if (token) {
      fetchData();
    }
  }, [token]);
  
  const calculateOverallProgress = () => {
    if (courses.length === 0) return 0;
    
    const totalProgress = courses.reduce((sum, course) => sum + (course.progress || 0), 0);
    return Math.round(totalProgress / courses.length);
  };
  
  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom>
        Welcome, {currentUser?.name || 'Student'}!
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* Progress Overview */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography 
                  component="h2" 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 1.5,
                    background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Your Progress
                </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculateOverallProgress()} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`${calculateOverallProgress()}%`}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <List sx={{ overflow: 'auto', flexGrow: 1, maxHeight: 180 }}>
                {courses.slice(0, 5).map((course) => (
                  <ListItem key={course._id}>
                    <ListItemText 
                      primary={course.title} 
                      secondary={`${course.progress || 0}% Complete`} 
                    />
                    <Box sx={{ width: '40%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={course.progress || 0} 
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
              
              {courses.length > 5 && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Button size="small" onClick={() => navigate('/student/courses')}>
                    View All Courses
                  </Button>
                </Box>
              )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Stats Summary */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography 
                  component="h2" 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 1.5,
                    background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Statistics
                </Typography>
                
                <Grid container spacing={1.5} sx={{ flexGrow: 1 }}>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: 2,
                        py: 1.2,
                        px: 1,
                        textAlign: 'center',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease-in-out',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.2)',
                        }
                      }}
                    >
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                          borderRadius: 1,
                          p: 0.4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 0.4,
                          width: 28,
                          height: 28,
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                          alignSelf: 'center'
                        }}
                      >
                        <VideoLibraryIcon sx={{ color: 'white', fontSize: 18 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1rem', mb: 0.2 }}>
                        {courses.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                        Courses
                      </Typography>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: 2,
                        py: 1.2,
                        px: 1,
                        textAlign: 'center',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease-in-out',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.2)',
                        }
                      }}
                    >
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                          borderRadius: 1,
                          p: 0.4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 0.4,
                          width: 28,
                          height: 28,
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                          alignSelf: 'center'
                        }}
                      >
                        <OndemandVideoIcon sx={{ color: 'white', fontSize: 18 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1rem', mb: 0.2 }}>
                        {recentActivity.reduce((total, item) => total + (item.videoCount || 0), 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                        Videos Watched
                      </Typography>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: 2,
                        py: 1.2,
                        px: 1,
                        textAlign: 'center',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease-in-out',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.2)',
                        }
                      }}
                    >
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                          borderRadius: 1,
                          p: 0.4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 0.4,
                          width: 28,
                          height: 28,
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                          alignSelf: 'center'
                        }}
                      >
                        <AccessTimeIcon sx={{ color: 'white', fontSize: 18 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1rem', mb: 0.2 }}>
                        {formatDuration(recentActivity.reduce((total, item) => total + (item.totalWatchTime || 0), 0))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                        Watch Time
                      </Typography>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: 2,
                        py: 1.2,
                        px: 1,
                        textAlign: 'center',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease-in-out',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.2)',
                        }
                      }}
                    >
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                          borderRadius: 1,
                          p: 0.4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 0.4,
                          width: 28,
                          height: 28,
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                          alignSelf: 'center'
                        }}
                      >
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1rem', mb: 0.2 }}>
                        {courses.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                        Courses
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Forum section removed */}
          {/* Recent Forums Grid item - REMOVED */}
          
          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.15)',
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  Recent Activity
                </Typography>
              
              {recentActivity.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No recent activity. Start watching videos to track your progress!
                </Typography>
              ) : (
                <List sx={{ overflow: 'auto', maxHeight: 300 }}>
                  {recentActivity.map((activity) => (
                    <ListItem key={activity._id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <OndemandVideoIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.videoTitle || 'Video'}
                        secondary={
                          <>
                            {activity.courseName || 'Course'} • 
                            Watched: {formatDuration(activity.watchTime)} • 
                            {formatDate(activity.lastWatched)}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/student/courses')}
                >
                  View All Courses
                </Button>
              </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Course Cards */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Your Courses
            </Typography>
            
            <Grid container spacing={3}>
              {courses.length === 0 ? (
                <Grid item xs={12}>
                  <Card 
                    sx={{ 
                      background: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      borderRadius: 2,
                      p: 3, 
                      textAlign: 'center' 
                    }}
                  >
                    <Typography variant="body1">
                      You don't have any courses assigned yet.
                    </Typography>
                  </Card>
                </Grid>
              ) : (
                courses.map((course) => (
                  <Grid item xs={12} sm={6} md={4} key={course._id}>
                    <Card
                      sx={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        height: '100%',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 32px rgba(25, 118, 210, 0.2)',
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" noWrap>
                          {course.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {course.courseCode}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={course.progress || 0} 
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {`${course.progress || 0}%`}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {course.videoCount || 0} videos • 
                          {formatDuration(course.totalDuration || 0)} total length
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/student/course/${course._id}/videos`)}
                        >
                          View Videos
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/student/course/${course._id}/progress`)}
                        >
                          View Progress
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default StudentHomeDashboard;
