/* ============================================================
   DB Setup — NeDB (pure JavaScript embedded database)
   No native compilation required!
   Stores data as JSON files in server/data/
   ============================================================ */

const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Create collections ─────────────────────────────────────

const db = {
  users: Datastore.create({
    filename: path.join(DATA_DIR, 'users.db'),
    autoload: true,
  }),

  otps: Datastore.create({
    filename: path.join(DATA_DIR, 'otps.db'),
    autoload: true,
  }),

  analyses: Datastore.create({
    filename: path.join(DATA_DIR, 'analyses.db'),
    autoload: true,
  }),

  reports: Datastore.create({
    filename: path.join(DATA_DIR, 'reports.db'),
    autoload: true,
  }),
};

// ── Ensure indexes ─────────────────────────────────────────
async function ensureIndexes() {
  try {
    await db.users.ensureIndex({ fieldName: 'email', unique: true });
    await db.otps.ensureIndex({ fieldName: 'email' });
    await db.analyses.ensureIndex({ fieldName: 'userId' });
    await db.reports.ensureIndex({ fieldName: 'analysisId' });
    console.log('[DB] NeDB collections ready at', DATA_DIR);
  } catch (err) {
    console.error('[DB] Index setup error:', err.message);
  }
}

ensureIndexes();

module.exports = db;
