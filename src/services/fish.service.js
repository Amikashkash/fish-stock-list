/**
 * Fish Service
 * Handles fish instances in Firestore
 */

import { db } from '../firebase/config'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, Timestamp } from 'firebase/firestore'

/**
 * Create a new fish instance
 */
export async function createFishInstance(farmId, fishData) {
  try {
    const instanceRef = doc(collection(db, 'farms', farmId, 'fish_instances'))
    const instanceId = instanceRef.id

    const instance = {
      instanceId,
      farmId,
      code: fishData.code || '',
      scientificName: fishData.scientificName || '',
      commonName: fishData.commonName || '',
      size: fishData.size,
      aquariumId: fishData.aquariumId,
      currentQuantity: fishData.quantity || 1,
      initialQuantity: fishData.quantity || 1,
      arrivalDate: fishData.arrivalDate ? Timestamp.fromDate(fishData.arrivalDate) : Timestamp.now(),
      notes: fishData.notes || '',
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(instanceRef, instance)

    return { instanceId, instance }
  } catch (error) {
    console.error('Error creating fish instance:', error)
    throw error
  }
}

/**
 * Get fish instance by ID
 */
export async function getFishInstance(farmId, instanceId) {
  try {
    const instanceRef = doc(db, 'farms', farmId, 'fish_instances', instanceId)
    const instanceDoc = await getDoc(instanceRef)

    if (!instanceDoc.exists()) {
      throw new Error('Fish instance not found')
    }

    const data = instanceDoc.data()
    return {
      ...data,
      arrivalDate: data.arrivalDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    }
  } catch (error) {
    console.error('Error getting fish instance:', error)
    throw error
  }
}

/**
 * Get all fish instances for a farm
 */
export async function getFishInstances(farmId) {
  try {
    const q = query(collection(db, 'farms', farmId, 'fish_instances'))
    const snapshot = await getDocs(q)
    const instances = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      instances.push({
        ...data,
        arrivalDate: data.arrivalDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      })
    })

    return instances
  } catch (error) {
    console.error('Error getting fish instances:', error)
    throw error
  }
}

/**
 * Update fish instance
 */
export async function updateFishInstance(farmId, instanceId, updates) {
  try {
    const instanceRef = doc(db, 'farms', farmId, 'fish_instances', instanceId)

    await updateDoc(instanceRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error updating fish instance:', error)
    throw error
  }
}

/**
 * Get fish instances by aquarium
 */
export async function getFishByAquarium(farmId, aquariumId) {
  try {
    const q = query(
      collection(db, 'farms', farmId, 'fish_instances'),
      where('aquariumId', '==', aquariumId),
      where('status', '==', 'active')
    )

    const snapshot = await getDocs(q)
    const instances = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      instances.push({
        ...data,
        arrivalDate: data.arrivalDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      })
    })

    return instances
  } catch (error) {
    console.error('Error getting fish by aquarium:', error)
    throw error
  }
}
