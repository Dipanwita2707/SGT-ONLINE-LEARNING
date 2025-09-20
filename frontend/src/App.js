import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResetPasswordErrorPage from './pages/ResetPasswordErrorPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import PrivateRoute from './components/PrivateRoute';
import { restoreUserFromToken } from './utils/authService';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const DeanDashboard = lazy(() => import('./pages/DeanDashboard'));
const HODDashboard = lazy(() => import('./pages/HODDashboard'));

// Create a comprehensive theme with consistent color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#005b96',        // Primary Blue
      dark: '#011f4b',        // Primary Dark
      light: '#6497b1',       // Light Blue
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#03396c',        // Primary Mid
      light: '#b3cde0',       // Very Light Blue
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#011f4b',
      secondary: '#03396c',
    },
    // Custom color palette for consistent usage
    roles: {
      admin: '#011f4b',
      dean: '#03396c', 
      hod: '#005b96',
      teacher: '#6497b1',
      student: '#b3cde0'
    },
    status: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#005b96'
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    }
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
      color: '#011f4b',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: 1.3,
      color: '#011f4b',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: '#011f4b',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: '#011f4b',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      color: '#011f4b',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
      color: '#011f4b',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#03396c',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#03396c',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      borderRadius: 8,
    }
  },
  components: {
    // Button component standardization
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '0.95rem',
          lineHeight: 1.5,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0, 91, 150, 0.15)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 4px 12px rgba(0, 91, 150, 0.2)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #005b96 0%, #03396c 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #03396c 0%, #011f4b 100%)',
            boxShadow: '0 12px 30px rgba(0, 91, 150, 0.25)',
          },
          '&:disabled': {
            background: 'linear-gradient(135deg, #6497b1 0%, #b3cde0 100%)',
            color: 'rgba(255, 255, 255, 0.7)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #005b96 0%, #03396c 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #03396c 0%, #011f4b 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #6497b1 0%, #03396c 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #03396c 0%, #011f4b 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: '#005b96',
          color: '#005b96',
          '&:hover': {
            borderColor: '#03396c',
            backgroundColor: 'rgba(0, 91, 150, 0.05)',
            borderWidth: '2px',
          },
        },
        text: {
          color: '#005b96',
          '&:hover': {
            backgroundColor: 'rgba(0, 91, 150, 0.05)',
          },
        },
        sizeSmall: {
          padding: '8px 16px',
          fontSize: '0.85rem',
          borderRadius: 8,
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '1.05rem',
          borderRadius: 16,
        },
      },
    },
    // IconButton component standardization
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(0, 91, 150, 0.08)',
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
        colorPrimary: {
          color: '#005b96',
          '&:hover': {
            backgroundColor: 'rgba(0, 91, 150, 0.12)',
          },
        },
        colorSecondary: {
          color: '#03396c',
          '&:hover': {
            backgroundColor: 'rgba(3, 57, 108, 0.12)',
          },
        },
      },
    },
    // Card component standardization
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 91, 150, 0.08)',
          border: '1px solid rgba(0, 91, 150, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0, 91, 150, 0.15)',
            transform: 'translateY(-4px)',
            borderColor: 'rgba(0, 91, 150, 0.2)',
          },
        },
      },
    },
    // TextField component standardization
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            fontSize: '0.95rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: 'rgba(0, 91, 150, 0.23)',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 91, 150, 0.4)',
              borderWidth: '2px',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#005b96',
              borderWidth: '2px',
              boxShadow: '0 0 0 3px rgba(0, 91, 150, 0.1)',
            },
            '&.Mui-error fieldset': {
              borderColor: '#dc2626',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#03396c',
            fontSize: '0.95rem',
            fontWeight: 500,
            '&.Mui-focused': {
              color: '#005b96',
            },
            '&.Mui-error': {
              color: '#dc2626',
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '14px 16px',
          },
          '& .MuiFormHelperText-root': {
            fontSize: '0.85rem',
            marginLeft: 4,
            marginTop: 8,
          },
        },
      },
    },
    // FormControl component standardization
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: '#03396c',
            fontSize: '0.95rem',
            fontWeight: 500,
            '&.Mui-focused': {
              color: '#005b96',
            },
          },
        },
      },
    },
    // Select component standardization
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#005b96',
            borderWidth: '2px',
            boxShadow: '0 0 0 3px rgba(0, 91, 150, 0.1)',
          },
        },
        outlined: {
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 91, 150, 0.23)',
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 91, 150, 0.4)',
            borderWidth: '2px',
          },
        },
      },
    },
    // MenuItem component standardization
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.95rem',
          padding: '12px 16px',
          borderRadius: 8,
          margin: '4px 8px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(0, 91, 150, 0.08)',
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 91, 150, 0.12)',
            color: '#005b96',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(0, 91, 150, 0.16)',
            },
          },
        },
      },
    },
    // Checkbox component standardization
    MuiCheckbox: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: 8,
          '&:hover': {
            backgroundColor: 'rgba(0, 91, 150, 0.04)',
          },
          '&.Mui-checked': {
            color: '#005b96',
          },
        },
      },
    },
    // FormControlLabel component standardization
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          marginRight: 16,
          '& .MuiFormControlLabel-label': {
            fontSize: '0.95rem',
            fontWeight: 500,
            color: '#03396c',
          },
        },
      },
    },
    // CardContent component standardization
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    // CardHeader component standardization
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          '& .MuiCardHeader-title': {
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#011f4b',
          },
          '& .MuiCardHeader-subheader': {
            fontSize: '0.9rem',
            color: '#03396c',
            marginTop: '4px',
          },
        },
      },
    },
    // Paper component standardization
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&.MuiDialog-paper': {
            borderRadius: 16,
          },
        },
      },
    },
    // Dialog component standardization
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 91, 150, 0.15), 0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(0, 91, 150, 0.08)',
        },
      },
    },
    // DialogTitle component standardization
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.5rem',
          fontWeight: 600,
          padding: '20px 24px 16px',
          color: '#011f4b',
          borderBottom: '1px solid rgba(0, 91, 150, 0.08)',
        },
      },
    },
    // DialogContent component standardization
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          '&.MuiDialogContent-dividers': {
            borderTop: '1px solid rgba(0, 91, 150, 0.08)',
            borderBottom: '1px solid rgba(0, 91, 150, 0.08)',
          },
        },
      },
    },
    // DialogActions component standardization
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 20px',
          gap: '12px',
          borderTop: '1px solid rgba(0, 91, 150, 0.08)',
        },
      },
    },
    // Backdrop component standardization
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(1, 31, 75, 0.5)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    // Chip component standardization
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: '#005b96',
          color: '#ffffff',
        },
        colorSecondary: {
          backgroundColor: '#6497b1',
          color: '#ffffff',
        },
      },
    },
  },
});

function App() {
  const navigate = useNavigate();
  const timerRef = useRef();
  const INACTIVITY_LIMIT = 300000; // 5 minutes in ms

  // Reset inactivity timer
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Clear session (localStorage, etc.)
      localStorage.removeItem('token');
      // You may want to clear other session data here
      navigate('/login');
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    restoreUserFromToken();
    
    // List of events to consider as activity
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); // Start timer on mount
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
  <Suspense fallback={<div style={{padding: 24}}>Loading…</div>}>
  <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/reset-password-error" element={<ResetPasswordErrorPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route 
          path="/admin/*" 
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/dean/*" 
          element={
            <PrivateRoute allowedRoles={['dean', 'admin']}>
              <DeanDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/hod/*" 
          element={
            <PrivateRoute allowedRoles={['hod', 'admin']}>
              <HODDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/teacher/*" 
          element={
            <PrivateRoute allowedRoles={['teacher', 'admin']}>
              <TeacherDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/student/*" 
          element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentDashboard />
            </PrivateRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
  </Suspense>
    </ThemeProvider>
  );
}

export default App;
