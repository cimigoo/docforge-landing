/**
 * DocForge Reddit Poster (Web Login Approach)
 * POST /api/reddit-post
 * 
 * Simulates browser login + posting via Reddit's web endpoints
 * No need for Reddit app/client_id/client_secret
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { subreddit, title, text, kind = 'self', url } = req.body;

    if (!subreddit || !title) {
      return res.status(400).json({ error: 'subreddit and title are required' });
    }

    const username = process.env.REDDIT_USERNAME;
    const password = process.env.REDDIT_PASSWORD;

    if (!username || !password) {
      return res.status(500).json({ error: 'Reddit credentials not configured' });
    }

    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

    // Step 1: Get login page for CSRF token
    const loginPageRes = await fetch('https://www.reddit.com/login/', {
      headers: { 'User-Agent': UA },
      redirect: 'manual'
    });

    const loginPageBody = await loginPageRes.text();

    const csrfMatch = loginPageBody.match(/name="csrf_token"\s+value="([^"]+)"/) 
                   || loginPageBody.match(/"csrf_token"\s*:\s*"([^"]+)"/);
    
    if (!csrfMatch) {
      return res.status(500).json({ 
        error: 'Could not extract CSRF token from login page',
        hint: 'Reddit may have changed their login flow'
      });
    }

    const csrfToken = csrfMatch[1];

    let allCookies = [];
    if (loginPageRes.headers.get('set-cookie')) {
      const rawCookies = loginPageRes.headers.get('set-cookie');
      allCookies.push(...rawCookies.split(',').filter(c => c.includes('=')).map(c => c.split(';')[0].trim()));
    }

    // Step 2: Login
    const loginRes = await fetch('https://www.reddit.com/login/', {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.reddit.com/login/',
        'Cookie': allCookies.join('; ')
      },
      body: new URLSearchParams({
        username: username,
        password: password,
        csrf_token: csrfToken,
        dest: 'https://www.reddit.com/'
      }).toString(),
      redirect: 'manual'
    });

    if (loginRes.headers.get('set-cookie')) {
      const rawCookies = loginRes.headers.get('set-cookie');
      allCookies.push(...rawCookies.split(',').filter(c => c.includes('=')).map(c => c.split(';')[0].trim()));
    }

    const loginStatus = loginRes.status;
    if (loginStatus !== 302 && loginStatus !== 301) {
      const loginBody = await loginRes.text();
      console.error('Login failed, status:', loginStatus, 'body:', loginBody.substring(0, 500));
      return res.status(401).json({ error: 'Reddit login failed', status: loginStatus });
    }

    // Follow redirect to confirm session
    const redirectUrl = loginRes.headers.get('location');
    if (redirectUrl) {
      const confirmRes = await fetch(redirectUrl, {
        headers: { 'User-Agent': UA, 'Cookie': allCookies.join('; ') },
        redirect: 'manual'
      });
      if (confirmRes.headers.get('set-cookie')) {
        const rawCookies = confirmRes.headers.get('set-cookie');
        allCookies.push(...rawCookies.split(',').filter(c => c.includes('=')).map(c => c.split(';')[0].trim()));
      }
    }

    // Step 3: Get submit page for access token
    const submitPageRes = await fetch(`https://www.reddit.com/r/${subreddit}/submit`, {
      headers: { 'User-Agent': UA, 'Cookie': allCookies.join('; ') }
    });

    const submitPageBody = await submitPageRes.text();
    const accessTokenMatch = submitPageBody.match(/"accessToken"\s*:\s*"([^"]+)"/);
    const submitCsrfMatch = submitPageBody.match(/"csrf_token"\s*:\s*"([^"]+)"/);

    // Step 4: Submit the post
    if (accessTokenMatch) {
      const webAccessToken = accessTokenMatch[1];
      
      const postRes = await fetch('https://oauth.reddit.com/api/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${webAccessToken}`,
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': allCookies.join('; ')
        },
        body: new URLSearchParams({
          sr: subreddit,
          title: title,
          kind: kind,
          text: text || '',
          api_type: 'json'
        }).toString()
      });

      const postData = await postRes.json();
      
      if (postData.json && postData.json.errors && postData.json.errors.length > 0) {
        return res.status(400).json({ error: 'Reddit post failed', details: postData.json.errors });
      }

      return res.status(200).json({ success: true, data: postData.json?.data || postData });
    }

    // Fallback: direct form submission
    const directPostRes = await fetch('https://www.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `https://www.reddit.com/r/${subreddit}/submit`,
        'Cookie': allCookies.join('; ')
      },
      body: new URLSearchParams({
        sr: subreddit,
        title: title,
        kind: kind,
        text: text || '',
        api_type: 'json'
      }).toString()
    });

    const directPostData = await directPostRes.text();
    
    try {
      const parsed = JSON.parse(directPostData);
      if (parsed.json && parsed.json.errors && parsed.json.errors.length > 0) {
        return res.status(400).json({ error: 'Reddit post failed', details: parsed.json.errors });
      }
      return res.status(200).json({ success: true, data: parsed.json?.data || parsed });
    } catch (e) {
      return res.status(200).json({ success: true, raw: directPostData.substring(0, 500) });
    }

  } catch (err) {
    console.error('Reddit post error:', err);
    return res.status(500).json({ error: err.message });
  }
};
