const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Verify token middleware (optional for the webhook, mandatory for checkout)
const { verifyApiToken } = require('../middleware/auth');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:80';

// 1. Create Checkout Session
// POST /api/v1/stripe/create-checkout-session
router.post('/create-checkout-session', verifyApiToken, async (req, res) => {
  try {
    const { priceId } = req.body; // e.g., 'price_12345'
    const uid = req.user.uid;
    const email = req.user.email;

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      // Add metadata so we know WHO paid in the webhook
      metadata: {
        uid: uid, 
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/pricing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/v1/stripe/bypass
router.post('/bypass', verifyApiToken, async (req, res) => {
  const { code } = req.body;
  const uid = req.user.uid;

  // Hardcoded secret code for testers
  if (code !== 'BETA_TESTER_2025') {
    return res.status(403).json({ error: 'Invalid code' });
  }

  try {
    // Manually unlock Pro status in Firebase
    await db.collection('users').doc(uid).set({
      isPro: true,
      subscriptionStatus: 'active', // active (bypass)
      plan: 'beta_tester',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, message: 'Beta access granted!' });
  } catch (error) {
    res.status(500).json({ error: 'Database update failed' });
  }
});

// 2. Stripe Webhook (MUST be raw body, handled in index.js usually, but routing here for logic)
// This endpoint is called by Stripe servers, not your frontend.
// Note: You need to configure index.js to NOT parse JSON for this specific route if using express.json() globally.
// For simplicity, we often put the webhook logic directly in index.js or use a specific raw middleware.
// For now, let's keep the logic here and we will tweak index.js next.

module.exports = router;