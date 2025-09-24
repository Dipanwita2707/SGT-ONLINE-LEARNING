import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Stack
} from '@mui/material';
import { 
  People as PeopleIcon, 
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Forum as ForumIcon
} from '@mui/icons-material';
import * as sectionApi from '../../api/sectionApi';
import GroupChatPanel from '../chat/GroupChatPanel';
import GroupChatButton from '../chat/GroupChatButton';

const StudentSection = ({ user, token }) => {
  const [section, setSection] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Chat panel states
  const [sectionChatOpen, setSectionChatOpen] = useState(false);
  const [courseChatOpen, setCourseChatOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Debug timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ LOADING TIMEOUT - 8 seconds passed, debugging...');
        console.log('User:', user);
        console.log('Token exists:', !!token);
        console.log('Token length:', token?.length);
        setError('Loading timeout. Check browser console for debugging information. Try refreshing the page or logging out and back in.');
        setLoading(false);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [loading, user, token]);

  useEffect(() => {
    console.log('🔄 StudentSection useEffect triggered');
    
    // Debug localStorage data
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    console.log('Raw localStorage data:', {
      user: storedUser,
      token: storedToken?.substring(0, 20) + '...'
    });
    
    // Parse and check user structure
    let parsedUser = null;
    try {
      parsedUser = storedUser ? JSON.parse(storedUser) : null;
      console.log('Parsed user object:', parsedUser);
      console.log('User fields:', parsedUser ? Object.keys(parsedUser) : 'No user');
    } catch (e) {
      console.error('Error parsing user:', e);
    }
    
    // Check props vs localStorage
    console.log('Props user vs localStorage user:', {
      propsUser: user,
      localStorageUser: parsedUser,
      propsUserId: user?._id || user?.id,
      localUserId: parsedUser?._id || parsedUser?.id
    });
    
    // Use user from props first, fallback to localStorage
    const currentUser = user || parsedUser;
    const userId = currentUser?._id || currentUser?.id;
    
    if (!currentUser) {
      console.log('⚠️ No user found anywhere, setting error');
      setError('User information not found. Please log out and log back in.');
      setLoading(false);
      return;
    }
    
    if (!token && !storedToken) {
      console.log('⚠️ No token found anywhere, setting error');
      setError('Authentication token not found. Please log out and log back in.');
      setLoading(false);
      return;
    }
    
    if (!userId) {
      console.log('⚠️ No user ID found, setting error');
      console.log('Current user object:', currentUser);
      setError('User ID not found in user data. Please log out and log back in, or contact support if the issue persists.');
      setLoading(false);
      return;
    }
    
    console.log('📞 Calling fetchStudentSection with userId:', userId);
    fetchStudentSectionWithUserId(userId, token || storedToken);
  }, [user, token]);

  const fetchStudentSection = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Fetching section for user:', user?._id, 'with token length:', token?.length);
      console.log('🌐 API Call: GET /api/sections/student/' + user._id);
      
      const response = await sectionApi.getStudentSection(user._id, token);
      console.log('✅ Section API response received:', {
        hasSection: !!response.section,
        hasDirect: !!response._id,
        responseKeys: Object.keys(response),
        fullResponse: response
      });
      
      // Handle the API response format: { section: {...} }
      const sectionData = response.section || response;
      setSection(sectionData);
      
      // Filter out the current user from classmates
      const otherStudents = sectionData?.students?.filter(student => student._id !== user._id) || [];
      setClassmates(otherStudents);
      
      console.log('✅ Section loaded successfully:', {
        sectionName: sectionData?.name,
        studentsCount: sectionData?.students?.length,
        teacherName: sectionData?.teacher?.name,
        coursesCount: sectionData?.courses?.length,
        department: sectionData?.department?.name,
        school: sectionData?.school?.name
      });
    } catch (err) {
      console.error('Error fetching student section:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message
      });
      
      if (err.response?.status === 404) {
        setError('You are not assigned to any section yet.');
      } else {
        setError('Failed to fetch your section information. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // New function that accepts userId and token as parameters
  const fetchStudentSectionWithUserId = async (userId, authToken) => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Fetching section for userId:', userId, 'with token length:', authToken?.length);
      console.log('🌐 API Call: GET /api/sections/student/' + userId);
      
      const response = await sectionApi.getStudentSection(userId, authToken);
      console.log('✅ Section API response received:', {
        hasSection: !!response.section,
        hasDirect: !!response._id,
        responseKeys: Object.keys(response),
        fullResponse: response
      });
      
      // Handle the API response format: { section: {...} }
      const sectionData = response.section || response;
      setSection(sectionData);
      
      // Filter out the current user from classmates
      const otherStudents = sectionData?.students?.filter(student => student._id !== userId) || [];
      setClassmates(otherStudents);
      
      console.log('✅ Section loaded successfully:', {
        sectionName: sectionData?.name,
        studentsCount: sectionData?.students?.length,
        teacherName: sectionData?.teacher?.name,
        coursesCount: sectionData?.courses?.length,
        department: sectionData?.department?.name,
        school: sectionData?.school?.name
      });

      setError('');
    } catch (err) {
      console.error('❌ Error fetching student section:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message
      });
      
      if (err.response?.status === 404) {
        setError('You are not assigned to any section yet.');
      } else {
        setError('Failed to fetch your section information. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading your section information...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we fetch your section details
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              My Section
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View your section details, teacher, and classmates.
            </Typography>
          </Box>
          <Tooltip title="Refresh section information">
            <IconButton 
              onClick={fetchStudentSection} 
              disabled={loading}
              sx={{ ml: 2 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {section ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {section.name}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <MenuBookIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                      Courses: {section.courses?.map(course => course.name || course.title || 'Unnamed Course').join(', ') || 'No courses assigned'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Course Codes: {section.courses?.map(course => course.courseCode || 'N/A').join(', ') || 'No course codes'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Teacher: {section.teacher?.name || 'Not assigned'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PeopleIcon sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      {classmates.length + 1} students in your section (including you)
                    </Typography>
                  </Box>

                  {/* Section Group Chat Button */}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<ChatIcon />}
                      onClick={() => setSectionChatOpen(true)}
                      sx={{ 
                        background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                        '&:hover': { 
                          background: 'linear-gradient(45deg, #1976D2, #0288D1)',
                        }
                      }}
                    >
                      Section Group Chat
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your Classmates
                  </Typography>
                  {classmates.length > 0 ? (
                    <List>
                      {classmates.map((classmate, index) => (
                        <ListItem key={classmate._id} divider={index < classmates.length - 1}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {classmate.name ? classmate.name.charAt(0).toUpperCase() : <PersonIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={classmate.name || 'Unknown Student'}
                            secondary={classmate.email || 'No email provided'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography color="text.secondary" variant="body1">
                        No other students in your section yet.
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        You'll see your classmates here once they're added to the section.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Section Stats
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={`${(section.students?.length || 0)} Students`} 
                      color="primary" 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                    <Chip 
                      label={`${section.courses?.length || 0} Courses`} 
                      color="secondary" 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                    <Chip label="Active" color="success" sx={{ mr: 1, mb: 1 }} />
                  </Box>
                  
                  {section.teacher && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Section Teacher
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                          {section.teacher.name ? section.teacher.name.charAt(0).toUpperCase() : 'T'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {section.teacher.name || 'Unknown Teacher'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {section.teacher.email || 'No email'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary">
                    You are part of a vibrant learning community in this section.
                  </Typography>
                </CardContent>
              </Card>
              
              {section.courses && section.courses.length > 0 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Course Details & Group Chats
                    </Typography>
                    {section.courses.map((course, index) => (
                      <Box key={course._id || index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {course.name || course.title || 'Unnamed Course'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Code: {course.courseCode || 'N/A'}
                            </Typography>
                            {course.description && (
                              <Typography variant="caption" color="text.secondary">
                                {course.description}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<ForumIcon />}
                            onClick={() => {
                              setSelectedCourse(course);
                              setCourseChatOpen(true);
                            }}
                            sx={{ 
                              ml: 2,
                              background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                              '&:hover': { 
                                background: 'linear-gradient(45deg, #388E3C, #689F38)',
                              }
                            }}
                          >
                            Course Chat
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Section Assigned
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                You are not currently assigned to any section. Contact your administrator or teacher for section assignment.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Tooltip title="Check again for section assignment">
                  <IconButton 
                    onClick={fetchStudentSection} 
                    disabled={loading}
                    size="large"
                    color="primary"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Section Group Chat Panel */}
        <GroupChatPanel
          open={sectionChatOpen}
          onClose={() => setSectionChatOpen(false)}
          chatType="section"
          targetId={section?._id}
          chatName={`Section ${section?.sectionName || section?.name || 'Chat'}`}
          participants={section?.students || []}
        />

        {/* Course Group Chat Panel */}
        <GroupChatPanel
          open={courseChatOpen}
          onClose={() => setCourseChatOpen(false)}
          chatType="course"
          targetId={selectedCourse?._id}
          chatName={`${selectedCourse?.name || selectedCourse?.title || 'Course'} Chat`}
          participants={section?.students || []}
        />
      </Box>
    </Container>
  );
};

export default StudentSection;
