const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { verifyApiToken } = require('../middleware/auth');

// Configure Transporter (Use your Gmail App Password)
// See: https://support.google.com/accounts/answer/185833
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail (safehousestudios4593@gmail.com)
    pass: process.env.EMAIL_PASS  // Your Gmail App Password (NOT your normal password)
  }
});

// POST /api/v1/feedback
router.post('/', verifyApiToken, async (req, res) => {
  const { message, type } = req.body;
  const userEmail = req.user.email;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'safehousestudios4593@gmail.com', // Send to yourself
    subject: `[StreamTitle Beta Feedback] ${type}`,
    text: `From: ${userEmail}\nType: ${type}\n\nMessage:\n${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({ error: 'Failed to send feedback' });
  }
});

module.exports = router;