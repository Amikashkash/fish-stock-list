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
      isReceptionFish: transferData.isReceptionFish || false,
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
 * Get pending transfer quantity for a specific fish
 * Returns total quantity committed to pending transfer tasks
 * @param {string} farmId - Farm ID
 * @param {string} fishId - Fish ID to check
 * @returns {Promise<number>} Total pending quantity
 */
export async function getPendingTransferQuantity(farmId, fishId) {
  try {
    const pendingTasks = await getTasks(farmId, 'pending')
    const fishTasks = pendingTasks.filter(
      t => t.type === 'transfer' && t.transfer && t.transfer.fishId === fishId
    )
    return fishTasks.reduce((total, t) => total + (t.transfer.quantity || 0), 0)
  } catch (error) {
    console.error('Error getting pending transfer quantity:', error)
    return 0
  }
}

/**
 * Check if a fish has pending transfer tasks
 * @param {string} farmId - Farm ID
 * @param {string} fishId - Fish ID to check
 * @returns {Promise<Array>} List of pending tasks for this fish
 */
export async function getPendingTasksForFish(farmId, fishId) {
  try {
    const pendingTasks = await getTasks(farmId, 'pending')
    return pendingTasks.filter(
      t => t.type === 'transfer' && t.transfer && t.transfer.fishId === fishId
    )
  } catch (error) {
    console.error('Error getting pending tasks for fish:', error)
    return []
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
      const { updateAquariumStatus } = await import('./farm-fish.service')

      // Auto-detect if fish is in farmFish or fish_instances
      let isReceptionFish = task.transfer.isReceptionFish || false

      if (!isReceptionFish && !task.transfer.isShipment) {
        // Check if fish exists in farmFish collection
        const farmFishRef = doc(db, 'farmFish', task.transfer.fishId)
        try {
          const farmFishDoc = await getDoc(farmFishRef)
          if (!farmFishDoc.exists()) {
            // Not in farmFish, must be a reception fish
            isReceptionFish = true
            console.log('Fish not found in farmFish, trying fish_instances')
          }
        } catch (err) {
          // Permission error means it's not in farmFish - try fish_instances
          isReceptionFish = true
          console.log('Cannot access farmFish, trying fish_instances')
        }
      }

      if (task.transfer.isShipment) {
        // Shipment - remove fish from aquarium
        if (isReceptionFish) {
          const { updateFishInstance, deleteFishInstance } = await import('./fish.service')
          // For reception fish shipments, delete or reduce quantity
          const instanceRef = doc(db, 'farms', farmId, 'fish_instances', task.transfer.fishId)
          const instanceDoc = await getDoc(instanceRef)

          if (instanceDoc.exists()) {
            const fishData = instanceDoc.data()
            const remainingQuantity = fishData.currentQuantity - task.transfer.quantity
            if (remainingQuantity <= 0) {
              await deleteFishInstance(farmId, task.transfer.fishId)
            } else {
              await updateFishInstance(farmId, task.transfer.fishId, {
                currentQuantity: remainingQuantity,
              })
            }
            await updateAquariumStatus(farmId, task.transfer.sourceAquariumId)
          }
        } else {
          const { updateFarmFish, deleteFarmFish } = await import('./farm-fish.service')
          const fishRef = doc(db, 'farmFish', task.transfer.fishId)
          const fishDoc = await getDoc(fishRef)

          if (fishDoc.exists()) {
            const fishData = fishDoc.data()
            const remainingQuantity = fishData.quantity - task.transfer.quantity
            if (remainingQuantity <= 0) {
              await deleteFarmFish(farmId, task.transfer.fishId)
            } else {
              await updateFarmFish(farmId, task.transfer.fishId, {
                quantity: remainingQuantity,
              })
            }
            await updateAquariumStatus(farmId, task.transfer.sourceAquariumId)
          }
        }

        transferResult = {
          success: true,
          transferred: task.transfer.quantity,
          isShipment: true,
          fishName: task.transfer.fishName,
        }
      } else if (isReceptionFish) {
        // Reception fish (fish_instances collection) - update aquariumId directly
        const { updateFishInstance } = await import('./fish.service')

        await updateFishInstance(farmId, task.transfer.fishId, {
          aquariumId: task.transfer.targetAquariumId,
        })

        // Update both aquarium statuses
        await updateAquariumStatus(farmId, task.transfer.sourceAquariumId)
        await updateAquariumStatus(farmId, task.transfer.targetAquariumId)

        transferResult = {
          success: true,
          transferred: task.transfer.quantity,
          fishName: task.transfer.fishName,
        }
      } else {
        // Regular farmFish transfer between aquariums
        const { transferFish } = await import('./transfer.service')
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
