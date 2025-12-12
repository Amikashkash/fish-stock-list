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

    await updateDoc(itemRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
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
    const fishInstance = await createFishInstance(farmId, {
      code: item.code,
      scientificName: item.scientificName,
      commonName: item.hebrewName,
      size: item.size,
      aquariumId: item.targetAquariumId,
      quantity: item.quantity,
      arrivalDate: new Date(),
      notes: item.notes,
    })

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
