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
  setDoc,
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

    console.log('Creating invitation with data:', invitation)
    const docRef = await addDoc(collection(db, COLLECTION_NAME), invitation)
    console.log('Invitation created with ID:', docRef.id, 'inviteCode:', inviteCode)

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
    console.log('Looking for invitation with code:', inviteCode)

    // First, try to find by inviteCode only (without status filter) for debugging
    const debugQ = query(
      collection(db, COLLECTION_NAME),
      where('inviteCode', '==', inviteCode)
    )
    const debugSnapshot = await getDocs(debugQ)
    console.log('DEBUG - All invitations with this code:', debugSnapshot.size)
    debugSnapshot.forEach(doc => {
      console.log('DEBUG - Invitation:', doc.id, doc.data())
    })

    const q = query(
      collection(db, COLLECTION_NAME),
      where('inviteCode', '==', inviteCode),
      where('status', '==', 'pending')
    )

    const snapshot = await getDocs(q)
    console.log('Found pending invitations:', snapshot.size)

    if (snapshot.empty) {
      console.log('No pending invitation found for code:', inviteCode)
      return null
    }

    const doc = snapshot.docs[0]
    const data = doc.data()
    console.log('Invitation found:', doc.id, data)

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
    console.log('Accepting invitation:', invitationId, 'for user:', userId)
    const inviteRef = doc(db, COLLECTION_NAME, invitationId)
    const inviteDoc = await getDoc(inviteRef)

    if (!inviteDoc.exists()) {
      console.error('Invitation not found:', invitationId)
      throw new Error('ההזמנה לא נמצאה')
    }

    const invitation = inviteDoc.data()
    console.log('Invitation data:', invitation)

    if (invitation.status !== 'pending') {
      console.error('Invitation status is not pending:', invitation.status)
      throw new Error('ההזמנה כבר נוצלה או בוטלה')
    }

    if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
      throw new Error('ההזמנה פגה תוקף')
    }

    // First, add user to farm members (do this BEFORE marking invitation as accepted)
    const farmRef = doc(db, 'farms', invitation.farmId)
    const farmDoc = await getDoc(farmRef)

    if (!farmDoc.exists()) {
      throw new Error('החווה לא נמצאה')
    }

    const farmData = farmDoc.data()
    console.log('Farm data:', farmData)
    const members = farmData.members || []
    const memberIds = farmData.memberIds || []
    console.log('Current members:', members)
    console.log('Current memberIds:', memberIds)

    // Check if user is already a member
    const isAlreadyMember = members.some(m => m.id === userId)
    const isInMemberIds = memberIds.includes(userId)
    console.log('Is already member:', isAlreadyMember, 'Is in memberIds:', isInMemberIds)

    let needsUpdate = false

    if (!isAlreadyMember) {
      const newMember = {
        id: userId,
        role: invitation.role,
        joinedAt: new Date().toISOString()
      }
      members.push(newMember)
      needsUpdate = true
    }

    // Always ensure user is in memberIds (used for security rules)
    if (!isInMemberIds) {
      memberIds.push(userId)
      needsUpdate = true
    }

    if (needsUpdate) {
      console.log('Updating farm members:', { farmId: invitation.farmId, userId, members, memberIds })
      await updateDoc(farmRef, { members, memberIds })
      console.log('User added to farm successfully')
    } else {
      console.log('User is already fully added, skipping update')
    }

    // Create user's farm membership document (required for getUserFarms to find this farm)
    try {
      const membershipRef = doc(db, 'users', userId, 'farms', invitation.farmId)
      await setDoc(membershipRef, {
        farmId: invitation.farmId,
        farmName: invitation.farmName,
        role: invitation.role,
        joinedAt: serverTimestamp()
      })
      console.log('User farm membership document created at users/' + userId + '/farms/' + invitation.farmId)
    } catch (membershipError) {
      console.error('Error creating user membership document:', membershipError)
      // Don't throw - the user is added to the farm, they just might need to refresh
    }

    // Only mark invitation as accepted AFTER successfully adding user to farm
    await updateDoc(inviteRef, {
      status: 'accepted',
      acceptedBy: userId,
      acceptedAt: serverTimestamp()
    })
    console.log('Invitation marked as accepted')

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
