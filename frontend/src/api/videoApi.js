import axios from 'axios';

export const uploadVideo = async (data, token, progressCallback) => {
  if (data.videoType === 'link') {
    // For video links, send JSON data
    const payload = {
      title: data.title,
      description: data.description || '',
      courseId: data.courseId,
      videoLink: data.videoLink,
      videoType: data.videoType
    };
    
    // Include unitId if it exists
    if (data.unitId) {
      payload.unitId = data.unitId;
    }
    
    const res = await axios.post('/api/admin/video/upload', payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return res.data;
  } else {
    // For file uploads, use FormData
    const formData = new FormData();
    
    // Explicitly handle each field to ensure unitId is included
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('courseId', data.courseId);
    formData.append('videoType', data.videoType || 'upload');
    
    // Include unitId if it exists
    if (data.unitId) {
      formData.append('unitId', data.unitId);
    }
    
    const res = await axios.post('/api/admin/video/upload', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: progressEvent => {
        if (progressCallback) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressCallback(percentCompleted);
        }
      }
    });
    
    return res.data;
  }
};

export const getVideoAnalytics = async (videoId, token) => {
  const res = await axios.get(`/api/admin/video/${videoId}/analytics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const removeVideo = async (id, token) => {
  const res = await axios.delete(`/api/admin/video/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const warnVideo = async (id, token) => {
  const res = await axios.patch(`/api/admin/video/${id}/warn`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
