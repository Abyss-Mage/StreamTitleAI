const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db } = require('../config/firebase');
const { decrypt } = require('../utils/crypto');
const { TWITCH_CLIENT_ID } = require('../utils/twitch'); // Ensure this is exported from utils

// Helper to get stored token
async function getTwitchToken(uid) {
  const doc = await db.collection('connections').doc(uid).collection('twitch').doc('tokens').get();
  if (!doc.exists) throw new Error('Twitch not connected');
  return {
    accessToken: decrypt(doc.data().accessToken),
    channelId: doc.data().channelId
  };
}

// GET /api/v1/twitch/analytics
router.get('/analytics', async (req, res) => {
  try {
    const { accessToken, channelId } = await getTwitchToken(req.user.uid);
    const headers = { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${accessToken}` };

    // 1. Get Channel Info (Followers)
    const channelRes = await axios.get(`https://api.twitch.tv/helix/channels/followers`, {
      headers,
      params: { broadcaster_id: channelId, first: 1 } // We just need the "total" count
    });

    // 2. Get User Info (Total Views, Profile Pic)
    const userRes = await axios.get(`https://api.twitch.tv/helix/users`, {
      headers,
      params: { id: channelId }
    });
    
    // 3. Get Stream Status (Is Live?, Current Viewers)
    const streamRes = await axios.get(`https://api.twitch.tv/helix/streams`, {
      headers,
      params: { user_id: channelId }
    });

    const userData = userRes.data.data[0];
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
        broadcasterType: userData.broadcaster_type || 'Streamer' // partner/affiliate
      }
    });

  } catch (error) {
    console.error("Twitch Analytics Error:", error.response?.data || error.message);
    res.status(500).send('Failed to fetch Twitch stats.');
  }
});

module.exports = router;