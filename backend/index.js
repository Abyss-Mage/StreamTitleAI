// backend/index.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const admin = require('firebase-admin'); // <-- NEW

// --- Configuration ---
const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

// --- NEW: Initialize Firebase Admin ---
// You must create a service account in Firebase and download the JSON key
const serviceAccount = require('./serviceAccountKey.json'); // <-- YOU MUST PROVIDE THIS FILE

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// --- AI & API Clients ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const mainModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const steamApiKey = process.env.STEAM_API_KEY; 
const curseforgeApiKey = process.env.CURSEFORGE_API_KEY;
const MINECRAFT_GAME_ID = 432; 

// --- NEW: Firebase Auth Middleware ---
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: No token provided.');
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Add user info (like uid) to the request object
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).send('Unauthorized: Invalid token.');
  }
}


// --- NEW: AI "Expander" Prompt (Unchanged) ---
const expanderSystemPrompt = `You are a helpful gaming encyclopedia. The user will provide a game name, nickname, or abbreviation. 
Respond with ONLY the full, official, searchable title of the game.
Examples: User: "bg3" -> "Baldur's Gate 3", User: "cod mw3" -> "Call of Duty: Modern Warfare III"
If it's ambiguous or not a game, just return the original text.`;

// --- NEW: Core Generation Prompt (HEAVILY MODIFIED) ---
// This prompt now accepts a "platform" and generates generic, platform-aware content.
const systemPrompt = `
You are StreamTitle.AI, a world-class creative writer for gaming content creators.
Your sole purpose is to generate highly detailed, SEO-optimized, and community-aware content packages.

You will be given a JSON object containing "facts" (verified game data) and "preferences".
"preferences" contains "language", "descriptionLength", and "platform".

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
    "platform": "YouTube" 
  }
}
---

**User Preferences Guide:**
1.  **language**: Generate all text in this language.
2.  **descriptionLength**: Adjust the length of "platformDescription".
    * "Short": 1-2 paragraphs.
    * "Medium": 3-4 paragraphs with markdown.
    * "Long": 5+ paragraphs, detailed, with markdown and emojis.
3.  **platform**: This is CRITICAL. You must tailor the content for this platform.
    * **YouTube**: Create SEO-friendly titles. Descriptions should be detailed, well-structured, and include calls to action (Like, Subscribe, etc.). Tags should be SEO-focused.
    * **Twitch**: Titles should be shorter, punchier, and "go-live" focused. Descriptions are less important; make them short and link to socials. Tags should be like Twitch categories.
    * **Kick**: Similar to Twitch. Titles are for the stream. Emojis are good. Descriptions are minimal.

---

**Success JSON Structure (Your Output)**
(You MUST use these exact keys. Fill them creatively based on the 'platform' preference.)
{
  "game": "The Game/Modpack Name You Were Given",
  "platformTitle": "[A catchy, platform-aware title in the target language. (e.g., SEO for YouTube, Punchy for Twitch)]",
  "platformDescription": "[A complete, multi-part description in the target language, matching the requested 'descriptionLength' and 'platform' style. USE EMOJIS AND MARKDOWN (\\n for newlines). 
   
    **If YouTube:** Detailed, with sections, "Join our community!", "Like & Subscribe!".
    **If Twitch/Kick:** Shorter, with a stream summary and social links (e.g., "Discord: [Your Server Invite Here]").
  ]",
  "platformTags": [
    "tag1", "tag2", "tag3",
    // Tags MUST be appropriate for the 'platform' (e.g., YouTube SEO tags vs. Twitch categories)
    // All tags must be in the target language or be universal names.
  ],
  "discordAnnouncement": "🚀 [Stream Title] is LIVE! ⚙️\n\nHey @everyone! We’re jumping into [Game/Modpack Name]! ... [Generate a concise, exciting announcement in the target language for Discord]",
  "thumbnailIdeas": {
    "idea_1": "[A creative, simple idea for a YouTube/video thumbnail. e.g., 'Close up on player character's face, with the game's logo in the corner.']",
    "idea_2": "[A second, more dynamic thumbnail idea. e.g., 'A split screen: left side shows a cool boss, right side shows your shocked face.']",
    "text_overlay": "[Suggested text to put on the thumbnail, e.g., 'THE IMPOSSIBLE BOSS?' or 'MY NEW FACTORY!']"
  }
}
---
`;

// --- NEW: Updated Error Function (Helper) ---
function createErrorResponse(inputName, message, originalQuery, prefs) {
    return {
        game: "Invalid Input",
        platformTitle: "🎮 Error: Content Not Found",
        platformDescription: `The input '${originalQuery}' could not be found as a game or modpack.\n\nDetails: ${message}\n\nPlease check the spelling or try a different name.`,
        platformTags: ["error", "invalid input", "not found"],
        discordAnnouncement: `❌ **Error:** The game or modpack '${originalQuery}' was not found.`,
        thumbnailIdeas: {
            idea_1: "No thumbnail generated due to error.",
            idea_2: "Please check your input.",
            text_overlay: "ERROR"
        },
        preferences: {
            ...prefs,
            originalQuery: originalQuery
        }
    };
}


// --- NEW: API Endpoint (Now protected and platform-aware) ---
// We add the 'verifyFirebaseToken' middleware
app.post('/api/generate', verifyFirebaseToken, async (req, res) => {
    try {
        // --- UPDATE: Get new preferences from req.body ---
        const { 
          gameName, 
          platform = 'YouTube', 
          language = 'English', 
          descriptionLength = 'Medium' 
        } = req.body;
        
        // --- NEW: user info is available from middleware ---
        const uid = req.user.uid; 
        console.log(`[StreamTitle.AI] Request from user ${uid} for: ${gameName}`);
        
        const userPreferences = { platform, language, descriptionLength };
        
        if (!gameName) {
            return res.status(400).json({ error: 'Game name is required' });
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

        // --- Data Fetching (Unchanged) ---
        let factsForAI = null;
        let found = false;
        // [... The Steam, Modrinth, and CurseForge search logic remains exactly the same as your original file ...]
        // ... (Steam search) ...
        try {
            console.log(`[StreamTitle.AI] Checking Steam Store API for "${officialGameName}"...`);
            const searchResponse = await axios.get(`https://store.steampowered.com/api/storesearch/`, {
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

        // ... (Modrinth search) ...
        if (!found) {
            try {
                console.log(`[StreamTitle.AI] Checking Modrinth API for "${officialGameName}"...`);
                const modrinthSearch = await axios.get(`https://api.modrinth.com/v2/search`, {
                    params: { query: officialGameName, limit: 1, facets: '[["project_type:modpack"]]' }
                });
                if (modrinthSearch.data.hits && modrinthSearch.data.hits.length > 0) {
                    const pack = modrinthSearch.data.hits[0];
                    console.log(`[StreamTitle.AI] Found Modrinth modpack: ${pack.title}`);
                    factsForAI = { source: "Modrinth", title: pack.title, description: pack.description, categories: pack.categories, versions: pack.versions, downloads: pack.downloads };
                    found = true;
                }
            } catch (apiError) {
                console.error('[StreamTitle.AI] Error calling Modrinth API:', apiError.message);
            }
        }

        // ... (CurseForge search) ...
        if (!found && curseforgeApiKey) {
            try {
                console.log(`[StreamTitle.AI] Checking CurseForge API for "${officialGameName}"...`);
                const curseForgeSearch = await axios.get(`https://api.curseforge.com/v1/mods/search`, {
                    params: { gameId: MINECRAFT_GAME_ID, searchFilter: officialGameName, classId: 4471, pageSize: 1 },
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-api-key': curseforgeApiKey }
                });
                if (curseForgeSearch.data.data && curseForgeSearch.data.data.length > 0) {
                    const mod = curseForgeSearch.data.data[0];
                    console.log(`[StreamTitle.AI] Found CurseForge modpack: ${mod.name}`);
                    factsForAI = { source: "CurseForge", title: mod.name, description: mod.summary, categories: mod.categories.map(c => c.name), versions: mod.latestFiles.map(f => f.gameVersion).filter((v, i, a) => a.indexOf(v) === i), downloads: mod.downloadCount };
                    found = true;
                }
            } catch (apiError) {
                console.error('[StreamTitle.AI] Error calling CurseForge API:', apiError.message);
            }
        }

        // -----------------------------------------------------------------
        // STEP 4: If still not found, return an error
        // -----------------------------------------------------------------
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
        // STEP 5: GENERATION PHASE (Call Gemini API)
        // -----------------------------------------------------------------
        console.log(`[StreamTitle.AI] Sending verified ${factsForAI.source} data to Gemini for creative writing...`);

        const chat = mainModel.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.8 },
        });

        // --- UPDATE: Payload now includes platform ---
        const aiRequestPayload = {
            facts: factsForAI,
            preferences: userPreferences
        };

        const result = await chat.sendMessage(JSON.stringify(aiRequestPayload));
        const response = await result.response;
        const rawText = response.text();

        console.log(`[StreamTitle.AI] Gemini Raw Output:\n${rawText}`);
        
        const match = rawText.match(/\{[\s\S]*\}/);
        if (!match) {
            console.error("[StreamTitle.AI] Error: No valid JSON object found in Gemini response.");
            return res.status(500).json({ error: "Failed to parse AI response." });
        }

        const cleanText = match[0];
        const jsonResponse = JSON.parse(cleanText);

        // --- Re-attach preferences and original query for history ---
        jsonResponse.preferences = {
            ...userPreferences,
            originalQuery: gameName 
        };

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