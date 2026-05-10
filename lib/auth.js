/**
 * API Key Authentication
 * Validates Bearer token against environment variable
 */

module.exports = function authenticate(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  // If no API key is set in environment, allow all requests (for local testing)
  const validApiKey = process.env.DOCFORGE_API_KEY;
  
  if (!validApiKey) {
    return { valid: true, message: 'No API key configured - allowing all requests' };
  }
  
  // Extract Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, message: 'Missing or invalid Authorization header' };
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  if (token !== validApiKey) {
    return { valid: false, message: 'Invalid API key' };
  }
  
  return { valid: true };
};
