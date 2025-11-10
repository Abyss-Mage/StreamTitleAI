// backend/routes/ai.js
const express = require('express');
const { db } = require('../config/firebase');
const { 
  mainModel, 
  optimizePrompt, 
  outliersPrompt,
  keywordsPrompt,
  competitorPrompt // <-- IMPORT NEW PROMPT
} = require('../config/ai');
const aiRouter = express.Router();

// --- V2: Optimize Endpoint ---
aiRouter.post('/optimize', async (req, res) => {
  try {
    const { videoDetails } = req.body;
    const uid = req.user.uid;

    // 1. Fetch Creator Profile
    let creatorProfile = {};
    // Use the multi-profile system: check for a profileId in the request
    if (req.body.profileId) {
      const profileRef = db.collection('creatorProfiles').doc(uid).collection('profiles').doc(req.body.profileId);
      const doc = await profileRef.get();
      if (doc.exists) {
        creatorProfile = doc.data();
      }
    } else {
      // Fallback or default logic if no profileId is passed (e.g., use first, or default)
      // For now, we just use an empty profile if no ID is sent.
      console.log("[StreamTitle.AI] Optimize: No profileId sent, using default empty profile.");
    }

    // 2. Start Chat with Gemini
    const chat = mainModel.startChat({
      history: [{ role: "user", parts: [{ text: optimizePrompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    });

    // 3. Send Payload
    const aiRequestPayload = {
      videoDetails: videoDetails,
      creatorProfile: creatorProfile,
    };
    const result = await chat.sendMessage(JSON.stringify(aiRequestPayload));
    const response = await result.response;
    const rawText = response.text();

    // 4. Parse and Send Response
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No valid JSON object found in Gemini response.");
    }
    const jsonResponse = JSON.parse(match[0]);
    res.json(jsonResponse);

  } catch (error) {
    console.error('[StreamTitle.AI] Error optimizing video:', error.message);
    res.status(500).json({ error: 'Failed to optimize video.' });
  }
});

// --- V3: Discover/Outliers Endpoint ---
aiRouter.post('/discover/outliers', async (req, res) => {
  try {
    const { topic } = req.body;
    const uid = req.user.uid;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    // 1. Fetch Creator Profile (Using multi-profile system)
    let creatorProfile = {};
    if (req.body.profileId) { // Check for profileId
      const profileRef = db.collection('creatorProfiles').doc(uid).collection('profiles').doc(req.body.profileId);
      const doc = await profileRef.get();
      if (doc.exists) {
        creatorProfile = doc.data();
      }
    } else {
      console.log("[StreamTitle.AI] Outliers: No profileId sent, using default empty profile.");
    }

    // 2. Start Chat with Gemini
    const chat = mainModel.startChat({
      history: [{ role: "user", parts: [{ text: outliersPrompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.8 },
    });

    // 3. Send Payload
    const aiRequestPayload = {
      topic: topic,
      creatorProfile: creatorProfile,
    };
    const result = await chat.sendMessage(JSON.stringify(aiRequestPayload));
    const response = await result.response;
    const rawText = response.text();

    // 4. Parse and Send Response
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No valid JSON object found in Gemini response.");
    }
    const jsonResponse = JSON.parse(match[0]);
    res.json(jsonResponse);

  } catch (error) {
    console.error('[StreamTitle.AI] Error generating outlier ideas:', error.message);
    res.status(500).json({ error: 'Failed to generate ideas.' });
  }
});

// --- V3: Discover/Keywords Endpoint ---
aiRouter.post('/discover/keywords', async (req, res) => {
  try {
    const { topic } = req.body;
    const uid = req.user.uid;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    // 1. Fetch Creator Profile (Using multi-profile system)
    let creatorProfile = {};
    if (req.body.profileId) { // Check for profileId
      const profileRef = db.collection('creatorProfiles').doc(uid).collection('profiles').doc(req.body.profileId);
      const doc = await profileRef.get();
      if (doc.exists) {
        creatorProfile = doc.data();
      }
    } else {
      console.log("[StreamTitle.AI] Keywords: No profileId sent, using default empty profile.");
    }

    // 2. Start Chat with Gemini
    const chat = mainModel.startChat({
      history: [{ role: "user", parts: [{ text: keywordsPrompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    });

    // 3. Send Payload
    const aiRequestPayload = {
      topic: topic,
      creatorProfile: creatorProfile,
    };
    const result = await chat.sendMessage(JSON.stringify(aiRequestPayload));
    const response = await result.response;
    const rawText = response.text();

    // 4. Parse and Send Response
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No valid JSON object found in Gemini response.");
    }
    const jsonResponse = JSON.parse(match[0]);
    res.json(jsonResponse);

  } catch (error) {
    console.error('[StreamTitle.AI] Error generating keyword ideas:', error.message);
    res.status(500).json({ error: 'Failed to generate ideas.' });
  }
});

// --- NEW: V3 Discover/Competitor Endpoint ---
aiRouter.post('/discover/competitor', async (req, res) => {
  try {
    const { topic } = req.body; // Renamed to "topic" for consistency
    const uid = req.user.uid;

    if (!topic) {
      return res.status(400).json({ error: 'Competitor topic is required.' });
    }

    // 1. Fetch Creator Profile (Using multi-profile system)
    let creatorProfile = {};
    if (req.body.profileId) { // Check for profileId
      const profileRef = db.collection('creatorProfiles').doc(uid).collection('profiles').doc(req.body.profileId);
      const doc = await profileRef.get();
      if (doc.exists) {
        creatorProfile = doc.data();
      }
    } else {
      console.log("[StreamTitle.AI] Competitor: No profileId sent, using default empty profile.");
    }

    // 2. Start Chat with Gemini
    const chat = mainModel.startChat({
      history: [{ role: "user", parts: [{ text: competitorPrompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    });

    // 3. Send Payload
    const aiRequestPayload = {
      competitorTopic: topic,
      creatorProfile: creatorProfile,
    };
    const result = await chat.sendMessage(JSON.stringify(aiRequestPayload));
    const response = await result.response;
    const rawText = response.text();

    // 4. Parse and Send Response
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No valid JSON object found in Gemini response.");
    }
    const jsonResponse = JSON.parse(match[0]);
    res.json(jsonResponse);

  } catch (error) {
    console.error('[StreamTitle.AI] Error generating competitor analysis:', error.message);
    res.status(500).json({ error: 'Failed to generate analysis.' });
  }
});


module.exports = aiRouter;