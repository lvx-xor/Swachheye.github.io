/* ============================================================
   Auth Routes — Register, Verify OTP, Login, Me, Logout
   Uses NeDB (async API)
   ============================================================ */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/email');
const { requireAuth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'swachhta-fallback-secret';
const JWT_EXPIRES = '7d';

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required.' });

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Invalid email address.' });

    const existing = await db.users.findOne({ email });

    if (existing && existing.verified)
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });

    const hashed = await bcrypt.hash(password, 12);

    const isFirstUser = (await db.users.count({})) === 0;
    const assignedRole = isFirstUser ? 'admin' : 'citizen';

    if (existing && !existing.verified) {
      await db.users.update({ email }, { $set: { name, password: hashed, role: assignedRole } });
    } else {
      await db.users.insert({
        name, email, password: hashed,
        role: assignedRole, verified: false,
        avatar: '🌿', points: 0, createdAt: new Date().toISOString(),
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.otps.update(
      { email, purpose: 'verify', used: false },
      { $set: { used: true } },
      { multi: true }
    );
    await db.otps.insert({ email, otp, purpose: 'verify', expiresAt, used: false, createdAt: new Date().toISOString() });

    try { await sendOTPEmail(email, otp, name); } catch (e) { console.error('[Email]', e.message); }

    res.status(201).json({
      message: `Verification code sent to ${email}. Please check your inbox.`,
      email,
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    if (err.message && err.message.includes('unique')) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/verify-otp ──────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    const otpRecord = await db.otps.findOne({
      email, otp, purpose: 'verify', used: false,
    });

    if (!otpRecord)
      return res.status(400).json({ error: 'Invalid verification code. Please request a new one.' });

    if (new Date(otpRecord.expiresAt) < new Date())
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });

    await db.otps.update({ _id: otpRecord._id }, { $set: { used: true } });
    await db.users.update({ email }, { $set: { verified: true } });

    const user = await db.users.findOne({ email });

    try { await sendWelcomeEmail(email, user.name); } catch (e) { console.error('[Email]', e.message); }

    const token = signToken(user);
    res.json({
      message: 'Email verified successfully! Welcome to Swachhta & LiFE.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    console.error('[Auth] Verify OTP error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ── POST /api/auth/resend-otp ──────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await db.users.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });
    if (user.verified) return res.status(400).json({ error: 'This email is already verified. Please log in.' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.otps.update({ email, purpose: 'verify', used: false }, { $set: { used: true } }, { multi: true });
    await db.otps.insert({ email, otp, purpose: 'verify', expiresAt, used: false, createdAt: new Date().toISOString() });

    try { await sendOTPEmail(email, otp, user.name); } catch (e) { console.error('[Email]', e.message); }

    res.json({ message: `New verification code sent to ${email}.` });
  } catch (err) {
    console.error('[Auth] Resend OTP error:', err);
    res.status(500).json({ error: 'Failed to resend OTP.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await db.users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    if (!user.verified) {
      return res.status(403).json({
        error: 'Please verify your email first.',
        needsVerification: true,
        email,
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    await db.users.update({ _id: user._id }, { $set: { lastLogin: new Date().toISOString() } });

    const token = signToken(user);
    res.json({
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.users.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ── POST /api/auth/forgot-password ────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await db.users.findOne({ email, verified: true });
    if (user) {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await db.otps.update({ email, purpose: 'reset', used: false }, { $set: { used: true } }, { multi: true });
      await db.otps.insert({ email, otp, purpose: 'reset', expiresAt, used: false, createdAt: new Date().toISOString() });
      try { await sendOTPEmail(email, otp, user.name); } catch (e) { console.error('[Email]', e.message); }
    }

    res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// ── GET /api/auth/leaderboard ──────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await db.users.find({ role: 'citizen' });
    
    // Sort by points DESC and return top 10
    const sorted = users
      .map(u => ({
        id: u._id,
        name: u.name,
        avatar: u.avatar,
        points: u.points || 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    res.json({ leaderboard: sorted });
  } catch (err) {
    console.error('[Auth] Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

module.exports = router;
