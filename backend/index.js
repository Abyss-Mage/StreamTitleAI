// backend/index.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

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
// This prompt is now personalized and reads the creatorProfile
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
    // (Function is unchanged)
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
      // Return a default, empty profile if one doesn't exist
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