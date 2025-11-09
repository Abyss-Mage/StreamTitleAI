// backend/routes/ai.js
const express = require('express');
const { db } = require('../config/firebase');
const { mainModel, optimizePrompt, outliersPrompt } = require('../config/ai'); // <-- IMPORT NEW PROMPT
const aiRouter = express.Router();

// --- V2: Optimize Endpoint ---
aiRouter.post('/optimize', async (req, res) => {
  try {
    const { videoDetails } = req.body;
    const uid = req.user.uid;

    // 1. Fetch Creator Profile
    let creatorProfile = {};
    const profileRef = db.collection('creatorProfiles').doc(uid);
    const doc = await profileRef.get();
    if (doc.exists) {
      creatorProfile = doc.data();
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

// --- NEW V3: Discover/Outliers Endpoint ---
aiRouter.post('/discover/outliers', async (req, res) => {
  try {
    const { topic } = req.body;
    const uid = req.user.uid;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    // 1. Fetch Creator Profile
    let creatorProfile = {};
    const profileRef = db.collection('creatorProfiles').doc(uid);
    const doc = await profileRef.get();
    if (doc.exists) {
      creatorProfile = doc.data();
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

module.exports = aiRouter;