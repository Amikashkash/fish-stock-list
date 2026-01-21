/**
 * excel-parser.service.js
 *
 * Service for parsing Excel shipment files.
 * Simplified version - only 3 mandatory fields:
 * 1. Scientific Name (שם מדעי)
 * 2. Size (גודל)
 * 3. Box Number (מספר ארגז)
 */

import * as XLSX from 'xlsx'

/**
 * Find column value by trying multiple possible column names
 */
function findColumnValue(row, possibleNames) {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name]
    }
  }
  return null
}

/**
 * Validate a single row - simplified version
 */
function validateRow(row) {
  const errors = []
  const warnings = []

  // Only 3 mandatory fields
  if (!row.scientificName?.toString().trim()) {
    errors.push({ field: 'scientificName', message: 'שם מדעי חסר' })
  }

  if (!row.size?.toString().trim()) {
    errors.push({ field: 'size', message: 'גודל חסר' })
  }

  if (!row.boxNumber && row.boxNumber !== 0) {
    errors.push({ field: 'boxNumber', message: 'מספר ארגז חסר' })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Parse Excel file and extract shipment data
 * Simplified version - only 3 mandatory fields
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
      throw new Error('לא נמצאו גליונות בקובץ האקסל')
    }

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 4. Convert to raw array (no headers assumed)
    const rawArray = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })

    if (!rawArray || rawArray.length === 0) {
      throw new Error('לא נמצאו נתונים בקובץ האקסל')
    }

    // Find the header row (look for row containing 'שם' or 'מספר ארגז' or 'גודל')
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(10, rawArray.length); i++) {
      const row = rawArray[i]
      if (row && Array.isArray(row)) {
        const rowStr = row.join(' ').toLowerCase()
        if (rowStr.includes('שם') || rowStr.includes('מספר ארגז') || rowStr.includes('גודל')) {
          headerRowIndex = i
          console.log('Found header row at index:', i, 'Content:', row)
          break
        }
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('לא נמצאה שורת כותרות בקובץ (מחפש: שם, גודל, מספר ארגז)')
    }

    // Get headers from the header row
    const headers = rawArray[headerRowIndex].map(h => h?.toString().trim() || '')
    console.log('Headers found:', headers)

    // Convert remaining rows to objects using these headers
    const rawData = []
    for (let i = headerRowIndex + 1; i < rawArray.length; i++) {
      const row = rawArray[i]
      if (row && Array.isArray(row)) {
        const obj = {}
        headers.forEach((header, idx) => {
          if (header) {
            obj[header] = row[idx] !== undefined ? row[idx] : null
          }
        })
        rawData.push(obj)
      }
    }

    if (rawData.length === 0) {
      throw new Error('לא נמצאו שורות נתונים אחרי הכותרות')
    }

    // Log first row to help debug
    console.log('Excel columns found:', Object.keys(rawData[0]))
    console.log('First data row:', rawData[0])

    // 5. Map columns to our schema - try multiple possible column names
    const mappedData = rawData.map((row, index) => {
      // Scientific Name - try multiple variations
      const scientificName = findColumnValue(row, [
        'שם', 'שם מדעי', 'שם לטיני',
        'Scientific Name', 'scientific name', 'Scientific name',
        'Latin Name', 'latin name',
        'Species', 'species', 'מין', 'Name', 'name'
      ])

      // Size - try multiple variations
      const size = findColumnValue(row, [
        'Size', 'size', 'SIZE',
        'גודל', 'מידה', 'Measure', 'measure'
      ])

      // Box Number - try multiple variations
      const boxNumber = findColumnValue(row, [
        'Box', 'box', 'BOX',
        'Cart', 'cart', 'CART',
        'ארגז', 'מספר ארגז', 'קרטון', 'מספר קרטון',
        'Box Number', 'Box No', 'Box #',
        'Carton', 'carton'
      ])

      return {
        // Row metadata
        rowNumber: headerRowIndex + index + 2, // Excel rows (1-based, +1 for header row, +1 for 0-index)

        // Mandatory fields (only these 3)
        scientificName: scientificName?.toString().trim() || null,
        size: size?.toString().trim() || null,
        boxNumber: boxNumber !== null ? parseInt(boxNumber) || boxNumber : null,

        // Store original row for debugging
        _originalRow: row,
      }
    })

    // Filter out empty rows (rows where all 3 fields are empty)
    const filteredData = mappedData.filter(row =>
      row.scientificName || row.size || row.boxNumber
    )

    // 6. Validate each row
    const validatedData = filteredData.map(row => {
      const validation = validateRow(row)

      return {
        ...row,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      }
    })

    // 7. Calculate summary
    const summary = {
      totalRows: validatedData.length,
      validRows: validatedData.filter(r => r.isValid).length,
      errorRows: validatedData.filter(r => !r.isValid).length,
    }

    // 8. Return results
    return {
      success: true,
      data: validatedData,
      summary,
    }

  } catch (error) {
    console.error('Error parsing Excel file:', error)

    // Return error result
    return {
      success: false,
      error: error.message || 'שגיאה בקריאת קובץ האקסל',
      data: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
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
