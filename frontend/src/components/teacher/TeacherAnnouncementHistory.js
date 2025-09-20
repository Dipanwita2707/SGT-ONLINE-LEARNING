import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  useTheme
} from '@mui/material';
import {
  History as HistoryIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import axios from 'axios';

// Simple date formatting function
const formatDistanceToNow = (date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return new Date(date).toLocaleDateString();
};

const TeacherAnnouncementHistory = ({ token }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewDialog, setViewDialog] = useState({
    open: false,
    announcement: null
  });

  const theme = useTheme();

  useEffect(() => {
    fetchAnnouncementHistory();
  }, []);

  const fetchAnnouncementHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/teacher/announcements/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (err) {
      console.error('Error fetching announcement history:', err);
      setError(err.response?.data?.message || 'Failed to load announcement history');
    } finally {
      setLoading(false);
    }
  };

  const openViewDialog = (announcement) => {
    setViewDialog({
      open: true,
      announcement
    });
  };

  const closeViewDialog = () => {
    setViewDialog({
      open: false,
      announcement: null
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <ApprovedIcon color="success" />;
      case 'rejected':
        return <RejectedIcon color="error" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      approved: 'success',
      rejected: 'error',
      pending: 'warning'
    };
    
    const labels = {
      approved: 'Approved',
      rejected: 'Rejected',
      pending: 'Pending Approval'
    };

    return (
      <Chip
        icon={getStatusIcon(status)}
        label={labels[status] || status}
        color={colors[status] || 'default'}
        size="small"
      />
    );
  };

  const getFilteredAnnouncements = () => {
    if (!history) return [];
    
    switch (selectedTab) {
      case 0: // All
        return history.announcements;
      case 1: // Pending
        return history.announcements.filter(a => a.status === 'pending');
      case 2: // Approved
        return history.announcements.filter(a => a.status === 'approved');
      case 3: // Rejected
        return history.announcements.filter(a => a.status === 'rejected');
      default:
        return history.announcements;
    }
  };

  if (loading) {
    return (
      <Card 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          m: 3
        }}
      >
        <CardContent>
          <CircularProgress color="primary" size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
            Loading Announcement History...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          m: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(244, 67, 54, 0.2)',
          fontWeight: 500
        }}
      >
        {error}
      </Alert>
    );
  }

  const filteredAnnouncements = getFilteredAnnouncements();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>
      {/* Header Card */}
      <Card 
        sx={{ 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <CardContent sx={{ py: 2.5, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                borderRadius: 2,
                p: 1.5,
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 16px ${theme.palette.primary.main}40`
              }}
            >
              <HistoryIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: 0.5,
                  mb: 0.5
                }}
              >
                Announcement History
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 500
                }}
              >
                Track the status of your submitted announcements
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 4px 16px rgba(33, 150, 243, 0.3)'
                }}
              >
                <AssignmentIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.info.main }}>
                {history?.totalCount || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Total Announcements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)'
                }}
              >
                <ApprovedIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.success.main }}>
                {history?.approvedCount || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 4px 16px rgba(255, 152, 0, 0.3)'
                }}
              >
                <PendingIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.warning.main }}>
                {history?.pendingCount || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 4px 16px rgba(244, 67, 54, 0.3)'
                }}
              >
                <RejectedIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.error.main }}>
                {history?.rejectedCount || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Card 
        sx={{ 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Tabs 
          value={selectedTab} 
          onChange={(e, newValue) => setSelectedTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1rem',
              minHeight: 60,
            }
          }}
        >
          <Tab 
            label={
              <Badge badgeContent={history?.totalCount} color="info">
                <Typography sx={{ fontWeight: 'bold' }}>All</Typography>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={history?.pendingCount} color="warning">
                <Typography sx={{ fontWeight: 'bold' }}>Pending</Typography>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={history?.approvedCount} color="success">
                <Typography sx={{ fontWeight: 'bold' }}>Approved</Typography>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={history?.rejectedCount} color="error">
                <Typography sx={{ fontWeight: 'bold' }}>Rejected</Typography>
              </Badge>
            } 
          />
        </Tabs>
      </Card>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <Card
          sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.grey[400]}, ${theme.palette.grey[600]})`,
                borderRadius: 3,
                p: 2,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              <AssignmentIcon sx={{ color: 'white', fontSize: 50 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
              No Announcements Found
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, maxWidth: 400, mx: 'auto' }}>
              {selectedTab === 0 
                ? 'You haven\'t created any announcements yet. Start by creating your first announcement.'
                : `No ${['all', 'pending', 'approved', 'rejected'][selectedTab]} announcements found.`
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredAnnouncements.map((announcement) => (
            <Grid item xs={12} key={announcement.id}>
              <Card
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark, flex: 1, mr: 2 }}>
                      {announcement.title}
                    </Typography>
                    {getStatusChip(announcement.status)}
                  </Box>
                  
                  <Box 
                    sx={{ 
                      background: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: 2,
                      p: 2,
                      mb: 2,
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        color: theme.palette.text.primary,
                        lineHeight: 1.5,
                        fontWeight: 500
                      }}
                    >
                      {announcement.message}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip 
                        icon={<SchoolIcon />}
                        label={`${announcement.targetSections.length} sections`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold', borderRadius: 2 }}
                      />
                      <Chip 
                        icon={<TimeIcon />}
                        label={formatDistanceToNow(announcement.submittedAt)}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold', borderRadius: 2 }}
                      />
                    </Box>
                    
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => openViewDialog(announcement)}
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        '&:hover': {
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      View Details
                    </Button>
                  </Box>

                  {announcement.approvalNote && (
                    <Alert 
                      severity={announcement.status === 'approved' ? 'success' : 'error'} 
                      sx={{ 
                        mt: 2,
                        borderRadius: 2,
                        fontWeight: 500,
                        background: announcement.status === 'approved' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                      }}
                    >
                      <strong>HOD Note:</strong> {announcement.approvalNote}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* View Details Dialog */}
      <Dialog 
        open={viewDialog.open} 
        onClose={closeViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Announcement Details</Typography>
          <IconButton onClick={closeViewDialog} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, mt: 2 }}>
          {viewDialog.announcement && (
            <Box>
              {/* Status */}
              <Box display="flex" alignItems="center" mb={3}>
                <Typography variant="subtitle1" sx={{ mr: 2, fontWeight: 'bold', color: theme.palette.text.primary }}>Status:</Typography>
                {getStatusChip(viewDialog.announcement.status)}
              </Box>

              {/* Title */}
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.primary.dark }}>
                {viewDialog.announcement.title}
              </Typography>

              {/* Message */}
              <Box 
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  p: 3,
                  mb: 3
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontWeight: 500 }}>
                  {viewDialog.announcement.message}
                </Typography>
              </Box>

              {/* Target Sections */}
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, color: theme.palette.text.primary }}>
                Target Sections:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                {viewDialog.announcement.targetSections.map((section, index) => (
                  <Chip 
                    key={index} 
                    label={section} 
                    variant="outlined" 
                    color="primary"
                    sx={{ fontWeight: 'bold', borderRadius: 2 }}
                  />
                ))}
              </Box>

              {/* Submission Details */}
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, color: theme.palette.text.primary }}>
                Submission Details:
              </Typography>
              <List dense sx={{ background: 'rgba(255, 255, 255, 0.5)', borderRadius: 2, mb: 2 }}>
                <ListItem>
                  <ListItemIcon>
                    <TimeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography sx={{ fontWeight: 'bold' }}>Submitted</Typography>}
                    secondary={formatDistanceToNow(viewDialog.announcement.submittedAt)}
                  />
                </ListItem>
                
                {viewDialog.announcement.approvedBy && (
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography sx={{ fontWeight: 'bold' }}>Reviewed By</Typography>}
                      secondary={`${viewDialog.announcement.approvedBy.name} (${viewDialog.announcement.approvedBy.email})`}
                    />
                  </ListItem>
                )}
                
                <ListItem>
                  <ListItemIcon>
                    <ViewIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography sx={{ fontWeight: 'bold' }}>Visibility Status</Typography>}
                    secondary={viewDialog.announcement.isVisible ? 'Visible to students' : 'Not visible to students'}
                  />
                </ListItem>
              </List>

              {/* Approval Note */}
              {viewDialog.announcement.approvalNote && (
                <Alert 
                  severity={viewDialog.announcement.status === 'approved' ? 'success' : 'error'} 
                  sx={{ 
                    mt: 2,
                    borderRadius: 2,
                    fontWeight: 500
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    HOD's Note:
                  </Typography>
                  {viewDialog.announcement.approvalNote}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Button 
            onClick={closeViewDialog}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              fontWeight: 'bold',
              textTransform: 'none',
              px: 3
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAnnouncementHistory;