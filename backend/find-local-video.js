const mongoose = require('mongoose');
require('dotenv').config();
const Video = require('./models/Video');

async function findLocalVideo() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  // Search for videos with the specific URL
  const localVideo = await Video.findOne({
    $or: [
      { videoUrl: { $regex: '192.168.7.20', $options: 'i' } },
      { videoLink: { $regex: '192.168.7.20', $options: 'i' } }
    ]
  });
  
  if (localVideo) {
    console.log('Found local server video:');
    console.log('ID:', localVideo._id);
    console.log('Title:', localVideo.title);
    console.log('VideoURL:', localVideo.videoUrl);
    console.log('VideoLink:', localVideo.videoLink);
    console.log('VideoType:', localVideo.videoType);
  } else {
    console.log('❌ No video found with 192.168.7.20 URL');
  }
  
  mongoose.disconnect();
}

findLocalVideo();