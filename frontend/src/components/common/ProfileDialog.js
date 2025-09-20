import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  School as SchoolIcon,
  BusinessCenter as DepartmentIcon
} from '@mui/icons-material';

const ProfileDialog = ({ open, onClose, user }) => {
  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'error';
      case 'dean': return 'warning';
      case 'hod': return 'info';
      case 'teacher': return 'success';
      case 'student': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          My Profile
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              fontSize: 32,
              fontWeight: 600,
              mb: 2
            }}
          >
            {getInitials(user.name || `${user.firstName || ''} ${user.lastName || ''}` || 'User')}
          </Avatar>
          
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {user.name || `${user.firstName} ${user.lastName}` || 'User'}
          </Typography>
          
          <Chip
            label={user.role?.toUpperCase() || 'USER'}
            color={getRoleColor(user.role)}
            variant="filled"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Email */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmailIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                Email Address
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.email || 'Not provided'}
              </Typography>
            </Box>
          </Box>

          {/* User ID/Student ID/Teacher ID - Always show */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BadgeIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                ID
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.regNo || user.teacherId || user.id || user._id || 'Not assigned'}
              </Typography>
            </Box>
          </Box>

          {/* School */}
          {user.school && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SchoolIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  School
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {typeof user.school === 'object' ? user.school.name : user.school}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Department */}
          {user.department && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DepartmentIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  Department
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {typeof user.department === 'object' ? user.department.name : user.department}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Additional role-specific info */}
          {user.role === 'student' && user.semester && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  Semester
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user.semester}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            borderRadius: 2,
            py: 1.5,
            fontSize: 16,
            fontWeight: 600
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileDialog;