/* ============================================================
   Enhancements.js — Dark Mode, Notifications, LiFE Score,
   Quick Report, Eco Tips, Weather, Waste Donut, Search
   ============================================================ */

const Enhancements = {

  // ── 1. DARK MODE ─────────────────────────────────────────
  initDarkMode() {
    const saved = localStorage.getItem('swachhta_theme') || 'light';
    this.setTheme(saved, false);

    const btn = document.getElementById('dark-mode-btn');
    if (btn) btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      this.setTheme(current === 'dark' ? 'light' : 'dark');
    });
  },

  setTheme(theme, save = true) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('dark-mode-btn');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (save) localStorage.setItem('swachhta_theme', theme);
  },

  // ── 2. NOTIFICATION CENTER ────────────────────────────────
  notifications: [
    { id: 1, icon: '🚨', iconBg: 'rgba(197,48,48,0.1)', title: 'Critical Alert — Zone C', desc: 'Open garbage dump at Chandni Chowk needs immediate attention.', time: '2 min ago', unread: true },
    { id: 2, icon: '✅', iconBg: 'rgba(74,103,65,0.1)',  title: 'Report Cleared — Zone A', desc: 'RPT-005 at CP Inner Circle has been resolved by Crew Alpha.', time: '18 min ago', unread: true },
    { id: 3, icon: '🤖', iconBg: 'rgba(107,142,35,0.1)', title: 'AI Analysis Complete', desc: 'Gemini classified your upload as "Plastic Waste" — HIGH severity.', time: '45 min ago', unread: true },
    { id: 4, icon: '🏆', iconBg: 'rgba(200,132,12,0.1)', title: 'Badge Earned!', desc: 'Priya Sharma earned the "Eco Warrior" badge with 2,840 points.', time: '1 hr ago', unread: false },
    { id: 5, icon: '📊', iconBg: 'rgba(59,130,246,0.1)', title: 'Weekly Report Ready', desc: 'City Cleanliness Report for March 2026 is now available.', time: '2 hrs ago', unread: false },
    { id: 6, icon: '💧', iconBg: 'rgba(6,182,212,0.1)',  title: 'Sensor Alert — Zone F', desc: 'Drain blockage sensor triggered at Dwarka Sector 12.', time: '3 hrs ago', unread: false },
  ],

  get unreadCount() {
    return this.notifications.filter(n => n.unread).length;
  },

  initNotifications() {
    const bellBtn = document.getElementById('notif-bell');
    const panel   = document.getElementById('notif-panel');
    const list    = document.getElementById('notif-list');
    const badge   = document.getElementById('notif-badge');

    if (!bellBtn || !panel) return;

    // Update badge
    const updateBadge = () => {
      const count = this.notifications.filter(n => n.unread).length;
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    };

    // Render notifications
    const render = () => {
      if (!list) return;
      list.innerHTML = this.notifications.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" data-id="${n.id}" onclick="Enhancements.markRead(${n.id})">
          <div class="notif-icon" style="background:${n.iconBg}">${n.icon}</div>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            <div class="notif-desc">${n.desc}</div>
            <div class="notif-time">${n.time}</div>
          </div>
        </div>
      `).join('');
    };

    // Toggle panel
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) render();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== bellBtn) {
        panel.classList.remove('open');
      }
    });

    // Mark all read
    const markAllBtn = document.getElementById('notif-mark-all');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        this.notifications.forEach(n => n.unread = false);
        render();
        updateBadge();
      });
    }

    updateBadge();

    // Simulate new notifications
    setTimeout(() => {
      this.addNotification({
        icon: '📸', iconBg: 'rgba(107,142,35,0.1)',
        title: 'New AI Scan Available',
        desc: 'Upload an image now to classify garbage in your area.',
        time: 'just now', unread: true
      });
      updateBadge();
    }, 15000);
  },

  markRead(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.unread = false;
  },

  addNotification(notif) {
    notif.id = Date.now();
    this.notifications.unshift(notif);
  },

  // ── 3. LIFE SCORE PAGE ────────────────────────────────────
  lifeScoreData: {
    overall: 68,
    trend: '+4.2',
    categories: [
      { name: 'Waste Segregation',      score: 72, icon: '🗂️', iconBg: 'rgba(74,103,65,0.1)',   trend: '+5%', direction: 'up' },
      { name: 'Plastic Usage Reduction', score: 54, icon: '♻️', iconBg: 'rgba(197,48,48,0.08)',   trend: '-2%', direction: 'down' },
      { name: 'Green Cover',             score: 81, icon: '🌳', iconBg: 'rgba(34,197,94,0.1)',    trend: '+8%', direction: 'up' },
      { name: 'Citizen Participation',   score: 63, icon: '🧑‍🤝‍🧑', iconBg: 'rgba(59,130,246,0.08)', trend: '+12%', direction: 'up' },
    ],
    monthlyScores: [
      { month: 'Oct', score: 55 },
      { month: 'Nov', score: 58 },
      { month: 'Dec', score: 54 },
      { month: 'Jan', score: 60 },
      { month: 'Feb', score: 64 },
      { month: 'Mar', score: 68 },
    ],
  },

  initLifeScore() {
    const page = document.getElementById('page-life-score');
    if (!page) return;

    page.innerHTML = `
      <div class="page-header">
        <h1>🌿 LiFE Score Tracker</h1>
        <p>Your city's Lifestyle for Environment (LiFE) sustainability score — tracking waste, green cover, and citizen action.</p>
      </div>

      <!-- System Status -->
      <div class="system-status-bar">
        <div class="status-dot"><div class="pulse-dot green"></div> AI Engine Online</div>
        <div class="status-dot"><div class="pulse-dot green"></div> Database Synced</div>
        <div class="status-dot"><div class="pulse-dot amber"></div> 2 Zones Needs Attention</div>
        <span style="margin-left:auto;font-size:0.72rem">Last updated: ${new Date().toLocaleTimeString('en-IN')}</span>
      </div>

      <!-- Hero Ring -->
      <div class="life-score-hero">
        <div class="life-ring-wrap" id="life-ring-wrap">
          <svg viewBox="0 0 160 160">
            <circle class="life-ring-bg"   cx="80" cy="80" r="70"/>
            <circle class="life-ring-fill" cx="80" cy="80" r="70" id="life-ring-fill"/>
          </svg>
          <div class="life-ring-center">
            <div class="life-ring-num" id="life-score-num">0</div>
            <div class="life-ring-label">LiFE Score</div>
          </div>
        </div>
        <div class="life-hero-text">
          <h2>City LiFE Score — <span style="color:#4A6741">Moderate</span></h2>
          <p>Based on real-time data across all 8 city zones. Score reflects waste management, green cover, and active citizen engagement over the past 30 days.</p>
          <div class="life-trend">↑ ${this.lifeScoreData.trend} pts this month</div>
        </div>
      </div>

      <!-- Category cards -->
      <div class="life-categories" id="life-categories"></div>

      <!-- Sparkline -->
      <div class="life-trend-chart">
        <h3>📈 6-Month Score Trend</h3>
        <div class="sparkline-bars" id="sparkline-bars"></div>
        <div class="sparkline-months" id="sparkline-months"></div>
      </div>

      <!-- Eco Tip -->
      <div style="margin-top:20px">
        ${this.buildEcoTipWidget()}
      </div>
    `;

    // Animate ring
    const max = 440; // circumference for r=70
    const offset = max - (this.lifeScoreData.overall / 100) * max;
    setTimeout(() => {
      const fill = document.getElementById('life-ring-fill');
      if (fill) fill.style.strokeDashoffset = offset;
      this.animateCount(document.getElementById('life-score-num'), 0, this.lifeScoreData.overall, 1400);
    }, 300);

    // Render categories
    const catContainer = document.getElementById('life-categories');
    if (catContainer) {
      catContainer.innerHTML = this.lifeScoreData.categories.map((cat, i) => `
        <div class="life-cat-card">
          <div class="life-cat-header">
            <div class="life-cat-label">
              <div class="life-cat-icon" style="background:${cat.iconBg}">${cat.icon}</div>
              <div class="life-cat-name">${cat.name}</div>
            </div>
            <div class="life-cat-trend ${cat.direction}">${cat.trend}</div>
          </div>
          <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:8px">
            <div class="life-cat-score" id="lcat-score-${i}">0</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">/100</div>
          </div>
          <div class="life-progress-track">
            <div class="life-progress-fill" id="lcat-bar-${i}"></div>
          </div>
        </div>
      `).join('');

      // Animate bars
      setTimeout(() => {
        this.lifeScoreData.categories.forEach((cat, i) => {
          const bar = document.getElementById(`lcat-bar-${i}`);
          const num = document.getElementById(`lcat-score-${i}`);
          if (bar) bar.style.width = cat.score + '%';
          if (num) this.animateCount(num, 0, cat.score, 1200);
        });
      }, 500);
    }

    // Render sparkline
    const barsEl   = document.getElementById('sparkline-bars');
    const monthsEl = document.getElementById('sparkline-months');
    if (barsEl && monthsEl) {
      const max = Math.max(...this.lifeScoreData.monthlyScores.map(m => m.score));
      barsEl.innerHTML = this.lifeScoreData.monthlyScores.map(m => {
        const h = Math.round((m.score / max) * 100);
        return `<div class="sparkline-bar" style="height:${h}%;opacity:0.6" data-val="${m.score}"></div>`;
      }).join('');
      monthsEl.innerHTML = this.lifeScoreData.monthlyScores.map(m =>
        `<span>${m.month}</span>`).join('');

      // Animate bars in
      setTimeout(() => {
        barsEl.querySelectorAll('.sparkline-bar').forEach(b => b.style.opacity = '1');
      }, 200);
    }

    // Init eco tips
    this.initEcoTips();
  },

  // ── 4. ECO TIPS WIDGET ────────────────────────────────────
  ecoTips: [
    '🧴 Rinse plastic bottles before recycling — food residue contaminates entire batches at processing centers.',
    '🌿 Composting kitchen waste reduces methane emissions and creates natural fertilizer for gardens.',
    '🛍️ Carry a reusable bag. Each year, India uses 16 billion plastic bags — most end up in drains.',
    '💧 Fix leaking taps — a dripping tap wastes up to 20 litres of water per day.',
    '♻️ Segregate waste at source: Blue bin for dry waste, Green bin for wet waste.',
    '🚰 Use a reusable water bottle. Plastic bottles take 450 years to decompose.',
    '🌳 Plant a tree this season — a single tree absorbs 22 kg of CO₂ per year.',
    '🔋 Dispose of batteries at designated e-waste collection points — never in regular bins.',
  ],
  currentTip: 0,

  buildEcoTipWidget() {
    return `
      <div class="eco-tip-widget">
        <div class="eco-tip-label">💡 Daily Eco Tip</div>
        <div class="eco-tip-text" id="eco-tip-text">${this.ecoTips[0]}</div>
        <div class="eco-tip-footer">
          <div class="eco-tip-dots" id="eco-tip-dots">
            ${this.ecoTips.map((_, i) =>
              `<div class="eco-tip-dot${i===0?' active':''}" id="eco-dot-${i}"></div>`
            ).join('')}
          </div>
          <div class="eco-tip-nav">
            <button class="eco-tip-btn" onclick="Enhancements.prevTip()">‹</button>
            <button class="eco-tip-btn" onclick="Enhancements.nextTip()">›</button>
          </div>
        </div>
      </div>
    `;
  },

  initEcoTips() {
    // Auto-rotate every 7 seconds
    setInterval(() => this.nextTip(), 7000);
  },

  nextTip() {
    this.currentTip = (this.currentTip + 1) % this.ecoTips.length;
    this.updateTipUI();
  },

  prevTip() {
    this.currentTip = (this.currentTip - 1 + this.ecoTips.length) % this.ecoTips.length;
    this.updateTipUI();
  },

  updateTipUI() {
    const textEl = document.getElementById('eco-tip-text');
    if (!textEl) return;
    textEl.style.opacity = '0';
    textEl.style.transform = 'translateY(6px)';
    setTimeout(() => {
      textEl.textContent = this.ecoTips[this.currentTip];
      textEl.style.opacity = '1';
      textEl.style.transform = 'translateY(0)';
      textEl.style.transition = 'opacity 0.4s, transform 0.4s';
    }, 200);

    document.querySelectorAll('.eco-tip-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentTip);
    });
  },

  // ── 5. QUICK REPORT MODAL (FAB) ───────────────────────────
  selectedReportType: null,
  qrStream: null,
  qrBlob: null,

  initQuickReport() {
    const fab   = document.getElementById('fab-report');
    const modal = document.getElementById('qr-modal');
    const closeBtn = document.getElementById('qr-close');
    const form  = document.getElementById('qr-submit-btn');

    if (!fab || !modal) return;

    fab.addEventListener('click', () => {
      modal.classList.add('open');
      this.startQRCamera();
    });

    const closeModal = () => {
      modal.classList.remove('open');
      this.stopQRCamera();
    };

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Type selector
    document.querySelectorAll('.qr-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.qr-type-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedReportType = btn.dataset.type;
      });
    });

    // Camera capture
    const captureBtn = document.getElementById('qr-capture-btn');
    const retakeBtn  = document.getElementById('qr-retake-btn');
    const video      = document.getElementById('qr-video');
    const canvas     = document.getElementById('qr-canvas');
    const container  = document.getElementById('qr-camera-container');
    const previewBox = document.getElementById('qr-preview-container');
    const previewImg = document.getElementById('qr-preview-img');

    captureBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this.qrStream || !video) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(blob => {
        this.qrBlob = blob;
        previewImg.src = URL.createObjectURL(blob);
        container.style.display = 'none';
        previewBox.style.display = 'block';
        this.stopQRCamera();
      }, 'image/jpeg', 0.8);
    });

    retakeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.qrBlob = null;
      previewBox.style.display = 'none';
      container.style.display = 'flex';
      this.startQRCamera();
    });

    // Submit handler
    form?.addEventListener('click', (e) => {
      e.preventDefault();
      this.submitQuickReport();
    });
  },

  async startQRCamera() {
    try {
      const video = document.getElementById('qr-video');
      if (!video) return;
      this.qrStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } }
      });
      video.srcObject = this.qrStream;
    } catch (err) {
      console.warn('QR Camera Setup Error:', err);
    }
  },

  stopQRCamera() {
    if (this.qrStream) {
      this.qrStream.getTracks().forEach(t => t.stop());
      this.qrStream = null;
    }
  },

  async submitQuickReport() {
    const loc  = document.getElementById('qr-location')?.value?.trim();

    if (!this.qrBlob) {
      this.showToast('Please capture an image using the live camera constraint.', 'error');
      return;
    }

    const btn = document.getElementById('qr-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Analyzing & Submitting (AI)...'; }

    try {
      const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const formData = new FormData();
      formData.append('image', this.qrBlob, 'quick_capture.jpg');
      if (loc) formData.append('locationName', loc);
      
      const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
      if (user?.email) formData.append('reporterEmail', user.email);

      // Rapidly fetch exact GPS for map plotting
      if (navigator.geolocation) {
        try {
          const coords = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              err => reject(err), { timeout: 2500 }
            );
          });
          formData.append('lat', coords.lat);
          formData.append('lng', coords.lng);
        } catch (e) { console.warn('QR GPS skipped:', e); }
      }

      const res = await fetch(`${window.API_BASE || 'http://localhost:3001/api'}/ai/analyze`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Show success on the modal before closing
      const modalBody = document.querySelector('#qr-modal .qr-modal-card');
      if (modalBody) {
        // Save original in case they reopen it without refresh
        if (!this.originalQrModalHtml) {
            this.originalQrModalHtml = modalBody.innerHTML;
        }

        modalBody.innerHTML = `
          <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 3.5rem; margin-bottom: 20px; font-family: emoji;">✅</div>
            <h2 style="color: #4A6741; margin-bottom: 10px;">Report Sent!</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5;">
              Your quick report <b>#${data.reportId}</b> has been lodged.<br>
              The NGO & Municipal Party have been notified via email.
            </p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px; font-weight: bold;">Closing Automatically...</p>
          </div>
        `;
        
        setTimeout(() => {
          document.getElementById('qr-modal').classList.remove('open');
          // Restore original HTML so the modal works if opened again
          setTimeout(() => {
              if (this.originalQrModalHtml) {
                  modalBody.innerHTML = this.originalQrModalHtml;
                  this.selectedReportType = null;
                  this.initQuickReport(); // Rebind events!
              }
          }, 300);
        }, 3000);
      } else {
        document.getElementById('qr-modal').classList.remove('open');
        this.showToast('✅ Report submitted! NGO Alerted.', 'success');
      }

    } catch (err) {
      this.showToast(err.message || 'Submission failed.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Report'; }
      this.selectedReportType = null;
    }
  },

  // ── 6. WASTE BREAKDOWN DONUT ──────────────────────────────
  renderWasteDonut() {
    const container = document.getElementById('waste-donut-container');
    if (!container) return;

    const data = [
      { label: 'Plastic',  pct: 38, color: '#C53030' },
      { label: 'Wet Waste', pct: 29, color: '#4A6741' },
      { label: 'Dry Waste', pct: 21, color: '#C8840C' },
      { label: 'Mixed',     pct: 12, color: '#6B8E3B' },
    ];

    const r = 45, cx = 60, cy = 60;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    const segments = data.map(d => {
      const dash = (d.pct / 100) * circumference;
      const seg = { ...d, dashArray: `${dash} ${circumference - dash}`, dashOffset: -offset };
      offset += dash;
      return seg;
    });

    container.innerHTML = `
      <div class="waste-donut-wrap">
        <div class="waste-donut">
          <svg viewBox="0 0 120 120">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(74,103,65,0.06)" stroke-width="16"/>
            ${segments.map(s => `
              <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
                stroke="${s.color}" stroke-width="16"
                stroke-dasharray="${s.dashArray}"
                stroke-dashoffset="${s.dashOffset}"
                transform="rotate(-90 ${cx} ${cy})"
                style="transition: stroke-dasharray 1.2s ease"/>
            `).join('')}
          </svg>
          <div class="waste-donut-center">
            <div class="donut-pct">${data[0].pct}%</div>
            <div class="donut-lbl">Plastic</div>
          </div>
        </div>
        <div class="waste-legend">
          ${data.map(d => `
            <div class="waste-legend-item">
              <div class="waste-legend-dot" style="background:${d.color}"></div>
              ${d.label}
              <span class="waste-legend-val">${d.pct}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ── 7. HEADER SEARCH ───────────────────────────────────────
  initSearch() {
    const input = document.getElementById('header-search-input');
    if (!input) return;

    const pages = [
      { keyword: 'ai|detect|scan|image|photo',        page: 'ai-detection' },
      { keyword: 'map|zone|location',                  page: 'map' },
      { keyword: 'citizen|leaderboard|complaint',      page: 'citizen' },
      { keyword: 'suggest|recommend|insight',          page: 'suggestions' },
      { keyword: 'admin|command|report|crew',          page: 'admin' },
      { keyword: 'life|score|sustainability|eco',      page: 'life-score' },
      { keyword: 'document|guideline|report|circular', page: 'documents' },
      { keyword: 'dashboard|overview|stats',           page: 'dashboard' },
    ];

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = input.value.trim().toLowerCase();
        const match = pages.find(p => new RegExp(p.keyword).test(q));
        if (match && typeof App !== 'undefined') {
          App.navigateTo(match.page);
          input.value = '';
          input.blur();
        } else if (q) {
          this.showToast(`No page found for "${q}". Try: ai, map, citizen, admin, life.`, 'info');
        }
      }
      if (e.key === 'Escape') { input.value = ''; input.blur(); }
    });
  },

  // ── 8. ENV WIDGET DATA ─────────────────────────────────────
  updateEnvWidget() {
    const aqi    = document.getElementById('env-aqi');
    const temp   = document.getElementById('env-temp');
    const humid  = document.getElementById('env-humid');

    // Mock real-time env data
    if (aqi)   aqi.textContent   = '142';
    if (temp)  temp.textContent  = '32°C';
    if (humid) humid.textContent = '68%';
  },

  // ── 9. REAL-TIME CLOCK ─────────────────────────────────────
  initClock() {
    const el = document.getElementById('live-clock');
    if (!el) return;
    const tick = () => {
      el.textContent = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    };
    tick();
    setInterval(tick, 1000);
  },

  // ── 10. TOAST ──────────────────────────────────────────────
  showToast(msg, type = 'info') {
    const existing = document.getElementById('enh-toast');
    if (existing) existing.remove();

    const colors = {
      success: { bg: '#4A6741', border: '#6B8E3B' },
      error:   { bg: '#C53030', border: '#E05050' },
      info:    { bg: '#1d4ed8', border: '#3b82f6' },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.id = 'enh-toast';
    toast.style.cssText = `
      position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
      background:${c.bg};color:white;padding:14px 22px;
      border-radius:14px;font-family:'Inter',sans-serif;
      font-size:0.875rem;font-weight:500;z-index:9999;
      box-shadow:0 8px 32px rgba(0,0,0,0.25);
      border:1px solid ${c.border};
      animation:slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1);
      max-width:420px;text-align:center;line-height:1.5;
    `;
    toast.innerHTML = msg;

    const s = document.createElement('style');
    s.textContent = `@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}`;
    document.head.appendChild(s);

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
  },

  // ── 11. ANIMATED COUNTER ───────────────────────────────────
  animateCount(el, start, end, duration) {
    if (!el) return;
    const startTime = performance.now();
    const update = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

  // ── BOOT ───────────────────────────────────────────────────
  init() {
    this.initDarkMode();
    this.initNotifications();
    this.initSearch();
    this.initClock();
    this.updateEnvWidget();
    this.initQuickReport();
    console.log('[Enhancements] All modules initialized ✅');
  },
};

window.Enhancements = Enhancements;
