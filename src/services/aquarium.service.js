import { db } from '../firebase/config'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { recordMortalityEvent } from './mortality.service'

/**
 * Creates a new aquarium
 * @param {string} farmId - Farm ID
 * @param {Object} aquariumData - Aquarium data
 * @returns {Promise<{aquariumId: string, aquarium: Object}>}
 */
export async function createAquarium(farmId, aquariumData) {
  try {
    const aquariumsRef = collection(db, 'farms', farmId, 'aquariums')

    const newAquarium = {
      ...aquariumData,
      fishInstances: aquariumData.fishInstances || [],
      totalFish: aquariumData.totalFish || 0,
      occupancyRate: aquariumData.occupancyRate || 0,
      equipment: aquariumData.equipment || {
        heater: false,
        filter: false,
        aerator: false,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const docRef = await addDoc(aquariumsRef, newAquarium)

    // Update the document with its own ID
    await updateDoc(docRef, { aquariumId: docRef.id })

    return {
      aquariumId: docRef.id,
      aquarium: { ...newAquarium, aquariumId: docRef.id },
    }
  } catch (error) {
    console.error('Error creating aquarium:', error)
    throw error
  }
}

/**
 * Gets all aquariums for a farm
 * @param {string} farmId - Farm ID
 * @returns {Promise<Array>}
 */
export async function getAquariums(farmId) {
  try {
    const aquariumsRef = collection(db, 'farms', farmId, 'aquariums')
    const snapshot = await getDocs(aquariumsRef)

    const aquariums = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        aquariumId: doc.id,
        // Convert Firestore Timestamps to Dates
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        lastCleaned: data.lastCleaned?.toDate?.() || data.lastCleaned,
        lastWaterChange: data.lastWaterChange?.toDate?.() || data.lastWaterChange,
      }
    })

    // Sort by aquariumNumber as a number (not string)
    aquariums.sort((a, b) => {
      const numA = parseInt(a.aquariumNumber) || 0
      const numB = parseInt(b.aquariumNumber) || 0
      return numA - numB
    })

    return aquariums
  } catch (error) {
    console.error('Error getting aquariums:', error)
    throw error
  }
}

/**
 * Gets a single aquarium by ID
 * @param {string} farmId - Farm ID
 * @param {string} aquariumId - Aquarium ID
 * @returns {Promise<Object|null>}
 */
export async function getAquarium(farmId, aquariumId) {
  try {
    const aquariumRef = doc(db, 'farms', farmId, 'aquariums', aquariumId)
    const snapshot = await getDoc(aquariumRef)

    if (!snapshot.exists()) {
      return null
    }

    const data = snapshot.data()
    return {
      ...data,
      aquariumId: snapshot.id,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      lastCleaned: data.lastCleaned?.toDate?.() || data.lastCleaned,
      lastWaterChange: data.lastWaterChange?.toDate?.() || data.lastWaterChange,
    }
  } catch (error) {
    console.error('Error getting aquarium:', error)
    throw error
  }
}

/**
 * Updates an aquarium
 * @param {string} farmId - Farm ID
 * @param {string} aquariumId - Aquarium ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateAquarium(farmId, aquariumId, updates) {
  try {
    const aquariumRef = doc(db, 'farms', farmId, 'aquariums', aquariumId)

    await updateDoc(aquariumRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error updating aquarium:', error)
    throw error
  }
}

/**
 * Fix all aquarium statuses - one-time repair function
 * Recalculates status for ALL aquariums based on actual fish count
 * @param {string} farmId - Farm ID
 * @returns {Promise<{fixed: number, errors: number}>}
 */
export async function fixAllAquariumStatuses(farmId) {
  try {
    // Import updateAquariumStatus from farm-fish service
    const { updateAquariumStatus } = await import('./farm-fish.service')

    // Get all aquariums
    const aquariums = await getAquariums(farmId)

    let fixed = 0
    let errors = 0

    // Update status for each aquarium
    for (const aquarium of aquariums) {
      try {
        await updateAquariumStatus(farmId, aquarium.aquariumId)
        fixed++
      } catch (err) {
        console.error(`Error fixing aquarium ${aquarium.aquariumNumber}:`, err)
        errors++
      }
    }

    return { fixed, errors, total: aquariums.length }
  } catch (error) {
    console.error('Error fixing all aquarium statuses:', error)
    throw error
  }
}

/**
 * Deletes an aquarium
 * @param {string} farmId - Farm ID
 * @param {string} aquariumId - Aquarium ID
 * @returns {Promise<void>}
 */
export async function deleteAquarium(farmId, aquariumId) {
  try {
    const aquariumRef = doc(db, 'farms', farmId, 'aquariums', aquariumId)
    await deleteDoc(aquariumRef)
  } catch (error) {
    console.error('Error deleting aquarium:', error)
    throw error
  }
}

/**
 * Gets empty aquariums
 * @param {string} farmId - Farm ID
 * @returns {Promise<Array>}
 */
export async function getEmptyAquariums(farmId) {
  try {
    const aquariumsRef = collection(db, 'farms', farmId, 'aquariums')
    const q = query(aquariumsRef, where('status', '==', 'empty'))
    const snapshot = await getDocs(q)

    const aquariums = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        aquariumId: doc.id,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      }
    })

    // Sort by aquariumNumber as a number (not string)
    aquariums.sort((a, b) => {
      const numA = parseInt(a.aquariumNumber) || 0
      const numB = parseInt(b.aquariumNumber) || 0
      return numA - numB
    })

    return aquariums
  } catch (error) {
    console.error('Error getting empty aquariums:', error)
    throw error
  }
}

/**
 * Gets aquariums by room
 * @param {string} farmId - Farm ID
 * @param {string} room - Room type
 * @returns {Promise<Array>}
 */
export async function getAquariumsByRoom(farmId, room) {
  try {
    const aquariumsRef = collection(db, 'farms', farmId, 'aquariums')
    const q = query(aquariumsRef, where('room', '==', room))
    const snapshot = await getDocs(q)

    const aquariums = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        aquariumId: doc.id,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      }
    })

    // Sort by aquariumNumber as a number (not string)
    aquariums.sort((a, b) => {
      const numA = parseInt(a.aquariumNumber) || 0
      const numB = parseInt(b.aquariumNumber) || 0
      return numA - numB
    })

    return aquariums
  } catch (error) {
    console.error('Error getting aquariums by room:', error)
    throw error
  }
}

/**
 * Empty reasons enum
 */
export const EMPTY_REASONS = {
  MORTALITY: 'mortality',   // תמותה כוללת
  SHIPMENT: 'shipment',     // אריזה לחנות
  DELETE: 'delete',         // מחיקה רגילה
}

/**
 * Empty an aquarium - remove all fish with a specified reason
 * @param {string} farmId - Farm ID
 * @param {string} aquariumId - Aquarium ID
 * @param {string} reason - Reason for emptying (mortality/shipment/delete)
 * @param {string} notes - Optional notes
 * @returns {Promise<{farmFishCount: number, fishInstancesCount: number}>}
 */
export async function emptyAquarium(farmId, aquariumId, reason, notes = '') {
  try {
    // 1. Get all farmFish in this aquarium
    const farmFishRef = collection(db, 'farmFish')
    const farmFishQuery = query(
      farmFishRef,
      where('farmId', '==', farmId),
      where('aquariumId', '==', aquariumId)
    )
    const farmFishSnapshot = await getDocs(farmFishQuery)
    const farmFishList = farmFishSnapshot.docs.map((doc) => ({
      fishId: doc.id,
      ...doc.data(),
    }))

    // 2. Get all fish_instances in this aquarium
    const fishInstancesRef = collection(db, 'farms', farmId, 'fish_instances')
    const fishInstancesQuery = query(
      fishInstancesRef,
      where('aquariumId', '==', aquariumId)
    )
    const fishInstancesSnapshot = await getDocs(fishInstancesQuery)
    const fishInstancesList = fishInstancesSnapshot.docs.map((doc) => ({
      instanceId: doc.id,
      ...doc.data(),
    }))

    // Get aquarium info for mortality recording
    const aquarium = await getAquarium(farmId, aquariumId)

    // 3. Handle based on reason
    if (reason === EMPTY_REASONS.MORTALITY) {
      // Record mortality for each fish
      for (const fish of farmFishList) {
        if (fish.quantity > 0) {
          await recordMortalityEvent(farmId, {
            fishSource: 'local',
            fishId: fish.fishId,
            scientificName: fish.scientificName || '',
            commonName: fish.hebrewName || '',
            aquariumId: aquariumId,
            aquariumNumber: aquarium?.aquariumNumber || '',
            mortalityType: 'regular',
            quantity: fish.quantity,
            cause: 'mass_mortality',
            notes: notes || 'ריקון אקווריום - תמותה כוללת',
          })
        }
      }

      for (const fish of fishInstancesList) {
        if (fish.currentQuantity > 0) {
          await recordMortalityEvent(farmId, {
            fishSource: 'reception',
            fishId: fish.instanceId,
            scientificName: fish.scientificName || '',
            commonName: fish.commonName || '',
            aquariumId: aquariumId,
            aquariumNumber: aquarium?.aquariumNumber || '',
            mortalityType: 'regular',
            quantity: fish.currentQuantity,
            cause: 'mass_mortality',
            notes: notes || 'ריקון אקווריום - תמותה כוללת',
            receptionDate: fish.arrivalDate,
          })
        }
      }
    } else if (reason === EMPTY_REASONS.SHIPMENT) {
      // Remove from aquarium but keep records for history
      const batch = writeBatch(db)

      for (const fish of farmFishList) {
        const fishRef = doc(db, 'farmFish', fish.fishId)
        batch.update(fishRef, {
          quantity: 0,
          aquariumId: null,  // Remove from aquarium
          updatedAt: Timestamp.now(),
          lastEmptyReason: 'shipment',
          lastEmptyNotes: notes,
        })
      }

      for (const fish of fishInstancesList) {
        const fishRef = doc(db, 'farms', farmId, 'fish_instances', fish.instanceId)
        batch.update(fishRef, {
          currentQuantity: 0,
          aquariumId: null,  // Remove from aquarium
          updatedAt: Timestamp.now(),
          lastEmptyReason: 'shipment',
          lastEmptyNotes: notes,
        })
      }

      await batch.commit()
    } else {
      // DELETE - remove fish completely
      const batch = writeBatch(db)

      for (const fish of farmFishList) {
        const fishRef = doc(db, 'farmFish', fish.fishId)
        batch.delete(fishRef)
      }

      for (const fish of fishInstancesList) {
        const fishRef = doc(db, 'farms', farmId, 'fish_instances', fish.instanceId)
        batch.delete(fishRef)
      }

      await batch.commit()
    }

    // 4. Update aquarium status to empty
    await updateAquarium(farmId, aquariumId, {
      status: 'empty',
      totalFish: 0,
    })

    return {
      farmFishCount: farmFishList.length,
      fishInstancesCount: fishInstancesList.length,
    }
  } catch (error) {
    console.error('Error emptying aquarium:', error)
    throw error
  }
}
