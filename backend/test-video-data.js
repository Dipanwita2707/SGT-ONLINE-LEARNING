// Test to check what's stored in MongoDB for video data
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Video = require('./models/Video');

async function testVideoData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for testing');

    // Find a video that has videoLink field
    const videoWithLink = await Video.findOne({
      videoLink: { $exists: true, $ne: null }
    });

    if (videoWithLink) {
      console.log('\n=== Video with Link Found ===');
      console.log('Video ID:', videoWithLink._id);
      console.log('Title:', videoWithLink.title);
      console.log('VideoURL:', videoWithLink.videoUrl);
      console.log('VideoLink:', videoWithLink.videoLink);
      console.log('VideoType:', videoWithLink.videoType);
      
      // Test the URL logic that should be used
      const actualVideoUrl = videoWithLink.videoLink || videoWithLink.videoUrl;
      console.log('\n=== URL Logic Test ===');
      console.log('Actual Video URL (videoLink || videoUrl):', actualVideoUrl);
      console.log('Starts with http?', actualVideoUrl && actualVideoUrl.startsWith('http'));
    } else {
      console.log('❌ No video with videoLink found in database');
    }

    // List all videos to see what's in the database
    const allVideos = await Video.find({}).select('title videoUrl videoLink videoType').limit(10);
    console.log('\n=== All Videos (first 10) ===');
    allVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   VideoURL: ${video.videoUrl || 'null'}`);
      console.log(`   VideoLink: ${video.videoLink || 'null'}`);
      console.log(`   VideoType: ${video.videoType || 'null'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

testVideoData();