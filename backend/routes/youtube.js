// backend/routes/youtube.js
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { getAuthenticatedYouTubeClient, google } = require('../utils/youtube');

// --- Channel Connection Endpoints ---
// GET /api/v1/youtube/connections
router.get('/connections', async (req, res) => {
  try {
    const uid = req.user.uid;
    
    // Check for YouTube connection
    const ytDocRef = db.collection('connections').doc(uid).collection('youtube').doc('tokens');
    const ytDoc = await ytDocRef.get();
    const ytChannelName = ytDoc.exists ? ytDoc.data().channelName : null;
    
    // Check for Twitch (placeholder)
    const twDocRef = db.collection('connections').doc(uid).collection('twitch').doc('tokens');
    const twDoc = await twDocRef.get();
    const twChannelName = twDoc.exists ? twDoc.data().channelName : null;

    res.json({
      youtube: {
        connected: ytDoc.exists,
        channelName: ytChannelName,
      },
      twitch: {
        connected: twDoc.exists,
        channelName: twChannelName,
      },
    });

  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).send('Failed to fetch connection status.');
  }
});

// --- YouTube Analytics (Totals) ---
// GET /api/v1/youtube/analytics
router.get('/analytics', async (req, res) => {
  try {
    const uid = req.user.uid;

    // 1. Get the authenticated client
    const oauth2Client = await getAuthenticatedYouTubeClient(uid);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // 2. Get Channel Info
    const channelResponse = await youtube.channels.list({
      part: 'contentDetails,snippet',
      mine: true,
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).send('YouTube channel not found.');
    }
    
    const channelData = channelResponse.data.items[0];
    const channelTitle = channelData.snippet.title;
    
    // 3. Call the YouTube Analytics API (Totals for last 30 days)
    const analytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const analyticsResponse = await analytics.reports.query({
      ids: 'channel==MINE', // Use "MINE" for the authenticated user
      startDate: startDate,
      endDate: endDate,
      metrics: 'views,subscribersGained,subscribersLost',
    });

    res.json({
      success: true,
      channelTitle: channelTitle,
      analytics: analyticsResponse.data,
    });

  } catch (error) {
    console.error("[StreamTitle.AI] Error fetching YouTube analytics:", error.message);
    res.status(500).send('Failed to fetch YouTube analytics.');
  }
});


// --- NEW: YouTube Analytics (Daily Growth) ---
// GET /api/v1/youtube/analytics/growth
router.get('/analytics/growth', async (req, res) => {
  try {
    const uid = req.user.uid;
    
    // 1. Get the authenticated client
    const oauth2Client = await getAuthenticatedYouTubeClient(uid);
    
    // 2. Call the YouTube Analytics API
    const analytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });
    
    const endDate = new Date().toISOString().split('T')[0];
    // Get data for the last 30 days
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const analyticsResponse = await analytics.reports.query({
      ids: 'channel==MINE',
      startDate: startDate,
      endDate: endDate,
      metrics: 'subscribersGained,subscribersLost',
      dimensions: 'day', // This is the key change to get time-series data
      sort: 'day', // Sort by day
    });

    // 3. Format the data for recharts
    const growthData = analyticsResponse.data.rows.map(row => {
      const [day, gained, lost] = row;
      const netChange = parseInt(gained) - parseInt(lost);
      
      // Format day from "YYYY-MM-DD" to "MM-DD" for cleaner chart labels
      const [year, month, date] = day.split('-');
      const formattedDay = `${month}-${date}`;

      return {
        day: formattedDay,
        Gained: parseInt(gained),
        Lost: parseInt(lost),
        Net: netChange
      };
    });

    res.json({
      success: true,
      growthData: growthData,
    });

  } catch (error) {
    console.error("[StreamTitle.AI] Error fetching YouTube growth analytics:", error.message);
    res.status(500).send('Failed to fetch YouTube growth analytics.');
  }
});


// --- Get YouTube Videos List ---
// GET /api/v1/youtube/videos
router.get('/videos', async (req, res) => {
  try {
    const uid = req.user.uid;
    const maxResults = 25; 

    // 1. Get the authenticated client
    const oauth2Client = await getAuthenticatedYouTubeClient(uid);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // 2. Find the user's "uploads" playlist ID
    const channelResponse = await youtube.channels.list({
      part: 'contentDetails',
      mine: true,
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).send('YouTube channel not found.');
    }
    
    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

    // 3. Get the video IDs from the "uploads" playlist
    const playlistResponse = await youtube.playlistItems.list({
      part: 'contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: maxResults
    });

    const videoIds = playlistResponse.data.items.map(item => item.contentDetails.videoId);

    if (videoIds.length === 0) {
      return res.json({ success: true, videos: [] });
    }

    // 4. Get full video details
    const videosResponse = await youtube.videos.list({
      part: 'snippet,statistics,status',
      id: videoIds.join(','),
    });

    // 5. Send the list of video objects back
    res.json({
      success: true,
      videos: videosResponse.data.items,
    });

  } catch (error) {
    console.error("[StreamTitle.AI] Error fetching YouTube videos:", error.message);
    res.status(500).send('Failed to fetch YouTube videos. Is the account connected?');
  }
});

module.exports = router;