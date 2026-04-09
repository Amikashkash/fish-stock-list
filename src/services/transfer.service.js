/**
 * transfer.service.js
 *
 * Service for transferring fish between aquariums.
 * Handles moving fish instances from one aquarium to another with proper tracking.
 */

import { db } from '../firebase/config'
import {
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'

/**
 * Transfer fish from one aquarium to another
 * Updated to work with farmFish collection
 *
 * @param {string} farmId - Farm ID
 * @param {Object} transferData - Transfer details
 * @param {string} transferData.sourceAquariumId - Source aquarium ID
 * @param {string} transferData.destinationAquariumId - Destination aquarium ID
 * @param {string} transferData.fishInstanceId - Fish ID to transfer (fishId from farmFish)
 * @param {number} transferData.quantity - Number of fish to transfer
 * @param {string} [transferData.notes] - Optional transfer notes
 * @returns {Promise<Object>} Transfer result
 */
export async function transferFish(farmId, transferData) {
  try {
    const { sourceAquariumId, destinationAquariumId, fishInstanceId, quantity, notes } = transferData

    // Validation
    if (!farmId) throw new Error('Farm ID is required')
    if (!sourceAquariumId) throw new Error('Source aquarium is required')
    if (!destinationAquariumId) throw new Error('Destination aquarium is required')
    if (!fishInstanceId) throw new Error('Fish instance is required')
    if (!quantity || quantity <= 0) throw new Error('Quantity must be greater than 0')
    if (sourceAquariumId === destinationAquariumId) {
      throw new Error('Source and destination cannot be the same')
    }

    const { updateFarmFish, addFarmFish, updateAquariumStatus } = await import('./farm-fish.service')

    // Determine if this is a farmFish or fish_instance
    // getFishInAquarium now tags each entry with a 'source' field
    // We receive fishInstanceId and fishSource from the transfer data
    const fishSource = transferData.fishSource || 'farmFish'

    if (fishSource === 'fish_instance') {
      // ── Reception fish (fish_instances) ─────────────────────────────────
      const fishRef = doc(db, 'farms', farmId, 'fish_instances', fishInstanceId)
      const fishDoc = await getDoc(fishRef)
      if (!fishDoc.exists()) throw new Error('Fish not found')

      const fishData = fishDoc.data()
      if (fishData.aquariumId !== sourceAquariumId) throw new Error('Fish not found in source aquarium')

      const available = fishData.currentQuantity || 0
      if (available < quantity) throw new Error(`Not enough fish (available: ${available}, requested: ${quantity})`)

      const now = Timestamp.now()
      const remaining = available - quantity
      const batch = writeBatch(db)

      if (remaining === 0) {
        // Move all — just change aquariumId
        batch.update(fishRef, { aquariumId: destinationAquariumId, updatedAt: now })
      } else {
        // Partial — reduce source, create new instance in destination
        batch.update(fishRef, { currentQuantity: remaining, updatedAt: now })
        const { collection: col, addDoc, serverTimestamp } = await import('firebase/firestore')
        await addDoc(col(db, 'farms', farmId, 'fish_instances'), {
          ...fishData,
          aquariumId: destinationAquariumId,
          currentQuantity: quantity,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      await batch.commit()
      await updateAquariumStatus(farmId, sourceAquariumId)
      await updateAquariumStatus(farmId, destinationAquariumId)

      return {
        success: true,
        transferred: quantity,
        sourceAquariumId,
        destinationAquariumId,
        fishInstanceId,
        fishName: fishData.commonName || fishData.scientificName,
        remainingInSource: remaining,
      }
    }

    // ── Local fish (farmFish) ──────────────────────────────────────────────
    const fishRef = doc(db, 'farmFish', fishInstanceId)
    const fishDoc = await getDoc(fishRef)

    if (!fishDoc.exists()) {
      throw new Error('Fish not found')
    }

    const fishData = fishDoc.data()

    // Verify fish is in source aquarium
    if (fishData.aquariumId !== sourceAquariumId) {
      throw new Error('Fish not found in source aquarium')
    }

    if (fishData.quantity < quantity) {
      throw new Error(
        `Not enough fish (available: ${fishData.quantity}, requested: ${quantity})`
      )
    }

    const now = Timestamp.now()
    const remainingInSource = fishData.quantity - quantity

    if (remainingInSource === 0) {
      // Move all fish - just update aquariumId
      await updateFarmFish(farmId, fishInstanceId, {
        aquariumId: destinationAquariumId,
        updatedAt: now,
      })
    } else {
      // Split fish - reduce quantity in source and create new entry in destination
      const batch = writeBatch(db)
      batch.update(fishRef, { quantity: remainingInSource, updatedAt: now })
      await batch.commit()

      await addFarmFish(farmId, {
        hebrewName: fishData.hebrewName,
        scientificName: fishData.scientificName,
        size: fishData.size,
        quantity: quantity,
        source: fishData.source,
        notes: notes || fishData.notes || '',
        aquariumId: destinationAquariumId,
      })

      await updateAquariumStatus(farmId, sourceAquariumId)
    }

    // Aquarium statuses are now updated automatically by farm-fish.service functions

    return {
      success: true,
      transferred: quantity,
      sourceAquariumId,
      destinationAquariumId,
      fishInstanceId,
      fishName: fishData.hebrewName || fishData.scientificName,
      remainingInSource,
    }
  } catch (error) {
    console.error('Error transferring fish:', error)
    throw error
  }
}

/**
 * Get fish instances in a specific aquarium
 *
 * @param {string} farmId - Farm ID
 * @param {string} aquariumId - Aquarium ID
 * @returns {Promise<Array>} List of fish instances with details
 */
export async function getFishInAquarium(farmId, aquariumId) {
  try {
    if (!farmId) throw new Error('Farm ID is required')
    if (!aquariumId) throw new Error('Aquarium ID is required')

    const { getFarmFish } = await import('./farm-fish.service')
    const { collection: col, query, where, getDocs } = await import('firebase/firestore')

    // Local fish (farmFish)
    const allFish = await getFarmFish(farmId)
    const localFish = allFish
      .filter(fish => fish.aquariumId === aquariumId && (fish.quantity || 0) > 0)
      .map(fish => ({
        instanceId: fish.fishId,
        source: 'farmFish',
        quantity: fish.quantity,
        currentQuantity: fish.quantity,
        scientificName: fish.scientificName,
        commonName: fish.hebrewName,
        size: fish.size,
        code: fish.code || '',
        dateAdded: fish.createdAt,
      }))

    // Reception fish (fish_instances)
    const { db: database } = await import('../firebase/config')
    const instancesRef = col(database, 'farms', farmId, 'fish_instances')
    const instancesQuery = query(instancesRef, where('aquariumId', '==', aquariumId))
    const instancesSnapshot = await getDocs(instancesQuery)
    const receptionFish = instancesSnapshot.docs
      .map(doc => ({ instanceId: doc.id, ...doc.data() }))
      .filter(fish => (fish.currentQuantity || 0) > 0)
      .map(fish => ({
        instanceId: fish.instanceId,
        source: 'fish_instance',
        quantity: fish.currentQuantity,
        currentQuantity: fish.currentQuantity,
        scientificName: fish.scientificName,
        commonName: fish.commonName,
        size: fish.size,
        code: fish.code || '',
        dateAdded: fish.arrivalDate,
      }))

    return [...localFish, ...receptionFish]
  } catch (error) {
    console.error('Error getting fish in aquarium:', error)
    throw error
  }
}
