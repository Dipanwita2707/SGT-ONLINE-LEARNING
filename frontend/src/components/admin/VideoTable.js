import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const VideoTable = ({ videos, onRemove, onWarn, onEdit }) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, videoId: null, videoTitle: '' });
  const [warnDialog, setWarnDialog] = useState({ open: false, videoId: null, videoTitle: '' });
  const [videoErrors, setVideoErrors] = useState({}); // Track video loading errors

  const handleDeleteClick = (video) => {
    setDeleteDialog({ open: true, videoId: video._id, videoTitle: video.title });
  };

  const handleWarnClick = (video) => {
    setWarnDialog({ open: true, videoId: video._id, videoTitle: video.title });
  };

  const confirmDelete = () => {
    onRemove(deleteDialog.videoId);
    setDeleteDialog({ open: false, videoId: null, videoTitle: '' });
  };

  const confirmWarn = () => {
    onWarn(warnDialog.videoId);
    setWarnDialog({ open: false, videoId: null, videoTitle: '' });
  };

  const handleVideoError = (videoId, videoSource) => {
    console.warn(`Video failed to load: ${videoSource}`);
    setVideoErrors(prev => ({ ...prev, [videoId]: true }));
  };

  const renderVideoPreview = (video) => {
    // Check if we have a video source (either videoUrl or videoLink)
    const videoSource = video.videoUrl || video.videoLink;
    const hasError = videoErrors[video._id];
    
    if (videoSource && !hasError) {
      // For both uploaded videos and video links, show video preview
      return (
        <Box sx={{ position: 'relative' }}>
          <video 
            width="120" 
            height="70" 
            controls 
            src={videoSource}
            style={{ background: '#000', borderRadius: 4 }}
            onError={() => handleVideoError(video._id, videoSource)}
            preload="metadata"
          />
          {/* Show video type indicator */}
          <Chip
            size="small"
            label={video.videoType === 'link' ? 'Link' : 'Upload'}
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              fontSize: '0.6rem',
              height: 16,
              bgcolor: video.videoType === 'link' ? 'primary.main' : 'grey.600',
              color: 'white'
            }}
          />
        </Box>
      );
    } else if (videoSource && hasError) {
      // Show error state with link to open video externally
      return (
        <Box sx={{ 
          width: 120, 
          height: 70, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 1,
          border: '1px dashed #ccc',
          borderRadius: 1,
          bgcolor: 'grey.50'
        }}>
          <ErrorOutlineIcon color="error" fontSize="small" />
          <Typography variant="caption" color="error">
            Preview Error
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => window.open(videoSource, '_blank')}
            sx={{ fontSize: '0.6rem', p: 0.5, minWidth: 'auto' }}
          >
            Open Link
          </Button>
        </Box>
      );
    } else {
      // Fallback when no video source is available
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoFileIcon color="action" />
          <Typography variant="caption">
            No preview
          </Typography>
        </Box>
      );
    }
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Preview</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {videos.map(video => (
              <TableRow key={video._id} hover>
                <TableCell>
                  {renderVideoPreview(video)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {video.title}
                  </Typography>
                  {video.description && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {video.description.substring(0, 50)}
                      {video.description.length > 50 ? '...' : ''}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {video.course?.title || video.courseTitle || 'Unknown Course'}
                  </Typography>
                  {(video.course?.courseCode || video.courseCode) && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {video.course?.courseCode || video.courseCode}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={video.videoType === 'link' ? 'Link' : 'Upload'} 
                    size="small" 
                    color={video.videoType === 'link' ? 'primary' : 'default'}
                    icon={video.videoType === 'link' ? <LinkIcon /> : <VideoFileIcon />}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {video.teacher?.name || video.teacherName || 'Unknown Teacher'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={video.warned ? 'Warned' : 'OK'} 
                    size="small" 
                    color={video.warned ? 'warning' : 'success'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Delete Video">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDeleteClick(video)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={video.warned ? "Already Warned" : "Flag for Review"}>
                    <IconButton 
                      size="small" 
                      color="warning"
                      onClick={() => handleWarnClick(video)}
                      disabled={video.warned}
                    >
                      <WarningIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Video">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => onEdit(video)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, videoId: null, videoTitle: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete Video
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the video "<strong>{deleteDialog.videoTitle}</strong>"? 
            <br /><br />
            This action cannot be undone and will permanently remove the video from the course.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, videoId: null, videoTitle: '' })}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warn Confirmation Dialog */}
      <Dialog
        open={warnDialog.open}
        onClose={() => setWarnDialog({ open: false, videoId: null, videoTitle: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Flag Video for Review
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to flag the video "<strong>{warnDialog.videoTitle}</strong>" for review?
            <br /><br />
            This will mark the video as potentially problematic and may restrict student access.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setWarnDialog({ open: false, videoId: null, videoTitle: '' })}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmWarn}
            color="warning"
            variant="contained"
          >
            Flag for Review
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VideoTable;
