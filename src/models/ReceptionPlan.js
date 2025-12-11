/**
 * Reception Plan Model
 * Represents a plan for receiving new fish into the farm
 */

/**
 * Reception Plan statuses - Multi-stage workflow
 */
export const RECEPTION_STATUS = {
  PLANNING: 'planning',              // בתכנון - Initial plan creation
  PROFORMA_RECEIVED: 'proforma_received', // פרופורמה התקבלה - Initial fish list received
  FINALIZED: 'finalized',            // סופי - Fish list and aquarium assignments finalized
  LOCKED: 'locked',                  // נעול - Plan locked, ready for reception
  IN_PROGRESS: 'in-progress',        // בתהליך קבלה - Currently receiving fish
  COMPLETED: 'completed',            // הושלם - All fish received
  CANCELLED: 'cancelled',            // בוטל - Plan was cancelled
}

/**
 * Reception Item statuses
 */
export const RECEPTION_ITEM_STATUS = {
  PLANNED: 'planned',     // מתוכנן - fish assigned to aquarium
  RECEIVED: 'received',   // התקבל - fish physically received and added
  CANCELLED: 'cancelled', // בוטל - this item was cancelled
}

/**
 * Validate reception plan data
 */
export function validateReceptionPlan(data) {
  const errors = []

  if (!data.expectedDate) {
    errors.push('תאריך משלוח חסר')
  }

  if (!data.source || !['excel', 'manual'].includes(data.source)) {
    errors.push('מקור נתונים לא חוקי')
  }

  if (!data.countryOfOrigin || !data.countryOfOrigin.trim()) {
    errors.push('ארץ מוצא חסרה')
  }

  if (!data.supplierName || !data.supplierName.trim()) {
    errors.push('שם ספק/חוות מקור חסר')
  }

  if (!data.targetRoom || !data.targetRoom.trim()) {
    errors.push('חדר/אזור יעד חסר')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate that all items in a plan have aquarium assignments
 */
export function validatePlanComplete(items) {
  const errors = []

  if (!items || items.length === 0) {
    errors.push('אין פריטים בתוכנית')
    return { valid: false, errors }
  }

  const unassignedItems = items.filter((item) => !item.targetAquariumId)
  if (unassignedItems.length > 0) {
    errors.push(`${unassignedItems.length} פריטים ללא אקווריום מוקצה`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate reception item data
 */
export function validateReceptionItem(data) {
  const errors = []

  if (!data.hebrewName || !data.hebrewName.trim()) {
    errors.push('שם עברי חסר')
  }

  if (!data.size || !data.size.trim()) {
    errors.push('גודל חסר')
  }

  if (!data.targetAquariumId) {
    errors.push('אקווריום יעד חסר')
  }

  if (data.quantity && data.quantity <= 0) {
    errors.push('כמות חייבת להיות גדולה מ-0')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generate a shipment reference if not provided
 */
export function generateShipmentReference() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  return `משלוח-${year}-${month}${day}-${timestamp}`
}

/**
 * Calculate work requirements from items
 * Shows how many aquariums of each size are needed by room
 */
export function calculateWorkRequirements(items) {
  if (!items || items.length === 0) {
    return {
      bySize: {},
      byRoom: {},
      totalItems: 0,
      totalAquariumsNeeded: 0,
    }
  }

  const bySize = {}
  const byRoom = {}

  items.forEach((item) => {
    const size = item.size || 'unknown'
    const room = item.targetRoom || 'unknown'

    // Aggregate by size
    if (!bySize[size]) {
      bySize[size] = { count: 0, items: [] }
    }
    bySize[size].count += 1
    bySize[size].items.push(item.hebrewName)

    // Aggregate by room
    if (!byRoom[room]) {
      byRoom[room] = { count: 0, sizes: {} }
    }
    byRoom[room].count += 1

    if (!byRoom[room].sizes[size]) {
      byRoom[room].sizes[size] = 0
    }
    byRoom[room].sizes[size] += 1
  })

  return {
    bySize,
    byRoom,
    totalItems: items.length,
    totalAquariumsNeeded: items.length,
  }
}

/**
 * Create a new reception plan object
 */
export function createReceptionPlan({
  farmId,
  expectedDate,
  source,
  countryOfOrigin = '',
  supplierName = '',
  targetRoom = '',
  notes = '',
  shipmentReference = '',
  expectedAquariumCount = 0,
}) {
  return {
    farmId,
    expectedDate,
    source, // 'excel' or 'manual'
    status: RECEPTION_STATUS.PLANNING,
    countryOfOrigin,
    supplierName,
    targetRoom,
    shipmentReference: shipmentReference || generateShipmentReference(),
    notes,
    expectedAquariumCount,
    itemCount: 0,
    receivedCount: 0,
    isLocked: false,
    lastEditedAt: null,
    lastEditedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create a new reception item object
 */
export function createReceptionItem({
  planId,
  farmId,
  hebrewName,
  scientificName = '',
  size,
  boxNumber = '',
  targetAquariumId,
  targetAquariumNumber = '',
  targetRoom = '',
  quantity = 1,
  notes = '',
  code = '',
}) {
  return {
    planId,
    farmId,
    hebrewName,
    scientificName,
    size,
    boxNumber,
    code,
    targetAquariumId,
    targetAquariumNumber,
    targetRoom,
    quantity,
    status: RECEPTION_ITEM_STATUS.PLANNED,
    notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
