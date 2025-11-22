// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { admin, db } = require('../config/firebase');
const { JWT_SECRET, verifyApiToken } = require('../middleware/auth');
const { 
  google, 
  YOUTUBE_CLIENT_ID, 
  YOUTUBE_CLIENT_SECRET, 
  YOUTUBE_REDIRECT_URI 
} = require('../utils/youtube');
const { encrypt } = require('../utils/crypto');
const { getTwitchTokens, getTwitchUser } = require('../utils/twitch');

// --- V2: Auth Exchange Endpoint ---
// POST /api/v1/auth/exchange
router.post('/exchange', async (req, res) => {
  try {
    const idToken = req.body.token;
    if (!idToken) {
      return res.status(400).send('Firebase token is required');
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    const apiTokenPayload = { uid, email };
    const apiToken = jwt.sign(apiTokenPayload, JWT_SECRET, { expiresIn: '1h' });
    res.json({ apiToken });
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(401).send('Authentication failed.');
  }
});

// POST /api/v1/auth/connect/youtube
// This route MUST be protected so we know which user (req.user.uid) to associate the tokens with.
router.post('/connect/youtube', verifyApiToken, async (req, res) => {
  try {
    const { code } = req.body;
    const uid = req.user.uid;
    if (!code) {
      return res.status(400).send('No authorization code provided.');
    }

    const oauth2Client = new google.auth.OAuth2(
      YOUTUBE_CLIENT_ID,
      YOUTUBE_CLIENT_SECRET,
      YOUTUBE_REDIRECT_URI
    );

    // 1. Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, scope } = tokens;

    if (!access_token || !refresh_token) {
      return res.status(400).send('Failed to retrieve refresh token. Please re-auth and ensure you grant offline access.');
    }

    // 2. Get Channel Info
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelResponse = await youtube.channels.list({
      part: 'snippet',
      mine: true,
    });

    const channel = channelResponse.data.items[0];
    const channelId = channel.id;
    const channelName = channel.snippet.title;

    // 3. Encrypt and Save Tokens
    const connectionRef = db.collection('connections').doc(uid).collection('youtube').doc('tokens');
    
    await connectionRef.set({
      channelId: channelId,
      channelName: channelName,
      scope: scope,
      accessToken: encrypt(access_token), // <-- Encrypted
      refreshToken: encrypt(refresh_token), // <-- Encrypted
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[StreamTitle.AI] Successfully connected YouTube channel for user ${uid}`);
    res.json({ success: true, channelName: channelName });

  } catch (error) {
    console.error("[StreamTitle.AI] Error connecting YouTube:", error.message);
    res.status(500).send('Failed to connect YouTube account.');
  }
});

// POST /api/v1/auth/connect/twitch
router.post('/connect/twitch', verifyApiToken, async (req, res) => {
  try {
    const { code } = req.body;
    const uid = req.user.uid;

    if (!code) return res.status(400).send('No code provided.');

    // 1. Exchange Code for Tokens
    const tokens = await getTwitchTokens(code);
    const { access_token, refresh_token, scope } = tokens;

    // 2. Get Channel Info
    const userProfile = await getTwitchUser(access_token);
    const channelId = userProfile.id;
    const channelName = userProfile.display_name;

    // 3. Encrypt and Save to Firestore
    // Note: We save this in a sibling collection to YouTube
    const connectionRef = db.collection('connections').doc(uid).collection('twitch').doc('tokens');

    await connectionRef.set({
      channelId: channelId,
      channelName: channelName,
      accessToken: encrypt(access_token),
      refreshToken: encrypt(refresh_token),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[StreamTitle.AI] Connected Twitch for user ${uid}`);
    res.json({ success: true, channelName });

  } catch (error) {
    console.error("Twitch Connect Error:", error);
    res.status(500).send('Failed to connect Twitch account.');
  }
});

module.exports = router;