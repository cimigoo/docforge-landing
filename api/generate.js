/**
 * DocForge PDF Generation API
 * Main endpoint: POST /api/generate
 * 
 * Accepts JSON with template name and data, returns PDF binary
 */

const PDFDocument = require('pdfkit');
const authenticate = require('../lib/auth');
const { getTemplate, isValidTemplate } = require('../lib/templates');

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  // Authenticate
  const authResult = authenticate(req);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.message });
  }
  
  // Parse body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  
  const { template, data } = body;
  
  // Validate template
  if (!template) {
    return res.status(400).json({ error: 'Missing required field: template' });
  }
  
  if (!isValidTemplate(template)) {
    return res.status(400).json({ 
      error: `Invalid template: "${template}". Available templates: invoice, receipt, certificate, report, contract`
    });
  }
  
  // Validate data
  if (!data) {
    return res.status(400).json({ error: 'Missing required field: data' });
  }
  
  // Generate PDF
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `${template.charAt(0).toUpperCase() + template.slice(1)} Document`,
        Author: 'DocForge',
        Creator: 'DocForge PDF API'
      }
    });
    
    // Collect PDF data
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    // Generate content using template
    const templateFn = getTemplate(template);
    templateFn(data, doc);
    
    // Finalize PDF
    doc.end();
    
    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      doc.on('error', reject);
    });
    
    // Return PDF
    return res
      .status(200)
      .setHeader('Content-Type', 'application/pdf')
      .setHeader('Content-Disposition', `attachment; filename="${template}-${Date.now()}.pdf"`)
      .setHeader('Content-Length', pdfBuffer.length)
      .send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: 'PDF generation failed: ' + error.message });
  }
};
