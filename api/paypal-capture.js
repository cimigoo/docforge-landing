/**
 * PayPal Capture Payment API
 * Captures an authorized PayPal order/subscription payment
 * 
 * POST /api/paypal-capture
 * Body: { orderId: string, subscriptionId?: string }
 * 
 * This endpoint is called after user approves payment on PayPal.
 * It captures the payment and activates the subscription.
 */

const PAYPAL_BASE_URL = process.env.PAYPAL_ENV === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal Access Token
 */
async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured.');
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
  
  const data = await response.json();
  return data.access_token;
}

/**
 * Capture PayPal Order (for one-time payments or initial subscription setup)
 */
async function captureOrder(accessToken, orderId) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to capture order');
  }
  
  return await response.json();
}

/**
 * Activate Subscription (for subscription payments that need activation)
 */
async function activateSubscription(accessToken, subscriptionId) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'Customer agreed to subscription'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Some subscriptions activate automatically, so 400 might be ok
    if (response.status !== 400) {
      throw new Error(error.message || 'Failed to activate subscription');
    }
  }
  
  return await response.json();
}

/**
 * Get Subscription Details
 */
async function getSubscription(accessToken, subscriptionId) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get subscription');
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
    const { orderId, subscriptionId } = req.body;
    
    if (!orderId && !subscriptionId) {
      return res.status(400).json({ 
        error: 'orderId or subscriptionId is required' 
      });
    }
    
    const accessToken = await getAccessToken();
    
    let result;
    
    if (orderId) {
      // Capture one-time payment or subscription order
      result = await captureOrder(accessToken, orderId);
      
      res.status(200).json({
        success: true,
        orderId: result.id,
        status: result.status,
        purchaseUnit: result.purchase_units?.[0]
      });
    } else if (subscriptionId) {
      // Get subscription status
      const subscription = await getSubscription(accessToken, subscriptionId);
      
      // If subscription is in PENDING state, try to activate
      if (subscription.status === 'PENDING') {
        await activateSubscription(accessToken, subscriptionId);
      }
      
      // Get updated subscription
      const updatedSubscription = await getSubscription(accessToken, subscriptionId);
      
      res.status(200).json({
        success: true,
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        planId: updatedSubscription.plan_id,
        subscriber: updatedSubscription.subscriber
      });
    }
    
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to capture payment' 
    });
  }
}
