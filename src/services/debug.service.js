/**
 * Debug Service
 * Tools for debugging and inspecting database state
 */

import { db } from '../firebase/config'
import { collection, getDocs, query, where } from 'firebase/firestore'

/**
 * Get all fish instances for a farm
 */
export async function getAllFishInstances(farmId) {
  try {
    const fishInstancesRef = collection(db, 'farms', farmId, 'fish_instances')
    const snapshot = await getDocs(fishInstancesRef)

    const instances = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      arrivalDate: doc.data().arrivalDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    }))

    console.log('📦 All fish instances:', instances)
    return instances
  } catch (error) {
    console.error('Error getting fish instances:', error)
    throw error
  }
}

/**
 * Get all reception items and their status
 */
export async function getAllReceptionItems(farmId) {
  try {
    const itemsRef = collection(db, 'farms', farmId, 'reception_items')
    const snapshot = await getDocs(itemsRef)

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      receivedAt: doc.data().receivedAt?.toDate(),
    }))

    console.log('📋 All reception items:', items)
    return items
  } catch (error) {
    console.error('Error getting reception items:', error)
    throw error
  }
}

/**
 * Compare reception items vs fish instances
 */
export async function compareReceptionToFishInstances(farmId) {
  try {
    const [receptionItems, fishInstances] = await Promise.all([
      getAllReceptionItems(farmId),
      getAllFishInstances(farmId),
    ])

    // Filter only received items
    const receivedItems = receptionItems.filter((item) => item.status === 'received')

    // Create a map of fish instances by their IDs
    const fishInstancesMap = new Map()
    fishInstances.forEach((fish) => {
      fishInstancesMap.set(fish.instanceId, fish)
    })

    // Find missing fish instances
    const missingFish = []
    const foundFish = []

    receivedItems.forEach((item) => {
      // Try to find matching fish instance by checking arrival date and name
      const matchingFish = fishInstances.find(
        (fish) =>
          fish.commonName === item.hebrewName &&
          fish.scientificName === item.scientificName &&
          Math.abs(fish.arrivalDate?.getTime() - item.receivedAt?.getTime()) < 60000 // Within 1 minute
      )

      if (matchingFish) {
        foundFish.push({
          item,
          fishInstance: matchingFish,
        })
      } else {
        missingFish.push(item)
      }
    })

    console.log('\n=== RECEPTION vs FISH INSTANCES REPORT ===\n')
    console.log('Received items:', receivedItems.length)
    console.log('Fish instances found:', foundFish.length)
    console.log('Missing fish instances:', missingFish.length)
    console.table(missingFish)

    return {
      receivedItems,
      fishInstances,
      foundFish,
      missingFish,
      summary: {
        totalReceivedItems: receivedItems.length,
        totalFishInstances: fishInstances.length,
        matchedCount: foundFish.length,
        missingCount: missingFish.length,
      },
    }
  } catch (error) {
    console.error('Error comparing reception to fish instances:', error)
    throw error
  }
}

/**
 * Get all aquariums and their fish references
 */
export async function getAllAquariums(farmId) {
  try {
    const aquariumsRef = collection(db, 'farms', farmId, 'aquariums')
    const snapshot = await getDocs(aquariumsRef)

    const aquariums = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      fishInstances: doc.data().fishInstances || [],
    }))

    console.log('🏠 All aquariums:', aquariums)
    return aquariums
  } catch (error) {
    console.error('Error getting aquariums:', error)
    throw error
  }
}

/**
 * Compare fish instances vs aquarium references
 */
export async function debugFishAquariumMismatch(farmId) {
  try {
    const fishInstances = await getAllFishInstances(farmId)
    const aquariums = await getAllAquariums(farmId)

    console.log('\n=== DEBUG REPORT ===\n')

    // Fish instances by aquarium
    const fishByAquarium = {}
    fishInstances.forEach((fish) => {
      if (!fishByAquarium[fish.aquariumId]) {
        fishByAquarium[fish.aquariumId] = []
      }
      fishByAquarium[fish.aquariumId].push(fish)
    })

    // Check each aquarium
    const mismatches = []
    aquariums.forEach((aquarium) => {
      const referencedFish = aquarium.fishInstances || []
      const actualFish = fishByAquarium[aquarium.aquariumId] || []

      const referencedIds = referencedFish.map((f) => f.instanceId)
      const actualIds = actualFish.map((f) => f.instanceId)

      const missingReferences = actualIds.filter((id) => !referencedIds.includes(id))
      const extraReferences = referencedIds.filter((id) => !actualIds.includes(id))

      if (missingReferences.length > 0 || extraReferences.length > 0) {
        mismatches.push({
          aquariumId: aquarium.aquariumId,
          aquariumNumber: aquarium.aquariumNumber,
          room: aquarium.room,
          status: aquarium.status,
          totalFish: aquarium.totalFish,
          referencedFishCount: referencedFish.length,
          actualFishCount: actualFish.length,
          missingReferences,
          extraReferences,
          actualFish: actualFish.map((f) => ({
            instanceId: f.instanceId,
            commonName: f.commonName,
            quantity: f.currentQuantity,
          })),
        })
      }
    })

    console.log('🔍 Mismatches found:', mismatches.length)
    console.table(mismatches)

    return {
      fishInstances,
      aquariums,
      mismatches,
      summary: {
        totalFish: fishInstances.length,
        totalAquariums: aquariums.length,
        aquariumsWithMismatches: mismatches.length,
      },
    }
  } catch (error) {
    console.error('Error debugging:', error)
    throw error
  }
}

/**
 * Recreate missing fish instances from reception items
 */
export async function recreateMissingFishInstances(farmId) {
  try {
    console.log('🔧 Starting to recreate missing fish instances...')

    const comparison = await compareReceptionToFishInstances(farmId)
    const { missingFish } = comparison

    if (missingFish.length === 0) {
      console.log('✅ No missing fish instances!')
      return {
        success: true,
        created: 0,
        message: 'אין דגים חסרים ליצירה',
      }
    }

    console.log(`📦 Found ${missingFish.length} missing fish instances`)

    // Import the createFishInstance function
    const { createFishInstance } = await import('./fish.service')
    const { updateDoc, doc, Timestamp } = await import('firebase/firestore')

    let createdCount = 0
    const createdFish = []

    for (const item of missingFish) {
      try {
        // Create fish instance
        const fishInstanceData = {
          code: item.code || '',
          scientificName: item.scientificName || '',
          commonName: item.hebrewName,
          size: item.size,
          aquariumId: item.targetAquariumId,
          quantity: item.quantity,
          arrivalDate: item.receivedAt || new Date(),
          notes: item.notes || '',
        }

        // Add price data if available
        if (item.price !== null && item.price !== undefined) {
          fishInstanceData.price = item.price
        }

        const fishInstance = await createFishInstance(farmId, fishInstanceData)

        console.log(
          `✅ Created fish instance: ${item.hebrewName} (${item.quantity} units) -> Aquarium ${item.targetAquariumNumber}`
        )

        createdFish.push({
          item,
          fishInstance,
        })
        createdCount++
      } catch (error) {
        console.error(`❌ Failed to create fish instance for ${item.hebrewName}:`, error)
      }
    }

    console.log(`\n🎉 Recreation complete! Created ${createdCount} fish instances`)

    return {
      success: true,
      created: createdCount,
      createdFish,
      message: `נוצרו ${createdCount} רשומות דגים חדשות`,
    }
  } catch (error) {
    console.error('❌ Error recreating fish instances:', error)
    throw error
  }
}

/**
 * Fix aquarium references for all fish instances
 */
export async function fixAllAquariumReferences(farmId) {
  try {
    console.log('🔧 Starting fix for all aquarium references...')

    const fishInstances = await getAllFishInstances(farmId)
    const aquariums = await getAllAquariums(farmId)

    // Group fish by aquarium
    const fishByAquarium = {}
    fishInstances.forEach((fish) => {
      if (!fish.aquariumId) return // Skip fish without aquarium

      if (!fishByAquarium[fish.aquariumId]) {
        fishByAquarium[fish.aquariumId] = []
      }
      fishByAquarium[fish.aquariumId].push({
        instanceId: fish.instanceId,
        quantity: fish.currentQuantity || fish.initialQuantity || 0,
        dateAdded: fish.arrivalDate || new Date(),
      })
    })

    // Update each aquarium
    const { updateDoc, doc, Timestamp } = await import('firebase/firestore')
    let updatedCount = 0

    for (const aquarium of aquariums) {
      const fishInAquarium = fishByAquarium[aquarium.aquariumId] || []
      const totalFish = fishInAquarium.reduce((sum, f) => sum + f.quantity, 0)

      const aquariumRef = doc(db, 'farms', farmId, 'aquariums', aquarium.aquariumId)

      await updateDoc(aquariumRef, {
        fishInstances: fishInAquarium,
        totalFish,
        status: totalFish > 0 ? 'occupied' : 'empty',
        updatedAt: Timestamp.now(),
      })

      console.log(
        `✅ Updated aquarium ${aquarium.aquariumNumber}: ${fishInAquarium.length} fish, total ${totalFish}`
      )
      updatedCount++
    }

    console.log(`\n🎉 Fix complete! Updated ${updatedCount} aquariums`)

    return {
      success: true,
      updatedCount,
      fishByAquarium,
    }
  } catch (error) {
    console.error('❌ Error fixing aquarium references:', error)
    throw error
  }
}
