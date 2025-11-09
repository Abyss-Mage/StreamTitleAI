// backend/utils/youtube.js
const { google } = require('googleapis');
const { db } = require('../config/firebase');
const { decrypt } = require('./crypto');

// --- NEW V2: YouTube OAuth Config ---
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;

if (!YOUTUBE_REDIRECT_URI) {
  console.error("CRITICAL ERROR: 'YOUTUBE_REDIRECT_URI' is not set in your .env file.");
  throw new Error('YOUTUBE_REDIRECT_URI is not set. Please check your .env file.');
}

// --- NEW V2: YouTube OAuth Client Helper ---
async function getAuthenticatedYouTubeClient(uid) {
  // 1. Get the user's stored refresh token
  const tokenRef = db.collection('connections').doc(uid).collection('youtube').doc('tokens');
  const tokenDoc = await tokenRef.get();
  
  if (!tokenDoc.exists) {
    throw new Error('User has no YouTube connection.');
  }
  
  const encryptedRefreshToken = tokenDoc.data().refreshToken;
  const refreshToken = decrypt(encryptedRefreshToken);

  // 2. Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT_URI
  );

  // 3. Set the refresh token
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  // 4. Get a new access token
  const { token: newAccessToken } = await oauth2Client.getAccessToken();
  
  // 5. Set the new access token on the client
  oauth2Client.setCredentials({
    access_token: newAccessToken
  });

  return oauth2Client;
}

module.exports = {
  getAuthenticatedYouTubeClient,
  google,
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET,
  YOUTUBE_REDIRECT_URI
};