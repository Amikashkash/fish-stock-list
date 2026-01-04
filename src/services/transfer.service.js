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

    // Import services dynamically
    const { updateFarmFish, addFarmFish } = await import('./farm-fish.service')
    const { collection: firestoreCollection, query, where, getDocs } = await import('firebase/firestore')

    // Get the fish record
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
      // updateFarmFish will automatically update both source and destination aquarium statuses
      await updateFarmFish(farmId, fishInstanceId, {
        aquariumId: destinationAquariumId,
        updatedAt: now,
      })
    } else {
      // Split fish - reduce quantity in source and create new entry in destination
      const batch = writeBatch(db)

      // Update source fish quantity
      batch.update(fishRef, {
        quantity: remainingInSource,
        updatedAt: now,
      })

      await batch.commit()

      // Create new fish entry in destination
      // addFarmFish will automatically update destination aquarium status
      await addFarmFish(farmId, {
        hebrewName: fishData.hebrewName,
        scientificName: fishData.scientificName,
        size: fishData.size,
        quantity: quantity,
        source: fishData.source,
        notes: notes || fishData.notes || '',
        aquariumId: destinationAquariumId,
      })

      // Manually update source aquarium status since we used batch.update
      const { updateAquariumStatus } = await import('./farm-fish.service')
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

    // Import getFarmFish dynamically to avoid circular dependency
    const { getFarmFish } = await import('./farm-fish.service')

    // Get all farm fish
    const allFish = await getFarmFish(farmId)

    // Filter fish in this specific aquarium
    const fishInAquarium = allFish.filter(fish => fish.aquariumId === aquariumId)

    // Transform to expected format for FishTransferModal
    return fishInAquarium.map(fish => ({
      instanceId: fish.fishId, // Using fishId as instanceId for compatibility
      quantity: fish.quantity,
      dateAdded: fish.createdAt,
      code: fish.code || '',
      scientificName: fish.scientificName,
      commonName: fish.hebrewName, // Using hebrewName as commonName
      size: fish.size,
      currentQuantity: fish.quantity,
    }))
  } catch (error) {
    console.error('Error getting fish in aquarium:', error)
    throw error
  }
}
