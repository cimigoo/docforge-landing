/**
 * Receipt Template
 * Professional receipt PDF generation
 */

const PRIMARY_COLOR = '#7c5cfc';
const SECONDARY_COLOR = '#34d399';

module.exports = function generateReceipt(data, doc) {
  const { receipt_number, date, customer, items, subtotal, tax, total, currency, payment_method } = data;
  
  const currencySymbols = { USD: '$', EUR: '€', GBP: '£', CNY: '¥' };
  const currencySymbol = currencySymbols[currency] || '$';
  
  // Header
  doc.rect(0, 0, doc.page.width, 100).fill(SECONDARY_COLOR);
  doc.fill('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(28)
    .text('RECEIPT', 0, 35, { align: 'center' });
  
  doc.font('Helvetica').fontSize(11);
  doc.text(`#${receipt_number}`, 0, 70, { align: 'center' });
  
  // Reset for content
  doc.fill('#000000');
  
  // Info section
  const contentY = 130;
  
  doc.fontSize(11);
  doc.text(`Date: ${date}`, 50, contentY);
  doc.text(`Customer: ${customer}`, 50, contentY + 22);
  doc.text(`Payment: ${payment_method}`, 50, contentY + 44);
  
  // Items
  const tableY = 220;
  
  // Header
  doc.rect(50, tableY, 500, 25).fill('#f3f4f6');
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Item', 60, tableY + 8);
  doc.text('Qty', 300, tableY + 8);
  doc.text('Price', 370, tableY + 8);
  doc.text('Total', 470, tableY + 8);
  
  // Rows
  let rowY = tableY + 25;
  
  items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(50, rowY, 500, 22).fill('#fafafa');
    }
    doc.font('Helvetica').fontSize(10);
    doc.text(item.name, 60, rowY + 6);
    doc.text(item.qty.toString(), 300, rowY + 6);
    doc.text(`${currencySymbol}${item.price.toFixed(2)}`, 370, rowY + 6);
    doc.text(`${currencySymbol}${(item.qty * item.price).toFixed(2)}`, 470, rowY + 6);
    rowY += 22;
  });
  
  // Totals
  const totalsY = rowY + 15;
  
  doc.font('Helvetica').fontSize(10);
  doc.text('Subtotal:', 370, totalsY);
  doc.text(`${currencySymbol}${subtotal.toFixed(2)}`, 470, totalsY);
  
  doc.text('Tax:', 370, totalsY + 18);
  doc.text(`${currencySymbol}${tax.toFixed(2)}`, 470, totalsY + 18);
  
  doc.rect(360, totalsY + 28, 190, 26).fill(SECONDARY_COLOR);
  doc.font('Helvetica-Bold').fontSize(12).fill('#ffffff');
  doc.text('TOTAL:', 370, totalsY + 35);
  doc.text(`${currencySymbol}${total.toFixed(2)}`, 470, totalsY + 35);
  
  // Thank you
  doc.font('Helvetica').fontSize(10).fill('#666666');
  doc.text('Thank you for your purchase!', 0, totalsY + 80, { align: 'center' });
  
  return doc;
};
