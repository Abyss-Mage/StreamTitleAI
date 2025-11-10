// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// --- V3: Creator ProfileS API (Subcollection) ---

// Helper function to get the profiles subcollection
const getProfilesCol = (uid) => {
  return db.collection('creatorProfiles').doc(uid).collection('profiles');
}

// GET /api/v1/profile
// Get ALL profiles for the logged-in user
router.get('/', async (req, res) => {
  try {
    const uid = req.user.uid;
    const profilesCol = getProfilesCol(uid);
    const snapshot = await profilesCol.get();

    if (snapshot.empty) {
      return res.json([]); // Return empty array if no profiles
    }

    const profiles = [];
    snapshot.forEach(doc => {
      profiles.push({ id: doc.id, ...doc.data() });
    });

    res.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).send('Failed to fetch profiles.');
  }
});

// POST /api/v1/profile
// Create a NEW profile
router.post('/', async (req, res) => {
  try {
    const uid = req.user.uid;
    const profilesCol = getProfilesCol(uid);
    
    // Default data for a new profile
    const profileData = {
      name: req.body.name || "New Profile", // Allow naming the profile
      tone: '',
      voiceGuidelines: '',
      bannedWords: [],
      defaultCTAs: [],
      logoUrl: '',
    };
    
    const docRef = await profilesCol.add(profileData);

    res.json({ success: true, id: docRef.id, ...profileData });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).send('Failed to create profile.');
  }
});

// PUT /api/v1/profile/:id
// Update a SPECIFIC profile
router.put('/:id', async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    const profileData = req.body;
    
    // Remove 'id' from data if it was sent in the body
    delete profileData.id; 

    const profileRef = getProfilesCol(uid).doc(id);
    await profileRef.set(profileData, { merge: true });

    res.json({ success: true, id: id, ...profileData });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).send('Failed to save profile.');
  }
});

// DELETE /api/v1/profile/:id
// Delete a SPECIFIC profile
router.delete('/:id', async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    const profileRef = getProfilesCol(uid).doc(id);
    await profileRef.delete();

    res.json({ success: true, message: 'Profile deleted.' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).send('Failed to delete profile.');
  }
});

module.exports = router;