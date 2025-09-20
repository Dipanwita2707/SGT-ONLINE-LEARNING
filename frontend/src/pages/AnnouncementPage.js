import React from 'react';
import { Box } from '@mui/material';
import AnnouncementBoard from '../components/AnnouncementBoard';

const AnnouncementPage = ({ role, teacherCourses, userId }) => {
  const token = localStorage.getItem('token');
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 3
      }}
    >
      <AnnouncementBoard role={role} token={token} teacherCourses={teacherCourses} userId={userId} />
    </Box>
  );
};

export default AnnouncementPage;
