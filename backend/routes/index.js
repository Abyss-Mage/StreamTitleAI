// backend/routes/index.js
const express = require('express');
const router = express.Router();
const { verifyApiToken } = require('../middleware/auth');

// --- Import Routers ---
const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const youtubeRoutes = require('./youtube');
const generateRoutes = require('./generate');
const aiRoutes = require('./ai'); // <-- 1. IMPORT THE AI ROUTER

// --- Public Routes ---
// Auth routes are public (for login/token exchange)
router.use('/auth', authRoutes);

// --- Protected Routes ---
// All routes below this require a valid API token
router.use(verifyApiToken);

router.use('/profile', profileRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/generate', generateRoutes); // This will mount POST / as /api/v1/generate
router.use('/ai', aiRoutes); // <-- 2. MOUNT THE AI ROUTER

// A simple test route for protected access
router.get('/test', (req, res) => {
  res.json({ message: `Hello user ${req.user.uid}! Your token is valid.` });
});

module.exports = router;