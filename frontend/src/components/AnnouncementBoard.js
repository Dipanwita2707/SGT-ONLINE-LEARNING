import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, Checkbox, 
  FormControlLabel, Select, MenuItem, FormControl, InputLabel, Card, 
  CardContent, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Tooltip, Chip, useTheme, List, ListItem,
  ListItemText, ListItemIcon, Collapse, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HistoryIcon from '@mui/icons-material/History';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Badge from '@mui/material/Badge';
import TeacherAnnouncementComponent from './TeacherAnnouncementComponent';
import NotificationsIcon from '@mui/icons-material/Notifications';

const AnnouncementBoard = ({ role, token, teacherCourses, userId }) => {
  const theme = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState([]); // For admin
  const [selectedCourse, setSelectedCourse] = useState(''); // For teacher
  const [canAnnounce, setCanAnnounce] = useState(false); // For teacher
  const [loading, setLoading] = useState(false);
  
  // States for edit/delete functionality
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [editRecipients, setEditRecipients] = useState([]);
  
  // State for edit history dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [announcementHistory, setAnnouncementHistory] = useState(null);
  const [expandedHistoryItems, setExpandedHistoryItems] = useState({});
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState('success');
  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false); // blink trigger for new admin announcements
  const announcementRefs = useRef({});
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    // Fetch announcements (filtered by role/course)
    fetchAnnouncements();
    
    // Fetch teacher permission if role is teacher
    if (role === 'teacher') {
      axios.get(`/api/teacher/${userId}/can-announce`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setCanAnnounce(res.data.canAnnounce))
        .catch(() => setCanAnnounce(false));
    }
  }, [role, token, userId]);

  // Poll unread notification count + detect unread announcements every 10s
  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      try {
        const countRes = await axios.get('/api/notifications/unread-count', { headers: { Authorization: `Bearer ${token}` } });
        const totalUnread = countRes.data.unread || 0;
        setUnreadCount(totalUnread);
        if (totalUnread > 0) {
          // Fetch notifications to identify announcement-specific unread items
            const listRes = await axios.get('/api/notifications?page=1&limit=50', { headers: { Authorization: `Bearer ${token}` } });
            const list = listRes.data.notifications || listRes.data || [];
            const hasUnreadAnn = list.some(n => !n.read && n.type === 'announcement');
            setHasNewAnnouncement(hasUnreadAnn);
        } else {
          setHasNewAnnouncement(false);
        }
      } catch (_) {
        /* ignore */
      }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const loadNotifications = () => {
    axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const list = res.data.notifications || res.data || [];
        setNotifications(list);
      })
      .catch(() => setNotifications([]));
  };

  const handleNotificationClick = () => {
    if (!showNotifications) {
      loadNotifications();
      if (unreadCount > 0) {
        axios.patch('/api/notifications/mark-all/read', {}, { headers: { Authorization: `Bearer ${token}` } })
          .then(() => setUnreadCount(0))
          .catch(() => {});
      }
    }
    setShowNotifications(prev => !prev);
  // Clear announcement blink when opened
  if (!showNotifications) setHasNewAnnouncement(false);
  };

  const goToItem = (n) => {
    if (n.type === 'announcement' && (n.data?.announcementId || n.announcement)) {
      const annId = n.data?.announcementId || n.announcement;
      setShowNotifications(false);
      // Scroll after panel closes
      setTimeout(() => {
        const el = announcementRefs.current[annId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedId(annId);
          setTimeout(() => setHighlightedId(null), 2500);
        }
      }, 150);
    } else if (n.type?.startsWith('discussion') && n.data?.discussionId) {
      // Navigation placeholder for future integration
    }
  };
  
  const fetchAnnouncements = () => {
  axios.get('/api/announcements', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        // Ensure we always set an array, handle different response formats
        const data = res.data;
        if (Array.isArray(data)) {
          setAnnouncements(data);
        } else if (data && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        } else {
          setAnnouncements([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch announcements:', err);
        setAlertMessage('Failed to fetch announcements');
        setAlertSeverity('error');
        setShowAlert(true);
        setAnnouncements([]);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Only admin and authorized teachers can post announcements
      if (role === 'admin') {
        await axios.post('/api/admin/announcement', { message, recipients }, { headers: { Authorization: `Bearer ${token}` } });
        setAlertMessage('Announcement posted successfully');
        setAlertSeverity('success');
      } else if (role === 'teacher' && canAnnounce && selectedCourse) {
        await axios.post(`/api/teacher/course/${selectedCourse}/announcement`, { message }, { headers: { Authorization: `Bearer ${token}` } });
        setAlertMessage('Announcement posted successfully');
        setAlertSeverity('success');
      }
      setMessage('');
      setRecipients([]);
      setSelectedCourse('');
      setShowAlert(true);
      
      // Refresh announcements
      fetchAnnouncements();
    } catch (err) {
      setAlertMessage('Failed to post announcement');
      setAlertSeverity('error');
      setShowAlert(true);
    }
    setLoading(false);
  };
  
  // Handle edit announcement
  const handleEditClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setEditMessage(announcement.message);
    setEditRecipients(announcement.recipients || []);
    setEditDialogOpen(true);
  };
  
  const handleEditSubmit = async () => {
    try {
      await axios.put(`/api/admin/announcement/${selectedAnnouncement._id}`, {
        message: editMessage,
        recipients: editRecipients
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setEditDialogOpen(false);
      setAlertMessage('Announcement updated successfully');
      setAlertSeverity('success');
      setShowAlert(true);
      fetchAnnouncements();
    } catch (err) {
      setAlertMessage('Failed to update announcement');
      setAlertSeverity('error');
      setShowAlert(true);
    }
  };
  
  // Handle delete announcement
  const handleDeleteClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/admin/announcement/${selectedAnnouncement._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDeleteDialogOpen(false);
      setAlertMessage('Announcement deleted successfully');
      setAlertSeverity('success');
      setShowAlert(true);
      fetchAnnouncements();
    } catch (err) {
      setAlertMessage('Failed to delete announcement');
      setAlertSeverity('error');
      setShowAlert(true);
    }
  };

  // View edit history of an announcement
  const handleViewHistory = async (announcement) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/announcements/${announcement._id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAnnouncementHistory(response.data);
      setHistoryDialogOpen(true);
      setLoading(false);
    } catch (err) {
      setAlertMessage('Failed to fetch edit history');
      setAlertSeverity('error');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Toggle the expanded state of a history item
  const toggleHistoryItem = (index) => {
    setExpandedHistoryItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>
      {/* Header Bar */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: theme.palette.primary.contrastText,
          p: 3,
          borderRadius: 3,
          boxShadow: `0 8px 32px ${theme.palette.primary.main}25`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AnnouncementIcon sx={{ mr: 1.5, fontSize: 36, opacity: 0.9 }} />
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                color:'white',
                letterSpacing: 0.5,
                lineHeight: 1.1
              }}
            >
              Announcements Board
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Stay updated with the latest information
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <style>{`@keyframes pulseGlow {0%{box-shadow:0 0 0 0 rgba(255,255,255,0.6);}70%{box-shadow:0 0 0 12px rgba(255,255,255,0);}100%{box-shadow:0 0 0 0 rgba(255,255,255,0);}}`}</style>
          <Tooltip title={hasNewAnnouncement ? 'New announcement' : 'Notifications'}>
            <IconButton
              onClick={handleNotificationClick}
              sx={{
                position: 'relative',
                bgcolor: hasNewAnnouncement ? 'error.light' : 'rgba(255,255,255,0.15)',
                color: 'white',
                '&:hover': { bgcolor: hasNewAnnouncement ? 'error.main' : 'rgba(255,255,255,0.25)' },
                animation: hasNewAnnouncement ? 'pulseGlow 1.6s infinite' : 'none'
              }}
            >
              <Badge
                color="error"
                variant={unreadCount > 0 ? 'standard' : 'dot'}
                badgeContent={unreadCount > 99 ? '99+' : unreadCount}
                invisible={unreadCount === 0}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {showNotifications && (
        <Paper elevation={3} sx={{ mb: 3, p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Notifications</Typography>
          {notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No notifications</Typography>
          ) : (
            <List dense>
              {notifications.map(n => (
                <ListItem 
                  key={n._id} 
                  button 
                  onClick={() => goToItem(n)} 
                  sx={{ bgcolor: !n.read ? 'action.hover' : 'transparent', borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemText 
                    primary={n.message} 
                    secondary={n.createdAt ? new Date(n.createdAt).toLocaleString() : ''} 
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
      {/* Alert for success/error messages */}
      {showAlert && (
        <Alert 
          severity={alertSeverity} 
          sx={{ mb: 3 }}
          onClose={() => setShowAlert(false)}
        >
          {alertMessage}
        </Alert>
      )}
      
  {/* Title is now inside colored header bar above */}
      
      {/* Only show the form for admin and teacher roles */}
      {role !== 'student' && (
        <Box sx={{ mb: 4 }}>
          {/* Teacher gets specialized section-based announcement component */}
          {role === 'teacher' ? (
            <TeacherAnnouncementComponent user={{ userId, role }} />
          ) : (
            /* Admin announcement form */
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                background: `linear-gradient(to right, ${theme.palette.primary.light}15, ${theme.palette.background.paper})`,
                border: `1px solid ${theme.palette.primary.light}`,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.dark, fontWeight: 'bold' }}>
                Post New Announcement
              </Typography>
              <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your announcement here..."
                required
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
              
              {role === 'admin' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.text.secondary }}>
                    Recipients:
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={recipients.includes('teacher')}
                        onChange={e => {
                          if (e.target.checked) setRecipients([...recipients, 'teacher']);
                          else setRecipients(recipients.filter(r => r !== 'teacher'));
                        }}
                        sx={{ color: theme.palette.primary.main }}
                      />
                    }
                    label="Teachers"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={recipients.includes('student')}
                        onChange={e => {
                          if (e.target.checked) setRecipients([...recipients, 'student']);
                          else setRecipients(recipients.filter(r => r !== 'student'));
                        }}
                        sx={{ color: theme.palette.primary.main }}
                      />
                    }
                    label="Students"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={recipients.includes('hod')}
                        onChange={e => {
                          if (e.target.checked) setRecipients([...recipients, 'hod']);
                          else setRecipients(recipients.filter(r => r !== 'hod'));
                        }}
                        sx={{ color: theme.palette.primary.main }}
                      />
                    }
                    label="HODs"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={recipients.includes('dean')}
                        onChange={e => {
                          if (e.target.checked) setRecipients([...recipients, 'dean']);
                          else setRecipients(recipients.filter(r => r !== 'dean'));
                        }}
                        sx={{ color: theme.palette.primary.main }}
                      />
                    }
                    label="Deans"
                  />
                </Box>
              )}
              
              {role === 'teacher' && canAnnounce && teacherCourses && teacherCourses.length > 0 && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Course</InputLabel>
                <Select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  required
                >
                  <MenuItem value="">
                    <em>Select a course</em>
                  </MenuItem>
                  {teacherCourses.map(c => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading || (role === 'teacher' && !canAnnounce) || (role === 'admin' && recipients.length === 0)}
                sx={{ 
                  fontWeight: 'bold',
                  textTransform: 'none',
                  px: 3,
                  py: 1
                }}
              >
                Post Announcement
              </Button>
              </form>
            </Paper>
          )}
        </Box>
      )}
      
      {/* Recent Announcements Header Card */}
      <Card 
        sx={{ 
          mb: 3, 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <CardContent sx={{ py: 2.5, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                <EventIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h5" 
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
                  Recent Announcements
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500
                  }}
                >
                  Stay updated with the latest information and updates
                </Typography>
              </Box>
            </Box>
            <Chip 
              label={`${announcements.length} Total`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ 
                fontWeight: 'bold',
                borderRadius: 2,
                '& .MuiChip-label': {
                  px: 1.5
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Admin tools section */}
      {(role === 'admin') && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            size="small"
            onClick={() => {
              setAlertMessage('This feature will allow viewing all announcement history');
              setAlertSeverity('info');
              setShowAlert(true);
            }}
            sx={{ mr: 1 }}
          >
            View All Edit History
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AnnouncementIcon />}
            size="small"
            onClick={() => {
              window.location.href = '/admin/announcements';
            }}
          >
            Manage All Announcements
          </Button>
        </Box>
      )}
      
      {/* Show announcements list with safe array check */}
      {!Array.isArray(announcements) || announcements.length === 0 ? (
        <Card 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <CardContent sx={{ py: 6, px: 4 }}>
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
              <AnnouncementIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.palette.text.primary,
                fontWeight: 'bold',
                mb: 1
              }}
            >
              {!Array.isArray(announcements) ? 'Error Loading Announcements' : 'No Announcements Yet'}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: theme.palette.text.secondary,
                maxWidth: 400,
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              {!Array.isArray(announcements) 
                ? 'There was an error loading the announcements. Please refresh the page and try again.' 
                : 'New announcements will appear here when they are posted. Check back later for updates.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {announcements.map((announcement, index) => (
            <Card 
              key={announcement._id} 
              ref={el => { if (el) announcementRefs.current[announcement._id] = el; }}
              sx={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: highlightedId === announcement._id ? `2px solid ${theme.palette.warning.main}` : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: highlightedId === announcement._id ? `0 0 0 3px ${theme.palette.warning.light}55` : '0 8px 32px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
                  borderColor: theme.palette.primary.light
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Announcement Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Box
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                        borderRadius: 2,
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 40,
                        height: 40,
                        boxShadow: `0 4px 16px ${theme.palette.primary.main}30`
                      }}
                    >
                      <AnnouncementIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: theme.palette.primary.dark,
                          mb: 0.5,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <PersonIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.primary.main }} />
                        {announcement.sender?.name || 'Unknown'} 
                        {announcement.sender?.teacherId ? ` (ID: ${announcement.sender.teacherId})` : ''} 
                        <Chip 
                          label={announcement.role === 'admin' ? 'Administrator' : 
                                 announcement.role === 'teacher' ? 'Teacher' : announcement.role}
                          size="small"
                          color={announcement.role === 'admin' ? 'error' : 'primary'}
                          variant="outlined"
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                        />
                        {announcement.isEdited && (
                          <Tooltip title={announcement.lastEditedBy ? `Last edited by ${announcement.lastEditedBy.name} on ${formatDate(announcement.lastEditedAt)}` : 'Edited'}>
                            <Chip 
                              label="Edited" 
                              size="small" 
                              color="info" 
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                              icon={<EditIcon style={{ fontSize: '0.8rem' }} />}
                            />
                          </Tooltip>
                        )}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          color: theme.palette.text.secondary,
                          fontWeight: 500
                        }}
                      >
                        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {announcement.createdAt ? formatDate(announcement.createdAt) : 'Unknown date'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Admin controls */}
                  {role === 'admin' && (
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      {announcement.isEdited && (
                        <Tooltip title="View edit history">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewHistory(announcement)}
                            sx={{ 
                              background: 'rgba(25, 118, 210, 0.1)',
                              color: theme.palette.info.main,
                              '&:hover': {
                                background: theme.palette.info.light,
                                color: 'white',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit announcement">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditClick(announcement)}
                          sx={{ 
                            background: 'rgba(25, 118, 210, 0.1)',
                            color: theme.palette.primary.main,
                            '&:hover': {
                              background: theme.palette.primary.light,
                              color: 'white',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete announcement">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(announcement)}
                          sx={{ 
                            background: 'rgba(244, 67, 54, 0.1)',
                            color: theme.palette.error.main,
                            '&:hover': {
                              background: theme.palette.error.light,
                              color: 'white',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                {/* Announcement Message */}
                <Box 
                  sx={{ 
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: 2,
                    p: 2.5,
                    mb: 2,
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      color: theme.palette.text.primary,
                      fontWeight: 500
                    }}
                  >
                    {announcement.message}
                  </Typography>
                </Box>

                {/* Announcement Footer */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  pt: 1,
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {announcement.course ? (
                      <Chip
                        icon={<MenuBookIcon />}
                        label={`Course: ${announcement.course.title}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold', borderRadius: 2 }}
                      />
                    ) : (
                      <Chip
                        icon={<GroupsIcon />}
                        label={`To: ${announcement.recipients?.map(r => r === 'teacher' ? 'Teachers' : r === 'student' ? 'Students' : r === 'hod' ? 'HODs' : r === 'dean' ? 'Deans' : r).join(', ')}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold', borderRadius: 2 }}
                      />
                    )}
                  </Box>

                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      textAlign: 'right'
                    }}
                  >
                    Announcement #{index + 1}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      {/* Edit Announcement Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
          Edit Announcement
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1, px: 3, mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editMessage}
            onChange={e => setEditMessage(e.target.value)}
            placeholder="Edit your announcement..."
            required
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle2" gutterBottom>
            Recipients:
          </Typography>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editRecipients.includes('teacher')}
                  onChange={e => {
                    if (e.target.checked) setEditRecipients([...editRecipients, 'teacher']);
                    else setEditRecipients(editRecipients.filter(r => r !== 'teacher'));
                  }}
                />
              }
              label="Teachers"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editRecipients.includes('student')}
                  onChange={e => {
                    if (e.target.checked) setEditRecipients([...editRecipients, 'student']);
                    else setEditRecipients(editRecipients.filter(r => r !== 'student'));
                  }}
                />
              }
              label="Students"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editRecipients.includes('hod')}
                  onChange={e => {
                    if (e.target.checked) setEditRecipients([...editRecipients, 'hod']);
                    else setEditRecipients(editRecipients.filter(r => r !== 'hod'));
                  }}
                />
              }
              label="HODs"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editRecipients.includes('dean')}
                  onChange={e => {
                    if (e.target.checked) setEditRecipients([...editRecipients, 'dean']);
                    else setEditRecipients(editRecipients.filter(r => r !== 'dean'));
                  }}
                />
              }
              label="Deans"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            color="primary"
            disabled={editMessage.trim() === '' || editRecipients.length === 0}
          >
            Update Announcement
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: theme.palette.error.main }}>
          Delete Announcement
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this announcement? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit History Dialog */}
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: theme.palette.info.main, color: 'white', display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1 }} />
          Announcement Edit History
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1, px: 3, mt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <Typography>Loading history...</Typography>
            </Box>
          ) : announcementHistory ? (
            <>
              <Box sx={{ mb: 3, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Current Version
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                  {announcementHistory.announcement.message}
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                  <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Last edited by {announcementHistory.announcement.lastEditedBy?.name || 'Unknown'} on {formatDate(announcementHistory.announcement.lastEditedAt)}
                </Typography>
              </Box>
              
              {announcementHistory.history.length > 0 ? (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    Previous Versions
                  </Typography>
                  <List sx={{ bgcolor: theme.palette.background.paper, borderRadius: 1, mb: 2 }}>
                    {announcementHistory.history.map((historyItem, index) => (
                      <React.Fragment key={index}>
                        <ListItem 
                          button 
                          onClick={() => toggleHistoryItem(index)}
                          sx={{ 
                            borderBottom: '1px solid',
                            borderColor: theme.palette.divider,
                            '&:hover': {
                              bgcolor: theme.palette.action.hover
                            }
                          }}
                        >
                          <ListItemIcon>
                            <AccessTimeIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`Edited by ${historyItem.editedBy?.name || 'Unknown'}`}
                            secondary={formatDate(historyItem.editedAt)}
                          />
                          {expandedHistoryItems[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </ListItem>
                        <Collapse in={expandedHistoryItems[index]} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, bgcolor: theme.palette.grey[50] }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Previous Message:
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: theme.palette.divider }}>
                              {historyItem.previousMessage}
                            </Typography>
                            <Typography variant="subtitle2" gutterBottom>
                              Previous Recipients:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                              {historyItem.previousRecipients?.map((recipient, i) => {
                                const getRecipientLabel = (type) => {
                                  switch(type) {
                                    case 'teacher': return 'Teachers';
                                    case 'student': return 'Students';
                                    case 'hod': return 'HODs';
                                    case 'dean': return 'Deans';
                                    default: return type;
                                  }
                                };
                                return (
                                  <Chip 
                                    key={i} 
                                    label={getRecipientLabel(recipient)} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                  />
                                );
                              }) || <Typography variant="caption">No recipients data</Typography>}
                            </Box>
                          </Box>
                        </Collapse>
                      </React.Fragment>
                    ))}
                  </List>
                </>
              ) : (
                <Typography variant="body1" color="textSecondary">
                  No edit history available.
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body1" color="textSecondary">
              Failed to load announcement history.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnnouncementBoard;
