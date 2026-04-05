/* ============================================
   Mock Data Store — Simulated API Data
   ============================================ */

const MockData = {
  // ── City Zones ──
  zones: [
    { id: 'z1', name: 'Zone A - Connaught Place',   lat: 28.6315, lng: 77.2167, score: 82, status: 'clean',    reports: 3,  lastInspection: '2 hrs ago' },
    { id: 'z2', name: 'Zone B - Karol Bagh',        lat: 28.6519, lng: 77.1909, score: 45, status: 'moderate', reports: 12, lastInspection: '5 hrs ago' },
    { id: 'z3', name: 'Zone C - Chandni Chowk',     lat: 28.6506, lng: 77.2334, score: 28, status: 'dirty',    reports: 24, lastInspection: '1 day ago' },
    { id: 'z4', name: 'Zone D - Lajpat Nagar',      lat: 28.5700, lng: 77.2373, score: 71, status: 'clean',    reports: 5,  lastInspection: '3 hrs ago' },
    { id: 'z5', name: 'Zone E - Saket',              lat: 28.5244, lng: 77.2066, score: 88, status: 'clean',    reports: 1,  lastInspection: '1 hr ago' },
    { id: 'z6', name: 'Zone F - Dwarka',             lat: 28.5921, lng: 77.0460, score: 55, status: 'moderate', reports: 8,  lastInspection: '6 hrs ago' },
    { id: 'z7', name: 'Zone G - Rohini',             lat: 28.7495, lng: 77.0565, score: 35, status: 'dirty',    reports: 19, lastInspection: '12 hrs ago' },
    { id: 'z8', name: 'Zone H - Vasant Kunj',        lat: 28.5194, lng: 77.1571, score: 76, status: 'clean',    reports: 4,  lastInspection: '2 hrs ago' },
  ],

  // ── AI Detection Responses ──
  detectionResults: [
    {
      score: 34,
      grade: 'Poor',
      location: { name: 'Near MG Road Metro Station, Sector 14', coords: '28.4744° N, 77.0708° E' },
      detections: [
        { name: 'Overflowing Dustbin',  confidence: 94, severity: 'high',   icon: '🗑️' },
        { name: 'Plastic Waste',        confidence: 87, severity: 'high',   icon: '♻️' },
        { name: 'Stagnant Water',       confidence: 72, severity: 'medium', icon: '💧' },
        { name: 'Uncleared Debris',     confidence: 65, severity: 'medium', icon: '🧱' },
      ]
    },
    {
      score: 72,
      grade: 'Good',
      location: { name: 'Central Park, Rajiv Chowk', coords: '28.6328° N, 77.2197° E' },
      detections: [
        { name: 'Minor Litter',         confidence: 58, severity: 'low',    icon: '🍂' },
        { name: 'Overflowing Bin',      confidence: 41, severity: 'medium', icon: '🗑️' },
      ]
    },
    {
      score: 91,
      grade: 'Excellent',
      location: { name: 'India Gate Lawns, New Delhi', coords: '28.6129° N, 77.2295° E' },
      detections: [
        { name: 'Clean Area',           confidence: 96, severity: 'none',   icon: '✅' },
      ]
    },
    {
      score: 18,
      grade: 'Critical',
      location: { name: 'Old Railway Colony, Paharganj', coords: '28.6449° N, 77.2120° E' },
      detections: [
        { name: 'Open Garbage Dump',    confidence: 97, severity: 'critical', icon: '⛔' },
        { name: 'Plastic Accumulation', confidence: 92, severity: 'high',     icon: '♻️' },
        { name: 'Overflowing Drains',   confidence: 88, severity: 'high',     icon: '💧' },
        { name: 'Animal Waste',         confidence: 73, severity: 'medium',   icon: '🐾' },
        { name: 'Construction Debris',  confidence: 61, severity: 'medium',   icon: '🧱' },
      ]
    },
  ],

  // ── LiFE Score Breakdown ──
  lifeScore: {
    overall: 68,
    categories: [
      { name: 'Waste Segregation',     score: 72, icon: '🗂️', trend: '+5%' },
      { name: 'Plastic Usage Reduction', score: 54, icon: '♻️', trend: '-2%' },
      { name: 'Green Cover',           score: 81, icon: '🌳', trend: '+8%' },
      { name: 'Citizen Participation', score: 63, icon: '🧑‍🤝‍🧑', trend: '+12%' },
    ]
  },

  // ── Citizen Leaderboard ──
  citizens: [
    { rank: 1, name: 'Priya Sharma',    points: 2840, badge: '🏆 Eco Warrior',     avatar: 'PS', reports: 47 },
    { rank: 2, name: 'Rahul Verma',     points: 2350, badge: '🌿 Green Champion',   avatar: 'RV', reports: 38 },
    { rank: 3, name: 'Anita Desai',     points: 1920, badge: '♻️ Recycle Hero',      avatar: 'AD', reports: 31 },
    { rank: 4, name: 'Vikram Singh',    points: 1680, badge: '🧹 Clean Crusader',    avatar: 'VS', reports: 25 },
    { rank: 5, name: 'Meera Patel',     points: 1240, badge: '🌱 Eco Starter',       avatar: 'MP', reports: 18 },
    { rank: 6, name: 'Arjun Nair',      points: 980,  badge: '🌱 Eco Starter',       avatar: 'AN', reports: 14 },
    { rank: 7, name: 'Sneha Gupta',     points: 760,  badge: '🌱 Eco Starter',       avatar: 'SG', reports: 11 },
  ],

  // ── Activity Feed ──
  activities: [
    { text: 'New report filed in <strong>Zone C</strong> — overflowing dustbin near market', time: '2 min ago', type: 'report',  color: 'var(--color-red)' },
    { text: 'Cleaning crew dispatched to <strong>Zone G</strong>', time: '8 min ago',  type: 'action',  color: 'var(--color-blue)' },
    { text: '<strong>Priya Sharma</strong> earned "Eco Warrior" badge!', time: '15 min ago', type: 'badge',   color: 'var(--color-amber)' },
    { text: 'AI Alert: High litter density detected in <strong>Zone B</strong>', time: '22 min ago', type: 'ai',      color: 'var(--color-purple)' },
    { text: 'Zone A inspection complete — Score: <strong>82/100</strong>', time: '30 min ago', type: 'inspect', color: 'var(--color-accent)' },
    { text: 'New recycling campaign launched in <strong>Zone D</strong>', time: '45 min ago', type: 'campaign', color: 'var(--color-cyan)' },
    { text: '3 complaints resolved in <strong>Zone E</strong>', time: '1 hr ago',  type: 'resolved', color: 'var(--color-accent)' },
    { text: 'Sensor alert: Bin capacity at 90% in <strong>Zone F</strong>', time: '1.5 hrs ago', type: 'sensor', color: 'var(--color-amber)' },
  ],

  // ── AI Suggestions ──
  suggestions: [
    { type: 'warning', icon: '⚠️', text: 'High litter density detected — Install additional dustbin at <strong>Chandni Chowk Market Gate</strong>', priority: 'High' },
    { type: 'alert',   icon: '🧹', text: 'Route alert: <strong>Zone C</strong> needs daily cleaning schedule (currently bi-weekly)', priority: 'High' },
    { type: 'promote', icon: '♻️', text: 'Promote recycling awareness campaign in <strong>Zone B - Karol Bagh</strong> (plastic usage up 12%)', priority: 'Medium' },
    { type: 'action',  icon: '🚛', text: 'Schedule additional waste pickup at <strong>Rohini Sector 7</strong> between 6–8 AM', priority: 'Medium' },
    { type: 'success', icon: '🌳', text: 'Green cover initiative working well in <strong>Zone E - Saket</strong> — consider expanding to Zone D', priority: 'Low' },
    { type: 'info',    icon: '📊', text: 'Citizen participation up 12% this month. Consider reward program expansion.', priority: 'Low' },
  ],

  // ── Admin Reports ──
  reports: [
    { id: 'RPT-001', location: 'Zone C, Chandni Chowk',   type: 'Overflowing Bin',  status: 'Pending',     assignee: 'Crew Alpha', time: '10:30 AM', priority: 'High' },
    { id: 'RPT-002', location: 'Zone G, Rohini Sec 3',     type: 'Open Dump',        status: 'In Progress', assignee: 'Crew Beta',  time: '09:15 AM', priority: 'Critical' },
    { id: 'RPT-003', location: 'Zone B, Karol Bagh',       type: 'Plastic Waste',    status: 'Resolved',    assignee: 'Crew Gamma', time: '08:00 AM', priority: 'Medium' },
    { id: 'RPT-004', location: 'Zone F, Dwarka Sec 12',    type: 'Drain Blockage',   status: 'Pending',     assignee: 'Unassigned', time: '11:45 AM', priority: 'High' },
    { id: 'RPT-005', location: 'Zone A, CP Inner Circle',  type: 'Litter',           status: 'Resolved',    assignee: 'Crew Alpha', time: '07:30 AM', priority: 'Low' },
    { id: 'RPT-006', location: 'Zone D, Lajpat Nagar',     type: 'Green Waste',      status: 'In Progress', assignee: 'Crew Delta', time: '10:00 AM', priority: 'Medium' },
  ],

  // ── Stats ──
  stats: {
    totalScans: 1247,
    activeReports: 18,
    avgScore: 62,
    resolvedToday: 34,
    avgResponseTime: '2.4 hrs',
    citizenReports: 156,
    activeCampaigns: 5,
    crewsDeployed: 12,
  },

  // ── Analysis Phases (for loading animation) ──
  analysisPhases: [
    'Initializing computer vision model...',
    'Detecting garbage and waste materials...',
    'Analyzing overflow conditions...',
    'Checking for plastic contamination...',
    'Scanning for drainage issues...',
    'Computing cleanliness score...',
    'Auto-tagging location data...',
    'Generating report...'
  ],

  // Helper: Get random detection result
  getRandomDetection() {
    return this.detectionResults[Math.floor(Math.random() * this.detectionResults.length)];
  },

  // Helper: Get score color
  getScoreColor(score) {
    if (score >= 75) return 'var(--color-accent)';
    if (score >= 50) return 'var(--color-amber)';
    if (score >= 25) return 'var(--color-red)';
    return '#dc2626';
  },

  // Helper: Get score grade
  getScoreGrade(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Moderate';
    if (score >= 25) return 'Poor';
    return 'Critical';
  },

  // Helper: Get severity color
  getSeverityColor(severity) {
    const map = {
      'none': 'var(--color-accent)',
      'low': 'var(--color-blue)',
      'medium': 'var(--color-amber)',
      'high': 'var(--color-red)',
      'critical': '#dc2626'
    };
    return map[severity] || 'var(--color-border)';
  }
};
