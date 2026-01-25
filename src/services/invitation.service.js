/**
 * Invitation Service
 * Handles employee invitations to join a farm
 */

import { db, auth } from '../firebase/config'
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

const COLLECTION_NAME = 'invitations'

/**
 * Generate a unique invitation code
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Create a new invitation
 * @param {string} farmId - Farm ID
 * @param {Object} inviteData - Invitation data
 * @returns {Promise<{invitationId: string, inviteLink: string}>}
 */
export async function createInvitation(farmId, inviteData) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('יש להתחבר כדי לשלוח הזמנות')
    }

    const inviteCode = generateInviteCode()

    // Get app URL from window location
    const baseUrl = window.location.origin
    const inviteLink = `${baseUrl}/join/${inviteCode}`

    const invitation = {
      farmId,
      email: inviteData.email,
      role: inviteData.role || 'worker',
      farmName: inviteData.farmName,
      inviteCode,
      inviteLink,
      status: 'pending',
      invitedBy: currentUser.uid,
      invitedByEmail: currentUser.email,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), invitation)

    return {
      invitationId: docRef.id,
      inviteLink,
      inviteCode
    }
  } catch (error) {
    console.error('Error creating invitation:', error)
    throw error
  }
}

/**
 * Get all pending invitations for a farm
 * @param {string} farmId - Farm ID
 * @returns {Promise<Array>}
 */
export async function getFarmInvitations(farmId) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('farmId', '==', farmId),
      where('status', '==', 'pending')
    )

    const snapshot = await getDocs(q)
    const invitations = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      // Filter out expired invitations
      if (data.expiresAt && data.expiresAt.toDate() > new Date()) {
        invitations.push({
          invitationId: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          expiresAt: data.expiresAt?.toDate()
        })
      }
    })

    return invitations
  } catch (error) {
    console.error('Error getting farm invitations:', error)
    throw error
  }
}

/**
 * Get invitation by code
 * @param {string} inviteCode - Invitation code
 * @returns {Promise<Object|null>}
 */
export async function getInvitationByCode(inviteCode) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('inviteCode', '==', inviteCode),
      where('status', '==', 'pending')
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    const data = doc.data()

    // Check if expired
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      return null
    }

    return {
      invitationId: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      expiresAt: data.expiresAt?.toDate()
    }
  } catch (error) {
    console.error('Error getting invitation by code:', error)
    throw error
  }
}

/**
 * Accept an invitation
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - User ID accepting the invitation
 * @returns {Promise<{farmId: string, role: string}>}
 */
export async function acceptInvitation(invitationId, userId) {
  try {
    const inviteRef = doc(db, COLLECTION_NAME, invitationId)
    const inviteDoc = await getDoc(inviteRef)

    if (!inviteDoc.exists()) {
      throw new Error('ההזמנה לא נמצאה')
    }

    const invitation = inviteDoc.data()

    if (invitation.status !== 'pending') {
      throw new Error('ההזמנה כבר נוצלה או בוטלה')
    }

    if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
      throw new Error('ההזמנה פגה תוקף')
    }

    // Update invitation status
    await updateDoc(inviteRef, {
      status: 'accepted',
      acceptedBy: userId,
      acceptedAt: serverTimestamp()
    })

    // Add user to farm members
    const farmRef = doc(db, 'farms', invitation.farmId)
    const farmDoc = await getDoc(farmRef)

    if (!farmDoc.exists()) {
      throw new Error('החווה לא נמצאה')
    }

    const farmData = farmDoc.data()
    const members = farmData.members || []

    // Check if user is already a member
    if (!members.some(m => m.id === userId)) {
      members.push({
        id: userId,
        role: invitation.role,
        joinedAt: new Date().toISOString()
      })

      await updateDoc(farmRef, { members })
    }

    return {
      farmId: invitation.farmId,
      role: invitation.role
    }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    throw error
  }
}

/**
 * Delete an invitation
 * @param {string} invitationId - Invitation ID
 */
export async function deleteInvitation(invitationId) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, invitationId))
  } catch (error) {
    console.error('Error deleting invitation:', error)
    throw error
  }
}
