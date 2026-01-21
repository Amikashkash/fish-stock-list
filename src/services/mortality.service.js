import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Record a mortality event for fish
 * @param {string} farmId - The farm ID
 * @param {Object} eventData - Mortality event data
 * @returns {Promise<string>} - Event ID
 */
export async function recordMortalityEvent(farmId, eventData) {
  const {
    fishSource, // 'reception' | 'local'
    fishId, // instanceId or farmFishId
    scientificName,
    commonName,
    aquariumId,
    aquariumNumber,
    mortalityType, // 'doa' | 'reception' | 'regular'
    quantity,
    cause, // Optional: 'disease', 'aggression', 'environmental', 'unknown', etc.
    notes,
    receptionDate, // For reception fish
  } = eventData

  const event = {
    farmId,
    fishSource,
    fishId,
    scientificName,
    commonName,
    aquariumId: aquariumId || null,
    aquariumNumber: aquariumNumber || null,
    mortalityType,
    quantity,
    cause: cause || 'unknown',
    notes: notes || '',
    timestamp: Timestamp.now(),
    createdAt: Timestamp.now(),
  }

  // Add reception-specific data
  if (fishSource === 'reception' && receptionDate) {
    event.receptionDate = receptionDate
    // Handle both Firestore Timestamp and JavaScript Date objects
    const dateObj = receptionDate.toDate ? receptionDate.toDate() : new Date(receptionDate)
    event.daysFromReception = Math.floor(
      (Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  const docRef = await addDoc(collection(db, 'farms', farmId, 'mortality_events'), event)

  // Update fish quantity
  if (fishSource === 'reception') {
    await updateFishInstanceQuantity(farmId, fishId, quantity)
  } else if (fishSource === 'local') {
    await updateLocalFishQuantity(farmId, fishId, quantity)
  }

  return docRef.id
}

/**
 * Update fish instance quantity after mortality
 */
async function updateFishInstanceQuantity(farmId, instanceId, mortalityQuantity) {
  // Get current quantity using getDoc directly
  const { getDoc } = await import('firebase/firestore')
  const instanceRef = doc(db, 'farms', farmId, 'fish_instances', instanceId)
  const instanceSnap = await getDoc(instanceRef)

  if (instanceSnap.exists()) {
    const currentQuantity = instanceSnap.data().currentQuantity || 0
    const newQuantity = Math.max(0, currentQuantity - mortalityQuantity)

    const updates = {
      currentQuantity: newQuantity,
      updatedAt: Timestamp.now(),
    }

    // Remove from aquarium if quantity reaches 0
    if (newQuantity === 0) {
      updates.aquariumId = null
    }

    await updateDoc(instanceRef, updates)
  }
}

/**
 * Update local fish quantity after mortality
 */
async function updateLocalFishQuantity(farmId, farmFishId, mortalityQuantity) {
  const fishRef = doc(db, 'farmFish', farmFishId)

  // Get current quantity using getDoc directly
  const { getDoc } = await import('firebase/firestore')
  const fishSnap = await getDoc(fishRef)

  if (fishSnap.exists()) {
    const currentQuantity = fishSnap.data().quantity || 0
    const newQuantity = Math.max(0, currentQuantity - mortalityQuantity)

    const updates = {
      quantity: newQuantity,
      updatedAt: Timestamp.now(),
    }

    // Remove from aquarium if quantity reaches 0
    if (newQuantity === 0) {
      updates.aquariumId = null
    }

    await updateDoc(fishRef, updates)
  }
}

/**
 * Get mortality events with filters
 * @param {string} farmId - The farm ID
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} - Array of mortality events
 */
export async function getMortalityEvents(farmId, filters = {}) {
  const { fishId, mortalityType, startDate, endDate, limitCount = 100 } = filters

  let q = query(
    collection(db, 'farms', farmId, 'mortality_events'),
    orderBy('timestamp', 'desc')
  )

  if (fishId) {
    q = query(q, where('fishId', '==', fishId))
  }

  if (mortalityType) {
    q = query(q, where('mortalityType', '==', mortalityType))
  }

  if (limitCount) {
    q = query(q, limit(limitCount))
  }

  const snapshot = await getDocs(q)
  let events = snapshot.docs.map((doc) => ({
    eventId: doc.id,
    ...doc.data(),
  }))

  // Client-side date filtering (Firestore doesn't allow complex queries)
  if (startDate) {
    events = events.filter((e) => e.timestamp.toDate() >= startDate)
  }
  if (endDate) {
    events = events.filter((e) => e.timestamp.toDate() <= endDate)
  }

  return events
}

/**
 * Calculate mortality rate for a fish
 * @param {string} farmId - The farm ID
 * @param {string} fishId - Fish instance or farmFish ID
 * @param {string} fishSource - 'reception' | 'local'
 * @param {number} initialQuantity - Initial fish quantity
 * @returns {Promise<Object>} - Mortality statistics
 */
export async function calculateMortalityRate(farmId, fishId, fishSource, initialQuantity) {
  const events = await getMortalityEvents(farmId, { fishId })

  const totalDeaths = events.reduce((sum, event) => sum + event.quantity, 0)
  const mortalityRate = initialQuantity > 0 ? (totalDeaths / initialQuantity) * 100 : 0

  // Calculate DOA rate (deaths on arrival)
  const doaEvents = events.filter((e) => e.mortalityType === 'doa')
  const doaDeaths = doaEvents.reduce((sum, event) => sum + event.quantity, 0)
  const doaRate = initialQuantity > 0 ? (doaDeaths / initialQuantity) * 100 : 0

  // Calculate reception period mortality (first 14 days)
  const receptionEvents = events.filter(
    (e) => e.mortalityType === 'reception' || (e.daysFromReception && e.daysFromReception <= 14)
  )
  const receptionDeaths = receptionEvents.reduce((sum, event) => sum + event.quantity, 0)
  const receptionMortalityRate = initialQuantity > 0 ? (receptionDeaths / initialQuantity) * 100 : 0

  // Calculate early mortality (first 30 days)
  const earlyEvents = events.filter((e) => e.daysFromReception && e.daysFromReception <= 30)
  const earlyDeaths = earlyEvents.reduce((sum, event) => sum + event.quantity, 0)
  const earlyMortalityRate = initialQuantity > 0 ? (earlyDeaths / initialQuantity) * 100 : 0

  return {
    totalDeaths,
    mortalityRate,
    doa: {
      deaths: doaDeaths,
      rate: doaRate,
    },
    reception: {
      deaths: receptionDeaths,
      rate: receptionMortalityRate,
    },
    earlyMortality: {
      deaths: earlyDeaths,
      rate: earlyMortalityRate,
    },
    eventCount: events.length,
    events,
  }
}

/**
 * Detect abnormal mortality patterns
 * @param {string} farmId - The farm ID
 * @param {Object} eventData - New mortality event data
 * @returns {Promise<Object>} - Alert information
 */
export async function detectAbnormalMortality(farmId, eventData) {
  const { fishId, quantity, fishSource } = eventData

  // Get recent mortality stats
  const stats = await calculateMortalityRate(farmId, fishId, fishSource, 100) // Assume 100 for percentage calc

  const alerts = []

  // Alert: High DOA rate (>10%)
  if (stats.doa.rate > 10) {
    alerts.push({
      type: 'high_doa',
      severity: 'critical',
      message: `שיעור תמותה גבוה בהגעה: ${stats.doa.rate.toFixed(1)}%`,
      recommendation: 'בדוק איכות משלוח וספק',
    })
  }

  // Alert: High reception mortality (>15%)
  if (stats.reception.rate > 15) {
    alerts.push({
      type: 'high_reception_mortality',
      severity: 'high',
      message: `תמותה גבוהה בתקופת קליטה: ${stats.reception.rate.toFixed(1)}%`,
      recommendation: 'בדוק תנאי אקווריום ותהליך אקלום',
    })
  }

  // Alert: Sudden spike (>30% of remaining fish died at once)
  if (quantity > 30) {
    alerts.push({
      type: 'sudden_spike',
      severity: 'critical',
      message: `תמותה פתאומית של ${quantity} דגים`,
      recommendation: 'בדוק מחלות, איכות מים, והתנהגות תוקפנית',
    })
  }

  // Alert: Multiple deaths in short period
  const recentEvents = await getMortalityEvents(farmId, {
    fishId,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  })

  if (recentEvents.length >= 3) {
    alerts.push({
      type: 'repeated_deaths',
      severity: 'high',
      message: `${recentEvents.length} אירועי תמותה בשבוע האחרון`,
      recommendation: 'בדוק תנאים סביבתיים ומחלות פוטנציאליות',
    })
  }

  return {
    hasAlerts: alerts.length > 0,
    alerts,
    stats,
  }
}

/**
 * Get mortality summary for farm/species/supplier
 * @param {string} farmId - The farm ID
 * @param {Object} filters - Aggregation filters
 * @returns {Promise<Object>} - Summary statistics
 */
export async function getMortalitySummary(farmId, filters = {}) {
  const { scientificName, supplier, days = 30 } = filters

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  let events = await getMortalityEvents(farmId, { startDate })

  // Filter by species
  if (scientificName) {
    events = events.filter((e) => e.scientificName === scientificName)
  }

  // Group by cause
  const byCause = {}
  events.forEach((event) => {
    const cause = event.cause || 'unknown'
    if (!byCause[cause]) {
      byCause[cause] = { count: 0, totalDeaths: 0 }
    }
    byCause[cause].count++
    byCause[cause].totalDeaths += event.quantity
  })

  // Group by type
  const byType = {}
  events.forEach((event) => {
    const type = event.mortalityType
    if (!byType[type]) {
      byType[type] = { count: 0, totalDeaths: 0 }
    }
    byType[type].count++
    byType[type].totalDeaths += event.quantity
  })

  return {
    totalEvents: events.length,
    totalDeaths: events.reduce((sum, e) => sum + e.quantity, 0),
    byCause,
    byType,
    period: `${days} ימים`,
  }
}
