/* ============================================================
   Auth.js — JWT Token Management + Auth Guard
   ============================================================ */

const API_BASE = 'http://localhost:3001/api';
const TOKEN_KEY = 'swachhta_token';
const USER_KEY  = 'swachhta_user';

const Auth = {
  // ── Token Management ──────────────────────────────────────

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;
    try {
      // Decode payload (no verification — server verifies)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // ── Auth Guard ────────────────────────────────────────────
  // Call on index.html to redirect to login if not authenticated

  guardPage() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    // Update UI with user info
    this.updateUserUI();
    return true;
  },

  updateUserUI() {
    const user = this.getUser();
    if (!user) return;

    // Update header avatar / name wherever present
    const userNameEls = document.querySelectorAll('[data-user-name]');
    const userEmailEls = document.querySelectorAll('[data-user-email]');
    const userAvatarEls = document.querySelectorAll('[data-user-avatar]');

    userNameEls.forEach(el => el.textContent = user.name || 'User');
    userEmailEls.forEach(el => el.textContent = user.email || '');
    userAvatarEls.forEach(el => el.textContent = user.avatar || '🌿');
  },

  logout() {
    this.removeToken();
    window.location.href = 'login.html';
  },

  // ── API Helpers ───────────────────────────────────────────

  async request(endpoint, options = {}) {
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    const response = await fetch(`${API_BASE}${cleanEndpoint}`, config);
    const data = await response.json();

    if (response.status === 401) {
      // Token expired
      this.removeToken();
      window.location.href = 'login.html';
      return;
    }

    return { ok: response.ok, status: response.status, data };
  },

  async apiFetch(endpoint, options = {}) {
    const res = await this.request(endpoint, options);
    if (!res || !res.ok) {
        throw new Error(res?.data?.error || 'Failed to fetch API endpoint');
    }
    return res.data;
  },

  // ── Auth API Calls ────────────────────────────────────────

  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async verifyOTP(email, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  async resendOTP(email) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // ── Check backend health ──────────────────────────────────
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },
};

// Make Auth globally available
window.Auth = Auth;
window.API_BASE = API_BASE;
