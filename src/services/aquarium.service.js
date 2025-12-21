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
} from 'firebase/firestore'

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
