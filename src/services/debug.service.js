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
    }))

    console.log('📦 All fish instances:', instances)
    return instances
  } catch (error) {
    console.error('Error getting fish instances:', error)
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
