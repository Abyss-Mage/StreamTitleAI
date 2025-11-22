const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Load env explicitly if needed
if (!process.env.STRIPE_SECRET_KEY) require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // We will get this soon

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // 1. Get User ID from the metadata we sent during checkout
    const uid = session.metadata.uid;
    const subscriptionId = session.subscription;

    console.log(`[Stripe] Payment success for User ${uid}. Sub ID: ${subscriptionId}`);

    try {
      // 2. Update Firebase User Document
      // We store this in a 'subscriptions' collection or directly on the user profile
      // Let's put it on the user's main profile for easy access
      await db.collection('users').doc(uid).set({
        isPro: true,
        subscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`[Stripe] User ${uid} upgraded to PRO.`);
    } catch (err) {
      console.error('[Stripe] Database update failed:', err);
      return res.status(500).send('Database Error');
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

module.exports = router;