export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ count: waitlistEmails.length, emails: waitlistEmails });
  }

  if (req.method === 'POST') {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const clean = email.toLowerCase().trim();
    if (!waitlistEmails.find(e => e.email === clean)) {
      waitlistEmails.push({ email: clean, time: new Date().toISOString() });
    }
    return res.status(200).