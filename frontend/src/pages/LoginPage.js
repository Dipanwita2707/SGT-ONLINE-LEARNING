import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Alert, 
  Paper,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  IconButton,
  useTheme
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { loginUser, isAuthenticated, getCurrentUser } from '../utils/authService';
import { parseJwt } from '../utils/jwt';
import sgtLogo from '../assets/sgt-logo-white.png';
import { universityImages } from '../assets/universityImages';

// Add CSS keyframes for animations
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('login-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'login-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const LoginPage = () => {
  const [loginType, setLoginType] = useState('email'); // 'email' or 'uid'
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState(''); // For regNo/teacherId
  const [loginInput, setLoginInput] = useState(''); // Combined input field
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem('token');
      const user = parseJwt(token);
      if (user) {
        // Get available roles
        let availableRoles = [];
        if (user.roles && Array.isArray(user.roles)) {
          availableRoles = user.roles;
        } else if (user.role) {
          availableRoles = [user.role];
        }
        
        // Get active role from localStorage or default to primary
        const savedActiveRole = localStorage.getItem('activeRole');
        let activeRole = savedActiveRole;
        
        if (!activeRole || !availableRoles.includes(activeRole)) {
          activeRole = user.primaryRole || availableRoles[0];
          localStorage.setItem('activeRole', activeRole);
        }
        
        // Redirect to role-based dashboard
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  // Slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % universityImages.length
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLoginTypeChange = (event, newLoginType) => {
    if (newLoginType !== null) {
      setLoginType(newLoginType);
      setError('');
      // Clear the opposite field when switching
      if (newLoginType === 'email') {
        setUid('');
      } else {
        setEmail('');
      }
    }
  };

  // Handler functions
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Use the login input (can be email or UID)
      const result = await loginUser(loginInput, password);
      
      if (!result.success) {
        setError(result.error);
        return;
      }
      
      const user = result.user;
      
      console.log('🎯 Login successful, user data:', user);
      
      // Get available roles
      let availableRoles = [];
      if (user.roles && Array.isArray(user.roles)) {
        availableRoles = user.roles;
      } else if (user.role) {
        availableRoles = [user.role];
      }
      
      // Set default active role
      const defaultRole = user.primaryRole || availableRoles[0];
      localStorage.setItem('activeRole', defaultRole);
      
      console.log('🔄 Setting active role:', defaultRole, 'Available roles:', availableRoles);
      
      // Redirect to dashboard (will be handled by RoleBasedRedirect)
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        background: '#f5f5f5'
      }}
    >
      {/* Left side - Image with slideshow */}
      <Box
        sx={{
          flex: { xs: '0 0 40%', md: '0 0 60%' },
          position: 'relative',
          backgroundImage: `url(${universityImages[currentImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 1s ease-in-out',
          minHeight: { xs: '40vh', md: '100vh' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1
          }
        }}
      >
        {/* Welcome Text Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            color: 'white',
            textAlign: 'left',
            maxWidth: '80%'
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
              textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
              mb: 2,
              lineHeight: 1.1,
              fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
            }}
          >
            Welcome to SGT University
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.4rem', lg: '1.6rem' },
              textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
              opacity: 0.95,
              fontWeight: 400,
              fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
            }}
          >
            Excellence in Education • Innovation in Learning • Future in Making
          </Typography>
        </Box>
      </Box>

      {/* Right side - Login Form */}
      <Box
        sx={{
          flex: { xs: '1', md: '0 0 40%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          p: { xs: 2, md: 4 },
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${theme.palette.primary.light}F0 0%, ${theme.palette.primary.main}F0 100%)`,
            zIndex: 1
          }
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '420px',
            position: 'relative',
            zIndex: 2
          }}
        >
          <Card
            elevation={24}
            sx={{
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(25px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 30px 100px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)'
              }
            }}
          >
            <CardContent 
              sx={{ 
                p: 4,
                animation: 'slideIn 0.6s ease-out',
                animationDelay: '0.2s',
                animationFillMode: 'backwards'
              }}
            >
              {/* Logo and Header */}
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  mb: 3,
                  animation: 'fadeIn 0.8s ease-out'
                }}
              >
                <img
                  src={sgtLogo}
                  alt="SGT University Logo"
                  style={{
                    width: 140,
                    height: 'auto',
                    marginBottom: 20,
                    transition: 'all 0.3s ease',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                    mb: 1,
                    fontSize: '1.75rem'
                  }}
                >
                  University Management
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.secondary.main,
                    fontSize: '1.2rem',
                    mb: 2,
                    fontWeight: 500
                  }}
                >
                  System
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#616161',
                    mb: 3,
                    fontSize: '1rem'
                  }}
                >
                  Enter your credentials to access your dashboard
                </Typography>
              </Box>
            
              <Typography 
                variant="body1" 
                color="text.secondary" 
                mb={3} 
                textAlign="center"
                sx={{ fontWeight: 400 }}
              >
                Choose your login method and enter your credentials
              </Typography>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3, 
                    width: '100%',
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      fontWeight: 500
                    }
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address or UID *" 
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  margin="normal"
                  helperText="You can login using either your email address or UID"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 2,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.light,
                          borderWidth: 2
                        }
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 20px ${theme.palette.primary.main}25`,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2
                        }
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666',
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: theme.palette.primary.main
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#888',
                      fontSize: '0.75rem'
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Password *"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon 
                          sx={{ 
                            color: '#888',
                            transition: 'color 0.3s ease'
                          }} 
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 2,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.light,
                          borderWidth: 2
                        },
                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                          color: theme.palette.primary.main
                        }
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 20px ${theme.palette.primary.main}25`,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2
                        },
                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                          color: theme.palette.primary.main
                        }
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666',
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: theme.palette.primary.main
                      }
                    }
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.8,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    textTransform: 'none',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: `0 8px 25px ${theme.palette.primary.main}4D`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      transition: 'left 0.5s'
                    },
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                      boxShadow: `0 12px 40px ${theme.palette.primary.main}66`,
                      transform: 'translateY(-2px)',
                      '&::before': {
                        left: '100%'
                      }
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                      boxShadow: `0 6px 20px ${theme.palette.primary.main}4D`
                    },
                    '&:disabled': {
                      background: theme.palette.grey[300],
                      boxShadow: 'none',
                    }
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                </Button>
                
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link
                    href="/forgot-password"
                    sx={{
                      color: '#1565c0',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: theme.palette.primary.dark,
                      }
                    }}
                  >
                    Forgot your password?
                  </Link>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
