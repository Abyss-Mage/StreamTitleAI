// backend/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Ensure env vars are loaded first

const apiRoutes = require('./routes'); // Imports the main router from routes/index.js

// --- Configuration ---
const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

// --- Mount Main API Router ---
// All v1 routes will be handled by the apiRoutes module
app.use('/api/v1', apiRoutes);

// --- Start the Server ---
app.listen(port, () => {
    console.log(`[StreamTitle.AI] Server running on http://localhost:${port}`);
});