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
 *
 * @param {string} farmId - Farm ID
 * @param {Object} transferData - Transfer details
 * @param {string} transferData.sourceAquariumId - Source aquarium ID
 * @param {string} transferData.destinationAquariumId - Destination aquarium ID
 * @param {string} transferData.fishInstanceId - Fish instance ID to transfer
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

    const batch = writeBatch(db)
    const now = Timestamp.now()

    // Get references
    const sourceAquariumRef = doc(db, 'farms', farmId, 'aquariums', sourceAquariumId)
    const destAquariumRef = doc(db, 'farms', farmId, 'aquariums', destinationAquariumId)
    const fishInstanceRef = doc(db, 'farms', farmId, 'fish_instances', fishInstanceId)

    // Fetch documents
    const [sourceAquariumDoc, destAquariumDoc, fishInstanceDoc] = await Promise.all([
      getDoc(sourceAquariumRef),
      getDoc(destAquariumRef),
      getDoc(fishInstanceRef),
    ])

    if (!sourceAquariumDoc.exists()) throw new Error('Source aquarium not found')
    if (!destAquariumDoc.exists()) throw new Error('Destination aquarium not found')
    if (!fishInstanceDoc.exists()) throw new Error('Fish instance not found')

    const sourceAquarium = sourceAquariumDoc.data()
    const destAquarium = destAquariumDoc.data()
    const fishInstance = fishInstanceDoc.data()

    // Find fish in source aquarium
    const sourceFishEntry = sourceAquarium.fishInstances?.find(
      (f) => f.instanceId === fishInstanceId
    )

    if (!sourceFishEntry) {
      throw new Error('Fish not found in source aquarium')
    }

    if (sourceFishEntry.quantity < quantity) {
      throw new Error(
        `Not enough fish in source aquarium (available: ${sourceFishEntry.quantity}, requested: ${quantity})`
      )
    }

    // Calculate new quantities
    const remainingInSource = sourceFishEntry.quantity - quantity
    const updatedSourceFishInstances = sourceAquarium.fishInstances || []
    const updatedDestFishInstances = destAquarium.fishInstances || []

    // Update source aquarium fishInstances
    if (remainingInSource === 0) {
      // Remove fish completely from source
      const index = updatedSourceFishInstances.findIndex((f) => f.instanceId === fishInstanceId)
      if (index > -1) {
        updatedSourceFishInstances.splice(index, 1)
      }
    } else {
      // Update quantity in source
      const index = updatedSourceFishInstances.findIndex((f) => f.instanceId === fishInstanceId)
      if (index > -1) {
        updatedSourceFishInstances[index] = {
          ...updatedSourceFishInstances[index],
          quantity: remainingInSource,
        }
      }
    }

    // Update destination aquarium fishInstances
    const destFishEntry = updatedDestFishInstances.find((f) => f.instanceId === fishInstanceId)

    if (destFishEntry) {
      // Fish already exists in destination, add to quantity
      const index = updatedDestFishInstances.findIndex((f) => f.instanceId === fishInstanceId)
      if (index > -1) {
        updatedDestFishInstances[index] = {
          ...updatedDestFishInstances[index],
          quantity: destFishEntry.quantity + quantity,
        }
      }
    } else {
      // Add new fish entry to destination
      updatedDestFishInstances.push({
        instanceId: fishInstanceId,
        quantity: quantity,
        dateAdded: now,
      })
    }

    // Calculate new totals
    const newSourceTotal = updatedSourceFishInstances.reduce((sum, f) => sum + f.quantity, 0)
    const newDestTotal = updatedDestFishInstances.reduce((sum, f) => sum + f.quantity, 0)

    // Update source aquarium
    batch.update(sourceAquariumRef, {
      fishInstances: updatedSourceFishInstances,
      totalFish: newSourceTotal,
      status: newSourceTotal === 0 ? 'empty' : sourceAquarium.status,
      updatedAt: now,
    })

    // Update destination aquarium
    batch.update(destAquariumRef, {
      fishInstances: updatedDestFishInstances,
      totalFish: newDestTotal,
      status: newDestTotal > 0 ? 'occupied' : destAquarium.status,
      updatedAt: now,
    })

    // Update fish instance aquariumId if all fish moved
    if (remainingInSource === 0) {
      batch.update(fishInstanceRef, {
        aquariumId: destinationAquariumId,
        updatedAt: now,
      })
    }
    // If fish split between aquariums, keep aquariumId as source (or set to null for "split")
    // This is a design choice - you may want to handle differently

    // Commit all updates
    await batch.commit()

    return {
      success: true,
      transferred: quantity,
      sourceAquariumId,
      destinationAquariumId,
      fishInstanceId,
      fishName: fishInstance.commonName || fishInstance.scientificName,
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

    const aquariumRef = doc(db, 'farms', farmId, 'aquariums', aquariumId)
    const aquariumDoc = await getDoc(aquariumRef)

    if (!aquariumDoc.exists()) {
      throw new Error('Aquarium not found')
    }

    const aquarium = aquariumDoc.data()
    const fishInstances = aquarium.fishInstances || []

    if (fishInstances.length === 0) {
      return []
    }

    // Fetch full fish instance details
    const fishDetails = await Promise.all(
      fishInstances.map(async (fishEntry) => {
        const fishInstanceRef = doc(db, 'farms', farmId, 'fish_instances', fishEntry.instanceId)
        const fishInstanceDoc = await getDoc(fishInstanceRef)

        if (!fishInstanceDoc.exists()) {
          console.warn(`Fish instance ${fishEntry.instanceId} not found`)
          return null
        }

        const fishData = fishInstanceDoc.data()

        return {
          instanceId: fishEntry.instanceId,
          quantity: fishEntry.quantity,
          dateAdded: fishEntry.dateAdded,
          // Fish details
          code: fishData.code,
          scientificName: fishData.scientificName,
          commonName: fishData.commonName,
          size: fishData.size,
          currentQuantity: fishData.currentQuantity,
        }
      })
    )

    // Filter out null entries (fish instances that weren't found)
    return fishDetails.filter((f) => f !== null)
  } catch (error) {
    console.error('Error getting fish in aquarium:', error)
    throw error
  }
}
