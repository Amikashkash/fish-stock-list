/**
 * Shipment.js
 *
 * Type definitions for shipment data models.
 * Used for Excel import and shipment management.
 */

/**
 * @typedef {Object} ExcelShipmentRow
 * @property {number} rowNumber - Row number in Excel (for error reporting)
 * @property {string|null} code - Supplier SKU code (can be null/missing)
 * @property {number} cart - Cart/batch number
 * @property {string} scientificName - Scientific name (Latin)
 * @property {string} commonName - Common/local name
 * @property {string} size - Fish size (flexible format)
 * @property {number} bags - Number of bags
 * @property {number} qtyPerBag - Quantity per bag
 * @property {number} total - Total quantity
 * @property {string|null} packingRatio - Packing ratio (e.g., "1:3")
 * @property {number|null} partOfCart - Percentage of cart
 * @property {number} price - Price per fish
 * @property {string} currency - Currency code (ILS or USD)
 * @property {boolean} isValid - Whether row passed validation
 * @property {Array<Object>} errors - Validation errors
 * @property {Array<Object>} warnings - Validation warnings
 * @property {string} codeStatus - 'valid' or 'missing'
 */

/**
 * @typedef {Object} ShipmentData
 * @property {string} shipmentId - Unique shipment ID
 * @property {string} farmId - Farm ID this shipment belongs to
 * @property {string} supplier - Supplier name
 * @property {Date} dateReceived - Date shipment was received
 * @property {number} totalItems - Number of different fish types
 * @property {number} totalFish - Total number of fish
 * @property {number} totalCost - Total cost of shipment
 * @property {string} currency - Primary currency
 * @property {string} status - Shipment status
 * @property {Array<ShipmentItem>} items - Fish items in shipment
 * @property {Array<EditHistoryEntry>} editHistory - Price edit history
 * @property {Date} createdAt - Creation timestamp
 * @property {string} createdBy - User ID who created
 */

/**
 * @typedef {Object} ShipmentItem
 * @property {string} code - Fish SKU code
 * @property {string} codeStatus - 'valid' or 'missing'
 * @property {string} scientificName - Scientific name
 * @property {string} commonName - Common name
 * @property {string} size - Fish size
 * @property {number} bags - Number of bags
 * @property {number} qtyPerBag - Quantity per bag
 * @property {number} total - Total quantity
 * @property {string|null} packingRatio - Packing ratio
 * @property {number|null} partOfCart - Percentage of cart
 * @property {Pricing} pricing - Price information
 */

/**
 * @typedef {Object} Pricing
 * @property {number} invoicePrice - Price from invoice
 * @property {string} currency - Currency code
 * @property {number} actualCostPerFish - Actual cost (manually edited for USD)
 * @property {string|null} priceNotes - Notes about price calculation
 */

/**
 * @typedef {Object} EditHistoryEntry
 * @property {Date} editedAt - When the edit was made
 * @property {string} editedBy - User ID who made the edit
 * @property {string} field - Which field was edited
 * @property {any} oldValue - Previous value
 * @property {any} newValue - New value
 * @property {string|null} notes - Notes about the edit
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {Array<ValidationError>} errors - Validation errors
 * @property {Array<ValidationWarning>} warnings - Validation warnings
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} field - Field with error
 * @property {string} message - Error message
 */

/**
 * @typedef {Object} ValidationWarning
 * @property {string} field - Field with warning
 * @property {string} message - Warning message
 */

/**
 * @typedef {Object} ImportSummary
 * @property {number} totalRows - Total rows in Excel
 * @property {number} validRows - Rows that passed validation
 * @property {number} errorRows - Rows with errors
 * @property {number} missingCodes - Rows with missing codes
 * @property {number} totalFish - Total number of fish
 * @property {number} totalCost - Total cost
 */

export {}
