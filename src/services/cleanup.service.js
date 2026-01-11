/**
 * Cleanup Service
 * One-time cleanup utilities for data migration
 */

import { db } from '../firebase/config'
import { collection, query, where, getDocs, deleteDoc, writeBatch, doc } from 'firebase/firestore'

/**
 * Clean up duplicate farmFish records created from reception
 * These should only be fish_instances, not farmFish
 */
export async function cleanupDuplicateReceptionFish(farmId) {
  try {
    console.log('🧹 Starting cleanup of duplicate reception fish...')

    // Find all farmFish with source = 'import' (these were created by mistake from reception)
    const farmFishRef = collection(db, 'farmFish')
    const q = query(farmFishRef, where('farmId', '==', farmId), where('source', '==', 'import'))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      console.log('✅ No duplicate farmFish records found!')
      return {
        success: true,
        deletedCount: 0,
        message: 'אין רשומות כפולות למחיקה',
      }
    }

    console.log(`📦 Found ${snapshot.size} duplicate farmFish records to delete`)

    // Delete in batches (Firestore limit: 500 operations per batch)
    const batchSize = 500
    let deletedCount = 0
    let currentBatch = writeBatch(db)
    let operationsInBatch = 0

    const duplicateFish = []

    for (const docSnap of snapshot.docs) {
      const fishData = docSnap.data()
      duplicateFish.push({
        id: docSnap.id,
        hebrewName: fishData.hebrewName,
        scientificName: fishData.scientificName,
        quantity: fishData.quantity,
        aquariumId: fishData.aquariumId,
      })

      currentBatch.delete(docSnap.ref)
      operationsInBatch++

      if (operationsInBatch >= batchSize) {
        await currentBatch.commit()
        deletedCount += operationsInBatch
        console.log(`  ✓ Deleted ${deletedCount} records so far...`)
        currentBatch = writeBatch(db)
        operationsInBatch = 0
      }
    }

    // Commit remaining operations
    if (operationsInBatch > 0) {
      await currentBatch.commit()
      deletedCount += operationsInBatch
    }

    console.log(`✅ Cleanup complete! Deleted ${deletedCount} duplicate farmFish records`)
    console.log('📋 Deleted records:', duplicateFish)

    return {
      success: true,
      deletedCount,
      duplicateFish,
      message: `נמחקו ${deletedCount} רשומות כפולות בהצלחה`,
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

/**
 * Get summary of duplicate fish for review before cleanup
 */
export async function getDuplicateFishSummary(farmId) {
  try {
    const farmFishRef = collection(db, 'farmFish')
    const q = query(farmFishRef, where('farmId', '==', farmId), where('source', '==', 'import'))
    const snapshot = await getDocs(q)

    const duplicates = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        hebrewName: data.hebrewName,
        scientificName: data.scientificName,
        quantity: data.quantity,
        aquariumId: data.aquariumId,
        createdAt: data.createdAt?.toDate(),
      }
    })

    return {
      count: duplicates.length,
      duplicates,
    }
  } catch (error) {
    console.error('Error getting duplicate fish summary:', error)
    throw error
  }
}
