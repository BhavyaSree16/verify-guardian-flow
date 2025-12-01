# ZIP File Upload Setup Guide

## Current Status
The ZIP file upload feature has been implemented with **automatic fallback support**:

- ✅ **Simulation Mode**: Works immediately without any setup
- ✅ **Firebase Mode**: Works with proper Firebase configuration

## Quick Start (Simulation Mode)

Your application will work immediately with simulation mode:

1. **Start the application**: `npm run dev`
2. **Upload ZIP files**: The system will use simulation mode automatically
3. **Check status**: Click "Check Upload Status" button to see current mode

## Setup Firebase (Optional - for Production)

To use real Firebase storage instead of simulation:

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Firebase Storage
4. Set up Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null; // Adjust as needed
    }
  }
}
```

### 2. Get Firebase Configuration
1. Go to Project Settings → General
2. Scroll down to "Your apps" → Web app
3. Copy the Firebase config object

### 3. Update Environment Variables
Replace the demo values in `.env` with your actual Firebase configuration:

```env
# Firebase Configuration (Replace with your actual values)
VITE_FIREBASE_API_KEY="your-actual-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

### 4. Restart Application
```bash
npm run dev
```

## Features Implemented

### ✅ **Robust File Upload**
- **File Validation**: Checks file type, size, and content
- **Multiple MIME Types**: Supports various ZIP formats
- **Error Handling**: Clear error messages for issues
- **Progress Tracking**: Visual upload progress
- **Auto Retry**: Suggests fixes for common issues

### ✅ **Debug Features**
- **Status Check**: "Check Upload Status" button shows current mode
- **Console Logging**: Detailed logs for troubleshooting
- **Error Details**: Specific error messages for different issues

### ✅ **User Experience**
- **Step-by-Step Guide**: Clear instructions for Aadhaar download
- **Visual Progress**: Progress bar and step indicators
- **Loading States**: Proper loading animations
- **Toast Notifications**: Real-time feedback

## Common Issues & Solutions

### Issue: "Please select a ZIP file"
- **Cause**: File type not recognized
- **Solution**: Ensure file has .zip extension and proper MIME type

### Issue: "File size must be less than 50MB"
- **Cause**: File too large
- **Solution**: Check if correct Aadhaar ZIP file (should be 1-5MB)

### Issue: "Upload failed"
- **Cause**: Network or configuration issue
- **Solution**: 
  1. Check internet connection
  2. Click "Check Upload Status" to see current mode
  3. Try again (system will use simulation if Firebase unavailable)

## Upload Flow

1. **File Selection**: Browse and select Aadhaar ZIP file
2. **Validation**: Automatic file type and size checking  
3. **Upload**: Either Firebase storage or simulation mode
4. **Success**: File processed and ready for next step

## Technical Details

- **Firebase SDK**: v12.6.0 with modern v9 API
- **Fallback Mode**: Automatic simulation when Firebase unavailable
- **File Types**: `.zip`, `application/zip`, `application/x-zip-compressed`
- **Size Limit**: 50MB maximum
- **Security**: File validation and secure upload paths

The system is designed to work immediately in simulation mode, so you can start testing right away!