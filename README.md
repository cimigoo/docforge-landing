# DocForge PDF Generation API

**JSON + Template → PDF API powered by PDFKit**

A serverless API service that generates professional PDF documents from JSON data and templates. No browser dependencies required.

## Features

- 🚀 **Serverless** - Deploys to Vercel Functions (Hobby plan compatible)
- 📄 **5 Professional Templates** - Invoice, Receipt, Certificate, Report, Contract
- 🎨 **Beautiful Design** - Clean, modern PDFs with consistent branding
- 🔐 **API Key Authentication** - Secure your endpoint
- ⚡ **Fast Generation** - Pure Node.js with PDFKit

## Quick Start

### 1. Deploy to Vercel

**Option A: GitHub Integration (Recommended)**
1. Create a new GitHub repository
2. Upload these files to the repository:
   - `api/generate.js`
   - `lib/auth.js`
   - `lib/templates/` (entire folder)
   - `package.json`
3. Go to [vercel.com](https://vercel.com) and import your repository
4. Vercel will automatically detect the serverless function

**Option B: Manual Deploy**
```bash
npm install
vercel --prod
```

### 2. Configure Environment Variable

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add: `DOCFORGE_API_KEY` = `df_sk_your-secret-key`
3. Redeploy if needed

### 3. Test the API

```bash
# Generate an invoice
curl -X POST https://your-project.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer df_sk_your-secret-key" \
  -d '{
    "template": "invoice",
    "data": {
      "invoice_number": "INV-001",
      "date": "2025-07-11",
      "due_date": "2025-08-11",
      "from": { "name": "Acme Corp", "address": "123 Main St, City" },
      "to": { "name": "Client Corp", "address": "456 Oak Ave, Town" },
      "items": [
        { "description": "Pro Plan", "quantity": 1, "unit_price": 4999, "amount": 4999 }
      ],
      "subtotal": 4999,
      "tax": 0,
      "total": 4999,
      "currency": "USD",
      "notes": "Thank you for your business!"
    }
  }' -o invoice.pdf
```

## API Reference

### Endpoint

```
POST /api/generate
```

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer df_sk_xxxxx` |
| `Content-Type` | Yes | `application/json` |

### Request Body

```json
{
  "template": "invoice|receipt|certificate|report|contract",
  "data": { ... }
}
```

### Response

- **Success**: PDF binary stream (Content-Type: `application/pdf`)
- **Error**: JSON with `error` field

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing template/data or invalid template name |
| 401 | Missing or invalid API key |
| 500 | PDF generation error |

## Templates

### Invoice
```json
{
  "invoice_number": "INV-001",
  "date": "2025-07-11",
  "due_date": "2025-08-11",
  "from": { "name": "...", "address": "..." },
  "to": { "name": "...", "address": "..." },
  "items": [{ "description": "...", "quantity": 1, "unit_price": 100, "amount": 100 }],
  "subtotal": 100,
  "tax": 0,
  "total": 100,
  "currency": "USD",
  "notes": "Thank you!"
}
```

### Receipt
```json
{
  "receipt_number": "RCP-001",
  "date": "2025-07-11",
  "customer": "Jane Smith",
  "items": [{ "name": "...", "qty": 2, "price": 25.00 }],
  "subtotal": 50.00,
  "tax": 0,
  "total": 50.00,
  "currency": "USD",
  "payment_method": "Credit Card"
}
```

### Certificate
```json
{
  "title": "Certificate of Completion",
  "recipient": "Jane Smith",
  "description": "has successfully completed",
  "course": "Advanced React Patterns",
  "date": "2025-07-11",
  "issuer": "Academy Corp",
  "signature": "John Doe"
}
```

### Report
```json
{
  "title": "Monthly Report",
  "subtitle": "June 2025",
  "metrics": [{ "label": "Revenue", "value": "$42,500" }],
  "sections": [{ "heading": "Overview", "content": "..." }]
}
```

### Contract
```json
{
  "title": "Service Agreement",
  "parties": [
    { "name": "Company A", "role": "Service Provider" },
    { "name": "Company B", "role": "Client" }
  ],
  "date": "2025-07-11",
  "sections": [{ "heading": "Scope", "content": "..." }],
  "duration": "12 months"
}
```

## Local Development

```bash
npm install
DOCFORGE_API_KEY=df_sk_test node test.js
```

## File Structure

```
docforge-api/
├── api/
│   └── generate.js          # Main API endpoint
├── lib/
│   ├── auth.js               # API key validation
│   └── templates/
│       ├── index.js          # Template registry
│       ├── invoice.js
│       ├── receipt.js
│       ├── certificate.js
│       ├── report.js
│       └── contract.js
├── package.json
└── README.md
```

## Notes

- Supports USD ($), EUR (€), GBP (£), CNY (¥) currencies
- API key authentication (skip by not setting env var for local dev)
- PDF size: A4
- No Chinese font support in MVP (requires additional font files)

## License

MIT
