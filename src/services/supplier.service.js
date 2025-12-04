/**
 * Supplier Service
 * Handles supplier-related operations
 */

import { collection, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Get all unique suppliers for a farm
 *
 * @param {string} farmId - Farm ID
 * @returns {Promise<Array<string>>} Array of unique supplier names
 */
export async function getSuppliers(farmId) {
  try {
    const shipmentsRef = collection(db, 'farms', farmId, 'shipments')
    const q = query(shipmentsRef, orderBy('dateReceived', 'desc'))
    const snapshot = await getDocs(q)

    // Extract unique supplier names
    const suppliers = new Set()
    snapshot.docs.forEach((doc) => {
      const supplier = doc.data().supplier
      if (supplier && supplier.trim()) {
        suppliers.add(supplier.trim())
      }
    })

    return Array.from(suppliers).sort()
  } catch (error) {
    console.error('Error getting suppliers:', error)
    return []
  }
}
