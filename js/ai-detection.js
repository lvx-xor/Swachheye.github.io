const AIDetection = {
  previewEl: null,
  analysisLoading: null,
  resultsCard: null,
  currentFile: null,
  currentAnalysisId: null,
  currentReportId: null,
  cameraStream: null,
  facingMode: 'environment', // start with rear camera

  init() {
    this.previewEl      = document.getElementById('upload-preview');
    this.analysisLoading= document.getElementById('analysis-loading');
    this.resultsCard    = document.getElementById('results-card');

    const analyzeBtn = document.getElementById('btn-analyze');
    if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.startAnalysis());

    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

    this.loadRecentAnalyses();
  },

  // ── Camera Controls ─────────────────────────────────────
  async startCamera() {
    try {
      if (this.cameraStream) this.stopCamera();

      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      const video = document.getElementById('camera-feed');
      video.srcObject = this.cameraStream;
      video.style.display = 'block';

      document.getElementById('camera-idle').style.display = 'none';
      const controls = document.getElementById('camera-controls');
      controls.style.display = 'flex';
      document.getElementById('camera-scan-line').style.display = 'block';

    } catch (err) {
      const idle = document.getElementById('camera-idle');
      idle.innerHTML = `
        <div style="font-size:3rem; margin-bottom:12px;">🚫</div>
        <div style="font-size:1rem; font-weight:600; margin-bottom:8px;">Camera Access Denied</div>
        <div style="font-size:0.82rem; opacity:0.7; margin-bottom:20px;">Please allow camera access in your browser settings.</div>
        <button class="btn btn-secondary" onclick="AIDetection.startCamera()" style="padding:10px 22px;">🔄 Try Again</button>
      `;
    }
  },

  switchCamera() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    this.startCamera();
  },

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }
    const video = document.getElementById('camera-feed');
    if (video) { video.srcObject = null; video.style.display = 'none'; }
    document.getElementById('camera-idle').style.display = 'block';
    document.getElementById('camera-controls').style.display = 'none';
    document.getElementById('camera-scan-line').style.display = 'none';
  },

  capturePhoto() {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    if (!video || !this.cameraStream) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    // Flash feedback
    const captureBtn = document.getElementById('btn-capture');
    if (captureBtn) { captureBtn.style.transform = 'scale(0.85)'; setTimeout(() => captureBtn.style.transform = '', 150); }

    // Convert canvas to blob (JPEG file)
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      this.currentFile = file;

      // Show preview & hide camera
      const img = this.previewEl.querySelector('img');
      img.src = canvas.toDataURL('image/jpeg', 0.92);
      this.previewEl.querySelector('.file-name').textContent = file.name;
      this.previewEl.querySelector('.file-size').textContent = this.formatFileSize(file.size);
      this.previewEl.classList.add('visible');

      // Hide camera zone, show action buttons
      document.getElementById('camera-zone').style.display = 'none';
      document.getElementById('btn-analyze').style.display = 'inline-flex';
      document.getElementById('btn-reset').style.display = 'inline-flex';

      this.stopCamera();
    }, 'image/jpeg', 0.92);
  },



  async startAnalysis() {
    if (!this.currentFile) return;

    document.getElementById('btn-analyze').style.display = 'none';
    this.resultsCard.classList.remove('visible');
    this.analysisLoading.classList.add('visible');

    const statusEl = this.analysisLoading.querySelector('.status-phase');
    const progressFill = this.analysisLoading.querySelector('.progress-fill');

    const phases = [
      'Uploading image to server...',
      'Pre-processing image...',
      'Running Gemini Flash AI analysis...',
      'Classifying waste type...',
      'Generating recommendations...',
    ];

    // Animate phases (first 4 locally, last one waits for API)
    let i = 0;
    const phaseInterval = setInterval(() => {
      if (i < phases.length - 1) {
        statusEl.textContent = phases[i];
        progressFill.style.width = ((i + 1) / phases.length * 70) + '%';
        i++;
      }
    }, 600);

    try {
      // Attempt to retrieve actual browser coordinates securely
      let lat = null, lng = null;
      let locationName = null;
      try {
        statusEl.textContent = 'Acquiring GPS coordinates...';
        const coords = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject('Geolocation API not supported');
          navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            err => reject(err),
            { timeout: 4000, enableHighAccuracy: true }
          );
        });
        lat = coords.lat;
        lng = coords.lng;
      } catch (err) {
        console.warn('[AI Geolocation] GPS failed or blocked. Attempting IP fallback...');
        try {
          statusEl.textContent = 'Detecting network location...';
          const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            lat = parseFloat(ipData.latitude);
            lng = parseFloat(ipData.longitude);
            // If GeoJS gives us a city name, we can skip OpenStreetMap Reverse lookup
            if (ipData.city) {
              locationName = `${ipData.city}${ipData.region ? ', ' + ipData.region : ''}`;
            }
          }
        } catch (ipErr) {
          console.warn('[IP Location fallback failed]', ipErr);
        }
      }

      // Attempt to Reverse Geocode using free OpenStreetMap Nominatim if no name yet
      if (lat && lng && !locationName) {
        try {
          statusEl.textContent = 'Identifying area...';
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.address) {
              const a = geoData.address;
              locationName = a.suburb || a.neighbourhood || a.road || a.city || a.county || 'Local Area';
            }
          }
        } catch (e) {
          console.warn('[Reverse Geocode Failed]', e);
        }
      }

      // Build FormData
      const formData = new FormData();
      formData.append('image', this.currentFile);
      formData.append('locationName', locationName || this.detectLocation());
      if (lat && lng) {
        formData.append('lat', lat);
        formData.append('lng', lng);
      } else {
        // Fallback simulated marker
        formData.append('lat', 28.6139 + (Math.random() * 0.05 - 0.025));
        formData.append('lng', 77.2090 + (Math.random() * 0.05 - 0.025));
      }

      // Attach email for clearance notifications
      const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
      if (user?.email) formData.append('reporterEmail', user.email);

      // Call backend
      statusEl.textContent = 'Running Gemini Flash AI analysis...';
      progressFill.style.width = '80%';

      const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${window.API_BASE || 'http://localhost:3001/api'}/ai/analyze`, {
        method: 'POST',
        headers,
        body: formData,
      });

      clearInterval(phaseInterval);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const result = await response.json();
      progressFill.style.width = '100%';
      statusEl.textContent = 'Analysis complete!';
      this.currentAnalysisId = result.analysisId;

      await this.sleep(400);
      this.analysisLoading.classList.remove('visible');
      this.showResults(result);

    } catch (err) {
      clearInterval(phaseInterval);
      this.analysisLoading.classList.remove('visible');
      console.error('[AI Detection]', err);

      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        this.showErrorState('Cannot reach the backend server. Please start the server with: <code>cd server && node server.js</code>');
      } else if (err.message.includes('not configured') || err.message.includes('GEMINI_API_KEY')) {
        this.showErrorState('Gemini AI not configured. Please add <code>GEMINI_API_KEY</code> to your <code>server/.env</code> file.');
      } else if (err.message.includes('Noise Reduction Active')) {
        this.showErrorState(`🚫 <b>Geo-Fence Blocked!</b><br>${err.message}`);
      } else {
        this.showErrorState(err.message || 'AI analysis failed. Please try again.');
      }
      document.getElementById('btn-reset').style.display = 'inline-flex';
    }
  },

  showResults(result) {
    // ── Score ring (use urgencyScore to compute cleanliness) ──
    const cleanlinessScore = result.isClean ? 95 : Math.max(5, 100 - result.urgencyScore);
    const scoreColor = result.isClean ? '#4A6741' : result.severityColor || '#C8840C';

    const circumference = 2 * Math.PI * 42;
    const ringFill = this.resultsCard.querySelector('.ring-fill');
    ringFill.style.strokeDasharray = circumference;
    ringFill.style.strokeDashoffset = circumference;
    ringFill.style.stroke = scoreColor;

    const scoreNum = this.resultsCard.querySelector('.score-num');
    scoreNum.style.color = scoreColor;

    // ── Grade badge ──
    const gradeBadge = this.resultsCard.querySelector('.grade-badge');
    const grade = cleanlinessScore >= 85 ? 'CLEAN' : cleanlinessScore >= 60 ? 'MODERATE' : cleanlinessScore >= 35 ? 'NEEDS ATTENTION' : 'CRITICAL';
    gradeBadge.textContent = grade;
    gradeBadge.className = 'badge grade-badge';
    if (cleanlinessScore >= 85) gradeBadge.classList.add('badge-green');
    else if (cleanlinessScore >= 60) gradeBadge.classList.add('badge-amber');
    else gradeBadge.classList.add('badge-red');

    // ── Location ──
    const locCard = this.resultsCard.querySelector('.location-card');
    if (locCard) locCard.style.display = 'flex';
    
    this.resultsCard.querySelector('.loc-name').textContent = result.location || 'Unknown Location';
    let geoText = new Date(result.timestamp).toLocaleString('en-IN');
    if (result.lat && result.lng) {
      geoText += ` | GPS: ${result.lat.toFixed(5)}° N, ${result.lng.toFixed(5)}° E`;
    }
    this.resultsCard.querySelector('.loc-coords').textContent = geoText;

    // ── Detection list — now shows real AI data ──
    const detList = this.resultsCard.querySelector('.detection-list');
    detList.innerHTML = '';

    // Primary detection
    const primarySevColor = result.isClean ? '#4A6741' : (result.severityColor || '#C8840C');
    const primarySevBg    = result.isClean ? 'badge-green' :
                            result.severity === 'LOW'      ? 'badge-blue' :
                            result.severity === 'MEDIUM'   ? 'badge-amber' :
                            result.severity === 'HIGH'     ? 'badge-red' : 'badge-red';

    detList.innerHTML = `
      <div class="detection-item animate-fade-in-up">
        <div class="det-icon" style="background:${primarySevColor}15; color:${primarySevColor}; font-size:1.5rem">${result.wasteTypeIcon}</div>
        <div class="det-info">
          <div class="det-name">${result.wasteTypeLabel}</div>
          <div class="det-conf">AI Confidence: ${result.confidence}%</div>
          <div style="font-size:0.75rem; color:#7D8B7D; margin-top:4px; line-height:1.5">${result.reasoning}</div>
        </div>
        <span class="badge ${primarySevBg} det-severity">${result.severity}</span>
      </div>
    `;

    // Sub-items
    if (result.subItems && result.subItems.length > 0) {
      result.subItems.forEach((item, idx) => {
        detList.innerHTML += `
          <div class="detection-item animate-fade-in-up" style="animation-delay:${(idx + 1) * 100}ms">
            <div class="det-icon" style="background:rgba(74,103,65,0.08); color:#4A6741">📍</div>
            <div class="det-info">
              <div class="det-name">${item.name}</div>
              <div class="det-conf">~${item.percentage}% of waste</div>
            </div>
          </div>
        `;
      });
    }

    // ── Recommendation box ──
    detList.innerHTML += `
      <div class="detection-item animate-fade-in-up" style="background:rgba(74,103,65,0.04); border:1px solid rgba(74,103,65,0.1); animation-delay:300ms">
        <div class="det-icon" style="background:rgba(74,103,65,0.08); color:#4A6741">💡</div>
        <div class="det-info">
          <div class="det-name" style="color:#4A6741">Recommended Action</div>
          <div style="font-size:0.82rem; color:#4A5D4A; margin-top:4px; line-height:1.5">${result.recommendation}</div>
        </div>
      </div>
    `;

    // ── Action buttons ──
    const actionsEl = this.resultsCard.querySelector('.results-actions') || this.resultsCard.querySelector('div[style*="margin-top"]');
    const btnContainer = this.resultsCard.querySelectorAll('div[style*="flex"]');
    const lastBtn = btnContainer[btnContainer.length - 1];

    if (lastBtn) {
      lastBtn.innerHTML = `
        <button class="btn btn-primary btn-sm" id="btn-create-report" onclick="AIDetection.createReport()">
          📋 Submit Report
        </button>
        <button class="btn btn-secondary btn-sm" onclick="AIDetection.copyResults('${result.wasteTypeLabel}', '${result.severity}', ${result.confidence})">
          📤 Copy Results
        </button>
        ${!result.isClean ? `
        <button class="btn btn-secondary btn-sm" id="btn-mark-cleared" onclick="AIDetection.markCleared()" style="display:none">
          ✅ Mark Cleared
        </button>` : ''}
      `;
    }

    // ── Show card ──
    this.resultsCard.classList.add('visible');

    // Animate score
    requestAnimationFrame(() => {
      setTimeout(() => {
        ringFill.style.strokeDashoffset = circumference - (cleanlinessScore / 100) * circumference;
        this.animateCount(scoreNum, 0, cleanlinessScore, 1200);
      }, 100);
    });

    document.getElementById('btn-reset').style.display = 'inline-flex';
  },

  async createReport() {
    if (!this.currentAnalysisId) return;

    const btn = document.getElementById('btn-create-report');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Submitting...';
    }

    try {
      const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${window.API_BASE || 'http://localhost:3001/api'}/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ analysisId: this.currentAnalysisId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create report');

      this.currentReportId = data.reportId;
      
      // Temporary Success Overlay
      const successOverlay = document.createElement('div');
      successOverlay.className = 'card animate-fade-in-up';
      successOverlay.id = 'ai-success-overlay';
      successOverlay.style.cssText = 'text-align: center; padding: 40px 20px; margin-top: 20px;';
      successOverlay.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px; font-family: emoji;">✅</div>
        <h2 style="color: #4A6741; margin-bottom: 10px;">Request Submitted!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5;">
          Your report <b>#${data.reportId}</b> has been safely lodged.<br>
          We've successfully dispatched an email alert to the local NGO & Municipal Party.
        </p>
        <div style="background: rgba(74,103,65,0.1); height: 4px; border-radius: 4px; max-width: 200px; margin: 0 auto; overflow: hidden;">
          <div style="background: #4A6741; height: 100%; width: 0%; animation: fillUpDelay 2.5s linear forwards;"></div>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px;">Redirecting...</p>
        <style>@keyframes fillUpDelay { to { width:100%; } }</style>
      `;
      
      this.resultsCard.classList.remove('visible');
      this.resultsCard.style.display = 'none';
      
      const container = document.querySelector('.upload-card');
      if (container) container.appendChild(successOverlay);

      setTimeout(() => {
        if (successOverlay) successOverlay.remove();
        this.resultsCard.style.display = ''; // Restore
        this.reset();
        if (typeof App !== 'undefined') App.navigateTo('home');
      }, 2500);

    } catch (err) {
      this.showToast(err.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📋 Submit Report';
      }
    }
  },

  async markCleared() {
    if (!this.currentReportId) {
      this.showToast('Please submit a report first.', 'error');
      return;
    }

    const btn = document.getElementById('btn-mark-cleared');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Processing...'; }

    try {
      const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;
      if (!token) {
        this.showToast('Please log in to mark as cleared.', 'error');
        return;
      }

      const res = await fetch(`${window.API_BASE || 'http://localhost:3001/api'}/reports/${this.currentReportId}/clear`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const msg = data.emailSent
        ? `✅ Marked as cleared! Clearance email sent to ${data.recipientEmail}.`
        : '✅ Marked as cleared!';

      this.showToast(msg, 'success');
      if (btn) { btn.textContent = '✅ Area Cleared'; btn.style.opacity = '0.6'; }

    } catch (err) {
      this.showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = '✅ Mark Cleared'; }
    }
  },

  copyResults(type, severity, confidence) {
    const text = `AI Waste Analysis\nType: ${type}\nSeverity: ${severity}\nConfidence: ${confidence}%\nTime: ${new Date().toLocaleString()}`;
    navigator.clipboard.writeText(text)
      .then(() => this.showToast('Results copied to clipboard!', 'success'))
      .catch(() => this.showToast('Could not copy to clipboard.', 'error'));
  },

  showErrorState(message) {
    if (!this.resultsCard) return;
    this.resultsCard.classList.add('visible');
    const detList = this.resultsCard.querySelector('.detection-list');
    if (detList) {
      detList.innerHTML = `
        <div class="detection-item" style="background:rgba(197,48,48,0.04); border:1px solid rgba(197,48,48,0.1)">
          <div class="det-icon" style="background:rgba(197,48,48,0.1); color:#C53030; font-size:1.5rem">⚠️</div>
          <div class="det-info">
            <div class="det-name" style="color:#C53030">Analysis Failed</div>
            <div style="font-size:0.82rem; color:#7D8B7D; margin-top:4px">${message}</div>
          </div>
        </div>
      `;
    }
    const scoreNum = this.resultsCard.querySelector('.score-num');
    if (scoreNum) scoreNum.textContent = '—';
    
    const locCard = this.resultsCard.querySelector('.location-card');
    if (locCard) locCard.style.display = 'none';
  },

  // ── Load recent analyses from backend ─────────────────────
  async loadRecentAnalyses() {
    const container = document.getElementById('recent-analyses');
    if (!container) return;

    try {
      const res = await fetch(`${window.API_BASE || 'http://localhost:3001/api'}/ai/analyses?limit=6`);
      if (!res.ok) throw new Error('not ok');

      const { analyses } = await res.json();
      if (!analyses || analyses.length === 0) {
        this.renderFallbackAnalyses(container);
        return;
      }

      const typeIcons = { PLASTIC:'🧴', WET_WASTE:'🍂', DRY_WASTE:'📦', MIXED:'🗑️', CLEAN:'✅' };
      const sevColors = { NONE:'#4A6741', LOW:'#6B8E3B', MEDIUM:'#C8840C', HIGH:'#C53030', CRITICAL:'#7B1515' };

      container.innerHTML = analyses.map(a => {
        const icon  = typeIcons[a.wasteType] || '🗑️';
        const color = sevColors[a.severity] || '#C8840C';
        const label = a.wasteType?.replace('_', ' ') || 'Unknown';
        const time  = this.timeAgo(new Date(a.createdAt));
        const statusBadge = a.status === 'cleared'
          ? '<span style="font-size:0.7rem; color:#4A6741; font-weight:600">✅ CLEARED</span>'
          : `<span style="font-size:0.7rem; color:${color}; font-weight:600">${(a.severity || 'PENDING')}</span>`;

        return `
          <div class="recent-item">
            <div class="recent-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.6rem;background:${color}10">
              ${icon}
            </div>
            <div class="recent-info">
              <h4>${a.locationName || 'Unknown Location'}</h4>
              <p style="font-size:0.8rem;color:#7D8B7D">${label} · ${time}</p>
              ${statusBadge}
            </div>
          </div>`;
      }).join('');

    } catch {
      this.renderFallbackAnalyses(container);
    }
  },

  renderFallbackAnalyses(container) {
    const fallback = [
      { location: 'Chandni Chowk Gate 3', icon: '🧴', label: 'Plastic Waste', color: '#C53030', time: '15 min ago' },
      { location: 'CP Inner Circle',       icon: '✅', label: 'Clean Area',    color: '#4A6741', time: '1 hr ago'  },
      { location: 'Saket Metro Exit',      icon: '🍂', label: 'Wet Waste',    color: '#C8840C', time: '2 hrs ago' },
      { location: 'Karol Bagh Market',     icon: '📦', label: 'Dry Waste',    color: '#6B8E3B', time: '3 hrs ago' },
    ];
    container.innerHTML = fallback.map(r => `
      <div class="recent-item">
        <div class="recent-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.6rem;background:${r.color}10">
          ${r.icon}
        </div>
        <div class="recent-info">
          <h4>${r.location}</h4>
          <p style="font-size:0.8rem;color:#7D8B7D">${r.label} · ${r.time}</p>
        </div>
      </div>`).join('');
  },

  reset() {
    this.currentFile = null;
    this.currentAnalysisId = null;
    this.currentReportId = null;
    // Restore camera zone
    const cameraZone = document.getElementById('camera-zone');
    if (cameraZone) cameraZone.style.display = 'flex';
    // Reset camera to idle state
    document.getElementById('camera-idle').style.display = 'block';
    document.getElementById('camera-controls').style.display = 'none';
    document.getElementById('camera-scan-line').style.display = 'none';
    const video = document.getElementById('camera-feed');
    if (video) video.style.display = 'none';
    this.stopCamera();
    this.previewEl.classList.remove('visible');
    this.resultsCard.classList.remove('visible');
    this.analysisLoading.classList.remove('visible');
    document.getElementById('btn-analyze').style.display = 'none';
    document.getElementById('btn-reset').style.display = 'none';
  },

  detectLocation() {
    const locations = [
      'Chandni Chowk', 'Connaught Place', 'Saket', 'Karol Bagh',
      'Lajpat Nagar', 'Defence Colony', 'Vasant Kunj', 'Rohini',
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  },

  showToast(message, type = 'info') {
    const existing = document.getElementById('ai-toast');
    if (existing) existing.remove();

    const colors = {
      success: { bg: 'rgba(74,103,65,0.95)', border: '#4A6741' },
      error:   { bg: 'rgba(197,48,48,0.95)',  border: '#C53030' },
      info:    { bg: 'rgba(30,64,175,0.95)',   border: '#1d4ed8' },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.id = 'ai-toast';
    toast.style.cssText = `
      position: fixed; bottom: 28px; right: 28px; z-index: 9999;
      background: ${c.bg}; color: white;
      padding: 14px 20px; border-radius: 14px;
      font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 500;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      border: 1px solid ${c.border};
      max-width: 380px; line-height: 1.5;
      animation: slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1);
    `;
    toast.innerHTML = message;
    document.body.appendChild(toast);

    const style = document.createElement('style');
    style.textContent = `@keyframes slideInRight { from { opacity:0; transform:translateX(20px); } }`;
    document.head.appendChild(style);

    setTimeout(() => toast.remove(), 5000);
  },

  // ── Utilities ──────────────────────────────────────────────

  formatFileSize(bytes) {
    if (bytes < 1024)    return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  },

  timeAgo(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60)   return diff + 's ago';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400)return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
  },

  animateCount(el, start, end, duration) {
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};
