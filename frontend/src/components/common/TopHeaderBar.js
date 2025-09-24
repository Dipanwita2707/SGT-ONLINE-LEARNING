import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

/**
 * TopHeaderBar - shared header for all dashboards
 * Props:
 * - title: string (required)
 * - subtitle: string (optional)
 * - right: ReactNode (optional) actions rendered on the right side
 */
export default function TopHeaderBar({ title, subtitle, right }) {
  const theme = useTheme();
  return (
    <Box sx={{ 
      background: 'linear-gradient(180deg, #ffffff 0%, #f6f7fb 100%)',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      pl: 3,
      pr: 3,
      py: 2.5,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      zIndex: 100
    }}>
      <Box>
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#1f2937',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: subtitle ? 0.5 : 0
          }}
        >
          <Box 
            sx={{
              width: 32,
              height: 32,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            📊
          </Box>
          {title}
        </Typography>
        {subtitle && (
          <Typography 
            variant="body2" 
            sx={{ color: '#6b7280', fontWeight: 400 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {right}
      </Box>
    </Box>
  );
}
