/**
 * Reception Plan Model
 * Represents a plan for receiving new fish into the farm
 */

/**
 * Reception Plan statuses
 */
export const RECEPTION_STATUS = {
  PLANNING: 'planning',      // בתכנון - still adding fish to plan
  READY: 'ready',            // מוכן לקליטה - plan is ready, waiting for fish arrival
  IN_PROGRESS: 'in-progress', // בתהליך קבלה - currently receiving fish
  COMPLETED: 'completed',    // הושלם - all fish received
  CANCELLED: 'cancelled',    // בוטל - plan was cancelled
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
 * Create a new reception plan object
 */
export function createReceptionPlan({
  farmId,
  expectedDate,
  source,
  notes = '',
  shipmentReference = '',
}) {
  return {
    farmId,
    expectedDate,
    source, // 'excel' or 'manual'
    status: RECEPTION_STATUS.PLANNING,
    shipmentReference,
    notes,
    itemCount: 0,
    receivedCount: 0,
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
