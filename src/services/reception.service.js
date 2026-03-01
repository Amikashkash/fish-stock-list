/**
 * Reception Service
 * Handles reception plans and items in Firestore
 */

import { db } from '../firebase/config'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { createFishInstance } from './fish.service'
import { getAquarium, updateAquarium } from './aquarium.service'

/**
 * Get list of countries used in previous reception plans
 */
export async function getPreviousCountries(farmId) {
  try {
    const plansRef = collection(db, 'farms', farmId, 'reception_plans')
    const snapshot = await getDocs(plansRef)
    const countries = new Set()

    snapshot.docs.forEach((doc) => {
      if (doc.data().countryOfOrigin) {
        countries.add(doc.data().countryOfOrigin)
      }
    })

    return Array.from(countries).sort()
  } catch (error) {
    console.error('Error getting previous countries:', error)
    return []
  }
}

/**
 * Get list of suppliers used in previous reception plans
 */
export async function getPreviousSuppliers(farmId) {
  try {
    const plansRef = collection(db, 'farms', farmId, 'reception_plans')
    const snapshot = await getDocs(plansRef)
    const suppliers = new Set()

    snapshot.docs.forEach((doc) => {
      if (doc.data().supplierName) {
        suppliers.add(doc.data().supplierName)
      }
    })

    return Array.from(suppliers).sort()
  } catch (error) {
    console.error('Error getting previous suppliers:', error)
    return []
  }
}

/**
 * Get list of fish names (Hebrew name + Scientific name) used in previous receptions and farm fish
 * Returns array of unique fish data, sorted by frequency (most used first)
 */
export async function getPreviousFishNames(farmId) {
  try {
    const fishMap = new Map() // hebrewName -> { hebrewName, scientificName, count }

    // Get data from reception_items
    const itemsRef = collection(db, 'farms', farmId, 'reception_items')
    const itemsSnapshot = await getDocs(itemsRef)

    itemsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.hebrewName && data.scientificName) {
        const key = data.hebrewName
        if (fishMap.has(key)) {
          const entry = fishMap.get(key)
          entry.count += 1
        } else {
          fishMap.set(key, {
            hebrewName: data.hebrewName,
            scientificName: data.scientificName,
            count: 1,
          })
        }
      }
    })

    // Also get data from farmFish collection
    const farmFishRef = collection(db, 'farmFish')
    const farmFishQuery = query(farmFishRef, where('farmId', '==', farmId))
    const farmFishSnapshot = await getDocs(farmFishQuery)

    farmFishSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.hebrewName && data.scientificName) {
        const key = data.hebrewName
        if (fishMap.has(key)) {
          const entry = fishMap.get(key)
          entry.count += 1
        } else {
          fishMap.set(key, {
            hebrewName: data.hebrewName,
            scientificName: data.scientificName,
            count: 1,
          })
        }
      }
    })

    // Convert to array and sort by frequency (most used first)
    const fishList = Array.from(fishMap.values()).sort((a, b) => b.count - a.count)

    return fishList
  } catch (error) {
    console.error('Error getting previous fish names:', error)
    return []
  }
}

/**
 * Create a new reception plan
 */
export async function createReceptionPlan(farmId, planData) {
  try {
    const planRef = doc(collection(db, 'farms', farmId, 'reception_plans'))
    const planId = planRef.id

    const plan = {
      planId,
      farmId,
      expectedDate: Timestamp.fromDate(new Date(planData.expectedDate)),
      source: planData.source, // 'excel' or 'manual'
      status: 'planning',
      countryOfOrigin: planData.countryOfOrigin || '',
      supplierName: planData.supplierName || '',
      targetRoom: planData.targetRoom || '',
      shipmentReference: planData.shipmentReference || '',
      notes: planData.notes || '',
      expectedAquariumCount: planData.expectedAquariumCount || 0,
      itemCount: 0,
      receivedCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(planRef, plan)

    return { planId, plan }
  } catch (error) {
    console.error('Error creating reception plan:', error)
    throw error
  }
}

/**
 * Get all reception plans for a farm
 */
export async function getReceptionPlans(farmId, statusFilter = null) {
  try {
    let q = query(
      collection(db, 'farms', farmId, 'reception_plans'),
      orderBy('expectedDate', 'desc')
    )

    if (statusFilter) {
      q = query(q, where('status', '==', statusFilter))
    }

    const snapshot = await getDocs(q)
    const plans = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      plans.push({
        ...data,
        expectedDate: data.expectedDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      })
    })

    return plans
  } catch (error) {
    console.error('Error getting reception plans:', error)
    throw error
  }
}

/**
 * Get a single reception plan
 */
export async function getReceptionPlan(farmId, planId) {
  try {
    const planRef = doc(db, 'farms', farmId, 'reception_plans', planId)
    const planDoc = await getDoc(planRef)

    if (!planDoc.exists()) {
      throw new Error('Reception plan not found')
    }

    const data = planDoc.data()
    return {
      ...data,
      expectedDate: data.expectedDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    }
  } catch (error) {
    console.error('Error getting reception plan:', error)
    throw error
  }
}

/**
 * Update reception plan
 */
export async function updateReceptionPlan(farmId, planId, updates) {
  try {
    const planRef = doc(db, 'farms', farmId, 'reception_plans', planId)

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    }

    // Remove undefined values - Firestore doesn't allow them
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    if (updates.expectedDate) {
      updateData.expectedDate = Timestamp.fromDate(new Date(updates.expectedDate))
    }

    await updateDoc(planRef, updateData)
  } catch (error) {
    console.error('Error updating reception plan:', error)
    throw error
  }
}

/**
 * Delete reception plan and all its items
 */
export async function deleteReceptionPlan(farmId, planId) {
  try {
    const batch = writeBatch(db)

    // Delete all items
    const q = query(
      collection(db, 'farms', farmId, 'reception_items'),
      where('planId', '==', planId)
    )
    const itemsSnapshot = await getDocs(q)

    itemsSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete the plan
    const planRef = doc(db, 'farms', farmId, 'reception_plans', planId)
    batch.delete(planRef)

    await batch.commit()
  } catch (error) {
    console.error('Error deleting reception plan:', error)
    throw error
  }
}

/**
 * Add item to reception plan
 */
export async function addReceptionItem(farmId, itemData) {
  try {
    const itemRef = doc(collection(db, 'farms', farmId, 'reception_items'))
    const itemId = itemRef.id

    const item = {
      itemId,
      planId: itemData.planId,
      farmId,
      hebrewName: itemData.hebrewName,
      scientificName: itemData.scientificName || '',
      size: itemData.size,
      boxNumber: itemData.boxNumber || '',
      boxPortion: itemData.boxPortion || '',
      code: itemData.code || '',
      targetAquariumId: itemData.targetAquariumId,
      targetAquariumNumber: itemData.targetAquariumNumber || '',
      targetRoom: itemData.targetRoom || '',
      quantity: itemData.quantity || 1,
      status: 'planned',
      notes: itemData.notes || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    // Add optional price fields
    if (itemData.price !== null && itemData.price !== undefined) {
      item.price = itemData.price
    }
    if (itemData.priceUpdatedAt) {
      item.priceUpdatedAt = Timestamp.fromDate(new Date(itemData.priceUpdatedAt))
    }

    await setDoc(itemRef, item)

    // Update plan item count
    const planRef = doc(db, 'farms', farmId, 'reception_plans', itemData.planId)
    const planDoc = await getDoc(planRef)
    if (planDoc.exists()) {
      const currentCount = planDoc.data().itemCount || 0
      await updateDoc(planRef, {
        itemCount: currentCount + 1,
        updatedAt: Timestamp.now(),
      })
    }

    return { itemId, item }
  } catch (error) {
    console.error('Error adding reception item:', error)
    throw error
  }
}

/**
 * Get all items for a reception plan
 */
export async function getReceptionItems(farmId, planId) {
  try {
    const q = query(
      collection(db, 'farms', farmId, 'reception_items'),
      where('planId', '==', planId)
    )

    const snapshot = await getDocs(q)
    const items = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      items.push({
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        priceUpdatedAt: data.priceUpdatedAt?.toDate(),
      })
    })

    // Sort by createdAt on client side
    items.sort((a, b) => (a.createdAt?.getTime?.() || 0) - (b.createdAt?.getTime?.() || 0))

    return items
  } catch (error) {
    console.error('Error getting reception items:', error)
    throw error
  }
}

/**
 * Update reception item
 */
export async function updateReceptionItem(farmId, itemId, updates) {
  try {
    const itemRef = doc(db, 'farms', farmId, 'reception_items', itemId)

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    }

    // Convert priceUpdatedAt to Timestamp if present
    if (updates.priceUpdatedAt) {
      updateData.priceUpdatedAt = Timestamp.fromDate(new Date(updates.priceUpdatedAt))
    }

    await updateDoc(itemRef, updateData)
  } catch (error) {
    console.error('Error updating reception item:', error)
    throw error
  }
}

/**
 * Delete reception item
 */
export async function deleteReceptionItem(farmId, planId, itemId) {
  try {
    const batch = writeBatch(db)

    // Delete the item
    const itemRef = doc(db, 'farms', farmId, 'reception_items', itemId)
    batch.delete(itemRef)

    // Update plan item count
    const planRef = doc(db, 'farms', farmId, 'reception_plans', planId)
    const planDoc = await getDoc(planRef)
    if (planDoc.exists()) {
      const currentCount = planDoc.data().itemCount || 0
      batch.update(planRef, {
        itemCount: Math.max(0, currentCount - 1),
        updatedAt: Timestamp.now(),
      })
    }

    await batch.commit()
  } catch (error) {
    console.error('Error deleting reception item:', error)
    throw error
  }
}

/**
 * Receive an item (mark as received and add fish to aquarium)
 */
export async function receiveItem(farmId, itemId) {
  try {
    const batch = writeBatch(db)

    // Get the item
    const itemRef = doc(db, 'farms', farmId, 'reception_items', itemId)
    const itemDoc = await getDoc(itemRef)

    if (!itemDoc.exists()) {
      throw new Error('Reception item not found')
    }

    const item = itemDoc.data()

    if (item.status === 'received') {
      throw new Error('Item already received')
    }

    // Create fish instance
    const fishInstanceData = {
      code: item.code,
      scientificName: item.scientificName,
      commonName: item.hebrewName,
      size: item.size,
      aquariumId: item.targetAquariumId,
      quantity: item.quantity,
      arrivalDate: new Date(),
      notes: item.notes,
    }

    // Add price data if available
    if (item.price !== null && item.price !== undefined) {
      fishInstanceData.price = item.price
    }
    if (item.priceUpdatedAt) {
      fishInstanceData.priceUpdatedAt = item.priceUpdatedAt.toDate()
    }

    const fishInstance = await createFishInstance(farmId, fishInstanceData)

    // Update aquarium with new fish
    const aquarium = await getAquarium(farmId, item.targetAquariumId)
    const updatedFishInstances = aquarium.fishInstances || []
    updatedFishInstances.push({
      instanceId: fishInstance.instanceId,
      quantity: item.quantity,
      dateAdded: Timestamp.now(),
    })

    const newTotalFish = updatedFishInstances.reduce((sum, f) => sum + f.quantity, 0)

    const aquariumRef = doc(db, 'farms', farmId, 'aquariums', item.targetAquariumId)
    batch.update(aquariumRef, {
      fishInstances: updatedFishInstances,
      totalFish: newTotalFish,
      status: 'occupied',
      updatedAt: Timestamp.now(),
    })

    // Mark item as received
    batch.update(itemRef, {
      status: 'received',
      receivedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Update plan received count
    const planRef = doc(db, 'farms', farmId, 'reception_plans', item.planId)
    const planDoc = await getDoc(planRef)
    if (planDoc.exists()) {
      const currentReceived = planDoc.data().receivedCount || 0
      const newReceivedCount = currentReceived + 1
      const itemCount = planDoc.data().itemCount || 0

      batch.update(planRef, {
        receivedCount: newReceivedCount,
        status: newReceivedCount >= itemCount ? 'completed' : 'in-progress',
        updatedAt: Timestamp.now(),
      })
    }

    await batch.commit()

    return { success: true, fishInstance }
  } catch (error) {
    console.error('Error receiving item:', error)
    throw error
  }
}

/**
 * Lock a reception plan - validates and prevents editing
 */
export async function lockReceptionPlan(farmId, planId) {
  try {
    const batch = writeBatch(db)

    // Get all items for the plan
    const q = query(
      collection(db, 'farms', farmId, 'reception_items'),
      where('planId', '==', planId)
    )
    const itemsSnapshot = await getDocs(q)

    // Validate all items have aquarium assignments
    let unassignedCount = 0
    itemsSnapshot.forEach((doc) => {
      if (!doc.data().targetAquariumId) {
        unassignedCount += 1
      }
    })

    if (unassignedCount > 0) {
      throw new Error(`לא ניתן לנעול - ${unassignedCount} פריטים ללא אקווריום מוקצה`)
    }

    // Lock the plan
    const planRef = doc(db, 'farms', farmId, 'reception_plans', planId)
    batch.update(planRef, {
      isLocked: true,
      status: 'locked',
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
  } catch (error) {
    console.error('Error locking reception plan:', error)
    throw error
  }
}

/**
 * Unlock a reception plan - allows editing again
 */
export async function unlockReceptionPlan(farmId, planId) {
  try {
    const planRef = doc(db, 'farms', farmId, 'reception_plans', planId)
    await updateDoc(planRef, {
      isLocked: false,
      status: 'finalized',
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error unlocking reception plan:', error)
    throw error
  }
}

/**
 * Move plan to next status
 */
export async function updatePlanStatus(farmId, planId, newStatus) {
  try {
    const planRef = doc(db, 'farms', farmId, 'reception_plans', planId)
    await updateDoc(planRef, {
      status: newStatus,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error updating plan status:', error)
    throw error
  }
}

/**
 * Remove an item from reception (DOA or not received).
 * Soft-deletes by setting status to 'cancelled' so it can be undone.
 */
export async function removeItem(farmId, itemId, reason = 'not-received') {
  try {
    const itemRef = doc(db, 'farms', farmId, 'reception_items', itemId)
    const itemDoc = await getDoc(itemRef)

    if (!itemDoc.exists()) {
      throw new Error('Item not found')
    }

    const itemData = itemDoc.data()

    // Soft-delete: mark as cancelled (preserves data for undo)
    await updateDoc(itemRef, {
      status: 'cancelled',
      cancelReason: reason,
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Update plan counts (decrement active item count)
    const planRef = doc(db, 'farms', farmId, 'reception_plans', itemData.planId)
    const planDoc = await getDoc(planRef)

    if (planDoc.exists()) {
      const planData = planDoc.data()
      const newItemCount = Math.max(0, (planData.itemCount || 0) - 1)
      await updateDoc(planRef, {
        itemCount: newItemCount,
        updatedAt: Timestamp.now(),
      })
    }

    return { success: true, reason }
  } catch (error) {
    console.error('Error removing item:', error)
    throw error
  }
}

/**
 * Restore a cancelled item back to 'planned' status (undo DOA / not-received).
 */
export async function restoreItem(farmId, itemId) {
  try {
    const itemRef = doc(db, 'farms', farmId, 'reception_items', itemId)
    const itemDoc = await getDoc(itemRef)

    if (!itemDoc.exists()) {
      throw new Error('Item not found')
    }

    const itemData = itemDoc.data()

    await updateDoc(itemRef, {
      status: 'planned',
      cancelReason: null,
      cancelledAt: null,
      updatedAt: Timestamp.now(),
    })

    // Increment plan item count back
    const planRef = doc(db, 'farms', farmId, 'reception_plans', itemData.planId)
    const planDoc = await getDoc(planRef)

    if (planDoc.exists()) {
      const planData = planDoc.data()
      await updateDoc(planRef, {
        itemCount: (planData.itemCount || 0) + 1,
        updatedAt: Timestamp.now(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error restoring item:', error)
    throw error
  }
}

/**
 * Complete reception and update all aquarium statuses
 */
export async function completeReception(farmId, planId) {
  try {
    // Get all items in the plan
    const itemsRef = collection(db, 'farms', farmId, 'reception_items')
    const q = query(itemsRef, where('planId', '==', planId))
    const itemsSnapshot = await getDocs(q)

    // Import updateAquariumStatus dynamically to avoid circular dependency
    const { updateAquariumStatus } = await import('./farm-fish.service')

    // Get unique aquarium IDs
    const aquariumIds = new Set()
    itemsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.targetAquariumId && data.status === 'received') {
        aquariumIds.add(data.targetAquariumId)
      }
    })

    // Update status for each aquarium
    const updatePromises = Array.from(aquariumIds).map((aquariumId) =>
      updateAquariumStatus(farmId, aquariumId)
    )

    await Promise.all(updatePromises)

    // Update plan status to completed
    const planRef = doc(db, 'farms', farmId, 'reception_plans', planId)
    await updateDoc(planRef, {
      status: 'completed',
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return { success: true, aquariumsUpdated: aquariumIds.size }
  } catch (error) {
    console.error('Error completing reception:', error)
    throw error
  }
}

/**
 * Reset a completed reception plan to allow re-receiving
 * This resets all items back to 'planned' status and removes the plan completion
 * IMPORTANT: Also deletes all fish_instances created from this plan to avoid duplicates
 */
export async function resetReceptionPlan(farmId, planId) {
  try {
    // Get all items in the plan
    const itemsRef = collection(db, 'farms', farmId, 'reception_items')
    const q = query(itemsRef, where('planId', '==', planId))
    const itemsSnapshot = await getDocs(q)

    // Get all fish instances for this farm to find matching ones
    const fishInstancesRef = collection(db, 'farms', farmId, 'fish_instances')
    const fishSnapshot = await getDocs(fishInstancesRef)

    // Collect item data to match against fish instances
    const items = itemsSnapshot.docs.map((itemDoc) => ({
      id: itemDoc.id,
      ...itemDoc.data(),
      receivedAt: itemDoc.data().receivedAt?.toDate(),
    }))

    // Find fish instances that match these reception items
    const fishToDelete = []
    fishSnapshot.docs.forEach((fishDoc) => {
      const fishData = fishDoc.data()
      const arrivalDate = fishData.arrivalDate?.toDate()

      // Try to match fish instance with reception item
      const matchingItem = items.find(
        (item) =>
          item.status === 'received' &&
          fishData.commonName === item.hebrewName &&
          fishData.scientificName === item.scientificName &&
          arrivalDate &&
          item.receivedAt &&
          Math.abs(arrivalDate.getTime() - item.receivedAt.getTime()) < 60000 // Within 1 minute
      )

      if (matchingItem) {
        fishToDelete.push(fishDoc.id)
      }
    })

    console.log(`🗑️ Found ${fishToDelete.length} fish instances to delete for plan ${planId}`)

    // Use batched deletes (max 500 per batch)
    const batchSize = 500
    for (let i = 0; i < fishToDelete.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchFish = fishToDelete.slice(i, i + batchSize)

      // Delete fish instances
      batchFish.forEach((fishId) => {
        const fishRef = doc(db, 'farms', farmId, 'fish_instances', fishId)
        batch.delete(fishRef)
      })

      // Reset items in first batch only
      if (i === 0) {
        itemsSnapshot.docs.forEach((itemDoc) => {
          const itemRef = doc(db, 'farms', farmId, 'reception_items', itemDoc.id)
          batch.update(itemRef, {
            status: 'planned',
            receivedAt: null,
            updatedAt: Timestamp.now(),
          })
        })

        // Reset plan status
        const planRef = doc(db, 'farms', farmId, 'reception_plans', planId)
        batch.update(planRef, {
          status: 'ready',
          receivedCount: 0,
          completedAt: null,
          updatedAt: Timestamp.now(),
        })
      }

      await batch.commit()
    }

    console.log(
      `✅ Reset reception plan ${planId} - ${itemsSnapshot.docs.length} items reset, ${fishToDelete.length} fish instances deleted`
    )

    return {
      success: true,
      itemsReset: itemsSnapshot.docs.length,
      fishDeleted: fishToDelete.length,
      message: `תוכנית הקליטה אופסה. ${itemsSnapshot.docs.length} פריטים חזרו לסטטוס מתוכנן, ${fishToDelete.length} רשומות דגים נמחקו`,
    }
  } catch (error) {
    console.error('Error resetting reception plan:', error)
    throw error
  }
}
