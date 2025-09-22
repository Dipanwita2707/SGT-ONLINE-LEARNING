import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Box,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EnhancedTeacherVideoPlayer from './EnhancedTeacherVideoPlayer';
import { formatVideoUrl } from '../../utils/videoUtils';

const TeacherVideoDialog = ({ open, onClose, video }) => {
  if (!video) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#f8f8f8'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: 'secondary.main', color: 'white' }}>
        <Typography variant="h6" component="div">
          {video.title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, mt: 1 }}>
        {video.description && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="text.secondary">
              {video.description}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ width: '100%' }}>
          <EnhancedTeacherVideoPlayer 
            videoUrl={video.videoUrl}
            videoType={video.videoType}
            videoLink={video.videoLink}
            title={video.title} 
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherVideoDialog;
