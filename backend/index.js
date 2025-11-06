// Import necessary packages
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config(); // Manages .env variables
const axios = require('axios'); // To call external APIs

// --- Configuration ---
const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

// --- AI & API Clients ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const mainModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Model for creative generation
const steamApiKey = process.env.STEAM_API_KEY; 
const curseforgeApiKey = process.env.CURSEFORGE_API_KEY;
const MINECRAFT_GAME_ID = 432; 

// --- NEW: AI "Expander" Prompt (Step 1) ---
// This prompt will expand abbreviations like "bg3" to "Baldur's Gate 3"
const expanderSystemPrompt = `You are a helpful gaming encyclopedia. The user will provide a game name, nickname, or abbreviation. 
Respond with ONLY the full, official, searchable title of the game.

Examples:
User: "bg3"
Assistant: "Baldur's Gate 3"
User: "cod mw3"
Assistant: "Call of Duty: Modern Warfare III"
User: "Elden Ring"
Assistant: "Elden Ring"
User: "stardew"
Assistant: "Stardew Valley"
User: "ftb"
Assistant: "Feed The Beast"

If it's ambiguous or not a game, just return the original text.
Do not add any other text, just the name.`;

// --- Core Generation Prompt (The "Brain") ---
// (This prompt remains unchanged from the previous step)
const systemPrompt = `
You are StreamTitle.AI, a world-class creative writer for gaming content creators.
Your sole purpose is to generate highly detailed, SEO-optimized, and community-aware content packages.

You will be given a JSON object containing two keys: "facts" and "preferences".
"facts" contains verified data in one of four formats (Steam, RAWG, Modrinth, CurseForge).
"preferences" contains user requests for "language" and "descriptionLength".

You MUST adhere to these preferences.
You MUST generate a creative package.
You MUST follow the "Success JSON Structure" below.
You MUST return ONLY a valid, minified JSON object (no other text, no markdown, no "here you go").

---
**Input Data Structure (Example)**
{
  "facts": {
    "source": "Steam",
    "name": "Elden Ring",
    "description": "...",
    "genres": ["RPG"],
    "developers": ["FromSoftware"]
  },
  "preferences": {
    "language": "English",
    "descriptionLength": "Medium" 
  }
}
---

**User Preferences Guide:**
1.  **language**: You MUST generate all text (titles, descriptions, tags, etc.) in this language. (e.g., "Spanish", "Japanese", "English").
2.  **descriptionLength**: You MUST adjust the length of the "youtube.description" text.
    * "Short": 1-2 paragraphs.
    * "Medium": 3-4 paragraphs with markdown.
    * "Long": 5+ paragraphs, very detailed, with markdown and emojis.

---

**Success JSON Structure (Your Output)**
(Your task is to creatively fill this out in the requested language)
{
  "game": "The Game/Modpack Name You Were Given",
  "youtube": {
    "title": "🎮 [A catchy, SEO-friendly YouTube Title in the target language]",
    "description": "[A complete, multi-part, SEO-optimized YouTube description in the target language, matching the requested descriptionLength. USE EMOJIS AND MARKDOWN (\\n for newlines). 
   
    **If GameData:** Mention the genres, developer, and key features.
    **If ModpackData:** Mention the core theme (e.g., 'tech', 'magic'), the Minecraft version.
   
    Include sections appropriate for the length, such as: 
    📝 Stream Description
    ⚙️ [Catchy Intro Hook]...
    🔥 What’s Happening in this Stream:
    🎮 Game/Modpack: [Name]
   
    💬 Join our community!
    🔗 Discord: [Your Server Invite Here]
    📺 Don’t forget to Like 👍, Subscribe 🔔, and Comment!]",
    "tags": [
      "game/modpack name", "developer/author", "genre/category1",
      "Gaming", "Live Stream", "gameplay", "let's play",
      // If ModpackData, add:
      "Minecraft", "Modded Minecraft", "Modpack",
      // All tags must be in the target language or be universal names.
    ]
  },
  "discord": {
    "announcement": "🚀 [Stream Title] is LIVE! ⚙️\n\nHey @everyone! We’re jumping into [Game/Modpack Name]! ... [Generate a concise, exciting announcement in the target language]"
  },
  "thumbnail": {
    "idea_1": "[A creative, simple idea for a YouTube thumbnail. e.g., 'Close up on player character's face, with the game's logo in the corner.']",
    "idea_2": "[A second, more dynamic thumbnail idea. e.g., 'A split screen: left side shows a cool boss, right side shows your shocked face.']",
    "text_overlay": "[Suggested text to put on the thumbnail, e.g., 'THE IMPOSSIBLE BOSS?' or 'MY NEW FACTORY!']"
  }
}
---
`;

// --- Error Function (Helper) ---
// --- UPDATED: To accept originalQuery and prefs ---
function createErrorResponse(inputName, message, originalQuery, prefs) {
    return {
        game: "Invalid Input",
        youtube: {
            title: "🎮 Error: Content Not Found",
            description: `The input '${originalQuery}' could not be found as a game or modpack.\n\nDetails: ${message}\n\nPlease check the spelling or try a different name.`,
            tags: ["error", "invalid input", "not found"]
        },
        discord: {
            announcement: `❌ **Error:** The game or modpack '${originalQuery}' was not found.`
        },
        thumbnail: {
            idea_1: "No thumbnail generated due to error.",
            idea_2: "Please check your input.",
            text_overlay: "ERROR"
        },
        // --- NEW: Add preferences to error object for history ---
        preferences: {
            ...prefs,
            originalQuery: originalQuery
        }
    };
}


// --- API Endpoint (Section 7 from TSD) ---
app.post('/api/generate', async (req, res) => {
    try {
        const { gameName, language = 'English', descriptionLength = 'Medium' } = req.body;
        const userPreferences = { language, descriptionLength };
        
        if (!gameName) {
            return res.status(400).json({ error: 'Game name is required' });
        }
        console.log(`[StreamTitle.AI] Received request for: ${gameName}`);

        // --- NEW FEATURE: SHORT-FORM EXPANSION ---
        let officialGameName = gameName; // Default to original name
        try {
            console.log(`[StreamTitle.AI] Expanding short form: "${gameName}"`);
            const expanderModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Use a fast model
            const chat = expanderModel.startChat({
                history: [{ role: "user", parts: [{ text: expanderSystemPrompt }] }],
                generationConfig: { maxOutputTokens: 100 }
            });
            const result = await chat.sendMessage(gameName);
            const response = await result.response;
            const expandedName = response.text().trim();

            if (expandedName.toLowerCase() !== gameName.toLowerCase() && expandedName.length > 0) {
                console.log(`[StreamTitle.AI] Expanded "${gameName}" to "${expandedName}"`);
                officialGameName = expandedName; // Use the new, full name
            } else {
                console.log(`[StreamTitle.AI] No expansion needed.`);
            }
        } catch (expandError) {
            console.error('[StreamTitle.AI] Error during name expansion, proceeding with original name:', expandError.message);
            officialGameName = gameName; // Failsafe: use the original name
        }
        // --- END OF NEW FEATURE ---

        console.log(`[StreamTitle.AI] Preferences: Lang=${language}, Length=${descriptionLength}`);
        console.log(`[StreamTitle.AI] Searching APIs with name: "${officialGameName}"`);


        let factsForAI = null;
        let found = false;

        // -----------------------------------------------------------------
        // --- STEP 1: Try to find as a GAME (Steam API) ---
        // --- UPDATED: Use 'officialGameName' ---
        // -----------------------------------------------------------------
        try {
            console.log(`[StreamTitle.AI] Checking Steam Store API for "${officialGameName}"...`);
            const searchResponse = await axios.get(`https://store.steampowered.com/api/storesearch/`, {
                params: { 
                    term: officialGameName, // Use expanded name
                    l: 'en', 
                    cc: 'us' 
                }
            });

            if (searchResponse.data.items && searchResponse.data.items.length > 0) {
                const game = searchResponse.data.items[0]; 
                const gameAppId = game.id;
                console.log(`[StreamTitle.AI] Found Steam AppID: ${gameAppId}`);

                const detailsResponse = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${gameAppId}`);
                const gameData = detailsResponse.data[gameAppId].data;

                if (gameData) {
                    factsForAI = {
                        source: "Steam",
                        name: gameData.name,
                        description: gameData.short_description,
                        genres: (gameData.genres || []).map(g => g.description),
                        developers: gameData.developers || ["Unknown"]
                    };
                    found = true;
                } else {
                     console.log(`[StreamTitle.AI] Failed to get app details for AppID ${gameAppId}.`);
                }
            } else {
                console.log(`[StreamTitle.AI] No results on Steam Store for "${officialGameName}".`);
            }
        } catch (apiError) {
            console.error('[StreamTitle.AI] Error calling Steam API:', apiError.message);
        }

        // -----------------------------------------------------------------
        // STEP 2: If not found, try as a MODPACK (Modrinth API)
        // --- UPDATED: Use 'officialGameName' ---
        // -----------------------------------------------------------------
        if (!found) {
            try {
                console.log(`[StreamTitle.AI] Checking Modrinth API for "${officialGameName}"...`);
                const modrinthSearch = await axios.get(`https://api.modrinth.com/v2/search`, {
                    params: {
                        query: officialGameName, // Use expanded name
                        limit: 1,
                        facets: '[["project_type:modpack"]]'
                    }
                });

                if (modrinthSearch.data.hits && modrinthSearch.data.hits.length > 0) {
                    const pack = modrinthSearch.data.hits[0];
                    console.log(`[StreamTitle.AI] Found Modrinth modpack: ${pack.title}`);
                    
                    factsForAI = {
                        source: "Modrinth",
                        title: pack.title,
                        description: pack.description,
                        categories: pack.categories,
                        versions: pack.versions,
                        downloads: pack.downloads
                    };
                    found = true;
                } else {
                    console.log(`[StreamTitle.AI] No modpack results on Modrinth for "${officialGameName}".`);
                }
            } catch (apiError) {
                console.error('[StreamTitle.AI] Error calling Modrinth API:', apiError.message);
            }
        }

        // -----------------------------------------------------------------
        // STEP 3: If not found, try CurseForge API
        // --- UPDATED: Use 'officialGameName' ---
        // -----------------------------------------------------------------
        if (!found) {
            if (!curseforgeApiKey) {
                console.log(`[StreamTitle.AI] CurseForge API key not found, skipping step 3.`);
            } else {
                try {
                    console.log(`[StreamTitle.AI] Checking CurseForge API for "${officialGameName}"...`);
                    const curseForgeSearch = await axios.get(`https://api.curseforge.com/v1/mods/search`, {
                        params: {
                            gameId: MINECRAFT_GAME_ID,
                            searchFilter: officialGameName, // Use expanded name
                            classId: 4471, 
                            pageSize: 1
                        },
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'x-api-key': curseforgeApiKey
                        }
                    });

                    if (curseForgeSearch.data.data && curseForgeSearch.data.data.length > 0) {
                        const mod = curseForgeSearch.data.data[0];
                        console.log(`[StreamTitle.AI] Found CurseForge modpack: ${mod.name}`);

                        factsForAI = {
                            source: "CurseForge",
                            title: mod.name,
                            description: mod.summary,
                            categories: mod.categories.map(c => c.name),
                            versions: mod.latestFiles.map(f => f.gameVersion).filter((v, i, a) => a.indexOf(v) === i), 
                            downloads: mod.downloadCount
                        };
                        found = true;
                    } else {
                        console.log(`[StreamTitle.AI] No modpack results on CurseForge for "${officialGameName}".`);
                    }
                } catch (apiError) {
                    console.error('[StreamTitle.AI] Error calling CurseForge API:', apiError.message);
                }
            }
        }


        // -----------------------------------------------------------------
        // STEP 4: If still not found, return an error
        // --- UPDATED: Use new error function ---
        // -----------------------------------------------------------------
        if (!found) {
            console.log(`[StreamTitle.AI] Content not found in any database.`);
            return res.status(404).json(createErrorResponse(
                officialGameName, 
                `Not found in Steam, Modrinth, or CurseForge. (Searched for: "${officialGameName}")`,
                gameName, // The user's original query
                userPreferences
            ));
        }

        // -----------------------------------------------------------------
        // STEP 5: GENERATION PHASE (Call Gemini API)
        // -----------------------------------------------------------------
        console.log(`[StreamTitle.AI] Sending verified ${factsForAI.source} data to Gemini for creative writing...`);

        const chat = mainModel.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.8,
            },
        });

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

        // --- NEW: Re-attach preferences and original query for history ---
        jsonResponse.preferences = {
            ...userPreferences,
            originalQuery: gameName 
        };

        // Send the final, beautiful JSON back to the frontend
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