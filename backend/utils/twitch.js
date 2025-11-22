const axios = require('axios');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI || 'http://localhost/settings'; 

// Helper to exchange code for tokens
async function getTwitchTokens(code) {
  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: TWITCH_REDIRECT_URI,
      },
    });
    return response.data; // { access_token, refresh_token, expires_in, ... }
  } catch (error) {
    console.error('Twitch Token Exchange Error:', error.response?.data || error.message);
    throw new Error('Failed to exchange Twitch code.');
  }
}

// Helper to get User Info (Channel Name, ID)
async function getTwitchUser(accessToken) {
  try {
    const response = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.data.data[0]; // Returns the first user object
  } catch (error) {
    console.error('Twitch User Fetch Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch Twitch user.');
  }
}

module.exports = {
  getTwitchTokens,
  getTwitchUser,
  TWITCH_CLIENT_ID,
  TWITCH_REDIRECT_URI
};