/**
 * Certificate Template
 * Professional certificate PDF generation
 */

const PRIMARY_COLOR = '#7c5cfc';
const SECONDARY_COLOR = '#34d399';

module.exports = function generateCertificate(data, doc) {
  const { title, recipient, description, course, date, issuer, signature } = data;
  
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  
  // Border decoration
  doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
    .lineWidth(3)
    .stroke(PRIMARY_COLOR);
  
  doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
    .lineWidth(1)
    .stroke(SECONDARY_COLOR);
  
  // Title
  doc.fill(PRIMARY_COLOR)
    .font('Helvetica-Bold')
    .fontSize(28)
    .text(title, 50, 100, { width: pageWidth - 100, align: 'center' });
  
  // Decorative line
  doc.moveTo(150, 150)
    .lineTo(pageWidth - 150, 150)
    .lineWidth(2)
    .stroke(PRIMARY_COLOR);
  
  // Body text
  doc.fill('#000000')
    .font('Helvetica')
    .fontSize(14)
    .text('This is to certify that', 50, 180, { width: pageWidth - 100, align: 'center' });
  
  // Recipient name
  doc.font('Helvetica-Bold')
    .fontSize(32)
    .fill(PRIMARY_COLOR)
    .text(recipient, 50, 220, { width: pageWidth - 100, align: 'center' });
  
  // Description
  doc.font('Helvetica')
    .fontSize(14)
    .fill('#000000')
    .text(description, 50, 280, { width: pageWidth - 100, align: 'center' });
  
  // Course
  doc.font('Helvetica-Bold')
    .fontSize(20)
    .fill(PRIMARY_COLOR)
    .text(course, 50, 310, { width: pageWidth - 100, align: 'center' });
  
  // Date
  doc.font('Helvetica')
    .fontSize(12)
    .fill('#666666')
    .text(`Issued on ${date}`, 50, 370, { width: pageWidth - 100, align: 'center' });
  
  // Issuer
  doc.font('Helvetica-Bold')
    .fontSize(16)
    .fill('#000000')
    .text(issuer, 50, 420, { width: pageWidth - 100, align: 'center' });
  
  // Signature line
  const sigX = pageWidth / 2;
  doc.moveTo(sigX - 80, 480)
    .lineTo(sigX + 80, 480)
    .lineWidth(1)
    .stroke('#000000');
  
  doc.font('Helvetica')
    .fontSize(10)
    .fill('#666666')
    .text(signature, sigX - 80, 490, { width: 160, align: 'center' });
  
  // Seal decoration
  doc.circle(pageWidth - 120, pageHeight - 120, 35)
    .lineWidth(2)
    .stroke(PRIMARY_COLOR);
  
  doc.circle(pageWidth - 120, pageHeight - 120, 28)
    .lineWidth(1)
    .stroke(SECONDARY_COLOR);
  
  return doc;
};
