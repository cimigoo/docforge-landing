/**
 * DocForge Webhook Handler
 * Receives Lemon Squeezy payment notifications
 * 
 * Events handled: order_created, subscription_created
 * 
 * Setup:
 * 1. Go to https://app.lemonsqueezy.com/settings/webhooks
 * 2. Add webhook URL: https://docforge-landing.vercel.app/api/webhook
 * 3. Subscribe to: order_created, subscription_created events
 * 4. Copy the signing secret (X-Signature header) to VERCEIL_ENV or SECRET.md
 */

const crypto = require('crypto');

// Lemon Squeezy signing secret (set in Vercel env vars as LS_WEBHOOK_SECRET)
const WEBHOOK_SECRET = process.env.LS_WEBHOOK_SECRET || '';

// Email config from env
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.qiye.163.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'newsletter@gpos.cn';
const SMTP_PASS = process.env.SMTP_PASS || 'bjjzd@163';
const EMAIL_FROM = process.env.EMAIL_FROM || 'newsletter@gpos.cn';
const EMAIL_TO = 'bwl@gpos.cn';

/**
 * Verify Lemon Squeezy X-Signature header
 */
function verifySignature(rawBody, signature) {
  if (!WEBHOOK_SECRET || !signature) {
    console.warn('[Webhook] Missing WEBHOOK_SECRET or signature - skipping verification in dev mode');
    return true; // Allow in dev if no secret set
  }
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');
  
  // Constant-time comparison to prevent timing attacks
  try {
    const sig = Buffer.from(signature, 'hex');
    const dig = Buffer.from(digest, 'hex');
    if (sig.length !== dig.length) return false;
    return crypto.timingSafeEqual(sig, dig);
  } catch {
    return false;
  }
}

/**
 * Send notification email
 */
async function sendEmail(subject, htmlBody) {
  // Use nodemailer if available, otherwise use native approach
  try {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"DocForge Payments" <${EMAIL_FROM}>`,
      to: EMAIL_TO,
      subject: subject,
      html: htmlBody,
    });
    
    console.log('[Webhook] Email sent successfully');
  } catch (err) {
    // Fallback: log to console if email fails
    console.error('[Webhook] Email send failed:', err.message);
    console.log('[Webhook] Would have sent email:', subject);
  }
}

/**
 * Format order/subscription data for email
 */
function formatOrderEmail(eventName, data) {
  const orderId = data.attributes?.identifier || data.id || 'N/A';
  const email = data.attributes?.user_email || data.attributes?.email || 'N/A';
  const status = data.attributes?.status || 'N/A';
  const total = data.attributes?.total || 0;
  const currency = data.attributes?.currency || 'USD';
  const createdAt = data.attributes?.created_at || new Date().toISOString();
  const productName = data.attributes?.first_order_item?.product_name || 'DocForge API';
  const variantName = data.attributes?.first_order_item?.variant_name || 'Subscription';
  
  const totalFormatted = (total / 100).toFixed(2);
  
  const colors = {
    bg: '#0a0a0f', bg2: '#111118', accent: '#7c5cfc', green: '#34d399',
    text: '#e4e4ed', text2: '#a0a0b8', border: '#2a2a3a',
  };
  
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{margin:0;padding:0;background:${colors.bg};color:${colors.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.container{max-width:560px;margin:0 auto;padding:32px 24px}
.card{background:${colors.bg2};border:1px solid ${colors.border};border-radius:12px;padding:32px}
.header{text-align:center;margin-bottom:28px}
.header h1{font-size:1.5rem;font-weight:700;margin:0 0 8px;color:#fff}
.header p{font-size:.9rem;color:${colors.text2};margin:0}
.badge{display:inline-block;padding:6px 16px;border-radius:20px;font-size:.75rem;font-weight:600;margin-bottom:16px}
.badge-success{background:rgba(52,211,153,.15);color:${colors.green};border:1px solid rgba(52,211,153,.3)}
.badge-info{background:rgba(124,92,252,.15);color:${colors.accent};border:1px solid rgba(124,92,252,.3)}
.meta{margin-top:24px;padding-top:24px;border-top:1px solid ${colors.border}}
.meta-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${colors.border};font-size:.875rem}
.meta-row:last-child{border-bottom:none}
.meta-label{color:${colors.text2}}
.meta-value{color:${colors.text};font-weight:500;font-family:monospace}
.footer{text-align:center;margin-top:28px;font-size:.75rem;color:${colors.text2}}
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <div class="badge ${eventName === 'order_created' ? 'badge-success' : 'badge-info'}">
        ${eventName === 'order_created' ? '💳 New Order' : '🔄 New Subscription'}
      </div>
      <h1>DocForge Payment Received</h1>
      <p>A new ${eventName === 'subscription_created' ? 'subscription' : 'order'} was created</p>
    </div>
    <div class="meta">
      <div class="meta-row">
        <span class="meta-label">Order ID</span>
        <span class="meta-value">#${orderId}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Customer Email</span>
        <span class="meta-value">${email}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Product</span>
        <span class="meta-value">${productName} — ${variantName}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Amount</span>
        <span class="meta-value">${currency} $${totalFormatted}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Status</span>
        <span class="meta-value">${status}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Time</span>
        <span class="meta-value">${createdAt}</span>
      </div>
    </div>
    <div class="footer">
      DocForge — Migo-Studio<br>
      This is an automated notification from your DocForge payment system.
    </div>
  </div>
</div>
</body>
</html>
  `.trim();

  return `[DocForge Payment] ${eventName === 'order_created' ? '💳 New Order' : '🔄 Subscription'} — ${email} paid $${totalFormatted} for ${productName}`;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get raw body for signature verification
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const signature = req.headers['x-signature'] || '';

  // Verify signature
  if (!verifySignature(rawBody, signature)) {
    console.error('[Webhook] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const eventName = req.headers['x-event-name'] || req.body?.meta?.event_name || '';
  
  console.log(`[Webhook] Received event: ${eventName}`);

  // Only handle order_created and subscription_created
  if (eventName === 'order_created' || eventName === 'subscription_created') {
    const plainSubject = formatOrderEmail(eventName, req.body?.data || {});
    // Send email notification
    await sendEmail(plainSubject, formatOrderEmail(eventName, req.body?.data || {}));
  } else {
    console.log(`[Webhook] Ignored event: ${eventName}`);
  }

  return res.status(200).json({ received: true });
};
