/* ============================================================
   AI Routes — Gemini Flash Garbage Classification (NeDB)
   ============================================================ */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '../data/uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed.'));
    cb(null, true);
  },
});

// ── Gemini API ─────────────────────────────────────────────
async function classifyGarbageWithGemini(imageBase64, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured. Please add it to your .env file.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are an expert AI system for a Smart City Waste Management platform called "Swachhta & LiFE Dashboard".
Analyze this image and classify the visible waste. Proceed step-by-step:

Step 1 (Observation): Identify visible objects, textures, and potential safety hazards (e.g. glass, chemicals).
Step 2 (Classification): Categorize the primary waste:
   - PLASTIC: Plastic bottles, bags, wrappers, containers
   - WET_WASTE: Food waste, organic matter, vegetable/fruit peels
   - DRY_WASTE: Paper, cardboard, glass, metal, cloth, wood
   - MIXED: Combination of multiple types
   - CLEAN: No visible garbage

Step 3 (Severity Rules): Determine severity strictly by volume:
   - NONE: Clean area
   - LOW: 1-5 scattered items, manageable by a bin
   - MEDIUM: Localized pile, manageable by 1 person
   - HIGH: Significant accumulation requiring a team/truck
   - CRITICAL: Massive illegal dump blocking paths/roads or highly hazardous

Step 4 (Decision Making): Generate a specific, actionable municipal response based on category and severity.
   - Example WET+HIGH: "Dispatch Organic Waste Compactor; issue health advisory."
   - Example HAZARD: "Initiate bio-hazard sweep protocol."
   - Example LOW: "Assign 1 sanitation worker with standard bin."

Step 5 (JSON Formatting): Return ONLY this valid JSON (no markdown ticks, no extra text):
{
  "wasteType": "PLASTIC|WET_WASTE|DRY_WASTE|MIXED|CLEAN",
  "severity": "NONE|LOW|MEDIUM|HIGH|CRITICAL",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentence description of observation>",
  "recommendation": "<specific actionable municipal step>",
  "subItems": [
    {"name": "<item>", "percentage": <number>}
  ],
  "isClean": <true|false>,
  "urgencyScore": <number 0-100, >90 if CRITICAL>
}`;

  const body = {
    contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }] }],
    generationConfig: { temperature: 0.1, topK: 32, topP: 1, maxOutputTokens: 1024 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response.');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response as JSON.');

  return JSON.parse(jsonMatch[0]);
}

// ── POST /api/ai/analyze ──────────────────────────────────
router.post('/analyze', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

    const { 
      locationName = 'Unknown Location', lat, lng, reporterEmail,
      surveyWasteType, surveyItemCount, surveySize, surveyHazards 
    } = req.body;

    // ── GEO-FENCING NOISE REDUCTION (Anti-Spam within 50m) ──
    const parsedLat = lat ? parseFloat(lat) : null;
    const parsedLng = lng ? parseFloat(lng) : null;

    if (parsedLat && parsedLng) {
      // Find all active analysis points across the platform
      const activeAnalyses = await db.analyses.find({ status: { $in: ['pending', 'in_progress'] } });
      const MAX_DIST_DEG = 0.0005; // Roughly 50 meters
      
      for (const a of activeAnalyses) {
        if (a.lat && a.lng) {
          const latDiff = Math.abs(a.lat - parsedLat);
          const lngDiff = Math.abs(a.lng - parsedLng);
          if (latDiff < MAX_DIST_DEG && lngDiff < MAX_DIST_DEG) {
            // Delete the unneeded image to conserve storage
            fs.unlinkSync(req.file.path);
            return res.status(409).json({ 
              error: 'Noise Reduction Active: This exact location has already been reported by another citizen and is currently awaiting cleanup.',
              duplicateId: a._id
            });
          }
        }
      }
    }

    // Read the temporarily saved file to base64 for Gemini Analysis
    const imageBase64 = fs.readFileSync(req.file.path).toString('base64');
    const mimeType = req.file.mimetype;

    console.log(`[AI] Analyzing: ${req.file.originalname} (${Math.round(req.file.size / 1024)} KB) - Saved at ${req.file.filename}`);

    // Fuse Gemini Vision
    const aiResult = await classifyGarbageWithGemini(imageBase64, mimeType);
    console.log('[AI] Result:', aiResult.wasteType, aiResult.severity, `${aiResult.confidence}%`);

    const analysisDoc = {
      userId: req.user?.id || null,
      imageName: req.file.originalname,
      imageUrl: '/uploads/' + req.file.filename,
      wasteType: aiResult.wasteType,
      confidence: aiResult.confidence,
      severity: aiResult.severity,
      locationName,
      lat: parsedLat,
      lng: parsedLng,
      aiReasoning: aiResult.reasoning,
      recommendation: aiResult.recommendation,
      reporterEmail: reporterEmail || req.user?.email || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const saved = await db.analyses.insert(analysisDoc);

    // ── TRIGGER EMERGENCY NGO NOTIFICATION ──
    if (aiResult.severity === 'HIGH' || aiResult.severity === 'CRITICAL') {
      try {
        const { sendNGODispatchEmail } = require('../utils/email');
        await sendNGODispatchEmail({
          location: locationName,
          lat: analysisDoc.lat || 28.6139, // fallback to Delhi center if denied
          lng: analysisDoc.lng || 77.2090,
          wasteType: aiResult.wasteType,
          severity: aiResult.severity,
          insights: aiResult.recommendation
        });
        console.log(`[AI] 🚨 Emergency Dispatch Email Triggered for ${locationName}`);
      } catch (e) {
        console.error('[AI] Failed to dispatch NGO email:', e.message);
      }
    }

    const typeLabels   = { PLASTIC: 'Plastic Waste', WET_WASTE: 'Wet / Organic Waste', DRY_WASTE: 'Dry Waste', MIXED: 'Mixed Waste', CLEAN: 'Clean Area' };
    const severityColors = { NONE: '#4A6741', LOW: '#6B8E3B', MEDIUM: '#C8840C', HIGH: '#C53030', CRITICAL: '#7B1515' };
    const typeIcons    = { PLASTIC: '🧴', WET_WASTE: '🍂', DRY_WASTE: '📦', MIXED: '🗑️', CLEAN: '✅' };

    res.json({
      analysisId: saved._id,
      wasteType: aiResult.wasteType,
      wasteTypeLabel: typeLabels[aiResult.wasteType] || aiResult.wasteType,
      wasteTypeIcon: typeIcons[aiResult.wasteType] || '🗑️',
      severity: aiResult.severity,
      severityColor: severityColors[aiResult.severity] || '#C8840C',
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      recommendation: aiResult.recommendation,
      subItems: aiResult.subItems || [],
      isClean: aiResult.isClean || false,
      urgencyScore: aiResult.urgencyScore || 50,
      location: locationName,
      lat: parsedLat,
      lng: parsedLng,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[AI] Error:', err.message);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ error: '⚙️ AI not configured. Add GEMINI_API_KEY to server/.env', setupRequired: true });
    }
    if (err.message.includes('429') || err.message.includes('quota')) {
      return res.status(429).json({ error: 'Rate limit reached. Wait a minute and try again.' });
    }
    res.status(500).json({ error: `AI analysis failed: ${err.message}` });
  }
});

// ── GET /api/ai/analyses ──────────────────────────────────
router.get('/analyses', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const analyses = await db.analyses.find({}).sort({ createdAt: -1 }).limit(limit);
    res.json({ analyses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analyses.' });
  }
});

// ── GET /api/ai/analyses/:id ──────────────────────────────
router.get('/analyses/:id', async (req, res) => {
  try {
    const analysis = await db.analyses.findOne({ _id: req.params.id });
    if (!analysis) return res.status(404).json({ error: 'Analysis not found.' });
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analysis.' });
  }
});

// ── PATCH /api/ai/analyses/:id/accept ─────────────────────
router.patch('/analyses/:id/accept', async (req, res) => {
  try {
    const updated = await db.analyses.update(
      { _id: req.params.id },
      { $set: { status: 'accepted', acceptedAt: new Date().toISOString() } },
      { returnUpdatedDocs: true }
    );
    if (!updated) return res.status(404).json({ error: 'Analysis not found.' });
    res.json({ message: 'Request accepted', analysis: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept request.' });
  }
});

module.exports = router;
