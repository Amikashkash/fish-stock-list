/**
 * claude-parser.service.js
 *
 * Parses fish shipment data from any document using Claude AI.
 * Supports: PDF, Excel/CSV (converted to text), plain text paste.
 *
 * Replaces excel-parser.service.js for the ShipmentImportModal.
 */

import * as XLSX from 'xlsx'

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are a fish shipment data extractor for an aquarium fish farm management system.
Your job is to extract structured fish shipment data from supplier invoices, price lists, or any document.
The document may be in Hebrew, English, or a mix of both.

Extract all fish/product line items and return ONLY a valid JSON object — no markdown, no explanation.`

const USER_PROMPT_TEMPLATE = `Extract fish shipment data from the document below and return a JSON object with this exact structure:

{
  "items": [
    {
      "scientificName": "string (MANDATORY - scientific/latin fish name)",
      "size": "string (MANDATORY - fish size e.g. '3-4cm', '5-6cm', 'M', 'L')",
      "boxNumber": number (MANDATORY - box/cart/carton number as integer),
      "commonName": "string or null (common name in Hebrew or English)",
      "code": "string or null (product/item code)",
      "bags": number or null (number of bags),
      "qtyPerBag": number or null (quantity per bag),
      "totalQuantity": number or null (total quantity of fish),
      "price": number or null (price per fish),
      "currency": "string or null (currency code e.g. ILS, USD, EUR - default ILS)"
    }
  ],
  "supplier": "string or null (supplier company name if found in document)",
  "dateReceived": "string or null (date in DD/MM/YYYY format if found)"
}

Rules:
- scientificName, size, and boxNumber are MANDATORY for each item. Skip rows where these cannot be found.
- If boxNumber is not explicitly listed, use 1 as default.
- If multiple fish share the same box/cart number, keep that number for all of them.
- Return ONLY the raw JSON object, no markdown code blocks, no explanation.

Document content:`

/**
 * Validate a single parsed item — same rules as excel-parser
 */
function validateItem(item) {
  const errors = []

  if (!item.scientificName?.toString().trim()) {
    errors.push({ field: 'scientificName', message: 'שם מדעי חסר' })
  }
  if (!item.size?.toString().trim()) {
    errors.push({ field: 'size', message: 'גודל חסר' })
  }
  if (item.boxNumber === null || item.boxNumber === undefined) {
    errors.push({ field: 'boxNumber', message: 'מספר ארגז חסר' })
  }

  return { isValid: errors.length === 0, errors, warnings: [] }
}

/**
 * Convert an Excel/XLS file to a CSV string for sending to Claude as text.
 */
async function excelToText(file) {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_csv(worksheet)
}

/**
 * Read a file as a base64-encoded string.
 */
async function fileToBase64(file) {
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Build the Claude API request messages array based on input type.
 */
async function buildMessages(file, pastedText) {
  if (pastedText) {
    return [
      {
        role: 'user',
        content: `${USER_PROMPT_TEMPLATE}\n\n${pastedText}`,
      },
    ]
  }

  const name = file.name.toLowerCase()
  const isPDF = file.type === 'application/pdf' || name.endsWith('.pdf')
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls')
  const isImage = file.type.startsWith('image/')

  if (isPDF) {
    const base64 = await fileToBase64(file)
    return [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          { type: 'text', text: USER_PROMPT_TEMPLATE },
        ],
      },
    ]
  }

  if (isImage) {
    const base64 = await fileToBase64(file)
    const mediaType = file.type || 'image/jpeg'
    return [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: USER_PROMPT_TEMPLATE },
        ],
      },
    ]
  }

  if (isExcel) {
    const csvText = await excelToText(file)
    return [
      {
        role: 'user',
        content: `${USER_PROMPT_TEMPLATE}\n\n${csvText}`,
      },
    ]
  }

  // CSV, TXT, or any other text file
  const text = await file.text()
  return [
    {
      role: 'user',
      content: `${USER_PROMPT_TEMPLATE}\n\n${text}`,
    },
  ]
}

/**
 * Parse shipment data using Claude AI.
 *
 * @param {File|null} file - Uploaded file (PDF, Excel, CSV, image, text)
 * @param {string} [pastedText] - Alternatively, text pasted directly by the user
 * @returns {Promise<{success: boolean, data: Array, summary: Object, error?: string}>}
 */
export async function parseShipmentWithClaude(file, pastedText = '') {
  if (!ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: 'Anthropic API key not configured. Add VITE_ANTHROPIC_API_KEY to your .env file.',
      data: [],
      summary: { totalRows: 0, validRows: 0, errorRows: 0 },
    }
  }

  if (!file && !pastedText.trim()) {
    return {
      success: false,
      error: 'No input provided. Upload a file or paste text.',
      data: [],
      summary: { totalRows: 0, validRows: 0, errorRows: 0 },
    }
  }

  try {
    const messages = await buildMessages(file, pastedText)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      throw new Error(errBody?.error?.message || `API error ${response.status}`)
    }

    const apiResult = await response.json()
    const rawText = apiResult.content?.[0]?.text?.trim() || ''

    // Parse JSON from Claude's response
    let parsed
    try {
      // Strip markdown code fences if Claude wrapped it anyway
      const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      parsed = JSON.parse(jsonText)
    } catch {
      throw new Error(`Claude returned invalid JSON: ${rawText.slice(0, 200)}`)
    }

    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      return {
        success: false,
        error: 'Claude could not find any fish items in the document.',
        data: [],
        summary: { totalRows: 0, validRows: 0, errorRows: 0 },
        extractedMeta: { supplier: parsed.supplier, dateReceived: parsed.dateReceived },
      }
    }

    // Map to internal schema + validate
    const data = parsed.items.map((item, index) => {
      const mapped = {
        rowNumber: index + 1,
        scientificName: item.scientificName?.toString().trim() || null,
        size: item.size?.toString().trim() || null,
        boxNumber: item.boxNumber !== null && item.boxNumber !== undefined
          ? parseInt(item.boxNumber) || item.boxNumber
          : null,
        commonName: item.commonName?.toString().trim() || null,
        code: item.code?.toString().trim() || null,
        bags: item.bags !== null && item.bags !== undefined ? Number(item.bags) : null,
        qtyPerBag: item.qtyPerBag !== null && item.qtyPerBag !== undefined ? Number(item.qtyPerBag) : null,
        totalQuantity: item.totalQuantity !== null && item.totalQuantity !== undefined ? Number(item.totalQuantity) : null,
        price: item.price !== null && item.price !== undefined ? Number(item.price) : null,
        currency: item.currency?.toString().trim() || 'ILS',
      }

      const validation = validateItem(mapped)
      return { ...mapped, isValid: validation.isValid, errors: validation.errors, warnings: validation.warnings }
    })

    const summary = {
      totalRows: data.length,
      validRows: data.filter(r => r.isValid).length,
      errorRows: data.filter(r => !r.isValid).length,
    }

    return {
      success: true,
      data,
      summary,
      // Expose supplier/date extracted by Claude so the modal can pre-fill them
      extractedMeta: {
        supplier: parsed.supplier || null,
        dateReceived: parsed.dateReceived || null,
      },
    }

  } catch (err) {
    console.error('Claude parse error:', err)
    return {
      success: false,
      error: err.message || 'Failed to analyze document with Claude AI.',
      data: [],
      summary: { totalRows: 0, validRows: 0, errorRows: 0 },
    }
  }
}
