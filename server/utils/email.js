/* ============================================================
   Email Utility — Nodemailer + Gmail
   ============================================================ */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

// ── OTP Email ──────────────────────────────────────────────

async function sendOTPEmail(toEmail, otp, name = 'User') {
  const mail = {
    from: `"🌿 Swachhta Dashboard" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Your Verification Code — ${otp}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f0f4f0; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(74,103,65,0.12); }
    .header { background: linear-gradient(135deg, #4A6741, #6B8E3B); padding: 36px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 40px; }
    .greeting { font-size: 16px; color: #2D3E2D; margin-bottom: 20px; }
    .otp-box { background: linear-gradient(135deg, #f0f7f0, #e8f3e8); border: 2px dashed #4A6741; border-radius: 16px; padding: 28px; text-align: center; margin: 28px 0; }
    .otp-label { font-size: 12px; color: #7D8B7D; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 12px; }
    .otp-code { font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #4A6741; font-family: 'Courier New', monospace; }
    .otp-expires { font-size: 12px; color: #9BA89B; margin-top: 12px; }
    .note { background: #fff9e6; border-left: 4px solid #C8840C; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #6B5000; margin-top: 20px; }
    .footer { background: #f8faf8; padding: 24px 40px; text-align: center; font-size: 12px; color: #9BA89B; border-top: 1px solid #e8f0e8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🌿 Swachhta & LiFE</h1>
      <p>Smart City Monitor</p>
    </div>
    <div class="body">
      <p class="greeting">Hello <strong>${name}</strong>,</p>
      <p style="color:#4A5D4A;font-size:15px;line-height:1.6;">
        Use the verification code below to complete your sign-in. This code is valid for <strong>10 minutes</strong>.
      </p>
      <div class="otp-box">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expires">⏱ Expires in 10 minutes</div>
      </div>
      <div class="note">
        🔒 If you didn't request this code, you can safely ignore this email. Never share this code with anyone.
      </div>
    </div>
    <div class="footer">
      Swachhta & LiFE Dashboard · Smart City Initiative<br>
      This is an automated email — please do not reply.
    </div>
  </div>
</body>
</html>`,
  };

  return getTransporter().sendMail(mail);
}

// ── Clearance Feedback Email ───────────────────────────────

async function sendClearanceEmail({ toEmail, reporterName, location, wasteType, clearedAt, clearedByName }) {
  const mail = {
    from: `"🌿 Swachhta Dashboard" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `✅ Garbage Cleared — ${location}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f0f4f0; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(74,103,65,0.12); }
    .header { background: linear-gradient(135deg, #4A6741, #6B8E3B); padding: 36px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; margin: 0; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 40px; }
    .success-badge { 
      display: inline-block; padding: 8px 20px; background: linear-gradient(135deg,#d4edda,#c3e6cb);
      color: #1a5a28; border-radius: 100px; font-size: 14px; font-weight: 700; margin-bottom: 24px;
    }
    .detail-card { background: #f8faf8; border-radius: 14px; padding: 24px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8f0e8; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #7D8B7D; font-weight: 500; }
    .detail-value { color: #2D3E2D; font-weight: 600; }
    .thank-you { background: linear-gradient(135deg, #f0f7f0, #e8f3e8); border-radius: 14px; padding: 24px; text-align: center; }
    .footer { background: #f8faf8; padding: 24px 40px; text-align: center; font-size: 12px; color: #9BA89B; border-top: 1px solid #e8f0e8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🌿 Swachhta & LiFE</h1>
      <p>Smart City Monitor — Clearance Confirmation</p>
    </div>
    <div class="body">
      <span class="success-badge">✅ Area Cleaned Successfully</span>
      <p style="color:#4A5D4A;font-size:15px;line-height:1.6;">
        Hi <strong>${reporterName || 'Citizen'}</strong>,<br><br>
        Great news! The garbage spot you reported has been cleared by our team. 
        Thank you for helping keep our city clean! 🙌
      </p>
      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">📍 Location</span>
          <span class="detail-value">${location}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🗑️ Waste Type</span>
          <span class="detail-value">${wasteType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">✅ Cleared At</span>
          <span class="detail-value">${clearedAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">👷 Cleared By</span>
          <span class="detail-value">${clearedByName || 'Sanitation Team'}</span>
        </div>
      </div>
      <div class="thank-you">
        <div style="font-size: 2rem; margin-bottom: 12px;">🏆</div>
        <div style="font-weight: 700; color: #4A6741; font-size: 16px;">Thank you for your contribution!</div>
        <div style="color: #7D8B7D; font-size: 13px; margin-top: 6px;">
          Your report helped make ${location} cleaner. Every report counts!
        </div>
      </div>
    </div>
    <div class="footer">
      Swachhta & LiFE Dashboard · Smart City Initiative<br>
      This is an automated email — please do not reply.
    </div>
  </div>
</body>
</html>`,
  };

  return getTransporter().sendMail(mail);
}

// ── Welcome Email ──────────────────────────────────────────

async function sendWelcomeEmail(toEmail, name) {
  const mail = {
    from: `"🌿 Swachhta Dashboard" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Welcome to Swachhta & LiFE Dashboard, ${name}! 🌿`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f0f4f0; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(74,103,65,0.12); }
    .header { background: linear-gradient(135deg, #4A6741, #6B8E3B); padding: 48px 40px; text-align: center; }
    .logo { font-size: 56px; margin-bottom: 16px; }
    .header h1 { color: #fff; font-size: 28px; font-weight: 700; margin: 0; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0; }
    .body { padding: 44px 40px; }
    .features { display: grid; gap: 16px; margin: 28px 0; }
    .feature { background: #f8faf8; border-radius: 14px; padding: 18px 22px; display: flex; align-items: center; gap: 16px; }
    .feature-icon { font-size: 2rem; flex-shrink: 0; }
    .feature-text h3 { margin: 0 0 4px; font-size: 15px; color: #2D3E2D; }
    .feature-text p { margin: 0; font-size: 13px; color: #7D8B7D; }
    .footer { background: #f8faf8; padding: 24px 40px; text-align: center; font-size: 12px; color: #9BA89B; border-top: 1px solid #e8f0e8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">🌿</div>
      <h1>Welcome, ${name}!</h1>
      <p>You're now part of the Swachhta & LiFE community</p>
    </div>
    <div class="body">
      <p style="color:#4A5D4A;font-size:15px;line-height:1.7;">
        Your account has been verified and you're ready to help monitor and improve cleanliness across our city!
      </p>
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📸</div>
          <div class="feature-text">
            <h3>AI Garbage Detection</h3>
            <p>Upload photos to classify plastic, wet or dry waste with AI</p>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">🗺️</div>
          <div class="feature-text">
            <h3>Smart City Map</h3>
            <p>Track cleanliness scores across all city zones in real-time</p>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">✅</div>
          <div class="feature-text">
            <h3>Clearance Alerts</h3>
            <p>Get email updates when your reported garbage spots are cleaned</p>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      Swachhta & LiFE Dashboard · Smart City Initiative<br>
      This is an automated email — please do not reply.
    </div>
  </div>
</body>
</html>`,
  };

  return getTransporter().sendMail(mail);
}

// ── NGO / Municipality Emergency Dispatch Email ─────────────

async function sendNGODispatchEmail({ location, lat, lng, wasteType, severity, insights }) {
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const badgeColor = severity === 'CRITICAL' ? 'linear-gradient(135deg,#f8d7da,#f5c6cb)' : 'linear-gradient(135deg,#fff3cd,#ffeeba)';
  const badgeTextColor = severity === 'CRITICAL' ? '#721c24' : '#856404';

  const mail = {
    from: `"🔴 Swachhta Dispatch" <${process.env.GMAIL_USER}>`,
    to: 'ngo@swachhtagov.in', // Simulated municipal inbox, but handled via the test account. (For dev, actually we should route it to the GMAIL_USER so the user sees it in their inbox!)
    subject: `🚨 ${severity} Severity Dispatch: Trash Accumulation at ${location}`,
    text: `Emergency Dispatch - ${severity} waste at ${location}. Coordinates: ${lat}, ${lng}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f0f4f0; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
    .header { background: linear-gradient(135deg, #2A2A2A, #1A1A1A); padding: 36px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; margin: 0; }
    .header p { color: rgba(255,255,255,0.7); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 40px; }
    .severity-badge { 
      display: inline-block; padding: 8px 20px; background: ${badgeColor};
      color: ${badgeTextColor}; border-radius: 100px; font-size: 14px; font-weight: 700; margin-bottom: 24px;
    }
    .detail-card { background: #f8faf8; border-radius: 14px; padding: 24px; margin: 24px 0; border: 1px solid #e8f0e8;}
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8f0e8; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #555; font-weight: 500; }
    .detail-value { color: #222; font-weight: 600; text-align: right; max-width: 60%; }
    .insights { font-size: 13px; background: #fdfdfd; padding: 15px; border-radius: 8px; font-style: italic; color: #555;}
    .action-button { display: block; text-align: center; background: #4A6741; color: #fff; text-decoration: none; padding: 14px; border-radius: 8px; font-weight: bold; margin-top: 20px;}
    .footer { background: #1A1A1A; padding: 24px 40px; text-align: center; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🚨 Automated Dispatch Unit</h1>
      <p>Municipal Sanitation Command Center</p>
    </div>
    <div class="body">
      <span class="severity-badge">${severity} SEVERITY DETECTED</span>
      <p style="color:#333;font-size:15px;line-height:1.6;">
        Attention Cleaning Crew,<br><br>
        A citizen report has flagged a significant accumulation of waste requiring immediate municipal attention. 
      </p>
      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">📍 Est. Zone</span>
          <span class="detail-value">${location}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🗑️ Materials</span>
          <span class="detail-value">${wasteType}</span>
        </div>
      </div>
      <div class="insights">"💡 AI Insight: ${insights}"</div>
      <a href="${mapLink}" class="action-button">📍 Open Location in Google Maps</a>
    </div>
    <div class="footer">
      Generated automatically by the Swachhta AI System.<br>
      GPS Coordinator Layer
    </div>
  </div>
</body>
</html>`,
  };

  // Override to process.env.GMAIL_USER so the user receives it in dev!
  if (process.env.GMAIL_USER) {
    mail.to = process.env.GMAIL_USER;
  }

  return getTransporter().sendMail(mail);
}

module.exports = { sendOTPEmail, sendClearanceEmail, sendWelcomeEmail, sendNGODispatchEmail };
