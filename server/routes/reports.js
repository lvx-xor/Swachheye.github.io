/* ============================================================
   Reports Routes — CRUD + Clearance Email (NeDB)
   ============================================================ */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const { sendClearanceEmail, sendNGODispatchEmail } = require('../utils/email');

// ── GET /api/reports ───────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await db.reports.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));

    // Enrich with analysis data
    const enriched = await Promise.all(reports.map(async (r) => {
      let analysis = null;
      if (r.analysisId) {
        analysis = await db.analyses.findOne({ _id: r.analysisId });
      }
      return { ...r, analysis };
    }));

    const total = await db.reports.count({});
    res.json({ reports: enriched, total });
  } catch (err) {
    console.error('[Reports] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// ── GET /api/reports/my ────────────────────────────────────
router.get('/my', requireAuth, async (req, res) => {
  try {
    const reports = await db.reports.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    // Enrich with analysis data
    const enriched = await Promise.all(reports.map(async (r) => {
      let analysis = null;
      if (r.analysisId) {
        analysis = await db.analyses.findOne({ _id: r.analysisId });
      }
      return { ...r, analysis };
    }));

    res.json({ reports: enriched });
  } catch (err) {
    console.error('[Reports] Get My Reports error:', err);
    res.status(500).json({ error: 'Failed to fetch your reports.' });
  }
});

// ── GET /api/reports/stats/summary ────────────────────────
router.get('/stats/summary', async (req, res) => {
  try {
    const total      = await db.reports.count({});
    const totalScans = await db.analyses.count({});
    const open       = await db.reports.count({ status: 'open' });
    const inProgress = await db.reports.count({ status: 'in_progress' });
    const resolved   = await db.reports.count({ status: 'resolved' });
    res.json({ total, totalScans, open, inProgress, resolved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── GET /api/reports/:id ───────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const report = await db.reports.findOne({ _id: req.params.id });
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    let analysis = null;
    if (report.analysisId) analysis = await db.analyses.findOne({ _id: report.analysisId });
    res.json({ report: { ...report, analysis } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// ── POST /api/reports ──────────────────────────────────────
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { analysisId, zone, description, priority = 'medium' } = req.body;
    if (!analysisId) return res.status(400).json({ error: 'analysisId is required.' });

    const analysis = await db.analyses.findOne({ _id: analysisId });
    if (!analysis) return res.status(404).json({ error: 'Analysis not found. Please run AI analysis first.' });

    const reportDoc = {
      analysisId,
      userId: req.user?.id || null,
      zone: zone || analysis.locationName,
      description: description || analysis.aiReasoning,
      priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.reports.insert(reportDoc);

    // Alert NGO and Municipal Party
    try {
      await sendNGODispatchEmail({
        location: saved.zone,
        lat: analysis.lat || 28.6139,
        lng: analysis.lng || 77.2090,
        wasteType: analysis.wasteType || 'Mixed Waste',
        severity: analysis.severity || priority.toUpperCase(),
        insights: analysis.recommendation || 'Citizen reported unattended garbage.'
      });
      console.log(`[Reports] Dispatch email sent to NGO for report ${saved._id}`);
    } catch (emailErr) {
      console.error('[Email] NGO Dispatch failed:', emailErr.message);
    }

    res.status(201).json({
      message: 'Report submitted successfully.',
      reportId: saved._id,
    });
  } catch (err) {
    console.error('[Reports] Create error:', err);
    res.status(500).json({ error: 'Failed to create report.' });
  }
});

// ── POST /api/reports/quick ────────────────────────────────
router.post('/quick', optionalAuth, async (req, res) => {
  try {
    const { zone, description, wasteType } = req.body;
    if (!zone) return res.status(400).json({ error: 'zone is required.' });

    const reportDoc = {
      analysisId: null,
      userId: req.user?.id || null,
      zone: zone,
      description: description || 'Manual Quick Report',
      priority: 'high',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.reports.insert(reportDoc);

    // Alert NGO and Municipal Party
    try {
      const { sendNGODispatchEmail } = require('../utils/email');
      await sendNGODispatchEmail({
        location: saved.zone,
        lat: 28.6139,
        lng: 77.2090,
        wasteType: wasteType || 'Mixed Waste',
        severity: 'HIGH', // Manual reports are high severity
        insights: description || 'Citizen manually logged a quick report.'
      });
      console.log(`[Reports] Quick dispatch email sent to NGO for report ${saved._id}`);
    } catch (emailErr) {
      console.error('[Email] NGO Dispatch failed:', emailErr.message);
    }

    res.status(201).json({
      message: 'Quick Report submitted successfully.',
      reportId: saved._id,
    });
  } catch (err) {
    console.error('[Reports] Quick Create error:', err);
    res.status(500).json({ error: 'Failed to create quick report.' });
  }
});

// ── PATCH /api/reports/:id/clear ──────────────────────────
router.patch('/:id/clear', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const report = await db.reports.findOne({ _id: req.params.id });
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    if (report.status === 'resolved') return res.status(400).json({ error: 'Already marked as cleared.' });

    const analysis = report.analysisId ? await db.analyses.findOne({ _id: report.analysisId }) : null;

    const clearedAt = new Date().toISOString();

    // Update report status
    await db.reports.update({ _id: report._id }, { $set: { status: 'resolved', updatedAt: clearedAt } });

    // Update analysis status
    if (analysis) {
      await db.analyses.update(
        { _id: analysis._id },
        { $set: { status: 'cleared', clearedAt, clearedById: req.user.id } }
      );
    }

    // Get reporter and grant points
    let recipientEmail = analysis?.reporterEmail || null;
    let recipientName = 'Citizen';

    if (report.userId) {
      const reporter = await db.users.findOne({ _id: report.userId });
      if (reporter) { 
        recipientEmail = reporter.email; 
        recipientName = reporter.name; 
        
        // Grant 5 points
        const newPoints = (reporter.points || 0) + 5;
        await db.users.update({ _id: reporter._id }, { $set: { points: newPoints } });
        console.log(`[Reports] Granted 5 points to user ${reporter._id}`);
      }
    } else if (analysis?.reporterEmail) {
      // Look up by email if no userId attached to report
      const reporter = await db.users.findOne({ email: analysis.reporterEmail });
      if (reporter) {
        recipientEmail = reporter.email; 
        recipientName = reporter.name; 
        
        // Grant 5 points
        const newPoints = (reporter.points || 0) + 5;
        await db.users.update({ _id: reporter._id }, { $set: { points: newPoints } });
        console.log(`[Reports] Granted 5 points to user ${reporter._id}`);
      }
    }

    let emailSent = false;
    if (recipientEmail) {
      try {
        await sendClearanceEmail({
          toEmail: recipientEmail,
          reporterName: recipientName,
          location: analysis?.locationName || report.zone || 'Unknown Location',
          wasteType: formatWasteType(analysis?.wasteType),
          clearedAt: new Date(clearedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          clearedByName: req.user.name,
        });
        emailSent = true;
        console.log(`[Reports] Clearance email sent to ${recipientEmail}`);
      } catch (emailErr) {
        console.error('[Email] Clearance email failed:', emailErr.message);
      }
    }

    res.json({ message: 'Report marked as cleared. 5 Points awarded!', emailSent, recipientEmail: emailSent ? recipientEmail : null });
  } catch (err) {
    console.error('[Reports] Clear error:', err);
    res.status(500).json({ error: 'Failed to mark report as cleared.' });
  }
});

// ── PATCH /api/reports/:id/status ─────────────────────────
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status, priority } = req.body;
    const validStatuses = ['open', 'in_progress', 'resolved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status.` });
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (status) updates.status = status;
    if (priority) updates.priority = priority;

    await db.reports.update({ _id: req.params.id }, { $set: updates });
    res.json({ message: 'Report updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report.' });
  }
});

function formatWasteType(type) {
  const map = { PLASTIC: 'Plastic Waste', WET_WASTE: 'Wet / Organic Waste', DRY_WASTE: 'Dry Waste', MIXED: 'Mixed Waste', CLEAN: 'Clean Area' };
  return map[type] || type || 'Unknown';
}

module.exports = router;
