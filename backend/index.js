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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// --- UPDATED ---
const steamApiKey = process.env.STEAM_API_KEY; // Using Steam key
const curseforgeApiKey = process.env.CURSEFORGE_API_KEY;
const MINECRAFT_GAME_ID = 432; // Static ID for Minecraft on CurseForge

// --- Core Generation Prompt (The "Brain") ---
// --- UPDATED ---
// THIS PROMPT IS NEW. It can now handle FOUR different types of input data.
const systemPrompt = `
You are StreamTitle.AI, a world-class creative writer for gaming content creators.
Your sole purpose is to generate highly detailed, SEO-optimized, and community-aware content packages.

You will be given a JSON object containing **verified data**. This data will be in one of four formats: "GameData" (from Steam), "GameData" (from RAWG.io), "ModpackData" (from Modrinth), or "ModpackData" (from CurseForge).

You MUST intelligently detect the format and generate a creative package.
You MUST follow the "Success JSON Structure" below.
You MUST return ONLY a valid, minified JSON object (no other text, no markdown, no "here you go").

---
**Format 1: GameData (from Steam)**
{
  "source": "Steam",
  "name": "Game Title",
  "description": "A short summary of the game...",
  "genres": ["Genre1", "Genre2"],
  "developers": ["Dev1", "Dev2"]
}

**Format 2: GameData (from RAWG)**
{
  "source": "RAWG",
  "name": "Game Title",
  "description_raw": "A long text description of the game...",
  "genres": [{ "name": "Genre1" }, { "name": "Genre2" }],
  "tags": [{ "name": "Tag1" }, { "name": "Tag2" }],
  "developers": [{ "name": "Dev1" }]
}

**Format 3: ModpackData (from Modrinth)**
{
  "source": "Modrinth",
  "title": "Modpack Title",
  "description": "A short summary of the modpack...",
  "categories": ["adventure", "tech", "magic"],
  "versions": ["1.19.2", "1.20.1"],
  "downloads": 123456
}

**Format 4: ModpackData (from CurseForge)**
{
  "source": "CurseForge",
  "title": "Modpack Title",
  "description": "A short summary of the modpack...",
  "categories": ["Adventure", "Tech", "Magic"],
  "versions": ["1.19.2", "1.20.1"],
  "downloads": 987654
}
---

**Success JSON Structure (Your Output)**
(Your task is to creatively fill this out using the data above)
{
  "game": "The Game/Modpack Name You Were Given",
  "youtube": {
    "title": "🎮 [A catchy, SEO-friendly YouTube Title based on the data]",
    "description": "[A complete, multi-part, SEO-optimized YouTube description. USE EMOJIS AND MARKDOWN (\\n for newlines). 
   
    **If GameData:** Mention the genres, developer, and key features.
    **If ModpackData:** Mention the core theme (e.g., 'tech', 'magic'), the Minecraft version, and list some popular mods associated with it (you should know popular mods for categories like 'tech' or 'magic').
   
    Include sections for: 
    📝 Stream Description (SEO Optimized)
    ⚙️ [Catchy Intro Hook]...
    🧱 Featuring Key Mechanics/Mods:
    🔥 What’s Happening in this Stream:
    🎮 Game/Modpack: [Name]
   
    💬 Join our community!
    🔗 Discord: [Your Server Invite Here]
    📺 Don’t forget to Like 👍, Subscribe 🔔, and Comment!]",
    "tags": [
      "game/modpack name", "developer/author", "genre/category1", "genre/category2",
      "Gaming", "Live Stream", "2025", "gameplay", "let's play",
      // If ModpackData, add:
      "Minecraft", "Modded Minecraft", "Modpack", "[minecraft_version]"
    ]
  },
  "discord": {
    "announcement": "🚀 [Stream Title] is LIVE! ⚙️\n\nHey @everyone! We’re jumping into [Game/Modpack Name] — [a [Genre] game OR a [Theme] modpack] packed with [Key Feature 1] and [Key Feature 2]!\n\nJoin us as we [Main Goal of Stream]!\n\n🕹️ Watch Live: [Your YouTube Link]\n\n💬 Join the Chat: Talk, share ideas, or hop into VC while we play!"
  }
}
---
`;

// --- Error Function (Helper) ---
// This standardizes our error response to the frontend
function createErrorResponse(inputName, message) {
    return {
        game: "Invalid Input",
        youtube: {
            title: "🎮 Error: Content Not Found",
            description: `The input '${inputName}' could not be found as a game or modpack.\n\nDetails: ${message}\n\nPlease check the spelling or try a different name.`,
            tags: ["error", "invalid input", "not found"]
        },
        discord: {
            announcement: `❌ **Error:** The game or modpack '${inputName}' was not found.`
        }
    };
}


// --- API Endpoint (Section 7 from TSD) ---
// This function now contains the full "waterfall" logic.
app.post('/api/generate', async (req, res) => {
    try {
        const { gameName } = req.body;
        if (!gameName) {
            return res.status(400).json({ error: 'Game name is required' });
        }
        console.log(`[StreamTitle.AI] Received request for: ${gameName}`);

        let factsForAI = null;
        let found = false;

        // -----------------------------------------------------------------
        // --- STEP 1: Try to find as a GAME (Steam API) ---
        // --- THIS ENTIRE BLOCK IS NEW / REPLACED ---
        // -----------------------------------------------------------------
        try {
            console.log(`[StreamTitle.AI] Checking Steam Store API for "${gameName}"...`);
            // We use the Steam Store Search API (unofficial but effective)
            const searchResponse = await axios.get(`https://store.steampowered.com/api/storesearch/`, {
                params: {
                    term: gameName,
                    l: 'en', // Language
                    cc: 'us'  // Country code
                }
            });

            if (searchResponse.data.items && searchResponse.data.items.length > 0) {
                const game = searchResponse.data.items[0]; // Get the top result
                const gameAppId = game.id;
                console.log(`[StreamTitle.AI] Found Steam AppID: ${gameAppId}`);

                // Now get details using the AppID
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
                console.log(`[StreamTitle.AI] No results on Steam Store for "${gameName}".`);
            }
        } catch (apiError) {
            console.error('[StreamTitle.AI] Error calling Steam API:', apiError.message);
        }


        // -----------------------------------------------------------------
        // STEP 2: If not found, try as a MODPACK (Modrinth API)
        // -----------------------------------------------------------------
        if (!found) {
            try {
                console.log(`[StreamTitle.AI] Checking Modrinth API for "${gameName}"...`);
                // facets=[["project_type:modpack"]] ensures we only get modpacks
                const modrinthSearch = await axios.get(`https://api.modrinth.com/v2/search`, {
                    params: {
                        query: gameName,
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
                    console.log(`[StreamTitle.AI] No modpack results on Modrinth for "${gameName}".`);
                }
            } catch (apiError) {
                console.error('[StreamTitle.AI] Error calling Modrinth API:', apiError.message);
            }
        }

        // -----------------------------------------------------------------
        // STEP 3: If not found, try CurseForge API
        // -----------------------------------------------------------------
        if (!found) {
            if (!curseforgeApiKey) {
                console.log(`[StreamTitle.AI] CurseForge API key not found, skipping step 3.`);
            } else {
                try {
                    console.log(`[StreamTitle.AI] Checking CurseForge API for "${gameName}"...`);
                    // 4471 is the ClassID for Modpacks
                    const curseForgeSearch = await axios.get(`https://api.curseforge.com/v1/mods/search`, {
                        params: {
                            gameId: MINECRAFT_GAME_ID,
                            searchFilter: gameName,
                            classId: 4471, // 4471 = Modpacks
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
                            // Map category names and latest file versions
                            categories: mod.categories.map(c => c.name),
                            versions: mod.latestFiles.map(f => f.gameVersion).filter((v, i, a) => a.indexOf(v) === i), // Unique versions
                            downloads: mod.downloadCount
                        };
                        found = true;
                    } else {
                        console.log(`[StreamTitle.AI] No modpack results on CurseForge for "${gameName}".`);
                    }
                } catch (apiError) {
                    console.error('[StreamTitle.AI] Error calling CurseForge API:', apiError.message);
                }
            }
        }


        // -----------------------------------------------------------------
        // STEP 4: If still not found, return an error
        // -----------------------------------------------------------------
        if (!found) {
            console.log(`[StreamTitle.AI] Content not found in any database.`);
            // --- UPDATED ---
            return res.status(404).json(createErrorResponse(gameName, "Not found in Steam, Modrinth, or CurseForge."));
        }

        // -----------------------------------------------------------------
        // STEP 5: GENERATION PHASE (Call Gemini API)
        // -----------------------------------------------------------------
        console.log(`[StreamTitle.AI] Sending verified ${factsForAI.source} data to Gemini for creative writing...`);

        const chat = model.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.8,
            },
        });

        // Send the JSON *data* (the "facts") as the message
        const result = await chat.sendMessage(JSON.stringify(factsForAI));
        const response = await result.response;
        const rawText = response.text();

        console.log(`[StreamTitle.AI] Gemini Raw Output:\n${rawText}`);
        
        // Clean and parse the response
        const match = rawText.match(/\{[\s\S]*\}/);
        if (!match) {
            console.error("[StreamTitle.AI] Error: No valid JSON object found in Gemini response.");
            return res.status(500).json({ error: "Failed to parse AI response." });
        }

        const cleanText = match[0];
        const jsonResponse = JSON.parse(cleanText);

        // Send the final, beautiful JSON back to the frontend
        res.json(jsonResponse);

    } catch (error) {
        console.error('[StreamTitle.AI] Root Error:', error);
        // This was the 5T00 error
        res.status(500).json({ error: 'Failed to generate content. Please check the server logs.' });
    }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`[StreamTitle.AI] Server running on http://localhost:${port}`);
});