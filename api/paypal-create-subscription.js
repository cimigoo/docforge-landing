/**
 * PayPal Create Subscription API
 * Creates a PayPal subscription for DocForge plans
 * 
 * POST /api/paypal-create-subscription
 * Body: { planId: 'free' | 'pro' | 'business', email?: string }
 * 
 * Returns: { subscriptionId, approvalUrl }
 */

const PAYPAL_BASE_URL = process.env.PAYPAL_ENV === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

const PLANS = {
  free: {
    planId: process.env.PAYPAL_PLAN_FREE || 'REPLACE_WITH_FREE_PLAN_ID',
    name: 'DocForge Free',
    price: '0',
    quotas: '100'
  },
  pro: {
    planId: process.env.PAYPAL_PLAN_PRO || 'REPLACE_WITH_PRO_PLAN_ID',
    name: 'DocForge Pro',
    price: '9',
    quotas: '1000'
  },
  business: {
    planId: process.env.PAYPAL_PLAN_BUSINESS || 'REPLACE_WITH_BUSINESS_PLAN_ID',
    name: 'DocForge Business',
    price: '29',
    quotas: 'unlimited'
  }
};

/**
 * Get PayPal Access Token
 */
async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Vercel env vars.');
  }
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal access token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayPal Subscription
 */
async function createSubscription(accessToken, planId, email) {
  const subscriber = email ? {
    email_address: email
  } : undefined;
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `docforge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      start_time: new Date(Date.now() + 60 * 1000).toISOString(), // Start in 1 minute
      subscriber: subscriber,
      application_context: {
        brand_name: 'DocForge',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${process.env.APP_URL || 'https://docforge-landing.vercel.app'}/payment/success`,
        cancel_url: `${process.env.APP_URL || 'https://docforge-landing.vercel.app'}/payment/cancel`
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('PayPal subscription error:', error);
    throw new Error(error.message || 'Failed to create subscription');
  }
  
  return await response.json();
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { planId, email } = req.body;
    
    if (!planId || !PLANS[planId]) {
      return res.status(400).json({ 
        error: 'Invalid plan. Must be: free, pro, or business' 
      });
    }
    
    const plan = PLANS[planId];
    
    // Check if it's a placeholder
    if (plan.planId.startsWith('REPLACE_')) {
      return res.status(400).json({ 
        error: 'PayPal plans not configured yet. Please set PAYPAL_PLAN_FREE, PAYPAL_PLAN_PRO, PAYPAL_PLAN_BUSINESS in Vercel env vars.' 
      });
    }
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // Create subscription
    const subscription = await createSubscription(accessToken, plan.planId, email);
    
    // Find approval URL
    const approvalLink = subscription.links?.find(link => link.rel === 'approve');
    
    res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      approvalUrl: approvalLink?.href,
      plan: plan.name
    });
    
  } catch (error) {
    console.error('PayPal create subscription error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create subscription' 
    });
  }
}
