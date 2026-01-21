/**
 * shipment.service.js
 *
 * Service for managing shipments in Firestore.
 * Handles creation, updates, and queries for shipment data.
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '../firebase/config'

/**
 * Calculate initial costs for fish instance
 * Simplified version - costs will be updated later
 *
 * @param {Object} item - Shipment item
 * @returns {Object} Cost structure
 */
function calculateInitialCosts(item) {
  const price = item.price || 0
  const quantity = item.total || item.quantity || 1

  return {
    // From invoice (0 if not provided)
    invoiceCostPerFish: price,

    // Same as invoice initially (no DOA yet)
    arrivalCostPerFish: price,

    // For USD invoices, this is just invoice price initially
    currentCostPerFish: price,

    // Total invoice cost
    totalInvoiceCost: quantity * price,

    // Currency - default to ILS if not provided
    currency: item.currency || 'ILS',

    // Flags
    profitableAtWholesale: true,
  }
}

/**
 * Import shipment to Firestore
 * Creates shipment document and fish instance documents in a batch
 *
 * @param {string} farmId - Farm ID
 * @param {Object} shipmentData - Shipment metadata
 * @param {Array} items - Fish items from Excel
 * @returns {Promise<Object>} Result with shipmentId and fish count
 */
export async function importShipment(farmId, shipmentData, items) {
  try {
    const batch = writeBatch(db)
    const userId = auth.currentUser?.uid

    if (!userId) {
      throw new Error('User not authenticated')
    }

    if (!farmId) {
      throw new Error('Farm ID is required')
    }

    if (!items || items.length === 0) {
      throw new Error('No items to import')
    }

    // 1. Create shipment document reference
    const shipmentsRef = collection(db, 'farms', farmId, 'shipments')
    const shipmentRef = doc(shipmentsRef)
    const shipmentId = shipmentRef.id

    // Calculate totals (handle missing price/total fields)
    const totalFish = items.reduce((sum, item) => sum + (item.total || item.quantity || 1), 0)
    const totalCost = items.reduce((sum, item) => {
      const qty = item.total || item.quantity || 1
      const price = item.price || 0
      return sum + (qty * price)
    }, 0)

    // 2. Set shipment document
    batch.set(shipmentRef, {
      shipmentId,
      farmId,
      supplier: shipmentData.supplier || 'לא צוין',
      dateReceived: shipmentData.dateReceived || new Date(),
      totalItems: items.length,
      totalFish,
      totalCost,
      currency: items[0]?.currency || 'ILS', // Default to ILS
      status: 'received',
      notes: shipmentData.notes || null,
      createdAt: serverTimestamp(),
      createdBy: userId,
      editHistory: [],
    })

    // 3. Create fish instance documents
    const fishInstancesRef = collection(db, 'farms', farmId, 'fish_instances')

    for (const item of items) {
      const fishRef = doc(fishInstancesRef)
      const fishId = fishRef.id
      const quantity = item.total || item.quantity || 1

      batch.set(fishRef, {
        instanceId: fishId,
        farmId,
        shipmentId,

        // Species info (handle simplified parser)
        code: item.code || '',
        codeStatus: item.codeStatus || 'unknown',
        scientificName: item.scientificName || '',
        commonName: item.commonName || '',
        size: item.size || '',

        // Additional metadata (optional fields)
        packingRatio: item.packingRatio || null,
        partOfCart: item.partOfCart || null,
        cart: item.cart || item.boxNumber || null,

        // Quantities
        originalQuantity: quantity,
        currentQuantity: quantity,

        // Costs
        costs: calculateInitialCosts(item),

        // Lifecycle
        phase: 'reception',
        lifecycle: 'short-term',

        // Mortality tracking
        mortality: {
          reception: {
            doa: 0,
            deaths: 0
          },
          postReception: {
            deaths: 0
          },
          totalMortality: 0,
          mortalityRate: 0,
        },

        // Aquarium assignment
        aquariumId: null,

        // Treatment tracking
        allTreatments: [],

        // Growth tracking (if applicable)
        growthTracking: null,

        // Metadata
        createdAt: serverTimestamp(),
        importedBy: userId,
        updatedAt: serverTimestamp(),
      })
    }

    // 4. Commit batch write
    await batch.commit()

    console.log(`Shipment ${shipmentId} imported successfully with ${items.length} fish types`)

    return {
      success: true,
      shipmentId,
      fishCount: items.length,
      totalFish,
    }

  } catch (error) {
    console.error('Error importing shipment:', error)
    throw new Error(`Failed to import shipment: ${error.message}`)
  }
}

/**
 * Get all shipments for a farm
 *
 * @param {string} farmId - Farm ID
 * @returns {Promise<Array>} List of shipments
 */
export async function getShipments(farmId) {
  try {
    if (!farmId) {
      throw new Error('Farm ID is required')
    }

    const shipmentsRef = collection(db, 'farms', farmId, 'shipments')
    const q = query(shipmentsRef, orderBy('dateReceived', 'desc'))
    const snapshot = await getDocs(q)

    const shipments = []
    snapshot.forEach(doc => {
      shipments.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return shipments

  } catch (error) {
    console.error('Error fetching shipments:', error)
    throw new Error(`Failed to fetch shipments: ${error.message}`)
  }
}

/**
 * Get a single shipment by ID
 *
 * @param {string} farmId - Farm ID
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise<Object>} Shipment data
 */
export async function getShipment(farmId, shipmentId) {
  try {
    if (!farmId || !shipmentId) {
      throw new Error('Farm ID and Shipment ID are required')
    }

    const shipmentRef = doc(db, 'farms', farmId, 'shipments', shipmentId)
    const snapshot = await getDoc(shipmentRef)

    if (!snapshot.exists()) {
      throw new Error('Shipment not found')
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    }

  } catch (error) {
    console.error('Error fetching shipment:', error)
    throw new Error(`Failed to fetch shipment: ${error.message}`)
  }
}

/**
 * Get fish instances for a shipment
 *
 * @param {string} farmId - Farm ID
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise<Array>} List of fish instances
 */
export async function getShipmentFish(farmId, shipmentId) {
  try {
    if (!farmId || !shipmentId) {
      throw new Error('Farm ID and Shipment ID are required')
    }

    const fishRef = collection(db, 'farms', farmId, 'fish_instances')
    const q = query(fishRef, where('shipmentId', '==', shipmentId))
    const snapshot = await getDocs(q)

    const fish = []
    snapshot.forEach(doc => {
      fish.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return fish

  } catch (error) {
    console.error('Error fetching shipment fish:', error)
    throw new Error(`Failed to fetch shipment fish: ${error.message}`)
  }
}
