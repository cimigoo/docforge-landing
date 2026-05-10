/**
 * Invoice Template
 * Professional invoice PDF generation
 */

const PRIMARY_COLOR = '#7c5cfc';
const SECONDARY_COLOR = '#34d399';

module.exports = function generateInvoice(data, doc) {
  const { invoice_number, date, due_date, from, to, items, subtotal, tax, total, currency, notes } = data;
  
  const currencySymbols = { USD: '$', EUR: '€', GBP: '£', CNY: '¥' };
  const currencySymbol = currencySymbols[currency] || '$';
  
  // Header
  doc.rect(0, 0, doc.page.width, 120).fill(PRIMARY_COLOR);
  doc.fill('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(32)
    .text('INVOICE', 50, 40);
  
  doc.font('Helvetica')
    .fontSize(12)
    .text(`#${invoice_number}`, 50, 75, { lineBreak: false })
    .text(`  Date: ${date}`, 200)
    .text(`  Due: ${due_date}`, 350);
  
  // Reset for content
  doc.fill('#000000');
  
  // From/To section
  const contentY = 150;
  
  doc.font('Helvetica-Bold').fontSize(10).fill(PRIMARY_COLOR).text('FROM', 50, contentY);
  doc.font('Helvetica').fontSize(11).fill('#000000').text(from.name, 50, contentY + 18);
  doc.fontSize(10).text(from.address, 50, contentY + 36);
  
  doc.font('Helvetica-Bold').fontSize(10).fill(PRIMARY_COLOR).text('BILL TO', 300, contentY);
  doc.font('Helvetica').fontSize(11).fill('#000000').text(to.name, 300, contentY + 18);
  doc.fontSize(10).text(to.address, 300, contentY + 36);
  
  // Items table
  const tableY = 260;
  
  // Table header
  doc.rect(50, tableY, 500, 30).fill('#f3f4f6');
  doc.font('Helvetica-Bold').fontSize(10).fill('#000000');
  doc.text('Description', 60, tableY + 10);
  doc.text('Qty', 320, tableY + 10);
  doc.text('Unit Price', 380, tableY + 10);
  doc.text('Amount', 470, tableY + 10);
  
  // Table rows
  let rowY = tableY + 30;
  doc.font('Helvetica').fontSize(10);
  
  items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(50, rowY, 500, 25).fill('#fafafa');
    }
    doc.text(item.description, 60, rowY + 8);
    doc.text(item.quantity.toString(), 320, rowY + 8);
    doc.text(`${currencySymbol}${item.unit_price.toFixed(2)}`, 380, rowY + 8);
    doc.text(`${currencySymbol}${item.amount.toFixed(2)}`, 470, rowY + 8);
    rowY += 25;
  });
  
  // Totals
  const totalsY = rowY + 20;
  
  doc.font('Helvetica').fontSize(10);
  doc.text('Subtotal:', 380, totalsY);
  doc.text(`${currencySymbol}${subtotal.toFixed(2)}`, 470, totalsY);
  
  doc.text('Tax:', 380, totalsY + 18);
  doc.text(`${currencySymbol}${tax.toFixed(2)}`, 470, totalsY + 18);
  
  doc.rect(370, totalsY + 32, 180, 28).fill(PRIMARY_COLOR);
  doc.font('Helvetica-Bold').fontSize(12).fill('#ffffff');
  doc.text('Total:', 380, totalsY + 40);
  doc.text(`${currencySymbol}${total.toFixed(2)}`, 470, totalsY + 40);
  
  // Notes
  if (notes) {
    doc.font('Helvetica').fontSize(10).fill('#666666');
    doc.text(notes, 50, totalsY + 80, { width: 500 });
  }
  
  return doc;
};
