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
  ListItemAvatar
} from '@mui/material';
import { 
  People as PeopleIcon, 
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import * as sectionApi from '../../api/sectionApi';

const StudentSection = ({ user, token }) => {
  const [section, setSection] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user._id) {
      fetchStudentSection();
    }
  }, [user]);

  const fetchStudentSection = async () => {
    try {
      setLoading(true);
      const sectionData = await sectionApi.getStudentSection(user._id, token);
      setSection(sectionData);
      
      // Filter out the current user from classmates
      const otherStudents = sectionData.students?.filter(student => student._id !== user._id) || [];
      setClassmates(otherStudents);
      
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('You are not assigned to any section yet.');
      } else {
        setError('Failed to fetch your section information');
      }
      console.error('Error fetching student section:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography>Loading your section information...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Section
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          View your section details, teacher, and classmates.
        </Typography>

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
                      Course: {section.course?.title || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Course Code: {section.course?.courseCode || 'N/A'}
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
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={classmate.name}
                            secondary={classmate.email}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">
                      No other students in your section yet.
                    </Typography>
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
                    <Chip label={`${classmates.length + 1} Students`} color="primary" sx={{ mr: 1, mb: 1 }} />
                    <Chip label="Active" color="success" sx={{ mr: 1, mb: 1 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    You are part of a vibrant learning community in this section.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">
            You are not assigned to any section yet. Contact your administrator for section assignment.
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default StudentSection;
