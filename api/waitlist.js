module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!global.waitlistEmails) {
    global.waitlistEmails = [];
  }

  if (req.method === 'GET') {
    return res.status(200).json({ count: global.waitlistEmails.length, emails: global.waitlistEmails });
  }

  if (req.method === 'POST') {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const clean = email.toLowerCase().trim();
    if (!global.waitlistEmails.find(e => e.email === clean)) {
      global.waitlistEmails.push({ email: clean, time: new Date().toISOString() });
    }
    return res.status(200).json({ ok: true, count: global.waitlistEmails.length });
  }

  return res.status(405).end();
};
