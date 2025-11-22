const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import Routers
const apiRoutes = require('./routes');
const stripeWebhookRoute = require('./routes/stripe-webhook'); 
const stripeRoutes = require('./routes/stripe'); 
const twitchRoutes = require('./routes/twitch'); // <-- 1. Import Twitch

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());

// 2. Mount Stripe Webhook FIRST (Needs Raw Body)
// This must be defined before express.json()
app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRoute);

// 3. Global JSON Parser (For everything else)
app.use(express.json());

// 4. Mount Stripe General Routes (Checkout)
app.use('/api/v1/stripe', stripeRoutes);

// 5. Mount Twitch Routes (Analytics)
app.use('/api/v1/twitch', twitchRoutes); // <-- 2. Mount Twitch

// 6. Mount Main API Router (Auth, Profile, Generate, etc.)
// This handles everything else under /api/v1
app.use('/api/v1', apiRoutes);

app.listen(port, () => {
    console.log(`[StreamTitle.AI] Server running on http://localhost:${port}`);
});