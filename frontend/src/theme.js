import { createTheme } from '@mui/material/styles';

// SGT University Brand Colors based on logo
const sgtColors = {
  primary: {
    main: '#1565c0', // Deep blue from SGT logo
    light: '#42a5f5', // Lighter blue
    dark: '#0d47a1', // Darker blue
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#1976d2', // Medium blue
    light: '#64b5f6', // Light blue
    dark: '#1565c0', // Deep blue
    contrastText: '#ffffff',
  },
  accent: {
    main: '#2196f3', // Bright blue
    light: '#90caf9', // Very light blue
    dark: '#1565c0', // Deep blue
  }
};

export const getTheme = (mode = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: sgtColors.primary,
      secondary: sgtColors.secondary,
      ...(mode === 'light'
        ? {
            background: { 
              default: '#f8fafc', // Very light blue-grey
              paper: '#ffffff'
            },
            text: {
              primary: '#1a202c',
              secondary: '#4a5568'
            }
          }
        : {
            background: { 
              default: '#0f172a', // Dark blue-grey
              paper: '#1e293b'
            },
            text: {
              primary: '#f8fafc',
              secondary: '#cbd5e1'
            }
          }),
    },
    shape: { 
      borderRadius: 12 
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
        color: mode === 'light' ? sgtColors.primary.main : '#ffffff'
      },
      h6: {
        fontWeight: 600,
        color: mode === 'light' ? sgtColors.secondary.main : '#90caf9'
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
          },
          contained: {
            background: `linear-gradient(135deg, ${sgtColors.primary.main} 0%, ${sgtColors.secondary.main} 100%)`,
            boxShadow: `0 4px 15px ${sgtColors.primary.main}40`,
            '&:hover': {
              background: `linear-gradient(135deg, ${sgtColors.secondary.main} 0%, ${sgtColors.primary.main} 100%)`,
              boxShadow: `0 6px 20px ${sgtColors.primary.main}60`,
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(21, 101, 192, 0.08)',
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: sgtColors.primary.main,
              }
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: sgtColors.primary.main,
            }
          }
        }
      }
    }
  });
