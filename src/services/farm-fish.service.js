import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COLLECTION_NAME = 'farmFish'

/**
 * Get all farm fish for a specific farm
 * @param {string} farmId - Farm ID
 * @returns {Promise<Array>} Array of farm fish
 */
export async function getFarmFish(farmId) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('farmId', '==', farmId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      fishId: doc.id,
      ...doc.data(),
    }))
  } catch (err) {
    console.error('Error getting farm fish:', err)
    throw new Error('שגיאה בטעינת הדגים המקומיים')
  }
}

/**
 * Add a new farm fish
 * @param {string} farmId - Farm ID
 * @param {Object} fishData - Fish data
 * @returns {Promise<string>} Fish ID
 */
export async function addFarmFish(farmId, fishData) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      farmId,
      hebrewName: fishData.hebrewName,
      scientificName: fishData.scientificName,
      size: fishData.size,
      quantity: fishData.quantity || 1,
      source: fishData.source,
      notes: fishData.notes || '',
      aquariumId: fishData.aquariumId || null,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (err) {
    console.error('Error adding farm fish:', err)
    throw new Error('שגיאה בהוספת הדג')
  }
}

/**
 * Update farm fish
 * @param {string} farmId - Farm ID
 * @param {string} fishId - Fish ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export async function updateFarmFish(farmId, fishId, updates) {
  try {
    const fishRef = doc(db, COLLECTION_NAME, fishId)
    await updateDoc(fishRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.error('Error updating farm fish:', err)
    throw new Error('שגיאה בעדכון הדג')
  }
}

/**
 * Update farm fish aquarium assignment
 * @param {string} farmId - Farm ID
 * @param {string} fishId - Fish ID
 * @param {string|null} aquariumId - Aquarium ID or null to unassign
 * @returns {Promise<void>}
 */
export async function updateFarmFishAquarium(farmId, fishId, aquariumId) {
  try {
    const fishRef = doc(db, COLLECTION_NAME, fishId)
    await updateDoc(fishRef, {
      aquariumId: aquariumId || null,
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.error('Error updating farm fish aquarium:', err)
    throw new Error('שגיאה בעדכון הקצאת אקווריום')
  }
}

/**
 * Delete farm fish
 * @param {string} farmId - Farm ID
 * @param {string} fishId - Fish ID
 * @returns {Promise<void>}
 */
export async function deleteFarmFish(farmId, fishId) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, fishId))
  } catch (err) {
    console.error('Error deleting farm fish:', err)
    throw new Error('שגיאה במחיקת הדג')
  }
}
