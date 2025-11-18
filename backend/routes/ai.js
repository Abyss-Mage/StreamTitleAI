// backend/routes/ai.js
const express = require('express');
const { db } = require('../config/firebase');
const { 
  mainModel, 
  optimizePrompt, 
  outliersPrompt, 
  keywordsPrompt, 
  competitorPrompt, 
  coachPrompt 
} = require('../config/ai');
const aiRouter = express.Router();

// Helper to get profile
async function getProfile(uid, profileId) {
  if (!profileId) return {};
  const doc = await db.collection('creatorProfiles').doc(uid).collection('profiles').doc(profileId).get();
  return doc.exists ? doc.data() : {};
}

// Optimize
aiRouter.post('/optimize', async (req, res) => {
  try {
    const { videoDetails, profileId, model } = req.body;
    const creatorProfile = await getProfile(req.user.uid, profileId);

    const chat = mainModel.startChat({
      history: [{ role: "user", parts: [{ text: optimizePrompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
      model: model
    });

    const result = await chat.sendMessage(JSON.stringify({ videoDetails, creatorProfile }));
    const match = result.response.text().match(/\{[\s\S]*\}/);
    res.json(JSON.parse(match[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discover: Outliers
aiRouter.post('/discover/outliers', async (req, res) => {
  try {
    const { topic, profileId, model } = req.body;
    const creatorProfile = await getProfile(req.user.uid, profileId);

    const chat = mainModel.startChat({
      history: [{ role: "user", parts: [{ text: outliersPrompt }] }],
      model: model
    });

    const result = await chat.sendMessage(JSON.stringify({ topic, creatorProfile }));
    const match = result.response.text().match(/\{[\s\S]*\}/);
    res.json(JSON.parse(match[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discover: Keywords
aiRouter.post('/discover/keywords', async (req, res) => {
  try {
    const { topic, profileId, model } = req.body;
    const creatorProfile = await getProfile(req.user.uid, profileId);

    const chat = mainModel.startChat({
      history: [{ role: "user", parts: [{ text: keywordsPrompt }] }],
      model: model
    });

    const result = await chat.sendMessage(JSON.stringify({ topic, creatorProfile }));
    const match = result.response.text().match(/\{[\s\S]*\}/);
    res.json(JSON.parse(match[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discover: Competitor
aiRouter.post('/discover/competitor', async (req, res) => {
  try {
    const { topic, profileId, model } = req.body;
    const creatorProfile = await getProfile(req.user.uid, profileId);

    const chat = mainModel.startChat({
      history: [{ role: "user", parts: [{ text: competitorPrompt }] }],
      model: model
    });

    const result = await chat.sendMessage(JSON.stringify({ competitorTopic: topic, creatorProfile }));
    const match = result.response.text().match(/\{[\s\S]*\}/);
    res.json(JSON.parse(match[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Coach
aiRouter.post('/coach', async (req, res) => {
  try {
    const { messages, profileId, model } = req.body;
    const creatorProfile = await getProfile(req.user.uid, profileId);

    // Map history for adapter
    const formattedHistory = messages.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const chat = mainModel.startChat({
      history: [
        { role: "user", parts: [{ text: `System: ${coachPrompt}\nProfile: ${JSON.stringify(creatorProfile)}` }] },
        { role: "model", parts: [{ text: "Ready." }] },
        ...formattedHistory.slice(0, -1)
      ],
      model: model
    });

    const lastMsg = messages[messages.length - 1].text;
    const result = await chat.sendMessage(lastMsg);
    res.json({ reply: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = aiRouter;