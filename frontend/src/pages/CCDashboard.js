import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Tooltip, IconButton, Badge } from '@mui/material';
import Sidebar from '../components/Sidebar';
import { parseJwt } from '../utils/jwt';
import TopHeaderBar from '../components/common/TopHeaderBar';
import NotificationsIcon from '@mui/icons-material/Notifications';

const CCDashboardHome = React.lazy(() => import('./cc/CCDashboardHome'));
const CCReviews = React.lazy(() => import('./cc/CCReviews'));

const CCDashboard = () => {
  const token = localStorage.getItem('token');
  const currentUser = parseJwt(token);
  const location = useLocation();

  useEffect(() => {
    // no-op: placeholder for future notifications
  }, []);

  if (!currentUser || (currentUser.role !== 'cc' && currentUser.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === '/cc') {
    return <Navigate to="/cc/dashboard" replace />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar currentUser={currentUser} />
  <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f4f6f8', ml: '280px', display: 'flex', flexDirection: 'column' }}>
        <TopHeaderBar 
          title="Analytics Dashboard"
          subtitle="Toggle metrics visibility to customize your dashboard view"
          right={
            <Tooltip title="Notifications">
              <span>
                <IconButton color="inherit">
                  <Badge badgeContent={0} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </span>
            </Tooltip>
          }
        />
        <React.Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}> 
          <Box component="main" sx={{ flexGrow: 1, pt: 3, pr: 3, pb: 3, pl: 0 }}>
          <Routes>
            <Route path="/dashboard" element={<CCDashboardHome />} />
            <Route path="/reviews" element={<CCReviews />} />
            <Route path="*" element={<Navigate to="/cc/dashboard" replace />} />
          </Routes>
          </Box>
        </React.Suspense>
      </Box>
    </Box>
  );
};

export default CCDashboard;
