/**
 * task.service.js
 *
 * Unified task management service.
 * Handles both general tasks and transfer tasks.
 * When a transfer task is completed, it executes the actual fish transfer.
 */

import { db } from '../firebase/config'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

/**
 * Create a new task
 * @param {string} farmId - Farm ID
 * @param {Object} taskData - Task data
 * @param {string} taskData.type - 'general' or 'transfer'
 * @param {string} taskData.title - Task title
 * @param {string} [taskData.notes] - Optional notes
 * @param {string} taskData.createdBy - User who created the task
 * @param {Object} [taskData.transfer] - Transfer details (only for type='transfer')
 * @returns {Promise<Object>} Created task with ID
 */
export async function createTask(farmId, taskData) {
  try {
    if (!farmId) throw new Error('Farm ID is required')
    if (!taskData.type) throw new Error('Task type is required')
    if (!taskData.title) throw new Error('Task title is required')

    const tasksRef = collection(db, 'farms', farmId, 'tasks')

    const task = {
      type: taskData.type,
      title: taskData.title,
      notes: taskData.notes || '',
      status: 'pending',
      createdBy: taskData.createdBy || 'unknown',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null,
      blockReason: null,
      blockNotes: null,
      transfer: taskData.transfer || null,
    }

    const docRef = await addDoc(tasksRef, task)

    return {
      taskId: docRef.id,
      ...task,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

/**
 * Create a transfer task with all transfer details
 * Convenience function that wraps createTask
 * @param {string} farmId - Farm ID
 * @param {Object} transferData - Transfer task data
 * @returns {Promise<Object>} Created task
 */
export async function createTransferTask(farmId, transferData) {
  const title = `העברת ${transferData.fishName} (${transferData.quantity})`

  return createTask(farmId, {
    type: 'transfer',
    title,
    notes: transferData.notes || '',
    createdBy: transferData.createdBy,
    transfer: {
      sourceAquariumId: transferData.sourceAquariumId,
      sourceAquariumNumber: transferData.sourceAquariumNumber,
      sourceRoom: transferData.sourceRoom,
      fishId: transferData.fishId,
      fishName: transferData.fishName,
      scientificName: transferData.scientificName || '',
      size: transferData.size || '',
      quantity: transferData.quantity,
      targetAquariumId: transferData.targetAquariumId,
      targetAquariumNumber: transferData.targetAquariumNumber,
      targetRoom: transferData.targetRoom,
      isShipment: transferData.isShipment || false,
      allowMixing: transferData.allowMixing || false,
    },
  })
}

/**
 * Get a single task by ID
 * @param {string} farmId - Farm ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object|null>} Task data or null if not found
 */
export async function getTask(farmId, taskId) {
  try {
    const taskRef = doc(db, 'farms', farmId, 'tasks', taskId)
    const taskDoc = await getDoc(taskRef)

    if (!taskDoc.exists()) {
      return null
    }

    const data = taskDoc.data()
    return {
      taskId: taskDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || null,
      updatedAt: data.updatedAt?.toDate?.() || null,
      completedAt: data.completedAt?.toDate?.() || null,
    }
  } catch (error) {
    console.error('Error getting task:', error)
    throw error
  }
}

/**
 * Get all tasks for a farm
 * @param {string} farmId - Farm ID
 * @param {string} [statusFilter] - Optional status filter ('pending', 'completed', 'blocked')
 * @returns {Promise<Array>} List of tasks
 */
export async function getTasks(farmId, statusFilter = null) {
  try {
    if (!farmId) throw new Error('Farm ID is required')

    const tasksRef = collection(db, 'farms', farmId, 'tasks')
    let q

    if (statusFilter) {
      q = query(
        tasksRef,
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      )
    } else {
      q = query(tasksRef, orderBy('createdAt', 'desc'))
    }

    const snapshot = await getDocs(q)
    const tasks = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      tasks.push({
        taskId: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
        updatedAt: data.updatedAt?.toDate?.() || null,
        completedAt: data.completedAt?.toDate?.() || null,
      })
    })

    return tasks
  } catch (error) {
    console.error('Error getting tasks:', error)
    throw error
  }
}

/**
 * Update a task
 * @param {string} farmId - Farm ID
 * @param {string} taskId - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateTask(farmId, taskId, updates) {
  try {
    const taskRef = doc(db, 'farms', farmId, 'tasks', taskId)
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating task:', error)
    throw error
  }
}

/**
 * Delete a task
 * @param {string} farmId - Farm ID
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export async function deleteTask(farmId, taskId) {
  try {
    const taskRef = doc(db, 'farms', farmId, 'tasks', taskId)
    await deleteDoc(taskRef)
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

/**
 * Complete a task
 * If it's a transfer task, executes the actual fish transfer
 * @param {string} farmId - Farm ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Result with transfer details if applicable
 */
export async function completeTask(farmId, taskId) {
  try {
    const task = await getTask(farmId, taskId)

    if (!task) {
      throw new Error('Task not found')
    }

    if (task.status === 'completed') {
      throw new Error('Task is already completed')
    }

    // If it's a transfer task, execute the actual transfer
    let transferResult = null
    if (task.type === 'transfer' && task.transfer) {
      const { transferFish } = await import('./transfer.service')

      // Handle shipments differently - for now, just mark as done
      // In the future, this could update shipment records
      if (task.transfer.isShipment) {
        // For shipments, we need to remove the fish from the aquarium
        const { updateFarmFish, deleteFarmFish, updateAquariumStatus } = await import('./farm-fish.service')

        // Get the fish data directly from the farmFish collection
        const fishRef = doc(db, 'farmFish', task.transfer.fishId)
        const fishDoc = await getDoc(fishRef)

        if (fishDoc.exists()) {
          const fishData = fishDoc.data()
          const remainingQuantity = fishData.quantity - task.transfer.quantity
          if (remainingQuantity <= 0) {
            // Delete the fish record entirely
            await deleteFarmFish(farmId, task.transfer.fishId)
          } else {
            // Just reduce the quantity
            await updateFarmFish(farmId, task.transfer.fishId, {
              quantity: remainingQuantity,
            })
          }
          // Update the aquarium status since fish was removed
          await updateAquariumStatus(farmId, task.transfer.sourceAquariumId)
        }

        transferResult = {
          success: true,
          transferred: task.transfer.quantity,
          isShipment: true,
          fishName: task.transfer.fishName,
        }
      } else {
        // Regular transfer between aquariums
        transferResult = await transferFish(farmId, {
          sourceAquariumId: task.transfer.sourceAquariumId,
          destinationAquariumId: task.transfer.targetAquariumId,
          fishInstanceId: task.transfer.fishId,
          quantity: task.transfer.quantity,
          notes: task.notes,
        })
      }
    }

    // Mark task as completed
    await updateTask(farmId, taskId, {
      status: 'completed',
      completedAt: serverTimestamp(),
    })

    return {
      success: true,
      taskId,
      transferResult,
    }
  } catch (error) {
    console.error('Error completing task:', error)
    throw error
  }
}

/**
 * Block a task (report an issue)
 * @param {string} farmId - Farm ID
 * @param {string} taskId - Task ID
 * @param {Object} blockData - Block details
 * @param {string} blockData.reason - Block reason ('temperature', 'size', 'leak', 'other')
 * @param {string} [blockData.notes] - Additional notes
 * @returns {Promise<void>}
 */
export async function blockTask(farmId, taskId, blockData) {
  try {
    await updateTask(farmId, taskId, {
      status: 'blocked',
      blockReason: blockData.reason,
      blockNotes: blockData.notes || '',
    })
  } catch (error) {
    console.error('Error blocking task:', error)
    throw error
  }
}

/**
 * Unblock a task
 * @param {string} farmId - Farm ID
 * @param {string} taskId - Task ID
 * @param {string} action - 'continue' to resume task, 'cancel' to cancel it
 * @returns {Promise<void>}
 */
export async function unblockTask(farmId, taskId, action) {
  try {
    if (action === 'continue') {
      await updateTask(farmId, taskId, {
        status: 'pending',
        blockReason: null,
        blockNotes: null,
      })
    } else if (action === 'cancel') {
      await updateTask(farmId, taskId, {
        status: 'cancelled',
      })
    } else {
      throw new Error('Invalid action. Use "continue" or "cancel"')
    }
  } catch (error) {
    console.error('Error unblocking task:', error)
    throw error
  }
}
