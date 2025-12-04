/**
 * Farm Service
 * Handles all farm-related Firestore operations
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Create a new farm
 *
 * @param {Object} farmData - Farm data
 * @param {string} farmData.name - Farm name
 * @param {string} farmData.ownerId - Owner user ID
 * @param {string} farmData.ownerName - Owner display name
 * @param {string} farmData.ownerEmail - Owner email
 * @param {Object} [farmData.address] - Optional address
 * @param {Object} [farmData.contact] - Optional contact info
 * @param {string} [farmData.description] - Optional description
 * @returns {Promise<{farmId: string, farm: Object}>}
 */
export async function createFarm(farmData) {
  try {
    // Create farm document reference
    const farmRef = doc(collection(db, 'farms'))
    const farmId = farmRef.id

    const now = Timestamp.now()

    const farm = {
      farmId,
      name: farmData.name,
      ownerId: farmData.ownerId,
      ownerName: farmData.ownerName,
      ownerEmail: farmData.ownerEmail,
      address: farmData.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Israel',
      },
      contact: farmData.contact || {
        phone: '',
        email: farmData.ownerEmail,
        website: '',
      },
      description: farmData.description || '',
      logoUrl: farmData.logoUrl || '',
      memberIds: [farmData.ownerId],
      memberRoles: {
        [farmData.ownerId]: 'owner',
      },
      settings: {
        currency: 'ILS',
        language: 'he',
        timezone: 'Asia/Jerusalem',
        aquariumRooms: [
          { id: 'reception', label: 'קליטה' },
          { id: 'main', label: 'ראשי' },
          { id: 'quarantine', label: 'הסגר' },
          { id: 'display', label: 'תצוגה' },
        ],
        aquariumStatuses: [
          { id: 'empty', label: 'ריק', color: '#95a5a6' },
          { id: 'occupied', label: 'תפוס', color: '#3498db' },
          { id: 'maintenance', label: 'תחזוקה', color: '#f39c12' },
          { id: 'in-transfer', label: 'בהעברה', color: '#9b59b6' },
        ],
      },
      createdAt: now,
      updatedAt: now,
    }

    await setDoc(farmRef, farm)

    // Create user's farm membership document
    const membershipRef = doc(db, 'users', farmData.ownerId, 'farms', farmId)
    await setDoc(membershipRef, {
      farmId,
      farmName: farm.name,
      role: 'owner',
      joinedAt: now,
    })

    console.log('Farm created:', farmId)

    return { farmId, farm }
  } catch (error) {
    console.error('Error creating farm:', error)
    throw new Error(`Failed to create farm: ${error.message}`)
  }
}

/**
 * Get a farm by ID
 *
 * @param {string} farmId - Farm ID
 * @returns {Promise<Object|null>}
 */
export async function getFarm(farmId) {
  try {
    const farmRef = doc(db, 'farms', farmId)
    const farmSnap = await getDoc(farmRef)

    if (!farmSnap.exists()) {
      console.warn('Farm not found:', farmId)
      return null
    }

    return {
      ...farmSnap.data(),
      createdAt: farmSnap.data().createdAt?.toDate(),
      updatedAt: farmSnap.data().updatedAt?.toDate(),
    }
  } catch (error) {
    console.error('Error getting farm:', error)
    throw new Error(`Failed to get farm: ${error.message}`)
  }
}

/**
 * Get all farms for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array<Object>>}
 */
export async function getUserFarms(userId) {
  try {
    const farmsRef = collection(db, 'users', userId, 'farms')
    const snapshot = await getDocs(farmsRef)

    const farmIds = snapshot.docs.map((doc) => doc.data().farmId)

    if (farmIds.length === 0) {
      return []
    }

    // Fetch full farm details
    const farms = await Promise.all(
      farmIds.map((farmId) => getFarm(farmId))
    )

    return farms.filter((farm) => farm !== null)
  } catch (error) {
    console.error('Error getting user farms:', error)
    throw new Error(`Failed to get user farms: ${error.message}`)
  }
}

/**
 * Update farm details
 *
 * @param {string} farmId - Farm ID
 * @param {Object} updates - Farm fields to update
 * @returns {Promise<void>}
 */
export async function updateFarm(farmId, updates) {
  try {
    const farmRef = doc(db, 'farms', farmId)

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    }

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    await updateDoc(farmRef, updateData)

    console.log('Farm updated:', farmId)
  } catch (error) {
    console.error('Error updating farm:', error)
    throw new Error(`Failed to update farm: ${error.message}`)
  }
}

/**
 * Check if user is owner of a farm
 *
 * @param {string} farmId - Farm ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function isOwner(farmId, userId) {
  try {
    const farm = await getFarm(farmId)
    return farm?.ownerId === userId
  } catch (error) {
    console.error('Error checking ownership:', error)
    return false
  }
}
