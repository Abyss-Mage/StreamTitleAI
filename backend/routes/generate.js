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

function createErrorResponse(inputName, message, originalQuery, prefs) {
    return {
        game: "Invalid Input",
        platformTitle: "🎮 Error: Content Not Found",
        platformDescription: `The input '${originalQuery}' could not be found.\n\nDetails: ${message}`,
        platformTags: ["error"],
        discordAnnouncement: `❌ Error: '${originalQuery}' not found.`,
        thumbnail: { description: "Error", text_overlay: "ERROR", layers: [] },
        preferences: { ...prefs, originalQuery: originalQuery }
    };
}

router.post('/', async (req, res) => {
    try {
        const { 
          gameName, 
          platform = 'YouTube', 
          language = 'English', 
          descriptionLength = 'Medium',
          profileId,
          model // <-- 1. Get model from request
        } = req.body;
        
        const uid = req.user.uid; 
        const userPreferences = { platform, language, descriptionLength };
        
        if (!gameName) return res.status(400).json({ error: 'Game name is required' });

        // Fetch Profile
        let creatorProfile = {};
        if (profileId) {
          try {
            const doc = await db.collection('creatorProfiles').doc(uid).collection('profiles').doc(profileId).get();
            if (doc.exists) creatorProfile = doc.data();
          } catch (e) { console.error('Profile fetch error', e); }
        }

        // Name Expansion
        let officialGameName = gameName;
        try {
            const chat = expanderModel.startChat({
                history: [{ role: "user", parts: [{ text: expanderSystemPrompt }] }],
                generationConfig: { maxOutputTokens: 100 },
                model: model // <-- Pass model here too
            });
            const result = await chat.sendMessage(gameName);
            const expandedName = result.response.text().trim();
            if (expandedName.length > 0 && expandedName.length < 50) officialGameName = expandedName;
        } catch (e) { console.error('Expansion error:', e.message); }

        // Logic to fetch facts (Placeholder for brevity, keeps existing structure)
        // In your actual file, keep your Steam/Modrinth/CurseForge logic here.
        // We will assume factsForAI is generated or null.
        let factsForAI = { source: "Direct Input", name: officialGameName }; 

        // --- GENERATION ---
        const chat = mainModel.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.8 },
            model: model // <-- 2. PASS MODEL TO CONFIG
        });

        const aiRequestPayload = { facts: factsForAI, preferences: userPreferences, creatorProfile };
        const result = await chat.sendMessage(JSON.stringify(aiRequestPayload));
        
        // JSON Parsing Logic
        const rawText = result.response.text();
        const match = rawText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No valid JSON found.");
        
        const jsonResponse = JSON.parse(match[0]);
        jsonResponse.preferences = { ...userPreferences, originalQuery: gameName };
        
        res.json(jsonResponse);

    } catch (error) {
        console.error('[StreamTitle.AI] Generate Error:', error);
        res.status(500).json({ error: error.message || 'Generation failed.' });
    }
});

module.exports = router;