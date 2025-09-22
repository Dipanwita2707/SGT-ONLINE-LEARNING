import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  IconButton,
  Paper,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  Container,
  Alert
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Speed as SpeedIcon,
  Fullscreen,
  FullscreenExit,
  Close,
  OpenInNew
} from '@mui/icons-material';
import { updateWatchHistory } from '../../api/studentVideoApi';
import { formatDuration, getEmbeddableVideoInfo } from '../../utils/videoUtils';

const EnhancedVideoPlayer = ({ 
  videoId, 
  videoUrl, 
  videoType, 
  videoLink,
  title, 
  token, 
  onTimeUpdate, 
  onVideoComplete 
}) => {
  // Determine video info based on type
  const videoInfo = React.useMemo(() => {
    // If videoType is 'link' and we have videoLink, use that
    if (videoType === 'link' && videoLink) {
      return getEmbeddableVideoInfo(videoLink, 'link');
    }
    // Otherwise use videoUrl (uploaded file or fallback)
    return getEmbeddableVideoInfo(videoUrl || videoLink, videoType);
  }, [videoUrl, videoType, videoLink]);

  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [timeWatched, setTimeWatched] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);

  // Speed options
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Handle video time update for tracking (only for upload videos)
  const handleTimeUpdate = () => {
    if (videoRef.current && videoInfo.embedType === 'upload') {
      const newCurrentTime = videoRef.current.currentTime;
      const newDuration = videoRef.current.duration;
      
      setCurrentTime(newCurrentTime);
      if (newDuration && !isNaN(newDuration)) {
        setDuration(newDuration);
      }

      // Update watch time
      const now = Date.now();
      const timeDiff = (now - lastUpdateTime) / 1000;
      if (isPlaying && timeDiff > 0 && timeDiff < 5) {
        setTimeWatched(prev => prev + timeDiff);
      }
      setLastUpdateTime(now);

      // Call parent callback
      if (onTimeUpdate) {
        onTimeUpdate(newCurrentTime, newDuration);
      }
    }
  };

  // Handle video end
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (onVideoComplete) {
      onVideoComplete();
    }
    // Update watch history
    updateWatchTime(true);
  };

  // Update watch history in backend
  const updateWatchTime = async (completed = false) => {
    if (videoId && token && timeWatched > 0) {
      try {
        await updateWatchHistory(videoId, {
          timeSpent: Math.floor(timeWatched),
          currentTime: Math.floor(currentTime),
          duration: Math.floor(duration),
          completed: completed || (duration > 0 && currentTime >= duration * 0.9)
        }, token);
      } catch (error) {
        console.error('Error updating watch history:', error);
      }
    }
  };

  // Toggle play/pause for uploaded videos
  const togglePlay = () => {
    if (videoRef.current && videoInfo.embedType === 'upload') {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle volume change
  const handleVolumeChange = (event, newValue) => {
    if (videoRef.current && videoInfo.embedType === 'upload') {
      setVolume(newValue);
      videoRef.current.volume = newValue;
      if (newValue > 0 && isMuted) {
        setIsMuted(false);
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current && videoInfo.embedType === 'upload') {
      setIsMuted(!isMuted);
      videoRef.current.muted = !isMuted;
    }
  };

  // Handle progress change
  const handleProgressChange = (event, newValue) => {
    if (videoRef.current && videoInfo.embedType === 'upload') {
      videoRef.current.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Show controls when mouse moves
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (isPlaying && videoInfo.embedType === 'upload') {
        setShowControls(false);
      }
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  // Handle speed change
  const handleSpeedChange = (speed) => {
    if (videoRef.current && videoInfo.embedType === 'upload') {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      updateWatchTime();
    };
  }, [controlsTimeout]);

  // Initialize video for uploads
  useEffect(() => {
    if (videoRef.current && videoInfo.embedType === 'upload') {
      const video = videoRef.current;
      
      const handleCanPlay = () => setLoading(false);
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        setLoading(false);
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('play', () => setIsPlaying(true));
      video.addEventListener('pause', () => setIsPlaying(false));
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [videoInfo.embedUrl]);

  // Render embedded video player based on type
  const renderVideoPlayer = () => {
    switch (videoInfo.embedType) {
      case 'youtube':
        return (
          <Box sx={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`${videoInfo.embedUrl}?enablejsapi=1&modestbranding=1&rel=0`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
              onLoad={() => setLoading(false)}
            />
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 10
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}
          </Box>
        );

      case 'vimeo':
        return (
          <Box sx={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`${videoInfo.embedUrl}?title=0&byline=0&portrait=0`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={title}
              onLoad={() => setLoading(false)}
            />
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 10
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}
          </Box>
        );

      case 'direct':
        return (
          <Box 
            sx={{ 
              position: 'relative', 
              width: '100%', 
              backgroundColor: '#000',
              overflow: 'hidden'
            }}
            onMouseMove={handleMouseMove}
          >
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 10
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}

            <video
              ref={videoRef}
              src={videoInfo.embedUrl}
              style={{ 
                width: '100%', 
                maxHeight: '500px',
                display: 'block'
              }}
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onClick={togglePlay}
            />

            {/* Custom controls for direct videos */}
            {showControls && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 2,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  transition: 'opacity 0.3s'
                }}
              >
                <Slider
                  value={currentTime}
                  max={duration}
                  onChange={handleProgressChange}
                  sx={{ color: 'primary.main', mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                      {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>
                    <Typography variant="body2" sx={{ ml: 1, color: 'white' }}>
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                      {isMuted ? <VolumeOff /> : <VolumeUp />}
                    </IconButton>
                    <IconButton onClick={toggleFullScreen} sx={{ color: 'white' }}>
                      <Fullscreen />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        );

      case 'upload':
      default:
        return (
          <Box 
            sx={{ 
              position: 'relative', 
              width: '100%', 
              backgroundColor: '#000',
              overflow: 'hidden'
            }}
            onMouseMove={handleMouseMove}
          >
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 10
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}

            <video
              ref={videoRef}
              src={videoInfo.embedUrl}
              style={{ 
                width: '100%', 
                maxHeight: '500px',
                display: 'block'
              }}
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onClick={togglePlay}
              controlsList="nodownload"
            />

            {/* Custom controls */}
            {showControls && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 2,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  transition: 'opacity 0.3s'
                }}
              >
                <Slider
                  value={currentTime}
                  max={duration}
                  onChange={handleProgressChange}
                  sx={{ color: 'primary.main', mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                      {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>
                    <Typography variant="body2" sx={{ ml: 1, color: 'white' }}>
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title="Volume">
                      <Box sx={{ display: 'flex', alignItems: 'center', width: 100, mx: 1 }}>
                        <IconButton onClick={toggleMute} size="small" sx={{ color: 'white' }}>
                          {isMuted ? <VolumeOff /> : <VolumeUp />}
                        </IconButton>
                        <Slider
                          value={volume}
                          onChange={handleVolumeChange}
                          min={0}
                          max={1}
                          step={0.1}
                          sx={{ color: 'primary.main', ml: 1 }}
                        />
                      </Box>
                    </Tooltip>
                    <IconButton onClick={toggleFullScreen} sx={{ color: 'white' }}>
                      <Fullscreen />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            )}

            {error && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  p: 2
                }}
              >
                <Typography variant="h6">{error}</Typography>
              </Box>
            )}
          </Box>
        );
    }
  };

  return (
    <>
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Video info banner for external links */}
        {videoInfo.embedType === 'youtube' || videoInfo.embedType === 'vimeo' ? (
          <Box sx={{ p: 1, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              External Video: {videoInfo.embedType === 'youtube' ? 'YouTube' : 'Vimeo'}
            </Typography>
            {videoInfo.originalUrl && (
              <IconButton
                href={videoInfo.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: 'white' }}
              >
                <OpenInNew />
              </IconButton>
            )}
          </Box>
        ) : null}

        {renderVideoPlayer()}

        {videoInfo.embedType === 'unknown' && (
          <Alert severity="warning" sx={{ m: 2 }}>
            <Typography variant="body2">
              Unsupported video format. Please check the video URL or contact support.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Fullscreen Dialog for uploaded videos */}
      {isFullScreen && videoInfo.embedType === 'upload' && (
        <Dialog
          fullScreen
          open={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          sx={{
            '& .MuiDialog-paper': { 
              backgroundColor: '#000',
              margin: 0
            }
          }}
        >
          <AppBar position="fixed" color="transparent" elevation={0} sx={{ top: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white' }}>
                {title}
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setIsFullScreen(false)}
                aria-label="close"
              >
                <Close />
              </IconButton>
            </Toolbar>
          </AppBar>
          
          <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
            <video
              src={videoInfo.embedUrl}
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              controls
              autoPlay={isPlaying}
            />
          </Box>
        </Dialog>
      )}
    </>
  );
};

export default EnhancedVideoPlayer;