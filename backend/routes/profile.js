// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// --- V2: Creator Profile API Endpoints ---

// GET /api/v1/profile
router.get('/', async (req, res) => {
  try {
    const uid = req.user.uid; // Attached by verifyApiToken middleware
    const profileRef = db.collection('creatorProfiles').doc(uid);
    const doc = await profileRef.get();

    if (!doc.exists) {
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

// PUT /api/v1/profile
router.put('/', async (req, res) => {
  try {
    const uid = req.user.uid; // Attached by verifyApiToken middleware
    const profileData = req.body;
    const profileRef = db.collection('creatorProfiles').doc(uid);
    
    await profileRef.set(profileData, { merge: true });

    res.json({ success: true, data: profileData });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).send('Failed to save profile.');
  }
});

module.exports = router;