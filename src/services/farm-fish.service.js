import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { updateAquarium } from './aquarium.service'

const COLLECTION_NAME = 'farmFish'

/**
 * Updates aquarium status based on fish count
 * @param {string} farmId - Farm ID
 * @param {string} aquariumId - Aquarium ID
 * @returns {Promise<void>}
 */
export async function updateAquariumStatus(farmId, aquariumId) {
  try {
    // Count fish in aquarium
    const q = query(
      collection(db, COLLECTION_NAME),
      where('farmId', '==', farmId),
      where('aquariumId', '==', aquariumId)
    )
    const querySnapshot = await getDocs(q)
    const totalFish = querySnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().quantity || 0)
    }, 0)

    // Update aquarium status
    const newStatus = totalFish > 0 ? 'occupied' : 'empty'
    await updateAquarium(farmId, aquariumId, {
      status: newStatus,
      totalFish: totalFish
    })
  } catch (err) {
    console.error('Error updating aquarium status:', err)
    // Don't throw - this is a side effect, not critical
  }
}

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
    const fishDoc = {
      farmId,
      hebrewName: fishData.hebrewName,
      scientificName: fishData.scientificName,
      size: fishData.size,
      quantity: fishData.quantity || 1,
      price: fishData.price || null,
      source: fishData.source,
      notes: fishData.notes || '',
      aquariumId: fishData.aquariumId || null,
      createdAt: serverTimestamp(),
    }

    // Add priceUpdatedAt if price is provided
    if (fishData.priceUpdatedAt) {
      fishDoc.priceUpdatedAt = fishData.priceUpdatedAt
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), fishDoc)

    // Update aquarium status if assigned
    if (fishData.aquariumId) {
      await updateAquariumStatus(farmId, fishData.aquariumId)
    }

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

    // Get current fish data to know its aquariumId
    const fishDoc = await getDoc(fishRef)
    const oldAquariumId = fishDoc.data()?.aquariumId
    const newAquariumId = updates.aquariumId

    await updateDoc(fishRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })

    // If aquariumId changed, update BOTH old and new aquarium statuses
    if (newAquariumId !== undefined && oldAquariumId !== newAquariumId) {
      // Update old aquarium status (now has one less fish)
      if (oldAquariumId) {
        await updateAquariumStatus(farmId, oldAquariumId)
      }
      // Update new aquarium status (now has one more fish)
      if (newAquariumId) {
        await updateAquariumStatus(farmId, newAquariumId)
      }
    } else if (oldAquariumId) {
      // For other updates (quantity change, etc.), update current aquarium
      await updateAquariumStatus(farmId, oldAquariumId)
    }
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
    const fishRef = doc(db, COLLECTION_NAME, fishId)

    // Get fish data before deleting to know its aquariumId
    const fishDoc = await getDoc(fishRef)
    const aquariumId = fishDoc.data()?.aquariumId

    await deleteDoc(fishRef)

    // Update aquarium status if fish was assigned to one
    if (aquariumId) {
      await updateAquariumStatus(farmId, aquariumId)
    }
  } catch (err) {
    console.error('Error deleting farm fish:', err)
    throw new Error('שגיאה במחיקת הדג')
  }
}

/**
 * Save fish from Excel import to catalog
 * This creates catalog entries for fish that don't already exist
 * @param {string} farmId - Farm ID
 * @param {Array} fishItems - Parsed fish items from Excel
 * @returns {Promise<{added: number, existing: number}>} Count of fish added/existing
 */
export async function saveFishToCatalog(farmId, fishItems) {
  try {
    // Get existing fish in catalog
    const existingFish = await getFarmFish(farmId)

    // Create a map of existing fish by scientificName+size for quick lookup
    const existingMap = new Map()
    existingFish.forEach(fish => {
      const key = `${(fish.scientificName || '').toLowerCase()}_${(fish.size || '').toLowerCase()}`
      existingMap.set(key, fish)
    })

    let added = 0
    let existing = 0

    for (const item of fishItems) {
      const scientificName = item.scientificName || ''
      const size = item.size || ''
      const key = `${scientificName.toLowerCase()}_${size.toLowerCase()}`

      if (!scientificName) continue // Skip items without scientific name

      if (existingMap.has(key)) {
        existing++
      } else {
        // Add new fish to catalog
        await addDoc(collection(db, COLLECTION_NAME), {
          farmId,
          hebrewName: '', // Can be updated later
          scientificName,
          size,
          quantity: 0, // Catalog entry, not actual stock
          price: item.price || null,
          source: 'excel-import',
          notes: '',
          aquariumId: null,
          boxNumber: item.boxNumber || null,
          createdAt: serverTimestamp(),
        })
        added++
        // Add to map to prevent duplicates in same batch
        existingMap.set(key, { scientificName, size })
      }
    }

    console.log(`Fish catalog updated: ${added} added, ${existing} already existed`)
    return { added, existing }
  } catch (err) {
    console.error('Error saving fish to catalog:', err)
    throw new Error('שגיאה בשמירת דגים לקטלוג')
  }
}

/**
 * Get fish catalog (unique species for selection)
 * @param {string} farmId - Farm ID
 * @returns {Promise<Array>} Array of unique fish species
 */
export async function getFishCatalog(farmId) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('farmId', '==', farmId),
      where('source', '==', 'excel-import')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      catalogId: doc.id,
      ...doc.data(),
    }))
  } catch (err) {
    console.error('Error getting fish catalog:', err)
    throw new Error('שגיאה בטעינת קטלוג הדגים')
  }
}
