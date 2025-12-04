/**
 * excel-parser.service.js
 *
 * Service for parsing Excel shipment files.
 * Handles file reading, data extraction, validation, and code generation.
 */

import * as XLSX from 'xlsx'

/**
 * Generate a dummy code for fish without supplier SKU
 *
 * Format: MISSING-{timestamp}-{randomId}
 * Example: MISSING-1702345678-a3f8c2
 *
 * @returns {string} Dummy code
 */
function generateMissingCode() {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  return `MISSING-${timestamp}-${randomId}`
}

/**
 * Validate a single row from Excel
 *
 * @param {Object} row - Parsed row data
 * @returns {Object} Validation result with errors and warnings
 */
function validateRow(row) {
  const errors = []
  const warnings = []

  // Required field validations
  if (!row.scientificName?.trim()) {
    errors.push({ field: 'scientificName', message: 'Scientific name is required' })
  }

  if (!row.commonName?.trim()) {
    errors.push({ field: 'commonName', message: 'Common name is required' })
  }

  if (!row.size?.trim()) {
    errors.push({ field: 'size', message: 'Size is required' })
  }

  // Numeric validations
  if (isNaN(row.cart) || row.cart <= 0) {
    errors.push({ field: 'cart', message: 'Cart must be a positive number' })
  }

  if (isNaN(row.bags) || row.bags <= 0) {
    errors.push({ field: 'bags', message: 'Bags must be a positive number' })
  }

  if (isNaN(row.qtyPerBag) || row.qtyPerBag <= 0) {
    errors.push({ field: 'qtyPerBag', message: 'Qty/Bag must be a positive number' })
  }

  if (isNaN(row.total) || row.total <= 0) {
    errors.push({ field: 'total', message: 'Total must be a positive number' })
  }

  // Price validation
  if (isNaN(row.price) || row.price <= 0) {
    errors.push({ field: 'price', message: 'Price must be a positive number' })
  } else if (row.price > 10000) {
    warnings.push({ field: 'price', message: 'Price seems unusually high' })
  }

  // Currency validation
  const currency = row.currency?.toUpperCase()
  if (!['ILS', 'USD'].includes(currency)) {
    errors.push({ field: 'currency', message: 'Currency must be ILS or USD' })
  }

  // Calculation check: bags × qtyPerBag should equal total
  if (!isNaN(row.bags) && !isNaN(row.qtyPerBag) && !isNaN(row.total)) {
    const calculated = row.bags * row.qtyPerBag
    if (calculated !== row.total) {
      errors.push({
        field: 'total',
        message: `Total (${row.total}) doesn't match Bags × Qty/Bag (${calculated})`
      })
    }
  }

  // Missing code warning (not an error)
  if (!row.code) {
    warnings.push({ field: 'code', message: 'Code missing - will be generated automatically' })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Parse Excel file and extract shipment data
 *
 * @param {File} file - Excel file from user upload
 * @returns {Promise<Object>} Parsed data with validation results
 */
export async function parseShipmentExcel(file) {
  try {
    // 1. Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // 2. Parse with SheetJS
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // 3. Get first sheet
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('No sheets found in Excel file')
    }

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 4. Convert to JSON (using first row as headers)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null })

    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in Excel file')
    }

    // 5. Map columns to our schema
    const mappedData = rawData.map((row, index) => {
      return {
        // Row metadata
        rowNumber: index + 2, // Excel rows (1-based, +1 for header)

        // Data fields
        code: row['Code'] || null,
        cart: parseInt(row['Cart']),
        scientificName: row['Scientific Name'],
        commonName: row['Common Name'],
        size: row['Size'],
        bags: parseInt(row['Bags']),
        qtyPerBag: parseInt(row['Qty/Bag']),
        total: parseInt(row['Total']),
        price: parseFloat(row['Price']),
        currency: row['Currency']?.toUpperCase(),

        // Optional fields
        packingRatio: row['Packing Ratio'] || null,
        partOfCart: row['Part of Cart'] ? parseFloat(row['Part of Cart']) : null,
      }
    })

    // 6. Validate each row
    const validatedData = mappedData.map(row => {
      const validation = validateRow(row)

      return {
        ...row,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      }
    })

    // 7. Handle missing codes
    const dataWithCodes = validatedData.map(row => {
      if (!row.code) {
        row.code = generateMissingCode()
        row.codeStatus = 'missing'
      } else {
        row.codeStatus = 'valid'
      }
      return row
    })

    // 8. Calculate summary
    const summary = {
      totalRows: dataWithCodes.length,
      validRows: dataWithCodes.filter(r => r.isValid).length,
      errorRows: dataWithCodes.filter(r => !r.isValid).length,
      missingCodes: dataWithCodes.filter(r => r.codeStatus === 'missing').length,
      totalFish: dataWithCodes.reduce((sum, r) => sum + (r.total || 0), 0),
      totalCost: dataWithCodes.reduce((sum, r) => sum + ((r.total || 0) * (r.price || 0)), 0),
    }

    // 9. Return results
    return {
      success: true,
      data: dataWithCodes,
      summary,
    }

  } catch (error) {
    console.error('Error parsing Excel file:', error)

    // Return error result
    return {
      success: false,
      error: error.message || 'Failed to parse Excel file',
      data: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
        missingCodes: 0,
        totalFish: 0,
        totalCost: 0,
      }
    }
  }
}

/**
 * Validate file before parsing
 *
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export function validateExcelFile(file) {
  const errors = []

  // Check file exists
  if (!file) {
    errors.push('No file selected')
    return { isValid: false, errors }
  }

  // Check file type
  const validExtensions = ['.xlsx', '.xls']
  const fileName = file.name.toLowerCase()
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))

  if (!hasValidExtension) {
    errors.push('File must be an Excel file (.xlsx or .xls)')
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
