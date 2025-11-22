// backend/config/firebase.js
const admin = require('firebase-admin');

// Load the service account key you downloaded
const serviceAccount = require('../serviceAccountKey.json');

// Initialize the app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };