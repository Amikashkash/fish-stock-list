import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import { signInAnonymously } from 'firebase/auth'
import { emptyAquarium } from './aquarium.service'

// ─── Token generation ─────────────────────────────────────────────────────────

function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 36 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

// ─── Anonymous auth ───────────────────────────────────────────────────────────

export async function ensureAnonymousAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
}

// ─── Portal management ────────────────────────────────────────────────────────

export async function createOrderPortal(farmId, farmName) {
  // Return existing active portal if one exists
  const existing = await getActiveFarmPortal(farmId)
  if (existing) {
    return { token: existing, shareUrl: `${window.location.origin}/shop/${existing}` }
  }

  const token = generateToken()
  await setDoc(doc(db, 'orderPortals', token), {
    farmId,
    farmName,
    active: true,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid || null,
  })

  return { token, shareUrl: `${window.location.origin}/shop/${token}` }
}

export async function getActiveFarmPortal(farmId) {
  const q = query(
    collection(db, 'orderPortals'),
    where('farmId', '==', farmId),
    where('active', '==', true)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].id
}

export async function deactivateOrderPortal(token) {
  await updateDoc(doc(db, 'orderPortals', token), { active: false })
}

export async function getOrderPortal(token) {
  const snap = await getDoc(doc(db, 'orderPortals', token))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ─── Order creation (store employee) ─────────────────────────────────────────

export async function createOrder({ farmId, token, customerName, customerPhone, notes, items }) {
  const docRef = await addDoc(collection(db, 'orders'), {
    farmId,
    token,
    customerName: customerName.trim(),
    customerPhone: (customerPhone || '').trim(),
    notes: (notes || '').trim(),
    status: 'pending',
    items: items.map(item => ({
      fishId: item.fishId,
      hebrewName: item.hebrewName || '',
      scientificName: item.scientificName || '',
      size: item.size || '',
      price: item.price || null,
      aquariumId: item.aquariumId || null,
      aquariumNumber: item.aquariumNumber || '',
      requestedQuantity: item.requestedQuantity,
      packedQuantity: item.requestedQuantity,
      isPacked: false,
      markAquariumEmpty: false,
    })),
    createdAt: serverTimestamp(),
    createdByUid: auth.currentUser?.uid || null,
  })
  return docRef.id
}

// ─── Order management (farm owner) ───────────────────────────────────────────

export async function getOrders(farmId) {
  const q = query(
    collection(db, 'orders'),
    where('farmId', '==', farmId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    orderId: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() || null,
  }))
}

export async function updateOrder(orderId, updates) {
  await updateDoc(doc(db, 'orders', orderId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function markOrderProcessing(orderId) {
  return updateOrder(orderId, { status: 'processing' })
}

export async function markOrderCompleted(orderId, farmId, items) {
  // Mark aquariums empty for flagged items
  const emptyAquariumPromises = (items || [])
    .filter(item => item.markAquariumEmpty && item.aquariumId)
    .map(item => emptyAquarium(farmId, item.aquariumId, 'shipped', `הזמנה ${orderId}`).catch(err => {
      console.error(`Failed to empty aquarium ${item.aquariumId}:`, err)
    }))

  await Promise.all([
    updateOrder(orderId, { status: 'completed' }),
    ...emptyAquariumPromises,
  ])
}
