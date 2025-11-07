// backend/index.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const admin = require('firebase-admin');

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

// --- AI & API Clients (Reading from .env) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const steamApiKey = process.env.STEAM_API_KEY; 
const curseforgeApiKey = process.env.CURSEFORGE_API_KEY;
const mainModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const MINECRAFT_GAME_ID = 432;

// --- Firebase Auth Middleware ---
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: No token provided.');
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; 
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).send('Unauthorized: Invalid token.');
  }
}

// --- AI "Expander" Prompt (Step 1) ---
const expanderSystemPrompt = `You are a helpful gaming encyclopedia. The user will provide a game name, nickname, or abbreviation. 
Respond with ONLY the full, official, searchable title of the game.
Examples: User: "bg3" -> "Baldur's Gate 3", User: "cod mw3" -> "Call of Duty: Modern Warfare III"
If it's ambiguous or not a game, just return the original text.`;

// --- Core Generation Prompt (The "Brain") ---
// --- REVERTED TO TEXT RECIPE ---
const systemPrompt = `
You are StreamTitle.AI, a world-class creative writer for gaming content creators.
Your sole purpose is to generate highly detailed, SEO-optimized, and community-aware content packages.

You will be given "facts" (verified game data) and "preferences".
"preferences" contains "language", "descriptionLength", "platform", and "logoUrl".

You MUST adhere to all preferences.
You MUST generate a creative package.
You MUST follow the "Success JSON Structure" below.
You MUST return ONLY a valid, minified JSON object.

---
**Input Data Structure (Example)**
{
  "facts": { "source": "Steam", "name": "Elden Ring", ... },
  "preferences": {
    "language": "English",
    "descriptionLength": "Medium",
    "platform": "YouTube",
    "logoUrl": "https://.../logo.png" 
  }
}
---

**User Preferences Guide:**
1.  **platform**, **language**, **descriptionLength**: (Same as before)
2.  **logoUrl**: If this is provided, you MUST include a "logo_placement" layer in the thumbnail. If it is null, you MUST NOT include a "logo_placement" layer.

---
**Thumbnail Generation Guide (NEW):**
You MUST generate a detailed, layer-by-layer "recipe" for a thumbnail.
This recipe MUST be visual and based on the game's "facts".

---

**Success JSON Structure (Your Output)**
(You MUST use these exact keys. Fill them creatively based on the 'platform' preference.)
{
  "game": "The Game/Modpack Name You Were Given",
  "platformTitle": "[A catchy, platform-aware title in the target language]",
  "platformDescription": "[A complete, multi-part description...]",
  "platformTags": ["tag1", "tag2", "tag3"],
  "discordAnnouncement": "🚀 [Stream Title] is LIVE! ...",

  "thumbnail": {
    "description": "[A 1-sentence summary of the thumbnail's theme, e.g., 'A high-contrast thumbnail showing the final boss.']",
    "text_overlay": "[Suggested text to put on the thumbnail, e.g., 'THE IMPOSSIBLE BOSS?' or 'MY NEW FACTORY!']",
    "layers": [
      { 
        "layer": 1, 
        "type": "background", 
        "content": "[A visual idea for the background, e.g., 'A high-saturation, slightly blurred screenshot of the game world.']" 
      },
      { 
        "layer": 2, 
        "type": "main_subject", 
        "content": "[The main visual element, e.g., 'A high-resolution image of the game's main character or boss on the right side.']" 
      },
      { 
        "layer": 3, 
        "type": "text_overlay", 
        "content": "[A description of the text, e.g., 'The text \\"THE IMPOSSIBLE BOSS?\\" in a bold, white font with a black outline.']"
      },
      { 
        "layer": 4, 
        "type": "logo_placement", 
        "content": "User's channel logo placed in the bottom-left corner." 
      }
      // You MUST NOT include layer 4 if 'logoUrl' was null.
      // You can add more layers (e.g., 'effects', 'borders') if you think they are creative.
    ]
  }
}
---
`;

// --- Error Function (Helper) ---
// --- REVERTED TO TEXT RECIPE ERROR ---
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


// --- API Endpoint ---
app.post('/api/generate', verifyFirebaseToken, async (req, res) => {
    try {
        const { 
          gameName, 
          platform = 'YouTube', 
          language = 'English', 
          descriptionLength = 'Medium',
          logoUrl = null 
        } = req.body;
        
        const uid = req.user.uid; 
        console.log(`[StreamTitle.AI] Request from user ${uid} for: ${gameName}`);
        const userPreferences = { platform, language, descriptionLength, logoUrl };
        
        if (!gameName) {
            return res.status(400).json({ error: 'Game name is required' });
        }

        // --- Name Expansion ---
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
        
        console.log(`[StreamTitle.AI] Preferences: Platform=${platform}, Lang=${language}, Length=${descriptionLength}, Logo=${!!logoUrl}`);
        console.log(`[StreamTitle.AI] Searching APIs with name: "${officialGameName}"`);

        let factsForAI = null;
        let found = false;

        // --- Steam Search ---
        try {
            console.log(`[StreamTitle.AI] Checking Steam Store API for "${officialGameName}"...`);
            // --- FIX: Added quotes around URL ---
            const searchResponse = await axios.get('https://store.steampowered.com/api/storesearch/', {
                params: { term: officialGameName, l: 'en', cc: 'us' }
            });

            if (searchResponse.data.items && searchResponse.data.items.length > 0) {
                const gameAppId = searchResponse.data.items[0].id;
                console.log(`[StreamTitle.AI] Found Steam AppID: ${gameAppId}`);
                // --- FIX: Added quotes around URL ---
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

        // --- Modrinth Search ---
        if (!found) {
            try {
                console.log(`[StreamTitle.AI] Checking Modrinth API for "${officialGameName}"...`);
                // --- FIX: Added quotes around URL ---
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

        // --- CurseForge Search ---
        if (!found && curseforgeApiKey) {
            try {
                console.log(`[StreamTitle.AI] Checking CurseForge API for "${officialGameName}"...`);
                // --- FIX: Added quotes around URL ---
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

        // --- Error if not found ---
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
        // STEP 5: GENERATION PHASE (TEXT ONLY)
        // -----------------------------------------------------------------
        console.log(`[StreamTitle.AI] Sending data to Gemini for text generation...`);

        const chat = mainModel.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.8 },
        });

        const aiRequestPayload = { facts: factsForAI, preferences: userPreferences };
        const result = await chat.sendMessage(JSON.stringify(aiRequestPayload));
        const response = await result.response;
        const rawText = response.text();

        console.log(`[StreamTitle.AI] Gemini Raw Output:\n${rawText}`);
        
        const match = rawText.match(/\{[\s\S]*\}/);
        if (!match) { throw new Error("No valid JSON object found in Gemini response."); }

        const jsonResponse = JSON.parse(match[0]);

        // --- NO IMAGE GENERATION STEP ---

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