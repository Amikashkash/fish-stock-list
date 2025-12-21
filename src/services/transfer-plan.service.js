/**
 * Transfer Plan Service
 * Handles transfer plans and tasks in Firestore
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
import { getFarmFish } from './farm-fish.service'

/**
 * Create a new transfer plan
 */
export async function createTransferPlan(farmId, planData) {
  try {
    const planRef = doc(collection(db, 'farms', farmId, 'transfer_plans'))
    const planId = planRef.id

    const plan = {
      planId,
      farmId,
      planName: planData.planName || `תוכנית העברה ${new Date().toLocaleDateString('he-IL')}`,
      status: 'planning', // planning, ready, in-progress, completed, cancelled
      createdBy: planData.createdBy || 'unknown',
      taskCount: 0,
      completedTaskCount: 0,
      blockedTaskCount: 0,
      notes: planData.notes || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(planRef, plan)

    return { planId, plan }
  } catch (error) {
    console.error('Error creating transfer plan:', error)
    throw error
  }
}

/**
 * Get all transfer plans for a farm
 */
export async function getTransferPlans(farmId, statusFilter = null) {
  try {
    let q = query(
      collection(db, 'farms', farmId, 'transfer_plans'),
      orderBy('createdAt', 'desc')
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
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      })
    })

    return plans
  } catch (error) {
    console.error('Error getting transfer plans:', error)
    throw error
  }
}

/**
 * Get a single transfer plan
 */
export async function getTransferPlan(farmId, planId) {
  try {
    const planRef = doc(db, 'farms', farmId, 'transfer_plans', planId)
    const planDoc = await getDoc(planRef)

    if (!planDoc.exists()) {
      throw new Error('Transfer plan not found')
    }

    const data = planDoc.data()
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    }
  } catch (error) {
    console.error('Error getting transfer plan:', error)
    throw error
  }
}

/**
 * Update transfer plan
 */
export async function updateTransferPlan(farmId, planId, updates) {
  try {
    const planRef = doc(db, 'farms', farmId, 'transfer_plans', planId)

    await updateDoc(planRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error updating transfer plan:', error)
    throw error
  }
}

/**
 * Delete transfer plan and all its tasks
 */
export async function deleteTransferPlan(farmId, planId) {
  try {
    const batch = writeBatch(db)

    // Delete all tasks
    const q = query(
      collection(db, 'farms', farmId, 'transfer_tasks'),
      where('planId', '==', planId)
    )
    const tasksSnapshot = await getDocs(q)

    tasksSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete the plan
    const planRef = doc(db, 'farms', farmId, 'transfer_plans', planId)
    batch.delete(planRef)

    await batch.commit()
  } catch (error) {
    console.error('Error deleting transfer plan:', error)
    throw error
  }
}

/**
 * Add transfer task to plan
 */
export async function addTransferTask(farmId, taskData) {
  try {
    const taskRef = doc(collection(db, 'farms', farmId, 'transfer_tasks'))
    const taskId = taskRef.id

    const task = {
      taskId,
      planId: taskData.planId,
      farmId,
      fishId: taskData.fishId,
      fishName: taskData.fishName,
      scientificName: taskData.scientificName,
      size: taskData.size,
      quantity: taskData.quantity,
      sourceAquariumId: taskData.sourceAquariumId,
      sourceAquariumNumber: taskData.sourceAquariumNumber,
      sourceRoom: taskData.sourceRoom || '',
      targetAquariumId: taskData.targetAquariumId,
      targetAquariumNumber: taskData.targetAquariumNumber || '',
      targetRoom: taskData.targetRoom || '',
      order: taskData.order || 0, // Execution order
      status: 'pending', // pending, in-progress, completed, blocked, cancelled
      blockReason: null,
      blockNotes: null,
      allowMixing: taskData.allowMixing || false, // Allow adding to occupied aquarium
      notes: taskData.notes || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      executedAt: null,
    }

    await setDoc(taskRef, task)

    // Update plan task count
    const planRef = doc(db, 'farms', farmId, 'transfer_plans', taskData.planId)
    const planDoc = await getDoc(planRef)
    if (planDoc.exists()) {
      const currentCount = planDoc.data().taskCount || 0
      await updateDoc(planRef, {
        taskCount: currentCount + 1,
        updatedAt: Timestamp.now(),
      })
    }

    return { taskId, task }
  } catch (error) {
    console.error('Error adding transfer task:', error)
    throw error
  }
}

/**
 * Get all tasks for a transfer plan
 */
export async function getTransferTasks(farmId, planId) {
  try {
    const q = query(
      collection(db, 'farms', farmId, 'transfer_tasks'),
      where('planId', '==', planId),
      orderBy('order', 'asc')
    )

    const snapshot = await getDocs(q)
    const tasks = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      tasks.push({
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        executedAt: data.executedAt?.toDate(),
      })
    })

    return tasks
  } catch (error) {
    console.error('Error getting transfer tasks:', error)
    throw error
  }
}

/**
 * Update transfer task
 */
export async function updateTransferTask(farmId, taskId, updates) {
  try {
    const taskRef = doc(db, 'farms', farmId, 'transfer_tasks', taskId)

    await updateDoc(taskRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error updating transfer task:', error)
    throw error
  }
}

/**
 * Delete transfer task
 */
export async function deleteTransferTask(farmId, planId, taskId) {
  try {
    const batch = writeBatch(db)

    // Delete the task
    const taskRef = doc(db, 'farms', farmId, 'transfer_tasks', taskId)
    batch.delete(taskRef)

    // Update plan task count
    const planRef = doc(db, 'farms', farmId, 'transfer_plans', planId)
    const planDoc = await getDoc(planRef)
    if (planDoc.exists()) {
      const currentCount = planDoc.data().taskCount || 0
      batch.update(planRef, {
        taskCount: Math.max(0, currentCount - 1),
        updatedAt: Timestamp.now(),
      })
    }

    await batch.commit()
  } catch (error) {
    console.error('Error deleting transfer task:', error)
    throw error
  }
}

/**
 * Calculate virtual state of aquariums based on pending tasks
 * Returns a map: aquariumId -> { willBeEmpty: boolean, willBeOccupied: boolean, pendingAdditions: number }
 */
export async function calculateVirtualAquariumState(farmId, planId) {
  try {
    const tasks = await getTransferTasks(farmId, planId)
    const virtualState = new Map()

    // Process tasks in order
    tasks
      .filter((t) => t.status === 'pending' || t.status === 'in-progress')
      .forEach((task) => {
        // Source aquarium will have fish removed
        if (task.sourceAquariumId) {
          if (!virtualState.has(task.sourceAquariumId)) {
            virtualState.set(task.sourceAquariumId, {
              willBeEmpty: false,
              willBeOccupied: false,
              pendingRemovals: 0,
              pendingAdditions: 0,
            })
          }
          const sourceState = virtualState.get(task.sourceAquariumId)
          sourceState.pendingRemovals += task.quantity
          sourceState.willBeEmpty = true // Assume it will be empty (need to verify with actual data)
        }

        // Target aquarium will have fish added
        if (task.targetAquariumId) {
          if (!virtualState.has(task.targetAquariumId)) {
            virtualState.set(task.targetAquariumId, {
              willBeEmpty: false,
              willBeOccupied: false,
              pendingRemovals: 0,
              pendingAdditions: 0,
            })
          }
          const targetState = virtualState.get(task.targetAquariumId)
          targetState.pendingAdditions += task.quantity
          targetState.willBeOccupied = true
        }
      })

    return virtualState
  } catch (error) {
    console.error('Error calculating virtual aquarium state:', error)
    throw error
  }
}

/**
 * Validate task warnings - checks for conflicts and returns warnings
 */
export async function validateTaskWarnings(farmId, planId, taskData) {
  try {
    const warnings = []
    const virtualState = await calculateVirtualAquariumState(farmId, planId)

    // Warning 1: Adding fish to aquarium that has pending removals
    if (taskData.targetAquariumId && virtualState.has(taskData.targetAquariumId)) {
      const targetState = virtualState.get(taskData.targetAquariumId)
      if (targetState.pendingRemovals > 0) {
        warnings.push({
          type: 'target_has_pending_removals',
          message: `אקווריום ${taskData.targetAquariumNumber} מתוכנן להתרוקן. האם אתה בטוח שברצונך להוסיף אליו דגים?`,
          severity: 'warning',
          allowOverride: true,
        })
      }
    }

    // Warning 2: Removing fish from aquarium that already has pending additions
    if (taskData.sourceAquariumId && virtualState.has(taskData.sourceAquariumId)) {
      const sourceState = virtualState.get(taskData.sourceAquariumId)
      if (sourceState.pendingAdditions > 0) {
        warnings.push({
          type: 'source_has_pending_additions',
          message: `אקווריום ${taskData.sourceAquariumNumber} כבר מתוכנן לקבל דגים. האם אתה בטוח שברצונך להוציא ממנו דגים?`,
          severity: 'warning',
          allowOverride: true,
        })
      }
    }

    // Warning 3: Check if target aquarium is already occupied (physical state)
    if (taskData.targetAquariumId && !taskData.allowMixing) {
      // Get all farm fish for this aquarium
      const farmFish = await getFarmFish(farmId)
      const targetOccupied = farmFish.some(
        (fish) => fish.aquariumId === taskData.targetAquariumId && fish.quantity > 0
      )

      if (targetOccupied) {
        warnings.push({
          type: 'target_occupied',
          message: `אקווריום ${taskData.targetAquariumNumber} תפוס כרגע. האם ברצונך לערבב דגים?`,
          severity: 'warning',
          allowOverride: true,
        })
      }
    }

    return warnings
  } catch (error) {
    console.error('Error validating task warnings:', error)
    throw error
  }
}

/**
 * Execute a transfer task - actually moves the fish
 */
export async function executeTransferTask(farmId, taskId) {
  try {
    const batch = writeBatch(db)

    // Get the task
    const taskRef = doc(db, 'farms', farmId, 'transfer_tasks', taskId)
    const taskDoc = await getDoc(taskRef)

    if (!taskDoc.exists()) {
      throw new Error('Transfer task not found')
    }

    const task = taskDoc.data()

    if (task.status === 'completed') {
      throw new Error('Task already completed')
    }

    if (task.status === 'blocked') {
      throw new Error('Task is blocked - requires manager approval')
    }

    // Update the fish record to new aquarium
    const fishRef = doc(db, 'farmFish', task.fishId)
    batch.update(fishRef, {
      aquariumId: task.targetAquariumId,
      updatedAt: Timestamp.now(),
    })

    // Mark task as completed
    batch.update(taskRef, {
      status: 'completed',
      executedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Update plan counts
    const planRef = doc(db, 'farms', farmId, 'transfer_plans', task.planId)
    const planDoc = await getDoc(planRef)
    if (planDoc.exists()) {
      const currentCompleted = planDoc.data().completedTaskCount || 0
      const taskCount = planDoc.data().taskCount || 0
      const newCompletedCount = currentCompleted + 1

      batch.update(planRef, {
        completedTaskCount: newCompletedCount,
        status: newCompletedCount >= taskCount ? 'completed' : 'in-progress',
        updatedAt: Timestamp.now(),
      })
    }

    await batch.commit()

    // Note: Aquarium status will be updated automatically by the farm-fish service

    return { success: true }
  } catch (error) {
    console.error('Error executing transfer task:', error)
    throw error
  }
}

/**
 * Block a task - worker reports an issue
 */
export async function blockTransferTask(farmId, planId, taskId, blockData) {
  try {
    const batch = writeBatch(db)

    const taskRef = doc(db, 'farms', farmId, 'transfer_tasks', taskId)
    batch.update(taskRef, {
      status: 'blocked',
      blockReason: blockData.reason, // 'temperature', 'size', 'leak', 'other'
      blockNotes: blockData.notes || '',
      updatedAt: Timestamp.now(),
    })

    // Update plan blocked count
    const planRef = doc(db, 'farms', farmId, 'transfer_plans', planId)
    const planDoc = await getDoc(planRef)
    if (planDoc.exists()) {
      const currentBlocked = planDoc.data().blockedTaskCount || 0
      batch.update(planRef, {
        blockedTaskCount: currentBlocked + 1,
        updatedAt: Timestamp.now(),
      })
    }

    await batch.commit()
  } catch (error) {
    console.error('Error blocking transfer task:', error)
    throw error
  }
}

/**
 * Unblock a task - manager approves to continue or cancel
 */
export async function unblockTransferTask(farmId, planId, taskId, action) {
  try {
    const batch = writeBatch(db)

    const taskRef = doc(db, 'farms', farmId, 'transfer_tasks', taskId)

    if (action === 'continue') {
      batch.update(taskRef, {
        status: 'pending',
        blockReason: null,
        blockNotes: null,
        updatedAt: Timestamp.now(),
      })
    } else if (action === 'cancel') {
      batch.update(taskRef, {
        status: 'cancelled',
        updatedAt: Timestamp.now(),
      })
    }

    // Update plan blocked count
    const planRef = doc(db, 'farms', farmId, 'transfer_plans', planId)
    const planDoc = await getDoc(planRef)
    if (planDoc.exists()) {
      const currentBlocked = planDoc.data().blockedTaskCount || 0
      batch.update(planRef, {
        blockedTaskCount: Math.max(0, currentBlocked - 1),
        updatedAt: Timestamp.now(),
      })
    }

    await batch.commit()
  } catch (error) {
    console.error('Error unblocking transfer task:', error)
    throw error
  }
}

/**
 * Finalize transfer plan - mark as ready for execution
 */
export async function finalizeTransferPlan(farmId, planId) {
  try {
    await updateTransferPlan(farmId, planId, {
      status: 'ready',
    })
  } catch (error) {
    console.error('Error finalizing transfer plan:', error)
    throw error
  }
}
