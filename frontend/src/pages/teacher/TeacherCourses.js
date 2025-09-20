import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Button, 
  List, 
  ListItem, 
  ListItemText,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import GroupChatButton from '../../components/chat/GroupChatButton';
import GroupChatPanel from '../../components/chat/GroupChatPanel';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeacherCourses = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState(null); // { courseId, sectionId, courseTitle }
  const [currentUser, setCurrentUser] = useState(() => {
    try { const t = localStorage.getItem('token'); return t ? JSON.parse(atob(t.split('.')[1])) : null; } catch { return null; }
  });

  useEffect(() => {
    const fetchTeacherCourses = async () => {
      try {
        const response = await axios.get('/api/teacher/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const normalized = (response.data || []).map(c => ({
          ...c,
            sectionId: c.sectionId || (c.section && c.section._id) || c.section || (Array.isArray(c.sectionIds) ? c.sectionIds[0] : null)
        }));
        setCourses(normalized);
        if (!chatContext) {
          const first = normalized.find(c => c.sectionId);
          if (first) setChatContext({ courseId: first._id, sectionId: first.sectionId, courseTitle: first.title });
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teacher courses:', err);
        setError('Failed to load courses. Please try again later.');
        setLoading(false);
      }
    };

    if (token) {
      fetchTeacherCourses();
    }
  }, [token]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        My Courses
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        View and manage your assigned courses
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <Paper sx={{ p: 3, mt: 3 }}>
          {courses.length === 0 ? (
            <Typography>No courses assigned yet.</Typography>
          ) : (
            <List>
              {courses.map((course, index) => (
                <React.Fragment key={course._id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 2 }}>
                    <ListItemText
                      primary={
                        <Typography variant="h6">{course.title}</Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Course Code: {course.courseCode}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {course.description || 'No description available.'}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => navigate(`/teacher/course/${course._id}`)}
                      >
                        View Course
                      </Button>
                      {course.sectionId && (
                        <GroupChatButton
                          onClick={() => {
                            setChatContext({ courseId: course._id, sectionId: course.sectionId, courseTitle: course.title });
                            setChatOpen(true);
                          }}
                          size="small"
                        />
                      )}
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
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

export default TeacherCourses;
