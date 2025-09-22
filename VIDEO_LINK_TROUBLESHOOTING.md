# Video Link Playback Troubleshooting Guide

## Issue: Video link http://192.168.7.20:8080/sgtuvideo.mp4 not playing

### Potential Causes & Solutions:

## 1. **CORS (Cross-Origin Resource Sharing) Issues**
Your local server at `192.168.7.20:8080` might not be allowing cross-origin requests from `localhost:3000`.

**Solution**: Add CORS headers to your video server:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Range
```

## 2. **Network Accessibility**
The IP `192.168.7.20` might not be accessible from your current network location.

**Test**: Open `http://192.168.7.20:8080/sgtuvideo.mp4` directly in browser
- ✅ If it plays → CORS issue
- ❌ If it doesn't load → Network/server issue

## 3. **Video Format Compatibility**
The video format might not be supported by the browser's video element.

**Supported formats**: MP4 (H.264), WebM, Ogg

## 4. **Server Configuration**
Your video server might not be properly configured to serve video files with correct headers.

**Required headers**:
- `Content-Type: video/mp4`
- `Accept-Ranges: bytes` (for seeking)

## 5. **Browser Security**
Modern browsers block mixed content (HTTP video on HTTPS page).

**Check**: Ensure both frontend and video server use same protocol (both HTTP or both HTTPS)

---

## Quick Debugging Steps:

1. **Test direct access**: `http://192.168.7.20:8080/sgtuvideo.mp4`
2. **Check browser console**: Look for CORS or network errors
3. **Check Network tab**: See if request is made and what response is received
4. **Try localhost**: Test with `http://localhost:8080/sgtuvideo.mp4` if possible

---

## Fixed in VideoTable.js:
- ✅ Now renders video element for both uploaded and linked videos
- ✅ Added error handling with fallback display
- ✅ Added "Open Link" button when preview fails
- ✅ Added video type indicators