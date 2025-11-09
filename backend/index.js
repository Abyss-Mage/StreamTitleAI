// backend/index.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis'); // <-- NEW: Google API library
const crypto = require('crypto'); // <-- NEW: Built-in for encryption

// --- Configuration ---
const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

// --- Initialize Firebase Admin ---
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET 
});

// --- Get Firestore instance ---
const db = admin.firestore();

// --- AI & API Clients (Reading from .env) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const steamApiKey = process.env.STEAM_API_KEY; 
const curseforgeApiKey = process.env.CURSEFORGE_API_KEY;
const mainModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const MINECRAFT_GAME_ID = 432;

// --- V2: JWT Secret ---
const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT_SUPER_SECRET_KEY_REPLACE_ME';

// --- NEW V2: YouTube OAuth Config ---
// **IMPORTANT**: You must add these to your .env file
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
// This *must* match the "Authorized redirect URIs" in your Google Cloud Console
// for the OAuth 2.0 Client ID.
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;
if (!YOUTUBE_REDIRECT_URI) {
  console.error("CRITICAL ERROR: 'YOUTUBE_REDIRECT_URI' is not set in your .env file.");
  // This will stop the server if the variable is missing, preventing mismatched errors.
  throw new Error('YOUTUBE_REDIRECT_URI is not set. Please check your .env file.');
}

// --- NEW V2: Encryption Config ---
// **IMPORTANT**: Add a strong, 32-byte (e.g., 64 hex chars) key to your .env
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'a'.repeat(64); // 64 'a's is a placeholder
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
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
  // This will automatically use the refresh token to get a new access token
  const { token: newAccessToken } = await oauth2Client.getAccessToken();
  
  // 5. Set the new access token on the client
  oauth2Client.setCredentials({
    access_token: newAccessToken
  });

  return oauth2Client;
}

// --- V2: API JWT Verification Middleware ---
async function verifyApiToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: No API token provided.');
  }
  const apiToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(apiToken, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    console.error('Error verifying API token:', error);
    return res.status(403).send('Unauthorized: Invalid API token.');
  }
}

// --- AI "Expander" Prompt (Step 1) ---
const expanderSystemPrompt = `You are a helpful gaming encyclopedia. The user will provide a game name, nickname, or abbreviation. 
Respond with ONLY the full, official, searchable title of the game.
Examples: User: "bg3" -> "Baldur's Gate 3", User: "cod mw3" -> "Call of Duty: Modern Warfare III"
If it's ambiguous or not a game, just return the original text.`;

// --- V2 Core Generation Prompt (The "Brain") ---
const systemPrompt = `
You are StreamTitle.AI, a world-class creative writer for gaming content creators.
Your sole purpose is to generate highly detailed, SEO-optimized, and community-aware content packages.

You will be given "facts" (verified game data), "preferences" (language, length), and a "creatorProfile" (tone, voice, banned words).
You MUST follow all instructions from the "creatorProfile".

---
**Input Data Structure (Example)**
{
  "facts": { "source": "Steam", "name": "Elden Ring", ... },
  "preferences": {
    "language": "English",
    "descriptionLength": "Medium",
    "platform": "YouTube"
  },
  "creatorProfile": {
    "tone": "Funny, chaotic, and high-energy",
    "voiceGuidelines": "Always use 🚀 emojis, never use 'lol'",
    "bannedWords": ["MyOldChannelName", "Boring"],
    "defaultCTAs": ["https://discord.gg/my-server", "https://patreon.com/me"],
    "logoUrl": "https://i.imgur.com/my-logo.png"
  }
}
---

**Creator Profile Rules (CRITICAL):**
1.  **tone**: You MUST match this tone (e.g., "Funny, chaotic" or "Calm, informative").
2.  **voiceGuidelines**: You MUST obey these specific rules (e.g., "Always start with a question").
3.  **bannedWords**: You MUST NOT use any words from this list.
4.  **defaultCTAs**: You MUST include these links in the \`platformDescription\`.

**Thumbnail Generation Guide:**
* You MUST generate a detailed, layer-by-layer "recipe" for a thumbnail.
* If \`creatorProfile.logoUrl\` is provided (not null/empty), you MUST include a "logo_placement" layer.
* If \`creatorProfile.logoUrl\` is null or empty, you MUST NOT include a "logo_placement" layer.

**Output Structure (Your Output):**
You MUST return ONLY a valid, minified JSON object using this exact structure.
{
  "game": "The Game/Modpack Name You Were Given",
  "platformTitle": "[A catchy, platform-aware title in the target language, matching the creator's 'tone']",
  "platformDescription": "[A complete, multi-part description, matching the 'tone' and 'voiceGuidelines'. It MUST include all 'defaultCTAs' links.]",
  "platformTags": ["tag1", "tag2", "tag3"],
  "discordAnnouncement": "🚀 [Stream Title] is LIVE! ... [Must also match 'tone']",

  "thumbnail": {
    "description": "[A 1-sentence summary of the thumbnail's theme.]",
    "text_overlay": "[Suggested text to put on the thumbnail.]",
    "layers": [
      { "layer": 1, "type": "background", "content": "[A visual idea for the background.]" },
      { "layer": 2, "type": "main_subject", "content": "[The main visual element.]" },
      { "layer": 3, "type": "text_overlay", "content": "[A description of the text.]" },
      { "layer": 4, "type": "logo_placement", "content": "User's channel logo placed in the bottom-left corner." }
      // Layer 4 is ONLY included if 'creatorProfile.logoUrl' was provided.
    ]
  }
}
---
`;

// --- Error Function (Helper) ---
function createErrorResponse(inputName, message, originalQuery, prefs) {
    return {
        game: "Invalid Input",
        platformTitle: "🎮 Error: Content Not Found",
        platformDescription: `The input '${originalQuery}' could not be found as a game or modpack.\n\nDetails: ${message}\n\nPlease check the spelling or try a different name.`,
        platformTags: ["error", "invalid input", "not found"],
        discordAnnouncement: `❌ **Error:** The game or modpack '${originalQuery}' was not found.`,
        
        thumbnail: {
            "description": "Error generating thumbnail.",
            "text_overlay": "ERROR",
            "layers": [
              { "layer": 1, "type": "error", "content": "Please check your input game name." }
            ]
        },

        preferences: {
            ...prefs,
            originalQuery: originalQuery
        }
    };
}


// --- V2: Auth Exchange Endpoint ---
app.post('/api/v1/auth/exchange', async (req, res) => {
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

// --- V2: Creator Profile API Endpoints ---
app.get('/api/v1/profile', verifyApiToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const profileRef = db.collection('creatorProfiles').doc(uid);
    const doc = await profileRef.get();

    if (!doc.exists) {
      res.json({
        tone: '',
        voiceGuidelines: '',
        bannedWords: [],
        defaultCTAs: [],
        logoUrl: '',
      });
    } else {
      res.json(doc.data());
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send('Failed to fetch profile.');
  }
});

app.put('/api/v1/profile', verifyApiToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const profileData = req.body;
    const profileRef = db.collection('creatorProfiles').doc(uid);
    
    await profileRef.set(profileData, { merge: true });

    res.json({ success: true, data: profileData });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).send('Failed to save profile.');
  }
});


// --- NEW V2: Channel Connection Endpoints ---

// GET /api/v1/connections
// Checks which services are connected and returns their status.
app.get('/api/v1/connections', verifyApiToken, async (req, res) => {
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

// --- NEW V2: Get YouTube Analytics ---
app.get('/api/v1/youtube/analytics', verifyApiToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // 1. Get the authenticated client
    const oauth2Client = await getAuthenticatedYouTubeClient(uid);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // 2. Get Channel Info (to find the 'uploads' playlist ID)
    const channelResponse = await youtube.channels.list({
      part: 'contentDetails,snippet', // Add snippet to get title
      mine: true,
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).send('YouTube channel not found.');
    }
    
    const channelData = channelResponse.data.items[0];
    const channelTitle = channelData.snippet.title;
    
    // 3. Call the YouTube Analytics API
    const analytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });
    
    // Get stats for the last 30 days
    const endDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago

    const analyticsResponse = await analytics.reports.query({
      ids: `channel==${channelData.id}`,
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

// POST /api/v1/auth/connect/youtube
// Exchanges a one-time code for OAuth tokens and saves them.
app.post('/api/v1/auth/connect/youtube', verifyApiToken, async (req, res) => {
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


// --- V2: Generation API Endpoint (Updated) ---
app.post('/api/generate', verifyApiToken, async (req, res) => {
    try {
        // 1. Get user preferences from request body
        const { 
          gameName, 
          platform = 'YouTube', 
          language = 'English', 
          descriptionLength = 'Medium'
        } = req.body;
        
        const uid = req.user.uid; 
        console.log(`[StreamTitle.AI] Request from user ${uid} for: ${gameName}`);
        
        // 2. Create user preferences object
        const userPreferences = { platform, language, descriptionLength };
        
        if (!gameName) {
            return res.status(400).json({ error: 'Game name is required' });
        }

        // --- 3. NEW: Fetch Creator Profile ---
        let creatorProfile = {};
        try {
          const profileRef = db.collection('creatorProfiles').doc(uid);
          const doc = await profileRef.get();
          if (doc.exists) {
            creatorProfile = doc.data();
          } else {
            console.log(`[StreamTitle.AI] No profile found for user ${uid}, using defaults.`);
          }
        } catch (profileError) {
          console.error('[StreamTitle.AI] Error fetching profile, proceeding without it:', profileError);
        }

        // --- Name Expansion (Unchanged) ---
        let officialGameName = gameName;
        try {
            console.log(`[StreamTitle.AI] Expanding short form: "${gameName}"`);
            const expanderModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const chat = expanderModel.startChat({
                history: [{ role: "user", parts: [{ text: expanderSystemPrompt }] }],
                generationConfig: { maxOutputTokens: 100 }
            });
            const result = await chat.sendMessage(gameName);
            const response = await result.response;
            const expandedName = response.text().trim();

            if (expandedName.toLowerCase() !== gameName.toLowerCase() && expandedName.length > 0) {
                console.log(`[StreamTitle.AI] Expanded "${gameName}" to "${expandedName}"`);
                officialGameName = expandedName;
            } else {
                console.log(`[StreamTitle.AI] No expansion needed.`);
            }
        } catch (expandError) {
            console.error('[StreamTitle.AI] Error during name expansion, proceeding with original name:', expandError.message);
            officialGameName = gameName;
        }
        
        console.log(`[StreamTitle.AI] Preferences: Platform=${platform}, Lang=${language}, Length=${descriptionLength}`);
        console.log(`[StreamTitle.AI] Searching APIs with name: "${officialGameName}"`);

        let factsForAI = null;
        let found = false;

        // --- Steam Search (Unchanged) ---
        try {
            console.log(`[StreamTitle.AI] Checking Steam Store API for "${officialGameName}"...`);
            const searchResponse = await axios.get('https://store.steampowered.com/api/storesearch/', {
                params: { term: officialGameName, l: 'en', cc: 'us' }
            });

            if (searchResponse.data.items && searchResponse.data.items.length > 0) {
                const gameAppId = searchResponse.data.items[0].id;
                console.log(`[StreamTitle.AI] Found Steam AppID: ${gameAppId}`);
                const detailsResponse = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${gameAppId}`);
                
                if (detailsResponse.data && detailsResponse.data[gameAppId] && detailsResponse.data[gameAppId].data) {
                    const gameData = detailsResponse.data[gameAppId].data;
                    factsForAI = {
                        source: "Steam",
                        name: gameData.name,
                        description: gameData.short_description,
                        genres: (gameData.genres || []).map(g => g.description),
                        developers: gameData.developers || ["Unknown"]
                    };
                    found = true;
                }
            }
        } catch (apiError) {
            console.error('[StreamTitle.AI] Error calling Steam API:', apiError.message);
        }

        // --- Modrinth Search (Unchanged) ---
        if (!found) {
            try {
                console.log(`[StreamTitle.AI] Checking Modrinth API for "${officialGameName}"...`);
                const modrinthSearch = await axios.get('https://api.modrinth.com/v2/search', {
                    params: { query: officialGameName, limit: 1, facets: '[["project_type:modpack"]]' }
                });
                if (modrinthSearch.data.hits && modrinthSearch.data.hits.length > 0) {
                    const pack = modrinthSearch.data.hits[0];
                    factsForAI = { 
                        source: "Modrinth", title: pack.title, description: pack.description, 
                        categories: pack.categories, versions: pack.versions, downloads: pack.downloads 
                    };
                    found = true;
                }
            } catch (apiError) {
                console.error('[StreamTitle.AI] Error calling Modrinth API:', apiError.message);
            }
        }

        // --- CurseForge Search (Unchanged) ---
        if (!found && curseforgeApiKey) {
            try {
                console.log(`[StreamTitle.AI] Checking CurseForge API for "${officialGameName}"...`);
                const curseForgeSearch = await axios.get('https://api.curseforge.com/v1/mods/search', {
                    params: { gameId: MINECRAFT_GAME_ID, searchFilter: officialGameName, classId: 4471, pageSize: 1 },
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-api-key': curseforgeApiKey }
                });
                if (curseForgeSearch.data.data && curseForgeSearch.data.data.length > 0) {
                    const mod = curseForgeSearch.data.data[0];
                    factsForAI = { 
                        source: "CurseForge", title: mod.name, description: mod.summary, 
                        categories: mod.categories.map(c => c.name), 
                        versions: mod.latestFiles.map(f => f.gameVersion).filter((v, i, a) => a.indexOf(v) === i), 
                        downloads: mod.downloadCount 
                    };
                    found = true;
                }
            } catch (apiError) {
                console.error('[StreamTitle.AI] Error calling CurseForge API:', apiError.message);
            }
        }

        // --- Error if not found (Unchanged) ---
        if (!found) {
            console.log(`[StreamTitle.AI] Content not found in any database.`);
            return res.status(404).json(createErrorResponse(
                officialGameName, 
                `Not found in Steam, Modrinth, or CurseForge. (Searched for: "${officialGameName}")`,
                gameName,
                userPreferences
            ));
        }

        // -----------------------------------------------------------------
        // STEP 5: GENERATION PHASE (NOW WITH PROFILE)
        // -----------------------------------------------------------------
        console.log(`[StreamTitle.AI] Sending data to Gemini for text generation...`);

        const chat = mainModel.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.8 },
        });

        // --- UPDATED: The payload now includes the creatorProfile ---
        const aiRequestPayload = { 
          facts: factsForAI, 
          preferences: userPreferences, 
          creatorProfile: creatorProfile 
        };
        const result = await chat.sendMessage(JSON.stringify(aiRequestPayload));
        const response = await result.response;
        const rawText = response.text();

        console.log(`[StreamTitle.AI] Gemini Raw Output:\n${rawText}`);
        
        const match = rawText.match(/\{[\s\S]*\}/);
        if (!match) { throw new Error("No valid JSON object found in Gemini response."); }

        const jsonResponse = JSON.parse(match[0]);

        // --- Add preferences back for the frontend (e.g., loading history) ---
        jsonResponse.preferences = { ...userPreferences, originalQuery: gameName };
        res.json(jsonResponse);

    } catch (error) {
        console.error('[StreamTitle.AI] Root Error:', error);
        res.status(500).json({ error: 'Failed to generate content. Please check the server logs.' });
    }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`[StreamTitle.AI] Server running on http://localhost:${port}`);
});