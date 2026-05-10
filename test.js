/**
 * DocForge API Test Script
 * Generates test PDFs for all templates
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Import templates
const invoice = require('./lib/templates/invoice');
const receipt = require('./lib/templates/receipt');
const certificate = require('./lib/templates/certificate');
const report = require('./lib/templates/report');
const contract = require('./lib/templates/contract');

// Ensure output directory exists
const outputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test data for each template
const testData = {
  invoice: {
    invoice_number: 'INV-001',
    date: '2025-07-11',
    due_date: '2025-08-11',
    from: { name: 'Acme Corp', address: '123 Main St, San Francisco, CA 94102' },
    to: { name: 'Client Corp', address: '456 Oak Ave, New York, NY 10001' },
    items: [
      { description: 'Pro Plan - Monthly Subscription', quantity: 1, unit_price: 4999, amount: 4999 },
      { description: 'Additional Users (5 seats)', quantity: 5, unit_price: 999, amount: 4995 },
      { description: 'Priority Support', quantity: 1, unit_price: 1999, amount: 1999 }
    ],
    subtotal: 11993,
    tax: 959.44,
    total: 12952.44,
    currency: 'USD',
    notes: 'Thank you for your business! Payment due within 30 days.'
  },
  
  receipt: {
    receipt_number: 'RCP-2025-001',
    date: '2025-07-11',
    customer: 'Jane Smith',
    items: [
      { name: 'Widget A', qty: 2, price: 25.00 },
      { name: 'Widget B', qty: 1, price: 12.00 },
      { name: 'Widget C', qty: 3, price: 8.50 }
    ],
    subtotal: 81.50,
    tax: 6.52,
    total: 88.02,
    currency: 'USD',
    payment_method: 'Credit Card'
  },
  
  certificate: {
    title: 'Certificate of Completion',
    recipient: 'Jane Smith',
    description: 'has successfully completed all requirements for',
    course: 'Advanced React Patterns & Best Practices',
    date: 'July 11, 2025',
    issuer: 'TechAcademy Corp',
    signature: 'John Doe, CEO'
  },
  
  report: {
    title: 'Monthly Performance Report',
    subtitle: 'June 2025',
    metrics: [
      { label: 'Revenue', value: '$42,500' },
      { label: 'New Users', value: '1,240' },
      { label: 'Growth', value: '+12.3%' },
      { label: 'Churn Rate', value: '2.1%' }
    ],
    sections: [
      { 
        heading: 'Executive Summary', 
        content: 'This month showed strong growth across all key metrics. Revenue increased by 12.3% compared to the previous month, driven primarily by new user acquisitions and improved conversion rates. The team successfully launched two major features that have been well-received by our user base.'
      },
      { 
        heading: 'Key Achievements', 
        content: 'We reached a milestone of 50,000 active users this month. The new onboarding flow reduced drop-off rates by 18%. Customer satisfaction scores improved from 4.2 to 4.6 out of 5.'
      },
      { 
        heading: 'Challenges & Next Steps', 
        content: 'Server infrastructure costs have increased due to higher traffic. We are exploring optimization strategies and considering tiered pricing for enterprise customers. Next month focus: launch mobile app beta and expand to European markets.'
      }
    ]
  },
  
  contract: {
    title: 'Professional Services Agreement',
    parties: [
      { name: 'TechCorp Solutions Inc.', role: 'Service Provider' },
      { name: 'ClientCo International LLC', role: 'Client' }
    ],
    date: 'July 11, 2025',
    sections: [
      { 
        heading: 'Scope of Services', 
        content: 'The Provider agrees to deliver professional consulting services including technical architecture review, code audit, and implementation guidance for the Client\'s web application platform. Services shall be performed remotely with bi-weekly progress calls.'
      },
      { 
        heading: 'Payment Terms', 
        content: 'Client shall pay the Provider a total of $15,000 in three installments: $5,000 upon signing, $5,000 at project midpoint (30 days), and $5,000 upon final delivery. All payments are due within 15 days of invoice date.'
      },
      { 
        heading: 'Confidentiality', 
        content: 'Both parties agree to keep all proprietary information confidential and not disclose it to any third party without written consent. This obligation survives the termination of this agreement for a period of two years.'
      },
      { 
        heading: 'Intellectual Property', 
        content: 'All deliverables created under this agreement shall be owned by the Client upon full payment. The Provider retains the right to showcase anonymized versions of the work in their portfolio.'
      }
    ],
    duration: '3 months from the effective date'
  }
};

// Generate PDF function
function generatePDF(templateFn, data, filename) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: filename,
        Author: 'DocForge Test',
        Creator: 'DocForge PDF API'
      }
    });
    
    const outputPath = path.join(outputDir, filename);
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);
    templateFn(data, doc);
    doc.end();
    
    stream.on('finish', () => {
      resolve(outputPath);
    });
    
    stream.on('error', reject);
  });
}

// Run tests
async function runTests() {
  console.log('🧪 DocForge API Test Suite');
  console.log('========================\n');
  
  const templates = [
    { name: 'invoice', fn: invoice },
    { name: 'receipt', fn: receipt },
    { name: 'certificate', fn: certificate },
    { name: 'report', fn: report },
    { name: 'contract', fn: contract }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const template of templates) {
    try {
      console.log(`Testing ${template.name} template...`);
      const outputPath = await generatePDF(
        template.fn,
        testData[template.name],
        `${template.name}-test.pdf`
      );
      console.log(`  ✅ Generated: ${outputPath}\n`);
      passed++;
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('========================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`\n📄 PDFs saved to: ${outputDir}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
