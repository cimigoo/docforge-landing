/**
 * Contract Template
 * Professional contract PDF generation
 */

const PRIMARY_COLOR = '#7c5cfc';
const SECONDARY_COLOR = '#34d399';

module.exports = function generateContract(data, doc) {
  const { title, parties, date, sections, duration } = data;
  
  const pageWidth = doc.page.width;
  
  // Header
  doc.rect(0, 0, pageWidth, 80).fill(PRIMARY_COLOR);
  doc.fill('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(24)
    .text(title, 0, 30, { align: 'center' });
  
  // Parties section
  doc.fill('#000000')
    .font('Helvetica-Bold')
    .fontSize(12)
    .fill(PRIMARY_COLOR)
    .text('PARTIES TO THIS AGREEMENT', 50, 110);
  
  doc.fill('#000000').fontSize(11);
  let partyY = 135;
  
  parties.forEach((party, index) => {
    doc.font('Helvetica-Bold').text(`${party.role}:`, 50, partyY);
    doc.font('Helvetica').text(party.name, 150, partyY);
    partyY += 22;
  });
  
  // Date and duration
  doc.font('Helvetica').fontSize(11);
  doc.text(`Effective Date: ${date}`, 50, partyY + 10);
  if (duration) {
    doc.text(`Term: ${duration}`, 50, partyY + 32);
  }
  
  // Divider
  doc.moveTo(50, partyY + 60)
    .lineTo(pageWidth - 50, partyY + 60)
    .lineWidth(2)
    .stroke(PRIMARY_COLOR);
  
  // Sections
  let currentY = partyY + 85;
  
  sections.forEach((section, index) => {
    // Check for page break
    if (currentY > 680) {
      doc.addPage();
      currentY = 50;
    }
    
    // Section number and heading
    doc.font('Helvetica-Bold')
      .fontSize(13)
      .fill(PRIMARY_COLOR)
      .text(`${index + 1}. ${section.heading}`, 50, currentY);
    
    currentY += 25;
    
    // Section content
    doc.font('Helvetica')
      .fontSize(11)
      .fill('#333333')
      .text(section.content, 50, currentY, {
        width: 500,
        lineGap: 5
      });
    
    currentY += doc.heightOfString(section.content, {
      width: 500,
      lineGap: 5
    }) + 25;
  });
  
  // Signature section
  if (currentY > 550) {
    doc.addPage();
    currentY = 50;
  }
  
  currentY += 30;
  
  doc.moveTo(50, currentY)
    .lineTo(pageWidth - 50, currentY)
    .lineWidth(1)
    .stroke('#e5e7eb');
  
  currentY += 30;
  
  doc.font('Helvetica-Bold')
    .fontSize(12)
    .fill(PRIMARY_COLOR)
    .text('SIGNATURES', 50, currentY);
  
  currentY += 35;
  
  // Signature boxes
  const sigBoxWidth = 220;
  const sigY = currentY;
  
  parties.forEach((party, index) => {
    const x = 50 + index * (sigBoxWidth + 30);
    
    // Box
    doc.rect(x, sigY, sigBoxWidth, 80)
      .lineWidth(1)
      .stroke('#d1d5db');
    
    // Label
    doc.font('Helvetica-Bold')
      .fontSize(10)
      .fill('#666666')
      .text(party.role, x + 10, sigY + 10);
    
    doc.font('Helvetica')
      .fontSize(12)
      .fill('#000000')
      .text(party.name, x + 10, sigY + 30);
    
    // Signature line
    doc.moveTo(x + 10, sigY + 55)
      .lineTo(x + sigBoxWidth - 10, sigY + 55)
      .stroke('#000000');
    
    doc.fontSize(8).fill('#9ca3af');
    doc.text('Signature', x + 10, sigY + 58);
  });
  
  return doc;
};
