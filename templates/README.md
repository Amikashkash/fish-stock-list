# Shipment Import Templates

## Overview

This folder contains the Excel template for importing shipments and related documentation.

---

## Files

- **`shipment-template.xlsx`** - Blank Excel template for users (to be created)
- **`template-guide.md`** - User-facing guide with examples and instructions
- **`README.md`** - This file (developer documentation)

---

## Template Structure

### Excel Format

**File Type:** Excel 2007+ (.xlsx) or Excel 97-2003 (.xls)

**Sheet:** First sheet (Sheet1) is used, others ignored

**Layout:**
```
Row 1: Headers (required)
Row 2+: Data rows
```

### Column Specification

Columns must appear in this **exact order**:

| Index | Column Name | Key | Type | Required | Default |
|-------|-------------|-----|------|----------|---------|
| 0 | Code | `code` | string | No | `MISSING-{timestamp}-{id}` |
| 1 | Cart | `cart` | number | Yes | - |
| 2 | Scientific Name | `scientificName` | string | Yes | - |
| 3 | Common Name | `commonName` | string | Yes | - |
| 4 | Size | `size` | string | Yes | - |
| 5 | Bags | `bags` | number | Yes | - |
| 6 | Qty/Bag | `qtyPerBag` | number | Yes | - |
| 7 | Total | `total` | number | Yes | - |
| 8 | Packing Ratio | `packingRatio` | string | No | null |
| 9 | Part of Cart | `partOfCart` | number | No | null |
| 10 | Price | `price` | number | Yes | - |
| 11 | Currency | `currency` | string | Yes | - |

---

## Parsing Implementation

### Library

**Recommended:** [SheetJS (xlsx)](https://sheetjs.com/)

```bash
npm install xlsx
```

### Parser Pseudocode

```javascript
import * as XLSX from 'xlsx'

/**
 * Parse Excel file and extract shipment data
 *
 * @param {File} file - Excel file from user upload
 * @returns {Object} Parsed data with validation results
 */
async function parseShipmentExcel(file) {
  // 1. Read file
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer)

  // 2. Get first sheet
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // 3. Convert to JSON (using header row)
  const rawData = XLSX.utils.sheet_to_json(worksheet)

  // 4. Map columns to our schema
  const mappedData = rawData.map((row, index) => {
    return {
      // Row metadata
      rowNumber: index + 2, // Excel rows (1-based, +1 for header)

      // Required fields
      code: row['Code'] || null, // May be missing
      cart: parseInt(row['Cart']),
      scientificName: row['Scientific Name'],
      commonName: row['Common Name'],
      size: row['Size'],
      bags: parseInt(row['Bags']),
      qtyPerBag: parseInt(row['Qty/Bag']),
      total: parseInt(row['Total']),
      price: parseFloat(row['Price']),
      currency: row['Currency'].toUpperCase(),

      // Optional fields
      packingRatio: row['Packing Ratio'] || null,
      partOfCart: row['Part of Cart'] ? parseFloat(row['Part of Cart']) : null,
    }
  })

  // 5. Validate each row
  const validatedData = mappedData.map(row => {
    const errors = []

    // Validation rules
    if (!row.scientificName) {
      errors.push('Scientific name is required')
    }

    if (!row.commonName) {
      errors.push('Common name is required')
    }

    if (isNaN(row.cart)) {
      errors.push('Cart must be a number')
    }

    if (isNaN(row.bags) || row.bags <= 0) {
      errors.push('Bags must be a positive number')
    }

    if (isNaN(row.qtyPerBag) || row.qtyPerBag <= 0) {
      errors.push('Qty/Bag must be a positive number')
    }

    if (isNaN(row.total) || row.total <= 0) {
      errors.push('Total must be a positive number')
    }

    // Check calculation
    const calculated = row.bags * row.qtyPerBag
    if (calculated !== row.total) {
      errors.push(`Total (${row.total}) doesn't match Bags × Qty/Bag (${calculated})`)
    }

    if (isNaN(row.price) || row.price <= 0) {
      errors.push('Price must be a positive number')
    }

    if (!['ILS', 'USD'].includes(row.currency)) {
      errors.push('Currency must be ILS or USD')
    }

    return {
      ...row,
      isValid: errors.length === 0,
      errors,
    }
  })

  // 6. Handle missing codes
  const dataWithCodes = validatedData.map(row => {
    if (!row.code) {
      // Generate dummy code
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      row.code = `MISSING-${timestamp}-${randomId}`
      row.codeStatus = 'missing'
      row.warnings = row.warnings || []
      row.warnings.push('Code missing - dummy code generated')
    } else {
      row.codeStatus = 'valid'
    }
    return row
  })

  // 7. Return results
  return {
    success: true,
    data: dataWithCodes,
    summary: {
      totalRows: dataWithCodes.length,
      validRows: dataWithCodes.filter(r => r.isValid).length,
      errorRows: dataWithCodes.filter(r => !r.isValid).length,
      missingCodes: dataWithCodes.filter(r => r.codeStatus === 'missing').length,
      totalFish: dataWithCodes.reduce((sum, r) => sum + r.total, 0),
      totalCost: dataWithCodes.reduce((sum, r) => sum + (r.total * r.price), 0),
    }
  }
}
```

### Error Handling

```javascript
try {
  const result = await parseShipmentExcel(file)

  if (result.summary.errorRows > 0) {
    // Show preview with errors highlighted
    showPreviewWithErrors(result.data)
  } else {
    // Show preview for confirmation
    showPreviewForConfirmation(result.data)
  }

} catch (error) {
  // Parsing failed completely
  if (error.message.includes('Unsupported file')) {
    showError('Please upload an Excel file (.xlsx or .xls)')
  } else {
    showError('Could not read Excel file. Please check the format.')
  }
}
```

---

## Data Validation

### Client-Side Validation

**Before Import:**

```javascript
function validateRow(row) {
  const errors = []
  const warnings = []

  // Required fields
  if (!row.scientificName?.trim()) {
    errors.push({ field: 'scientificName', message: 'Required' })
  }

  if (!row.commonName?.trim()) {
    errors.push({ field: 'commonName', message: 'Required' })
  }

  // Numeric validations
  if (!Number.isInteger(row.cart) || row.cart <= 0) {
    errors.push({ field: 'cart', message: 'Must be positive integer' })
  }

  if (!Number.isInteger(row.bags) || row.bags <= 0) {
    errors.push({ field: 'bags', message: 'Must be positive integer' })
  }

  if (!Number.isInteger(row.qtyPerBag) || row.qtyPerBag <= 0) {
    errors.push({ field: 'qtyPerBag', message: 'Must be positive integer' })
  }

  if (!Number.isInteger(row.total) || row.total <= 0) {
    errors.push({ field: 'total', message: 'Must be positive integer' })
  }

  // Price validation
  if (typeof row.price !== 'number' || row.price <= 0) {
    errors.push({ field: 'price', message: 'Must be positive number' })
  }

  if (row.price > 10000) {
    warnings.push({ field: 'price', message: 'Unusually high price' })
  }

  // Currency validation
  if (!['ILS', 'USD'].includes(row.currency)) {
    errors.push({ field: 'currency', message: 'Must be ILS or USD' })
  }

  // Calculation check
  const calculated = row.bags * row.qtyPerBag
  if (calculated !== row.total) {
    errors.push({
      field: 'total',
      message: `Should be ${calculated} (${row.bags} × ${row.qtyPerBag})`
    })
  }

  // Missing code warning (not error)
  if (!row.code) {
    warnings.push({ field: 'code', message: 'Code missing - will be generated' })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
```

### Server-Side Validation

**On Import (Firestore):**

```javascript
/**
 * Validate shipment data before writing to Firestore
 * This is a safety check - client should catch most errors
 */
function validateShipmentForFirestore(shipmentData) {
  // Check user has permission to create shipment
  if (!shipmentData.farmId) {
    throw new Error('Farm ID required')
  }

  // Validate each fish item
  for (const item of shipmentData.items) {
    // Required fields
    if (!item.scientificName) throw new Error('Scientific name required')
    if (!item.code) throw new Error('Code required (should be generated if missing)')
    if (!item.total || item.total <= 0) throw new Error('Invalid quantity')
    if (!item.price || item.price <= 0) throw new Error('Invalid price')

    // Currency check
    if (!['ILS', 'USD'].includes(item.currency)) {
      throw new Error('Invalid currency')
    }
  }

  return true
}
```

---

## Missing Code Generation

### Format

```
MISSING-{timestamp}-{randomId}
```

### Example

```
MISSING-1702345678-a3f8c2
```

### Implementation

```javascript
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
```

### Storage

```javascript
// In fish instance document
{
  code: "MISSING-1702345678-a3f8c2",
  codeStatus: "missing",  // or "valid"
  // ... other fields
}
```

### UI Display

```jsx
function CodeDisplay({ code, codeStatus }) {
  if (codeStatus === 'missing') {
    return (
      <div className="code-missing">
        <span className="warning-icon">⚠️</span>
        <span className="code-text">{code}</span>
        <span className="code-note">(Missing - can be added later)</span>
      </div>
    )
  }

  return <div className="code-valid">{code}</div>
}
```

---

## Cost Calculations

### Initial Cost (On Import)

```javascript
/**
 * Calculate initial costs when importing shipment
 */
function calculateInitialCosts(item) {
  return {
    // From invoice
    invoiceCostPerFish: item.price,

    // Same as invoice initially (no DOA yet)
    arrivalCostPerFish: item.price,

    // For USD invoices, this is just invoice price
    // User will update manually later
    currentCostPerFish: item.price,

    // Total invoice cost
    totalInvoiceCost: item.total * item.price,

    // Currency
    currency: item.currency,
  }
}
```

### After DOA Recording

```javascript
/**
 * Recalculate arrival cost after DOA reported
 */
function recalculateArrivalCost(fishInstance, doaCount) {
  const originalQty = fishInstance.originalQuantity
  const invoiceCost = fishInstance.costs.invoiceCostPerFish

  // New arrival cost spreads invoice cost over surviving fish
  const arrivalCostPerFish = (invoiceCost * originalQty) / (originalQty - doaCount)

  return {
    ...fishInstance.costs,
    arrivalCostPerFish,
    currentCostPerFish: arrivalCostPerFish, // Update current too
  }
}
```

### After Post-Reception Mortality

```javascript
/**
 * Recalculate current cost after mortality
 */
function recalculateCurrentCost(fishInstance, currentQuantity) {
  const originalQty = fishInstance.originalQuantity
  const invoiceCost = fishInstance.costs.invoiceCostPerFish

  // Current cost keeps rising as fish die
  const currentCostPerFish = (invoiceCost * originalQty) / currentQuantity

  return {
    ...fishInstance.costs,
    currentCostPerFish,
  }
}
```

---

## Import Flow (Technical)

### Step 1: File Upload

```javascript
// Client-side
async function handleFileUpload(event) {
  const file = event.target.files[0]

  // Validate file
  if (!file) return

  const validExtensions = ['.xlsx', '.xls']
  const extension = file.name.substring(file.name.lastIndexOf('.'))

  if (!validExtensions.includes(extension)) {
    showError('Please upload an Excel file (.xlsx or .xls)')
    return
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    showError('File too large. Maximum size: 10MB')
    return
  }

  // Parse file
  try {
    setLoading(true)
    const result = await parseShipmentExcel(file)
    showPreview(result)
  } catch (error) {
    showError('Could not read file: ' + error.message)
  } finally {
    setLoading(false)
  }
}
```

### Step 2: Preview & Validation

```jsx
function ImportPreview({ data, onConfirm, onCancel }) {
  const [editedData, setEditedData] = useState(data)

  // Allow inline editing
  function handleEdit(rowIndex, field, value) {
    const newData = [...editedData]
    newData[rowIndex][field] = value

    // Re-validate row
    const validation = validateRow(newData[rowIndex])
    newData[rowIndex].errors = validation.errors
    newData[rowIndex].warnings = validation.warnings
    newData[rowIndex].isValid = validation.isValid

    setEditedData(newData)
  }

  const canImport = editedData.every(row => row.isValid)

  return (
    <div className="import-preview">
      <h2>Import Preview</h2>

      <Summary data={editedData} />

      <DataTable
        data={editedData}
        onEdit={handleEdit}
        showErrors={true}
      />

      <Actions>
        <button onClick={onCancel}>Cancel</button>
        <button
          onClick={() => onConfirm(editedData)}
          disabled={!canImport}
        >
          Confirm Import ({editedData.length} items)
        </button>
      </Actions>
    </div>
  )
}
```

### Step 3: Firestore Write

```javascript
/**
 * Import shipment to Firestore
 * Creates shipment document and fish instance documents
 */
async function importShipment(farmId, shipmentData, items) {
  const batch = writeBatch(db)

  // 1. Create shipment document
  const shipmentRef = doc(collection(db, 'farms', farmId, 'shipments'))
  const shipmentId = shipmentRef.id

  batch.set(shipmentRef, {
    shipmentId,
    farmId,
    supplier: shipmentData.supplier,
    dateReceived: shipmentData.dateReceived,
    totalItems: items.length,
    totalFish: items.reduce((sum, item) => sum + item.total, 0),
    totalCost: items.reduce((sum, item) => sum + (item.total * item.price), 0),
    currency: items[0].currency, // Assuming all same currency
    status: 'received',
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid,
    editHistory: [],
  })

  // 2. Create fish instance documents
  for (const item of items) {
    const fishRef = doc(collection(db, 'farms', farmId, 'fish_instances'))
    const fishId = fishRef.id

    batch.set(fishRef, {
      instanceId: fishId,
      farmId,
      shipmentId,

      // Species info
      code: item.code,
      codeStatus: item.codeStatus,
      scientificName: item.scientificName,
      commonName: item.commonName,
      size: item.size,

      // Quantities
      originalQuantity: item.total,
      currentQuantity: item.total,

      // Costs
      costs: calculateInitialCosts(item),

      // Lifecycle
      phase: 'reception', // or 'growth' if marked as long-term
      lifecycle: 'short-term', // or 'growth'

      // Mortality tracking
      mortality: {
        reception: { doa: 0, deaths: 0 },
        postReception: { deaths: 0 },
        totalMortality: 0,
        mortalityRate: 0,
      },

      // Aquarium assignment
      aquariumId: null, // To be assigned later

      // Metadata
      createdAt: serverTimestamp(),
      importedBy: auth.currentUser.uid,
    })
  }

  // 3. Commit batch write
  await batch.commit()

  return {
    shipmentId,
    fishCount: items.length,
  }
}
```

---

## Template File Creation

### Creating shipment-template.xlsx

**Tool:** Microsoft Excel, Google Sheets, or LibreOffice Calc

**Structure:**

**Row 1 (Headers):**
```
A1: Code
B1: Cart
C1: Scientific Name
D1: Common Name
E1: Size
F1: Bags
G1: Qty/Bag
H1: Total
I1: Packing Ratio
J1: Part of Cart
K1: Price
L1: Currency
```

**Row 2 (Example - user should delete):**
```
A2: ANG-001
B2: 1
C2: Pterophyllum scalare
D2: מלאך
E2: 5-6cm
F2: 10
G2: 10
H2: 100
I2: 1:3
J2: 100
K2: 12.50
L2: ILS
```

**Formatting:**
- Headers: Bold
- Number columns: Number format (not text)
- Price column: Number format with 2 decimals
- All other columns: Text format

**Data Validation (Optional):**
- Currency column: Dropdown list (ILS, USD)
- Numeric columns: Whole number > 0
- Price column: Decimal > 0

**Protection (Optional):**
- Lock header row (prevent editing)
- Unlock data rows (allow editing)

---

## Testing

### Test Cases

**Test 1: Valid Import**
```
Input: Valid Excel with all required fields
Expected: Success, all fish created
```

**Test 2: Missing Codes**
```
Input: Excel with empty Code column
Expected: Success, dummy codes generated
```

**Test 3: Invalid Currency**
```
Input: Currency = "EUR"
Expected: Validation error shown
```

**Test 4: Calculation Mismatch**
```
Input: Bags=10, Qty/Bag=10, Total=95
Expected: Warning, ask user to confirm
```

**Test 5: Mixed Currencies**
```
Input: ILS and USD in same shipment
Expected: Success (system supports mixed)
```

**Test 6: Large File**
```
Input: 1000 rows
Expected: Success, batch writes work
```

**Test 7: Corrupted File**
```
Input: Renamed .txt to .xlsx
Expected: Error: "Could not read Excel file"
```

---

## Future Enhancements

### Version 2.0 Ideas

1. **Auto-mapping** - Detect columns even if order is wrong
2. **Multiple formats** - Support different supplier formats
3. **CSV import** - Alternative to Excel
4. **Bulk edit** - Edit multiple rows at once in preview
5. **Import history** - Track all imports, allow rollback
6. **Duplicate detection** - Warn if importing same fish twice
7. **Auto-pricing** - Suggest prices based on history
8. **Photo import** - Include fish photos in Excel

---

## References

- [SheetJS Documentation](https://docs.sheetjs.com/)
- [Firebase Batch Writes](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes)
- [Excel File Format Specs](https://www.microsoft.com/en-us/microsoft-365/excel)

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Planning Phase
