import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  TextField, 
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import axios from 'axios';
import GroupChatButton from '../../components/chat/GroupChatButton';
import GroupChatPanel from '../../components/chat/GroupChatPanel';
import { useNavigate } from 'react-router-dom';

const TeacherStudents = ({ token, user }) => {
  // Use the token prop if provided, otherwise fall back to localStorage
  const authToken = token || localStorage.getItem('token');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Chat state
  const [courses, setCourses] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState(null); // { courseId, sectionId, courseTitle }
  const [currentUser, setCurrentUser] = useState(() => {
    try { const t = authToken; return t ? JSON.parse(atob(t.split('.')[1])) : null; } catch { return null; }
  });
  
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        // First get all courses
        const coursesResponse = await axios.get('/api/teacher/courses', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const courseList = (coursesResponse.data || []).map(c => ({
          ...c,
          sectionId: c.sectionId || (c.section && c.section._id) || c.section || (Array.isArray(c.sectionIds) ? c.sectionIds[0] : null)
        }));
        setCourses(courseList);
        if (!chatContext) {
          const first = courseList.find(c => c.sectionId);
          if (first) setChatContext({ courseId: first._id, sectionId: first.sectionId, courseTitle: first.title });
        }
        const allStudents = new Map();
        
        // For each course, get students
        for (const course of courses) {
          const studentsResponse = await axios.get(`/api/teacher/course/${course._id}/students`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          // Add students to map with course info
          studentsResponse.data.forEach(student => {
            if (!allStudents.has(student._id)) {
              allStudents.set(student._id, {
                ...student,
                courses: [{ id: course._id, name: course.title, code: course.courseCode }]
              });
            } else {
              const existingStudent = allStudents.get(student._id);
              existingStudent.courses.push({ id: course._id, name: course.title, code: course.courseCode });
            }
          });
        }
        
        const studentList = Array.from(allStudents.values());
        setStudents(studentList);
        setFilteredStudents(studentList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again later.');
        setLoading(false);
      }
    };
    
    if (authToken) {
      fetchAllStudents();
    }
  }, [authToken]);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(lowercaseQuery) ||
      student.email.toLowerCase().includes(lowercaseQuery) ||
      (student.regNo && student.regNo.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredStudents(filtered);
  }, [searchQuery, students]);
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  return (
    <div>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" gutterBottom>
          My Students
        </Typography>
        {courses.filter(c => c.sectionId).length > 1 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="teacher-students-chat-course-label">Chat Course</InputLabel>
            <Select
              labelId="teacher-students-chat-course-label"
              label="Chat Course"
              value={chatContext?.courseId || ''}
              onChange={(e) => {
                const sel = courses.find(c => c._id === e.target.value);
                if (sel && sel.sectionId) {
                  setChatContext({ courseId: sel._id, sectionId: sel.sectionId, courseTitle: sel.title });
                }
              }}
            >
              {courses.filter(c => c.sectionId).map(c => (
                <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {chatContext?.sectionId && (
          <GroupChatButton size="small" onClick={() => setChatOpen(true)} />
        )}
      </Box>
      <Typography variant="subtitle1" gutterBottom>
        View students enrolled in your courses
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search Students"
          placeholder="Search by name, email or registration number"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Student Overview
                  </Typography>
                  <Typography variant="body1">
                    Total Students: {filteredStudents.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Paper sx={{ mt: 3 }}>
            {filteredStudents.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Typography>No students found.</Typography>
              </Box>
            ) : (
              <List>
                {filteredStudents.map((student) => (
                  <React.Fragment key={student._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={student.name}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="text.primary">
                              {student.email}
                            </Typography>
                            {student.regNo && (
                              <Typography component="span" variant="body2" display="block">
                                Registration No: {student.regNo}
                              </Typography>
                            )}
                            <Typography component="span" variant="body2" display="block">
                              Enrolled in: {student.courses.map(course => course.name).join(', ')}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      <Button 
                        variant="contained" 
                        color="primary"
                        size="small"
                        startIcon={<BarChartIcon />}
                        onClick={() => navigate(`/teacher/student/${student._id}/analytics`)}
                      >
                        View Analytics
                      </Button>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </>
      )}
      <GroupChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        courseId={chatContext?.courseId}
        sectionId={chatContext?.sectionId}
        title={chatContext ? `Group Chat • ${chatContext.courseTitle}` : 'Group Chat'}
        currentUser={currentUser}
      />
    </div>
  );
};

export default TeacherStudents;
