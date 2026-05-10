/**
 * PayPal Webhook Handler
 * Receives PayPal payment notifications
 * 
 * Events handled:
 * - PAYMENT.CAPTURE.COMPLETED - Payment successful
 * - PAYMENT.CAPTURE.DENIED - Payment failed
 * - PAYMENT.CAPTURE.REFUNDED - Refund issued
 * - BILLING.SUBSCRIPTION.CREATED - New subscription
 * - BILLING.SUBSCRIPTION.ACTIVATED - Subscription activated
 * - BILLING.SUBSCRIPTION.CANCELLED - Subscription cancelled
 * - BILLING.SUBSCRIPTION.SUSPENDED - Subscription suspended
 * - BILLING.SUBSCRIPTION.EXPIRED - Subscription expired
 * 
 * Setup:
 * 1. Go to https://developer.paypal.com/dashboard/applications
 * 2. Select your app -> Webhooks
 * 3. Add webhook URL: https://docforge-landing.vercel.app/api/paypal-webhook
 * 4. Subscribe to: PAYMENT.CAPTURE.COMPLETED, BILLING.SUBSCRIPTION.CREATED, 
 *    BILLING.SUBSCRIPTION.ACTIVATED, BILLING.SUBSCRIPTION.CANCELLED
 */

const crypto = require('crypto');

// Email config from env
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.qiye.163.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'newsletter@gpos.cn';
const SMTP_PASS = process.env.SMTP_PASS || 'bjjzd@163';
const EMAIL_FROM = process.env.EMAIL_FROM || 'newsletter@gpos.cn';
const EMAIL_TO = process.env.PAYMENT_EMAIL_TO || 'bwl@gpos.cn';

const PAYPAL_BASE_URL = process.env.PAYPAL_ENV === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

/**
 * Verify PayPal Webhook Signature
 */
async function verifyWebhookSignature(req) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!webhookId) {
    console.warn('[Webhook] PAYPAL_WEBHOOK_ID not set - skipping verification');
    return true;
  }
  
  // Get raw body
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const certUrl = req.headers['paypal-cert-url'];
  const authAlgo = req.headers['paypal-auth-algo'];
  const transmissionSig = req.headers['paypal-transmission-sig'];
  
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    console.warn('[Webhook] Missing PayPal signature headers');
    return false;
  }
  
  // Calculate CRC
  const crc = crc32(rawBody);
  
  // Get access token for verification
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });
  
  const { access_token } = await tokenResponse.json();
  
  // Verify webhook
  const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: req.body
    })
  });
  
  const verifyData = await verifyResponse.json();
  return verifyData.verification_status === 'SUCCESS';
}

/**
 * Calculate CRC32 for webhook signature
 */
function crc32(str) {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  for (let i = 0; i < str.length; i++) {
    crc = table[(crc ^ str.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Send notification email
 */
async function sendEmail(subject, htmlBody) {
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
    console.error('[Webhook] Email send failed:', err.message);
  }
}

/**
 * Format payment email
 */
function formatPaymentEmail(eventType, resource) {
  const colors = {
    bg: '#0a0a0f', bg2: '#111118', accent: '#7c5cfc', green: '#34d399',
    text: '#e4e4ed', text2: '#a0a0b8', border: '#2a2a3a', red: '#f87171',
  };
  
  let badge, title, status;
  
  switch (eventType) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      badge = 'badge-success';
      title = '💳 Payment Received';
      status = 'COMPLETED';
      break;
    case 'PAYMENT.CAPTURE.DENIED':
      badge = 'badge-error';
      title = '❌ Payment Denied';
      status = 'DENIED';
      break;
    case 'PAYMENT.CAPTURE.REFUNDED':
      badge = 'badge-warning';
      title = '💰 Payment Refunded';
      status = 'REFUNDED';
      break;
    case 'BILLING.SUBSCRIPTION.CREATED':
      badge = 'badge-info';
      title = '🆕 Subscription Created';
      status = 'CREATED';
      break;
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      badge = 'badge-success';
      title = '✅ Subscription Activated';
      status = 'ACTIVE';
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
      badge = 'badge-warning';
      title = '❌ Subscription Cancelled';
      status = 'CANCELLED';
      break;
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      badge = 'badge-warning';
      title = '⚠️ Subscription Suspended';
      status = 'SUSPENDED';
      break;
    default:
      badge = 'badge-info';
      title = '📋 Payment Event';
      status = resource.status || 'UNKNOWN';
  }
  
  const paymentId = resource.id || 'N/A';
  const amount = resource.amount?.value || resource.purchase_units?.[0]?.amount?.value || '0';
  const currency = resource.amount?.currency_code || resource.purchase_units?.[0]?.amount?.currency_code || 'USD';
  const subscriberEmail = resource.subscriber?.email_address || resource.payer?.email_address || 'N/A';
  const subscriptionId = resource.id || resource.billing_agreement_id || 'N/A';
  const createTime = resource.create_time || new Date().toISOString();
  
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
.badge-error{background:rgba(248,113,113,.15);color:${colors.red};border:1px solid rgba(248,113,113,.3)}
.badge-warning{background:rgba(251,191,36,.15);color:#fbbf24;border:1px solid rgba(251,191,36,.3)}
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
      <div class="badge ${badge}">${title}</div>
      <h1>DocForge Payment Notification</h1>
      <p>PayPal event: ${eventType}</p>
    </div>
    <div class="meta">
      <div class="meta-row">
        <span class="meta-label">Payment ID</span>
        <span class="meta-value">${paymentId}</span>
      </div>
      ${subscriptionId !== paymentId ? `
      <div class="meta-row">
        <span class="meta-label">Subscription ID</span>
        <span class="meta-value">${subscriptionId}</span>
      </div>
      ` : ''}
      <div class="meta-row">
        <span class="meta-label">Customer Email</span>
        <span class="meta-value">${subscriberEmail}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Amount</span>
        <span class="meta-value">${currency} $${amount}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Status</span>
        <span class="meta-value">${status}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Time</span>
        <span class="meta-value">${createTime}</span>
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
  
  return {
    subject: `[DocForge PayPal] ${title} — ${subscriberEmail} paid $${amount} ${currency}`,
    html
  };
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, PayPal-Transmission-Id, PayPal-Transmission-Time, PayPal-Cert-Url, PayPal-Auth-Algo, PayPal-Transmission-Sig');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(req);
  if (!isValid) {
    console.error('[Webhook] Invalid PayPal signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const eventType = req.body.event_type;
  const resource = req.body.resource;
  
  console.log(`[Webhook] Received event: ${eventType}`);
  console.log(`[Webhook] Resource:`, JSON.stringify(resource).substring(0, 500));

  // Handle different event types
  switch (eventType) {
    case 'PAYMENT.CAPTURE.COMPLETED':
    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.REFUNDED':
    case 'BILLING.SUBSCRIPTION.CREATED':
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      // Send notification email
      const { subject, html } = formatPaymentEmail(eventType, resource);
      await sendEmail(subject, html);
      
      // TODO: Update user subscription status in your database
      // You would typically:
      // 1. Get subscriber email from resource
      // 2. Update their subscription status in your DB
      // 3. Send welcome/activation email with API key
      
      console.log(`[Webhook] Processed ${eventType}`);
      break;
      
    default:
      console.log(`[Webhook] Unhandled event type: ${eventType}`);
  }

  // Respond 200 to acknowledge receipt
  res.status(200).json({ received: true });
}
