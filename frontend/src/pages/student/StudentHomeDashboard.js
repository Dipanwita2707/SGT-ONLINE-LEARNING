import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Container, 
  Grid, 
  Paper, 
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
  LinearProgress,
  Alert,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUser } from '../../utils/authService';
// import { getAllDeadlineWarnings } from '../../api/studentVideoApi';

// Icons
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';

const StudentHomeDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const currentUser = getCurrentUser(); // Use getCurrentUser instead of parseJwt
  
  const [courses, setCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [deadlineWarnings, setDeadlineWarnings] = useState(null);
  const [deadlineLoading, setDeadlineLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalCourses: 0,
    totalVideos: 0,
    videosWatched: 0,
    totalWatchTime: 0,
    completedQuizzes: 0,
    averageScore: 0
  });
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
        
        // Calculate initial statistics from courses
        const stats = {
          totalCourses: coursesResponse.data.length,
          totalVideos: coursesResponse.data.reduce((sum, course) => sum + (course.totalVideos || course.videoCount || 0), 0),
          videosWatched: 0, // Will be calculated from watch history
          totalWatchTime: 0, // Will be calculated from watch history
          completedQuizzes: 0, // Will be calculated from quiz data
          averageScore: 0
        };
        
        setStatistics(stats);
        
        // Get recent activity (watch history) and calculate accurate statistics
        try {
          const activityResponse = await axios.get('/api/student/watch-history', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const watchHistoryData = activityResponse.data || [];
          setRecentActivity(watchHistoryData);
          
          // Calculate accurate statistics from watch history
          let totalVideosWatched = 0;
          let totalWatchTimeAccumulated = 0;
          
          // Create a map of course watch data for easy lookup
          const courseWatchMap = {};
          
          watchHistoryData.forEach(courseHistory => {
            if (courseHistory.videos && Array.isArray(courseHistory.videos)) {
              const courseId = courseHistory.courseId;
              const watchedVideosInCourse = courseHistory.videos.filter(video => video.timeSpent > 0).length;
              const courseWatchTime = courseHistory.totalTimeSpent || 0;
              
              courseWatchMap[courseId] = {
                videosWatched: watchedVideosInCourse,
                totalWatchTime: courseWatchTime,
                videos: courseHistory.videos
              };
              
              totalVideosWatched += watchedVideosInCourse;
              totalWatchTimeAccumulated += courseWatchTime;
            }
          });
          
          // Enhance course data with watch information
          const enhancedCourses = coursesResponse.data.map(course => {
            const watchData = courseWatchMap[course._id];
            if (watchData) {
              // Calculate enhanced progress based on videos watched
              const videoProgress = course.totalVideos > 0 ? 
                Math.round((watchData.videosWatched / course.totalVideos) * 100) : 0;
              
              return {
                ...course,
                enhancedProgress: Math.max(course.progress || 0, videoProgress),
                actualVideosWatched: watchData.videosWatched,
                actualWatchTime: watchData.totalWatchTime,
                watchedVideos: watchData.videos
              };
            }
            return course;
          });
          
          setCourses(enhancedCourses);
          
          console.log('🔍 Debug - Enhanced Courses:', enhancedCourses);
          
          // Update statistics with accurate data
          console.log('🔍 Debug - Watch Statistics:', {
            totalVideosWatched,
            totalWatchTimeAccumulated,
            courseWatchMap
          });
          
          setStatistics(prev => ({
            ...prev,
            videosWatched: totalVideosWatched,
            totalWatchTime: totalWatchTimeAccumulated
          }));
          
        } catch (activityErr) {
          console.error('Error fetching watch history:', activityErr);
          setRecentActivity([]);
        }
        
        // Get quiz results for completed quizzes count
        try {
          const quizResponse = await axios.get('/api/student/quiz-results', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (quizResponse.data && quizResponse.data.attempts) {
            const quizAttempts = quizResponse.data.attempts;
            const completedQuizzes = quizAttempts.length;
            const averageScore = quizResponse.data.summary?.averageScore || 0;
            
            setStatistics(prev => ({
              ...prev,
              completedQuizzes,
              averageScore: Math.round(averageScore)
            }));
          } else if (quizResponse.data && Array.isArray(quizResponse.data)) {
            // Fallback for old format
            const quizResults = quizResponse.data;
            const completedQuizzes = quizResults.length;
            const averageScore = quizResults.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / completedQuizzes;
            
            setStatistics(prev => ({
              ...prev,
              completedQuizzes,
              averageScore: Math.round(averageScore)
            }));
          }
        } catch (quizErr) {
          console.error('Error fetching quiz results:', quizErr);
        }
        
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

  // Fetch deadline warnings separately
  useEffect(() => {
    const fetchDeadlineWarnings = async () => {
      try {
        console.log('🔍 StudentHomeDashboard: Fetching deadline warnings...');
        if (token) {
          console.log('📞 Making API call to getAllDeadlineWarnings...');
          // const warnings = await getAllDeadlineWarnings(token);
          // console.log('📋 Received deadline warnings:', warnings);
          // setDeadlineWarnings(warnings);
          setDeadlineWarnings({ deadlineWarnings: [], summary: { total: 0, expired: 0, upcoming: 0 } });
        }
      } catch (error) {
        console.error('❌ Error fetching deadline warnings:', error);
        setDeadlineWarnings({ deadlineWarnings: [], summary: { total: 0, expired: 0, upcoming: 0 } });
      } finally {
        console.log('✅ Setting deadlineLoading to false');
        setDeadlineLoading(false);
      }
    };

    if (token) {
      fetchDeadlineWarnings();
    }
  }, [token]);
  
  const calculateOverallProgress = () => {
    if (courses.length === 0) return 0;
    
    // Use enhanced progress if available, otherwise fall back to course progress
    const totalProgress = courses.reduce((sum, course) => {
      const progressValue = course.enhancedProgress !== undefined ? 
        course.enhancedProgress : (course.progress || 0);
      return sum + progressValue;
    }, 0);
    
    const averageProgress = totalProgress / courses.length;
    return Math.round(Math.min(averageProgress, 100));
  };
  
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0m';
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
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
      {/* Student Dashboard with personalized welcome */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ 
          background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          fontWeight: 'bold',
          mb: 1
        }}>
          Welcome back, {currentUser?.name || 'Student'}!
        </Typography>
        
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Continue your learning journey
        </Typography>
      </Box>

      {/* Deadline Warnings Section */}
      {console.log('🎨 Rendering deadline section. deadlineLoading:', deadlineLoading, 'deadlineWarnings:', deadlineWarnings)}
      {deadlineLoading ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Loading deadline information...
        </Alert>
      ) : deadlineWarnings && deadlineWarnings.summary.total > 0 && (
        <Alert 
          severity={deadlineWarnings.summary.expired > 0 ? "error" : "warning"} 
          sx={{ mb: 3 }}
          icon={<WarningIcon />}
        >
          <Typography variant="h6" gutterBottom>
            {deadlineWarnings.summary.expired > 0 ? "⚠️ Urgent Deadline Alerts!" : "📅 Upcoming Deadlines"}
          </Typography>
          <Typography variant="body2" paragraph>
            You have {deadlineWarnings.summary.total} deadline{deadlineWarnings.summary.total !== 1 ? 's' : ''} requiring attention
            {deadlineWarnings.summary.expired > 0 && (
              <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                {' '}({deadlineWarnings.summary.expired} expired!)
              </span>
            )}
          </Typography>
          <List dense>
            {deadlineWarnings.deadlineWarnings.slice(0, 3).map((warning) => (
              <ListItem key={`${warning.course._id}-${warning.unit._id}`}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2">
                        {warning.course.title} - {warning.unit.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={warning.warning.isExpired ? 'EXPIRED' : `${warning.warning.daysRemaining} days left`}
                        color={warning.warning.isExpired ? 'error' : warning.warning.daysRemaining <= 1 ? 'warning' : 'info'}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Deadline: {new Date(warning.unit.deadline).toLocaleDateString()} at{' '}
                      {new Date(warning.unit.deadline).toLocaleTimeString()}
                      {warning.unit.deadlineDescription && ` - ${warning.unit.deadlineDescription}`}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
          {deadlineWarnings.deadlineWarnings.length > 3 && (
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              ...and {deadlineWarnings.deadlineWarnings.length - 3} more deadline{deadlineWarnings.deadlineWarnings.length - 3 !== 1 ? 's' : ''}
            </Typography>
          )}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>{error}</Typography>
      ) : (
        <>
          {/* Statistics Cards Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <VideoLibraryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {statistics.totalCourses}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Total Courses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <OndemandVideoIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {statistics.videosWatched}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Videos Watched
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    out of {statistics.totalVideos}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <AccessTimeIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {formatDuration(statistics.totalWatchTime)}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Watch Time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <BarChartIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {statistics.completedQuizzes}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Quizzes Completed
                  </Typography>
                  {statistics.averageScore > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Avg: {statistics.averageScore}%
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Main Content Row */}
          <Grid container spacing={3}>
            {/* Progress Overview */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ 
                height: 400, 
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
                border: '1px solid #e3f2fd'
              }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <BarChartIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      Your Progress
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Overall Progress: {calculateOverallProgress()}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateOverallProgress()} 
                      sx={{ 
                        height: 12, 
                        borderRadius: 6,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                          borderRadius: 6
                        }
                      }}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>Course Progress</Typography>
                  <List sx={{ overflow: 'auto', flexGrow: 1 }}>
                    {courses.map((course) => (
                      <ListItem key={course._id} sx={{ 
                        py: 1.5, 
                        px: 2, 
                        mb: 1, 
                        borderRadius: 2,
                        backgroundColor: '#f8f9fa',
                        '&:hover': { backgroundColor: '#e3f2fd' }
                      }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: (course.enhancedProgress !== undefined ? course.enhancedProgress : course.progress) > 50 ? 'success.main' : 'warning.main',
                            width: 48,
                            height: 48
                          }}>
                            <VideoLibraryIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={
                            <Typography variant="subtitle1" fontWeight="medium">
                              {course.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Progress: {course.enhancedProgress !== undefined ? course.enhancedProgress : (course.progress || 0)}% • 
                                Videos: {course.actualVideosWatched !== undefined ? course.actualVideosWatched : (course.videosCompleted || 0)}/{course.totalVideos || 0}
                                {course.actualWatchTime > 0 && (
                                  <> • Watch Time: {formatDuration(course.actualWatchTime)}</>
                                )}
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={course.enhancedProgress !== undefined ? course.enhancedProgress : (course.progress || 0)} 
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3,
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3
                                  }
                                }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  {courses.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No courses enrolled yet
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Activity Sidebar */}
            <Grid item xs={12} lg={4}>
              {/* Recent Activity */}
              <Card sx={{ 
                height: 400, // Expanded height since we removed forums
                background: 'linear-gradient(145deg, #ffffff 0%, #fff3e0 100%)',
                border: '1px solid #ffe0b2'
              }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccessTimeIcon color="warning" sx={{ mr: 2 }} />
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      Recent Activity
                    </Typography>
                  </Box>
                  
                  <List dense sx={{ overflow: 'auto', flexGrow: 1 }}>
                    {recentActivity.length > 0 ? (() => {
                      // Flatten video watch history into a list of recent videos
                      const recentVideos = [];
                      recentActivity.forEach(courseHistory => {
                        if (courseHistory.videos && Array.isArray(courseHistory.videos)) {
                          courseHistory.videos.forEach(video => {
                            recentVideos.push({
                              videoTitle: video.videoTitle,
                              courseTitle: courseHistory.courseTitle,
                              timeSpent: video.timeSpent,
                              lastWatched: video.lastWatched
                            });
                          });
                        }
                      });
                      
                      // Sort by most recent and show all
                      recentVideos.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
                      
                      return recentVideos.map((video, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 1.5 }}>
                          <ListItemText 
                            primary={
                              <Typography variant="body2" fontWeight="medium">
                                {video.videoTitle}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {video.courseTitle} • {formatDuration(video.timeSpent)} • {formatDate(video.lastWatched)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ));
                    })() : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No recent activity
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Grid container spacing={2} sx={{ mt: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<VideoLibraryIcon />}
                onClick={() => navigate('/student/courses')}
                sx={{ 
                  py: 2,
                  background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                  '&:hover': { 
                    background: 'linear-gradient(45deg, #1976D2, #0288D1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                View All Courses
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<BarChartIcon />}
                onClick={() => navigate('/student/quiz-results')}
                sx={{ 
                  py: 2,
                  background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                  '&:hover': { 
                    background: 'linear-gradient(45deg, #388E3C, #689F38)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Quiz Results
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<AccessTimeIcon />}
                onClick={() => navigate('/student/section')}
                sx={{ 
                  py: 2,
                  background: 'linear-gradient(45deg, #9C27B0, #E91E63)',
                  '&:hover': { 
                    background: 'linear-gradient(45deg, #7B1FA2, #C2185B)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                My Section
              </Button>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default StudentHomeDashboard;
