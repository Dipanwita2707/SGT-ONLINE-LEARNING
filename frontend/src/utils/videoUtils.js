/**
 * Formats a video URL to ensure it's properly accessible
 * @param {string} videoUrl - The video URL from the backend
 * @returns {string} Properly formatted video URL
 */
export const formatVideoUrl = (videoUrl) => {
  if (!videoUrl) return '';
  
  // If the URL already starts with http, return it as is
  if (videoUrl.startsWith('http')) {
    return videoUrl;
  }
  
  // Otherwise prepend the backend URL
  // Ensure the URL is properly formatted (handle both /uploads/file.mp4 and uploads/file.mp4 formats)
  const formattedUrl = videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`;
  return `http://localhost:5000${formattedUrl}`;
};

/**
 * Formats duration in seconds to a readable time format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  // Handle edge cases
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return '0:00';
  }
  
  // Ensure we have a positive number
  const duration = Math.max(0, parseFloat(seconds));
  
  // For longer videos, include hours
  if (duration >= 3600) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const remainingSeconds = Math.floor(duration % 60);
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  
  // Standard minutes:seconds format
  const minutes = Math.floor(duration / 60);
  const remainingSeconds = Math.floor(duration % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

/**
 * Detects video platform type from URL
 * @param {string} videoUrl - The video URL to analyze
 * @returns {string} Platform type ('youtube', 'vimeo', 'direct', 'unknown')
 */
export const detectVideoType = (videoUrl) => {
  if (!videoUrl) return 'unknown';
  
  const url = videoUrl.toLowerCase();
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  if (url.startsWith('http') && (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg'))) {
    return 'direct';
  }
  
  // If it's a local file (doesn't start with http)
  if (!url.startsWith('http')) {
    return 'upload';
  }
  
  return 'unknown';
};

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} YouTube video ID or null if invalid
 */
export const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

/**
 * Extracts Vimeo video ID from Vimeo URL
 * @param {string} url - Vimeo URL
 * @returns {string|null} Vimeo video ID or null if invalid
 */
export const getVimeoVideoId = (url) => {
  if (!url) return null;
  
  const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

/**
 * Generates embeddable video URL based on platform
 * @param {string} videoUrl - Original video URL
 * @param {string} videoType - Video type from database ('upload' or 'link')
 * @returns {object} Object containing embedType and embedUrl
 */
export const getEmbeddableVideoInfo = (videoUrl, videoType) => {
  if (!videoUrl) {
    return { embedType: 'unknown', embedUrl: '' };
  }

  // If it's an uploaded file, use the formatted URL
  if (videoType === 'upload' || !videoType) {
    return {
      embedType: 'upload',
      embedUrl: formatVideoUrl(videoUrl)
    };
  }

  // If it's a video link, determine the platform
  const platformType = detectVideoType(videoUrl);

  switch (platformType) {
    case 'youtube':
      const youtubeId = getYouTubeVideoId(videoUrl);
      return {
        embedType: 'youtube',
        embedUrl: youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : videoUrl,
        originalUrl: videoUrl
      };

    case 'vimeo':
      const vimeoId = getVimeoVideoId(videoUrl);
      return {
        embedType: 'vimeo',
        embedUrl: vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : videoUrl,
        originalUrl: videoUrl
      };

    case 'direct':
      return {
        embedType: 'direct',
        embedUrl: videoUrl
      };

    default:
      return {
        embedType: 'unknown',
        embedUrl: videoUrl
      };
  }
};
