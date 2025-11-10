// backend/routes/generate.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db } = require('../config/firebase');
const {
  mainModel,
  expanderModel,
  systemPrompt,
  expanderSystemPrompt
} = require('../config/ai');

// ... (Error Function and API Configs are unchanged) ...
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


// --- V2: Generation API Endpoint ---
// POST /api/v1/generate
router.post('/', async (req, res) => {
    try {
        // 1. Get user preferences from request body
        const { 
          gameName, 
          platform = 'YouTube', 
          language = 'English', 
          descriptionLength = 'Medium',
          profileId // <-- NEW: Get the profileId from the request
        } = req.body;
        
        const uid = req.user.uid; 
        console.log(`[StreamTitle.AI] Request from user ${uid} for: ${gameName}`);
        
        // 2. Create user preferences object
        const userPreferences = { platform, language, descriptionLength };
        
        if (!gameName) {
            return res.status(400).json({ error: 'Game name is required' });
        }

        // --- 3. Fetch Creator Profile (NEW LOGIC) ---
        let creatorProfile = {};
        if (profileId) {
          try {
            // Fetch the specific profile from the subcollection
            const profileRef = db.collection('creatorProfiles').doc(uid).collection('profiles').doc(profileId);
            const doc = await profileRef.get();
            if (doc.exists) {
              console.log(`[StreamTitle.AI] Using profile: ${doc.data().name || profileId}`);
              creatorProfile = doc.data();
            } else {
              console.log(`[StreamTitle.AI] Profile ${profileId} not found, using defaults.`);
            }
          } catch (profileError) {
            console.error('[StreamTitle.AI] Error fetching specific profile, proceeding without it:', profileError);
          }
        } else {
            console.log(`[StreamTitle.AI] No profileId provided, using defaults.`);
        }
        // --- END OF NEW LOGIC ---

        // --- Name Expansion ---
        let officialGameName = gameName;
        // ... (rest of the function is unchanged) ...
        try {
            console.log(`[StreamTitle.AI] Expanding short form: "${gameName}"`);
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

        // --- Steam Search ---
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

        // --- Modrinth Search ---
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

        // --- CurseForge Search ---
        if (!found && curseforgeApiKey) {
            try {
                console.log(`[StreamTitle.AI] Checking CurseForge API for "${officialGameName}"...`);
                const curseForgeSearch = await axios.get('https://api.curseforge.com/v1/mods/search', {
                    params: { gameId: MINECRAFT_GAME_ID, searchFilter: officialGameName, classId: 4471, pageSize: 1 },
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-api-key': curseforgeApiKey }
                });
                if (curseForgeSearch.data.data && curseForgeSearch.data.length > 0) {
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

        // --- 5: GENERATION PHASE ---
        console.log(`[StreamTitle.AI] Sending data to Gemini for text generation...`);

        const chat = mainModel.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.8 },
        });

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

        jsonResponse.preferences = { ...userPreferences, originalQuery: gameName };
        res.json(jsonResponse);

    } catch (error) {
        console.error('[StreamTitle.AI] Root Error:', error);
        res.status(500).json({ error: 'Failed to generate content. Please check the server logs.' });
    }
});

module.exports = router;