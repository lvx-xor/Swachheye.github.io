/* ============================================
   App Controller — Router, Navigation, Shell
   ============================================ */

const App = {
  currentPage: 'home',
  navItems: [],
  topNavItems: [],
  closeMenu: null,
  map: null,
  mapInitialized: false,

  init() {
    this.navItems = document.querySelectorAll('.sidebar .nav-item[data-page]');
    this.topNavItems = document.querySelectorAll('.top-nav-item[data-page]');
    this.bindNavigation();
    this.bindMobileMenu();
    this.bindTopNavigation();
    this.bindHomeCards();
    this.bindDocumentFilters();
    this.renderStats();
    this.navigateTo('home');
    this.renderActivityFeed();
    this.renderDashboard();
    this.renderLeaderboard();
    this.renderSuggestions();
    this.renderAdminTable();
    this.renderNGOPortal();
    this.renderMyReports();

    // Real-time Dashboard Polling
    setInterval(() => {
      if (!Auth.getToken()) return;
      this.renderStats();
      if (this.currentPage === 'home') this.renderActivityFeed();
      if (this.currentPage === 'dashboard') this.renderDashboard();
      if (this.currentPage === 'admin') this.renderAdminTable();
      if (this.currentPage === 'citizen') {
        this.renderLeaderboard();
        this.renderMyReports();
      }
      if (this.currentPage === 'ngo') this.renderNGOPortal();
      if (this.currentPage === 'map' && this.mapInitialized) this.renderMapActivityFeed();
    }, 10000); // Poll every 10 seconds for real-time updates

    // Role Based UI Enforcement
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    
    if (user) {
      const accessPortal = document.getElementById('home-access-portal');
      if (accessPortal) accessPortal.style.display = 'none';
      
      if (user.role === 'citizen') {
        document.querySelectorAll('[data-page="admin"], [data-page="dashboard"], [data-goto="dashboard"]')
          .forEach(el => el.style.display = 'none');
        if (this.currentPage === 'admin' || this.currentPage === 'dashboard') {
          this.navigateTo('home');
        }
      }
    }

    // Initialize AI Detection module
    if (typeof AIDetection !== 'undefined') AIDetection.init();
  },

  // ── Sidebar Navigation ──
  bindNavigation() {
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (page) this.navigateTo(page);
      });
    });
  },

  // ── Top Navigation Bar ──
  bindTopNavigation() {
    this.topNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (page) this.navigateTo(page);
      });
    });
  },

  // ── Home Feature Cards ──
  bindHomeCards() {
    document.querySelectorAll('.home-feature-card[data-goto]').forEach(card => {
      card.addEventListener('click', () => {
        const page = card.getAttribute('data-goto');
        if (page) this.navigateTo(page);
      });
    });
  },

  // ── Document Category Filters ──
  bindDocumentFilters() {
    document.querySelectorAll('.doc-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.doc-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-cat');
        document.querySelectorAll('.doc-card').forEach(card => {
          if (cat === 'all' || card.getAttribute('data-cat') === cat) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  },

  // ── Sidebar Menu Toggle ──
  bindMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    const openMenu = () => {
      sidebar.classList.add('open');
      toggle.classList.add('active');
      if (overlay) overlay.classList.add('visible');
    };

    const closeMenu = () => {
      sidebar.classList.remove('open');
      toggle.classList.remove('active');
      if (overlay) overlay.classList.remove('visible');
    };

    const toggleMenu = () => {
      if (sidebar.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    };

    if (toggle) {
      toggle.addEventListener('click', toggleMenu);
    }

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeMenu();
      }
    });

    this.closeMenu = closeMenu;
  },

  // ── Navigate To Page ──
  navigateTo(pageId) {
    this.currentPage = pageId;

    // Update sidebar nav active state
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === pageId);
    });

    // Update top nav active state
    this.topNavItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === pageId);
    });

    // Show target page, hide others
    document.querySelectorAll('.page-view').forEach(page => {
      page.classList.toggle('active', page.id === `page-${pageId}`);
    });

    // Update header title + breadcrumb
    const titles = {
      'home':          '🏠 Home',
      'dashboard':     '📊 Operations Dashboard',
      'documents':     '📄 Documents & Reports',
      'ai-detection':  '📸 AI Image Detection',
      'map':           '🗺️ Smart City Map',
      'life-score':    '📊 LiFE Score Tracker',
      'citizen':       '🧑‍🤝‍🧑 Citizen Portal',
      'suggestions':   '🤖 AI Suggestions',
      'admin':         '🏛️ Command Center',
    };

    const breadcrumbNames = {
      'home':          'Home',
      'dashboard':     'Dashboard',
      'documents':     'Documents',
      'ai-detection':  'AI Detection',
      'map':           'City Map',
      'life-score':    'LiFE Score',
      'citizen':       'Citizen Portal',
      'suggestions':   'AI Suggestions',
      'admin':         'Command Center',
    };

    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = titles[pageId] || 'Dashboard';

    const breadcrumbPage = document.getElementById('breadcrumb-page');
    if (breadcrumbPage) breadcrumbPage.textContent = breadcrumbNames[pageId] || pageId;

    // Close sidebar menu after navigation
    if (this.closeMenu) this.closeMenu();

    // Initialize Leaflet map when navigating to map page
    if (pageId === 'map' && !this.mapInitialized) {
      setTimeout(() => this.initLeafletMap(), 300);
    }

    // Lazy-init modules
    if (pageId === 'life-score' && typeof LifeScore !== 'undefined') LifeScore.init();
  },

  // ── Leaflet Map (OpenStreetMap — Free, no API key) ──
  initLeafletMap() {
    const mapContainer = document.getElementById('google-map');
    if (!mapContainer || this.mapInitialized) return;

    // Center on New Delhi
    const center = [28.6139, 77.2090];

    this.map = L.map(mapContainer, {
      center: center,
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    // Use CartoDB Voyager tiles — clean, modern look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.map);

    // Custom marker icon factory
    const createScoreIcon = (score, color) => {
      return L.divIcon({
        className: 'zone-marker-icon',
        html: `
          <div style="
            width: 38px; height: 38px;
            border-radius: 50%;
            background: ${color};
            border: 3px solid #fff;
            box-shadow: 0 3px 12px rgba(0,0,0,0.25), 0 0 0 2px ${color}40;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 700;
            color: #fff;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">${score}</div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -22],
      });
    };

    // Create Marker Cluster Group
    const markersGroup = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        return new L.DivIcon({
          html: `<div style="background:#4A6741; color:white; border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 3px 12px rgba(0,0,0,0.25); font-weight:700; font-size:14px; font-family:'Inter',sans-serif;">${count}</div>`,
          className: 'marker-cluster-custom',
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });
      }
    });

    // Add live markers from AI Uploads
    setTimeout(async () => {
      try {
        const res = await Auth.apiFetch('/api/ai/analyses');
        const analyses = res.analyses || [];

        analyses.forEach(a => {
          if (!a.lat || !a.lng) return;
          
          let color = '#C8840C'; // default moderate
          let severityLabel = a.severity || 'Unknown';
          let statusEmoji = '🟡';

          if (severityLabel === 'CRITICAL' || severityLabel === 'HIGH') {
            color = '#C53030'; statusEmoji = '🔴';
          } else if (severityLabel === 'NONE' || a.status === 'accepted') {
            color = '#4A6741'; statusEmoji = '🟢';
          }

          const cleanScore = Math.max(0, 100 - (a.urgencyScore || 50));

          const marker = L.marker([a.lat, a.lng], {
            icon: createScoreIcon(cleanScore, color),
            title: a.locationName || 'Detection Area',
          });

          const imgUrl = a.imageUrl?.startsWith('http') ? a.imageUrl : `http://localhost:3001${a.imageUrl}`;

          marker.bindPopup(`
            <div style="font-family: 'Inter', sans-serif; min-width: 200px; padding: 4px;">
              <div style="font-size: 14px; font-weight: 600; color: #1A2E1A; margin-bottom: 6px;">
                ${a.locationName || 'Detection Area'}
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="padding: 4px 10px; border-radius: 20px; background: ${color}15; color: ${color}; font-size: 12px; font-weight: 700;">
                  Score: ${cleanScore}/100
                </div>
                <span style="font-size: 12px;">${statusEmoji} ${a.status || 'pending'}</span>
              </div>
              <div style="font-size: 12px; color: #7D8B7D; line-height: 1.5;">
                📋 AI Det: ${a.wasteType}<br>
                🕐 ${new Date(a.createdAt).toLocaleDateString()}<br>
                📍 ${a.lat.toFixed(4)}°N, ${a.lng.toFixed(4)}°E
              </div>
              ${a.imageUrl ? `<a href="${imgUrl}" target="_blank" style="display:block;margin-top:8px;color:#4A6741;text-decoration:underline;font-size:12px;">📷 View Original Capture</a>` : ''}
            </div>
          `, { className: 'zone-popup', maxWidth: 300 });

          // Add marker to cluster layer instead of map
          markersGroup.addLayer(marker);

          // Keep Area radius on map
          L.circle([a.lat, a.lng], {
            radius: 400, fillColor: color, fillOpacity: 0.05,
            color: color, weight: 1.5, opacity: 0.3, dashArray: '6, 4',
          }).addTo(this.map);
        });

        // Add the entire cluster group to the map
        this.map.addLayer(markersGroup);

      } catch (e) {
        console.error("Failed to load map pins:", e);
      }
    }, 500);

    // Add a legend
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div style="
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.5);
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #4A5D4A;
        ">
          <div style="font-weight: 600; margin-bottom: 8px; color: #1A2E1A;">Cleanliness Score</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="width:12px;height:12px;border-radius:50%;background:#4A6741;display:inline-block;"></span> 75–100 Clean
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="width:12px;height:12px;border-radius:50%;background:#C8840C;display:inline-block;"></span> 50–74 Moderate
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:12px;height:12px;border-radius:50%;background:#C53030;display:inline-block;"></span> 0–49 Needs Attention
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(this.map);

    this.mapInitialized = true;

    // Render activity feed for map sidebar
    this.renderMapActivityFeed();
  },

  // ── Render Activity Feed (Home) ──
  async renderActivityFeed() {
    const container = document.getElementById('home-activity-feed');
    if (!container) return;
    try {
      const res = await Auth.apiFetch('/api/reports');
      const reports = (res.reports || []).slice(0, 5);
      container.innerHTML = reports.map(r => `
        <div class="feed-item">
          <div class="feed-dot" style="background:${r.status === 'resolved' ? '#4A6741' : '#C8840C'}"></div>
          <div class="feed-content">
            <div class="feed-text">${r.status === 'resolved' ? 'Report Cleared' : 'New Report Logged'}: ${r.zone || 'City Area'}</div>
            <div class="feed-time">${new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = '<div style="padding:10px;font-size:12px;color:gray;">Activity feed unavailable</div>';
    }
  },

  // ── Render Map Activity Feed ──
  async renderMapActivityFeed() {
    const container = document.getElementById('map-activity-feed');
    if (!container) return;
    try {
      const res = await Auth.apiFetch('/api/reports');
      const reports = (res.reports || []).slice(0, 5);
      container.innerHTML = reports.map(r => `
        <div class="feed-item">
          <div class="feed-dot" style="background:${r.status === 'resolved' ? '#4A6741' : '#C8840C'}"></div>
          <div class="feed-content">
            <div class="feed-text">${r.status === 'resolved' ? 'Report Cleared' : 'New Report Logged'}: ${r.zone || r.analysis?.locationName || 'Location'}</div>
            <div class="feed-time">${new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
      `).join('');
    } catch (e) {}
  },

  // ── Render Dashboard ──
  async renderDashboard() {
    try {
      const res = await Auth.apiFetch('/api/reports');
      const reports = res.reports || [];

      // Reports
      const reportsContainer = document.getElementById('dashboard-reports');
      if (reportsContainer) {
        reportsContainer.innerHTML = reports.slice(0, 5).map(r => {
          const uiStatus = r.status === 'resolved' ? 'Resolved' : r.status === 'in_progress' ? 'In Progress' : 'Pending';
          const statusColor = r.status === 'resolved' ? 'green' : r.status === 'in_progress' ? 'blue' : 'amber';
          return `
            <div class="report-item">
              <div class="report-info">
                <div class="report-id">${r._id.slice(-6).toUpperCase()}</div>
                <div class="report-location">${r.zone || r.analysis?.locationName || 'City Zone'}</div>
                <div class="report-type">${r.analysis?.wasteType || 'Unknown'} · ${new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <span class="badge badge-${statusColor}">${uiStatus}</span>
            </div>
          `;
        }).join('');
      }

      // Zone Performance (Fallback logic based on reports since we don't have a rigid zone DB yet)
      const zonesContainer = document.getElementById('dashboard-zones');
      if (zonesContainer) {
        zonesContainer.innerHTML = `
          <div class="zone-item">
            <div class="zone-score" style="background:#4A6741">92</div>
            <div class="zone-info">
              <div class="zone-name">North District</div>
              <div class="zone-meta">${reports.length} total reports · Live Tracking</div>
            </div>
            <span class="badge badge-green">Clean</span>
          </div>
        `;
      }
    } catch (e) {
      console.error(e);
    }

    // AI Insights (Static since no endpoint for this yet)
    const insightsContainer = document.getElementById('dashboard-insights');
    if (insightsContainer) {
      insightsContainer.innerHTML = [
        { icon: '🗑️', text: 'Increase bin capacity in Downtown Area due to 45% waste overflow.', priority: 'High' },
        { icon: '♻️', text: 'Schedule extra plastic collection shift in Sector 4.', priority: 'Medium' }
      ].map(s => {
        const prioColor = s.priority === 'High' ? 'rgba(197,48,48,0.1); color: var(--color-red)' :
                          'rgba(200,132,12,0.1); color: var(--color-amber)';
        return `
          <div class="insight-item">
            <div class="insight-icon">${s.icon}</div>
            <div class="insight-text">${s.text}</div>
            <span class="insight-priority" style="background:${prioColor}">${s.priority}</span>
          </div>
        `;
      }).join('');
    }
  },

  // ── Render Citizen Leaderboard ──
  async renderLeaderboard() {
    const container = document.getElementById('citizen-leaderboard');
    if (!container) return;
    
    try {
      const res = await Auth.apiFetch('/api/auth/leaderboard');
      const users = res.leaderboard || [];
      
      if (users.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted)">No points earned yet! Be the first!</div>';
        return;
      }

      container.innerHTML = users.map((c, idx) => {
        const rank = idx + 1;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'normal';
        return `
          <div class="leader-item">
            <div class="leader-rank ${rankClass}">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</div>
            <div class="leader-avatar">${c.avatar || '🌿'}</div>
            <div class="leader-info">
              <div class="leader-name">${c.name}</div>
              <div class="leader-badge-row">
                <span class="tag">${c.points > 50 ? 'Eco Warrior' : 'Citizen'}</span>
              </div>
            </div>
            <div class="leader-points">${c.points.toLocaleString()} pts</div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    }
  },

  // ── Render My Reports ──
  async renderMyReports() {
    const container = document.getElementById('citizen-my-reports');
    if (!container) return;
    
    try {
      const res = await Auth.apiFetch('/api/reports/my');
      const reports = res.reports || [];
      
      if (reports.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">You haven\'t filed any reports yet. Use the Quick Report button or AI scanner to get started!</div>';
        return;
      }

      container.innerHTML = reports.map(r => {
        const uiStatus = r.status === 'resolved' ? 'Cleared' : r.status === 'in_progress' ? 'In Progress' : 'Pending';
        const statusColor = r.status === 'resolved' ? 'green' : r.status === 'in_progress' ? 'blue' : 'amber';
        let typeStr = r.analysis?.wasteType || 'Report';
        
        return `
          <div style="background: rgba(255,255,255,0.4); border: 1px solid rgba(74,103,65,0.15); border-radius: 12px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 4px;">
                ${r.zone || r.analysis?.locationName || 'Unknown Location'}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 8px;">
                <span>📋 ${typeStr}</span>
                <span>🕐 ${new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <span class="badge badge-${statusColor}" style="flex-shrink: 0;">${uiStatus}</span>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load my reports', err);
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-red); font-size: 0.85rem;">Failed to load your active reports.</div>';
    }
  },

  // ── Render Suggestions ──
  renderSuggestions() {
    const container = document.getElementById('suggestions-list');
    if (!container) return;
    const staticSuggestions = [
      { type: 'optimization', icon: '🗑️', text: 'Optimize route 4B for heavy load', priority: 'High' },
      { type: 'maintenance', icon: '🛠️', text: 'Schedule bin repair at Central Plaza', priority: 'Medium' },
      { type: 'citizen', icon: '🧑‍🤝‍🧑', text: 'Launch awareness drive in North District', priority: 'Low' }
    ];
    container.innerHTML = staticSuggestions.map(s => {
      const prioColor = s.priority === 'High' ? 'rgba(197,48,48,0.1); color: var(--color-red)' :
                        s.priority === 'Medium' ? 'rgba(200,132,12,0.1); color: var(--color-amber)' :
                        'rgba(74,103,65,0.1); color: var(--color-primary)';
      return `
        <div class="suggestion-card">
          <div class="suggestion-icon">${s.icon}</div>
          <div class="suggestion-content">
            <div class="suggestion-text">${s.text}</div>
            <span class="suggestion-priority" style="background:${prioColor}">${s.priority}</span>
            <div class="suggestion-actions">
              <button class="suggestion-act-btn primary" onclick="alert('Action initiated: ${s.type}')">Take Action</button>
              <button class="suggestion-act-btn dismiss" onclick="this.closest('.suggestion-card').style.display='none'">Dismiss</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Render Admin Table ──
  async renderAdminTable() {
    const tbody = document.getElementById('admin-reports-body');
    if (!tbody) return;
    
    try {
      const res = await Auth.apiFetch('/api/reports');
      const reports = res.reports || [];
      
      tbody.innerHTML = reports.map(r => {
        const uiStatus = r.status === 'resolved' ? 'Resolved' : r.status === 'in_progress' ? 'In Progress' : 'Pending';
        const statusColor = r.status === 'resolved' ? 'green' : r.status === 'in_progress' ? 'blue' : 'amber';
        const uiPriority = r.priority ? r.priority.charAt(0).toUpperCase() + r.priority.slice(1) : 'Medium';
        const prioColor = r.priority === 'critical' ? 'red' : r.priority === 'high' ? 'amber' : r.priority === 'medium' ? 'blue' : 'green';
        
        let typeStr = r.analysis?.wasteType || 'Unknown';
        let imageThumbnail = r.analysis?.imageUrl 
          ? `<a href="http://localhost:3001${r.analysis.imageUrl}" target="_blank" style="display:inline-block; margin-right: 8px;">
               <img src="http://localhost:3001${r.analysis.imageUrl}" style="width:32px; height:32px; object-fit:cover; border-radius:6px; border:1px solid #ddd; vertical-align:middle;" title="View Evidence">
             </a>`
          : `<span style="display:inline-block; width:32px; height:32px; background:#f0f0f0; border-radius:6px; margin-right: 8px; text-align:center; line-height:32px; font-size:12px; color:#aaa; vertical-align:middle;">No Pic</span>`;
        
        return `
          <tr>
            <td><strong>${r._id.slice(-6).toUpperCase()}</strong></td>
            <td>${r.zone || r.analysis?.locationName || 'Unknown Location'}</td>
            <td>${imageThumbnail} ${typeStr}</td>
            <td><span class="badge badge-${statusColor}">${uiStatus}</span></td>
            <td>System</td>
            <td>${new Date(r.createdAt).toLocaleDateString()}</td>
            <td>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span class="badge badge-${prioColor}">${uiPriority}</span>
                <div class="admin-actions">
                  <button class="admin-act-btn" title="Mark Resolved" onclick="App.markReportResolved('${r._id}')" ${r.status === 'resolved' ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>✅</button>
                </div>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load admin reports', err);
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Failed to load live reports.</td></tr>';
    }
  },

  // ── Render NGO Portal ──
  async renderNGOPortal() {
    const grid = document.getElementById('ngo-photo-grid');
    if (!grid) return;
    
    try {
      const res = await Auth.apiFetch('/api/ai/analyses');
      const analyses = res.analyses || [];
      if (analyses.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No AI scans in the system yet.</div>';
        return;
      }
      
      const typeIcons = { PLASTIC:'🥤', WET_WASTE:'🍎', DRY_WASTE:'📦', MIXED:'♻️', CLEAN:'✨' };
      
      grid.innerHTML = analyses.map(r => {
        const isAccepted = r.status === 'accepted';
        const btnClass = isAccepted ? 'ngo-btn accepted' : 'ngo-btn pending';
        const btnText = isAccepted ? '✓ Crew Dispatched' : 'Accept Request';
        const disabledAttr = isAccepted ? 'disabled' : '';
        const imgUrl = r.imageUrl.startsWith('http') ? r.imageUrl : `http://localhost:3001${r.imageUrl}`;
        
        return `
          <div class="ngo-photo-card" id="ngo-card-${r._id}">
            <img class="ngo-photo-img" src="${imgUrl}" alt="Waste Evidence" onerror="this.src='https://via.placeholder.com/300?text=No+Preview'">
            
            <div class="ngo-photo-body">
              <div class="ngo-photo-header">
                <div class="ngo-photo-meta">
                  <strong>${r.locationName || 'Unknown Location'}</strong>
                  ${new Date(r.createdAt).toLocaleString()}
                </div>
                <div class="det-icon" style="background: rgba(255,255,255,0.8); font-size: 1.2rem; border-radius: 8px; padding: 4px 8px;">
                  ${typeIcons[r.wasteType] || '🗑️'}
                </div>
              </div>
              
              <div class="ngo-photo-meta" style="margin-top: 8px; font-size: 0.85rem;">
                <strong>Detection AI:</strong>
                ${r.aiReasoning || 'Pending analysis...'}
              </div>
              
              <button class="${btnClass}" onclick="App.acceptNGORequest('${r._id}')" ${disabledAttr}>
                ${btnText}
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load NGO photo feed', err);
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--color-red);">Failed to sync live data connection.</div>';
    }
  },

  async acceptNGORequest(id) {
    if (!confirm('Mark this AI request as Accepted and dispatch a crew?')) return;
    try {
      const btn = document.querySelector(`#ngo-card-${id} .ngo-btn`);
      if (btn) {
        btn.textContent = 'Accepting...';
        btn.disabled = true;
      }
      
      const res = await Auth.apiFetch(`/api/ai/analyses/${id}/accept`, { method: 'PATCH' });
      Enhancements.showToast(res.message || 'Crew Dispatched', 'success');
      App.renderNGOPortal(); // Refresh grid layout
    } catch (err) {
      Enhancements.showToast(err.message, 'error');
      App.renderNGOPortal();
    }
  },

  async markReportResolved(id) {
    if (!confirm('Mark this report as resolved? This will safely award the citizen 5 eco coins!')) return;
    try {
      const res = await Auth.apiFetch(`/api/reports/${id}/clear`, { method: 'PATCH' });
      Enhancements.showToast(res.message || 'Report resolved', 'success');
      App.renderAdminTable(); // Refresh table
    } catch (err) {
      Enhancements.showToast(err.message, 'error');
    }
  },

  // ── Render Stats ──
  async renderStats() {
    try {
      const res = await Auth.apiFetch('/api/reports/stats/summary');
      const statElements = document.querySelectorAll('[data-stat]');
      
      const user = Auth.getUser();
      const totalScans   = res.totalScans || 0;
      const totalReports = res.total || 0;
      const activeCount  = (res.open || 0) + (res.inProgress || 0);
      const resolved     = res.resolved || 0;
      // Avg cleanliness: scale resolved rate 0-100
      const pctResolved  = totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0;
      const avgScore     = Math.min(95, 50 + pctResolved); // always between 50-95

      const statsMap = {
        'totalScans':        totalScans,
        'totalReports':      totalReports,
        'resolvedReports':   resolved,
        'resolvedToday':     resolved,
        'activeReports':     activeCount,
        'avgScore':          avgScore,
        'activeCitizens':    '24',
        'ecoPoints':         user?.points || 0,
        'citiesConnected':   '1',
        'treesPlanted':      (totalScans * 1.5).toFixed(0)
      };

      statElements.forEach(el => {
        const key = el.getAttribute('data-stat');
        if (statsMap[key] !== undefined) {
          el.textContent = statsMap[key];
        }
      });

      // Update AI-page sub-labels with real numbers
      const scansChange = document.getElementById('ai-scans-change');
      if (scansChange) scansChange.textContent = totalScans > 0 ? `${totalScans} total analyses` : 'No scans yet';

      const activeChange = document.getElementById('ai-active-change');
      if (activeChange) activeChange.textContent = activeCount > 0 ? `${activeCount} awaiting cleanup` : 'All clear!';

      const resolvedChange = document.getElementById('ai-resolved-change');
      if (resolvedChange) resolvedChange.textContent = resolved > 0 ? `${pctResolved}% resolution rate` : 'None yet';

    } catch (e) {
      console.error('Failed to load stats', e);
    }
  }
};

// ── Hero Login Handler ──
function handleHeroLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('hero-login-btn');
  if (btn) {
    btn.textContent = 'Signing in...';
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';
  }

  setTimeout(() => {
    if (btn) {
      btn.textContent = 'Sign In →';
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
    App.navigateTo('dashboard');
  }, 1200);
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
