const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db } = require('../config/firebase');
const { decrypt } = require('../utils/crypto');
const { TWITCH_CLIENT_ID } = require('../utils/twitch'); 
const { verifyApiToken } = require('../middleware/auth'); // <-- 1. Import Middleware

// Helper to get stored token
async function getTwitchToken(uid) {
  const doc = await db.collection('connections').doc(uid).collection('twitch').doc('tokens').get();
  if (!doc.exists) throw new Error('Twitch not connected');
  
  const data = doc.data();
  if (!data.accessToken || !data.channelId) throw new Error('Corrupt token data');

  try {
    return {
      accessToken: decrypt(data.accessToken),
      channelId: data.channelId
    };
  } catch (e) {
    throw new Error('Decryption failed. Please reconnect Twitch.');
  }
}

// GET /api/v1/twitch/analytics
// 2. Add 'verifyApiToken' before the async handler
router.get('/analytics', verifyApiToken, async (req, res) => {
  try {
    // Now req.user is populated!
    const { accessToken, channelId } = await getTwitchToken(req.user.uid);
    
    // Ensure Client ID is loaded
    if (!TWITCH_CLIENT_ID) {
        console.error("Missing TWITCH_CLIENT_ID in backend env");
        return res.status(500).send("Server misconfiguration: Missing Twitch Keys");
    }

    const headers = { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${accessToken}` };

    // 1. Get User Info
    const userRes = await axios.get(`https://api.twitch.tv/helix/users`, {
      headers,
      params: { id: channelId }
    });

    if (!userRes.data.data || userRes.data.data.length === 0) {
        throw new Error("Twitch user not found");
    }
    const userData = userRes.data.data[0];

    // 2. Get Channel Followers
    const channelRes = await axios.get(`https://api.twitch.tv/helix/channels/followers`, {
      headers,
      params: { broadcaster_id: channelId, first: 1 }
    });

    // 3. Get Stream Status
    const streamRes = await axios.get(`https://api.twitch.tv/helix/streams`, {
      headers,
      params: { user_id: channelId }
    });

    const isLive = streamRes.data.data.length > 0;
    const currentViewers = isLive ? streamRes.data.data[0].viewer_count : 0;

    res.json({
      platform: 'twitch',
      channelTitle: userData.display_name,
      thumbnail: userData.profile_image_url,
      stats: {
        followers: channelRes.data.total,
        totalViews: userData.view_count,
        isLive: isLive,
        currentViewers: currentViewers,
        broadcasterType: userData.broadcaster_type || 'Streamer'
      }
    });

  } catch (error) {
    const status = error.response?.status || 500;
    const msg = error.response?.data?.message || error.message;
    console.error(`[Twitch API Error ${status}]: ${msg}`);
    
    if (status === 401) {
        return res.status(401).send("Twitch token expired. Please reconnect.");
    }
    res.status(500).send(`Failed to fetch Twitch stats: ${msg}`);
  }
});

module.exports = router;