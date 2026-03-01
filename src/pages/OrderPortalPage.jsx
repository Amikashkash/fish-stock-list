import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getFarmFish } from '../services/farm-fish.service'
import { getFishInstances } from '../services/fish.service'
import { getAquariums } from '../services/aquarium.service'
import {
  ensureAnonymousAuth,
  getOrderPortal,
  createOrder,
} from '../services/order.service'

// Merge catalog fish + fish instances into a single in-stock priced list
function buildFishList(catalogFish, fishInstances, aquariums) {
  const aquariumMap = new Map()
  aquariums.forEach(aq => {
    aquariumMap.set(aq.aquariumId, {
      room: aq.room || '',
      number: aq.aquariumNumber || '',
    })
  })

  // Normalize size: extract leading number so "3cm" and "3-4cm" share the same key
  const sizeKey = (s) => {
    const n = (s || '').toLowerCase().replace(/\s+/g, '')
    const m = n.match(/^(\d+\.?\d*)/)
    return m ? m[1] : n
  }

  const fishMap = new Map()

  catalogFish.forEach(f => {
    const key = `${(f.scientificName || '').toLowerCase()}_${sizeKey(f.size)}`
    fishMap.set(key, {
      ...f,
      currentQuantity: 0,
      aquariumId: null,
      aquariumRoom: '',
      aquariumNumber: '',
    })
  })

  fishInstances.forEach(inst => {
    // Skip non-active instances
    if (inst.status && inst.status !== 'active') return

    const key = `${(inst.scientificName || '').toLowerCase()}_${sizeKey(inst.size)}`
    const existing = fishMap.get(key)
    const aqInfo = inst.aquariumId ? aquariumMap.get(inst.aquariumId) : null
    const instancePrice = inst.price || inst.costs?.invoiceCostPerFish || null
    const instQty = inst.currentQuantity || 0

    if (existing) {
      const useInstance = instQty > (existing.currentQuantity || 0)
      fishMap.set(key, {
        ...existing,
        size: useInstance ? (inst.size || existing.size) : existing.size,
        currentQuantity: (existing.currentQuantity || 0) + instQty,
        price: instancePrice || existing.price,
        aquariumId: useInstance ? (inst.aquariumId || existing.aquariumId) : existing.aquariumId,
        aquariumRoom: useInstance ? (aqInfo?.room || existing.aquariumRoom || '') : existing.aquariumRoom,
        aquariumNumber: useInstance ? (aqInfo?.number || existing.aquariumNumber || '') : existing.aquariumNumber,
      })
    } else {
      fishMap.set(key, {
        fishId: inst.instanceId,
        scientificName: inst.scientificName || '',
        hebrewName: inst.commonName || '',
        size: inst.size || '',
        price: instancePrice,
        currentQuantity: instQty,
        aquariumId: inst.aquariumId || null,
        aquariumRoom: aqInfo?.room || '',
        aquariumNumber: aqInfo?.number || '',
        source: 'fish-instance',
      })
    }
  })

  return Array.from(fishMap.values())
    .filter(f => f.price && (f.currentQuantity || 0) > 0)
    .sort((a, b) =>
      (a.hebrewName || a.scientificName || '').localeCompare(
        b.hebrewName || b.scientificName || '',
        'he'
      )
    )
}

export default function OrderPortalPage() {
  const { token } = useParams()

  // 'loading' | 'error' | 'form' | 'submitting' | 'success'
  const [phase, setPhase] = useState('loading')
  const [errorMsg, setErrorMsg] = useState('')

  const [portal, setPortal] = useState(null)
  const [fish, setFish] = useState([])

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [quantities, setQuantities] = useState({})
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        await ensureAnonymousAuth()

        const portalData = await getOrderPortal(token)
        if (!portalData || !portalData.active) {
          setErrorMsg('הקישור לא תקין או שפג תוקפו')
          setPhase('error')
          return
        }
        setPortal(portalData)

        const [catalogFish, fishInstances, aquariums] = await Promise.all([
          getFarmFish(portalData.farmId),
          getFishInstances(portalData.farmId),
          getAquariums(portalData.farmId),
        ])

        setFish(buildFishList(catalogFish, fishInstances, aquariums))
        setPhase('form')
      } catch (err) {
        console.error('Portal init error:', err)
        setErrorMsg('שגיאה בטעינת הדף. נסה שוב.')
        setPhase('error')
      }
    }
    init()
  }, [token])

  function handleQuantityChange(fishId, value) {
    const qty = parseInt(value, 10)
    setQuantities(prev => ({
      ...prev,
      [fishId]: isNaN(qty) || qty < 0 ? 0 : qty,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customerName.trim()) return

    const selectedItems = fish
      .filter(f => (quantities[f.fishId] || 0) > 0)
      .map(f => ({
        fishId: f.fishId,
        hebrewName: f.hebrewName,
        scientificName: f.scientificName,
        size: f.size,
        price: f.price,
        aquariumId: f.aquariumId,
        aquariumNumber: f.aquariumNumber,
        requestedQuantity: quantities[f.fishId],
      }))

    if (selectedItems.length === 0) return

    setPhase('submitting')
    try {
      const id = await createOrder({
        farmId: portal.farmId,
        token,
        customerName,
        customerPhone,
        notes,
        items: selectedItems,
      })
      setOrderId(id)
      setPhase('success')
    } catch (err) {
      console.error('Order submission error:', err)
      setErrorMsg('שגיאה בשליחת ההזמנה. נסה שוב.')
      setPhase('form')
    }
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center" dir="rtl">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">טוען מחירון...</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">הקישור אינו תקין</h1>
        <p className="text-gray-600">{errorMsg}</p>
      </div>
    )
  }

  if (phase === 'success') {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ההזמנה נשלחה!</h1>
        <p className="text-gray-600 mb-1">
          ההזמנה התקבלה אצל <strong>{portal?.farmName}</strong>
        </p>
        <p className="text-xs text-gray-400">מספר הזמנה: {orderId}</p>
        <button
          onClick={() => {
            setPhase('form')
            setQuantities({})
            setCustomerName('')
            setCustomerPhone('')
            setNotes('')
          }}
          className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          הזמנה חדשה
        </button>
      </div>
    )
  }

  const selectedCount = Object.values(quantities).filter(q => q > 0).length
  const isSubmitting = phase === 'submitting'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md px-4 py-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-700 m-0">הזמנת דגים</h1>
        <p className="text-sm text-gray-500 m-0">{portal?.farmName}</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 pb-28">
        {/* Customer Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-3">פרטי לקוח</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="שם החנות / הלקוח *"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-sm"
              dir="rtl"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="טלפון (לא חובה)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-sm"
              dir="ltr"
            />
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="הערות להזמנה (לא חובה)"
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-sm resize-none"
              dir="rtl"
            />
          </div>
        </div>

        {/* Fish Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-base font-semibold text-gray-800 mb-3">בחר דגים</h2>
          {fish.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">🐟</div>
              <div>אין דגים זמינים כרגע</div>
            </div>
          ) : (
            <div className="space-y-2">
              {fish.map(f => {
                const qty = quantities[f.fishId] || 0
                return (
                  <div
                    key={f.fishId}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                      qty > 0
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {f.hebrewName || f.scientificName}
                      </div>
                      {f.hebrewName && (
                        <div className="text-xs italic text-gray-400 truncate">{f.scientificName}</div>
                      )}
                      <div className="flex gap-3 mt-1 text-xs text-gray-600">
                        <span>{f.size}</span>
                        <span className="font-semibold text-green-700">
                          ₪{typeof f.price === 'number' ? f.price.toFixed(2) : f.price}
                        </span>
                        <span className="text-gray-400">מלאי: {f.currentQuantity}</span>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={f.currentQuantity}
                      value={qty || ''}
                      onChange={e => handleQuantityChange(f.fishId, e.target.value)}
                      placeholder="0"
                      className="w-20 px-2 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-bold focus:border-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </form>

      {/* Sticky Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedCount === 0 || !customerName.trim()}
          className="w-full max-w-2xl mx-block py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-blue-700 text-base block mx-auto"
        >
          {isSubmitting
            ? 'שולח הזמנה...'
            : selectedCount > 0
            ? `שלח הזמנה (${selectedCount} סוגי דגים)`
            : 'שלח הזמנה'}
        </button>
      </div>
    </div>
  )
}
