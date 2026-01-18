import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { emptyAquarium, EMPTY_REASONS } from '../../../services/aquarium.service'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../../firebase/config'

function QuickEmptyModal({ isOpen, onClose, onSuccess, aquarium }) {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [loadingFish, setLoadingFish] = useState(true)
  const [error, setError] = useState('')
  const [reason, setReason] = useState(EMPTY_REASONS.SHIPMENT)
  const [notes, setNotes] = useState('')
  const [fishList, setFishList] = useState({ farmFish: [], fishInstances: [] })

  // Load fish in aquarium
  useEffect(() => {
    if (isOpen && aquarium && currentFarm) {
      loadFishInAquarium()
    }
  }, [isOpen, aquarium, currentFarm])

  async function loadFishInAquarium() {
    setLoadingFish(true)
    try {
      // Get farmFish
      const farmFishRef = collection(db, 'farmFish')
      const farmFishQuery = query(
        farmFishRef,
        where('farmId', '==', currentFarm.farmId),
        where('aquariumId', '==', aquarium.aquariumId)
      )
      const farmFishSnapshot = await getDocs(farmFishQuery)
      const farmFishData = farmFishSnapshot.docs
        .map((doc) => ({ fishId: doc.id, ...doc.data() }))
        .filter((f) => f.quantity > 0)

      // Get fish_instances
      const fishInstancesRef = collection(db, 'farms', currentFarm.farmId, 'fish_instances')
      const fishInstancesQuery = query(
        fishInstancesRef,
        where('aquariumId', '==', aquarium.aquariumId)
      )
      const fishInstancesSnapshot = await getDocs(fishInstancesQuery)
      const fishInstancesData = fishInstancesSnapshot.docs
        .map((doc) => ({ instanceId: doc.id, ...doc.data() }))
        .filter((f) => f.currentQuantity > 0)

      setFishList({
        farmFish: farmFishData,
        fishInstances: fishInstancesData,
      })
    } catch (err) {
      console.error('Error loading fish:', err)
      setError('שגיאה בטעינת הדגים')
    } finally {
      setLoadingFish(false)
    }
  }

  async function handleEmpty() {
    setError('')
    setLoading(true)

    try {
      await emptyAquarium(currentFarm.farmId, aquarium.aquariumId, reason, notes)

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (err) {
      console.error('Error emptying aquarium:', err)
      setError('שגיאה בריקון האקווריום. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !aquarium) return null

  const totalFishCount =
    fishList.farmFish.reduce((sum, f) => sum + f.quantity, 0) +
    fishList.fishInstances.reduce((sum, f) => sum + f.currentQuantity, 0)

  const reasonLabels = {
    [EMPTY_REASONS.MORTALITY]: { icon: '💀', label: 'תמותה כוללת', desc: 'כל הדגים מתו - יירשם במערכת ניטור תמותה' },
    [EMPTY_REASONS.SHIPMENT]: { icon: '📦', label: 'אריזה לחנות', desc: 'הדגים נשלחו לחנות - הכמות תתאפס' },
    [EMPTY_REASONS.DELETE]: { icon: '🗑️', label: 'מחיקה רגילה', desc: 'הדגים יימחקו לחלוטין ללא רישום' },
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-0 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-[500px] h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">
            ריקון אקווריום {aquarium.aquariumNumber}
          </h2>
          <button
            className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Fish list */}
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">
              דגים באקווריום ({totalFishCount} סה"כ)
            </label>
            {loadingFish ? (
              <div className="text-gray-500 text-sm">טוען...</div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 max-h-[150px] overflow-y-auto">
                {fishList.farmFish.length === 0 && fishList.fishInstances.length === 0 ? (
                  <div className="text-gray-500 text-sm">אין דגים באקווריום</div>
                ) : (
                  <ul className="list-none p-0 m-0 space-y-1">
                    {fishList.farmFish.map((fish) => (
                      <li key={fish.fishId} className="text-sm text-gray-700 flex justify-between">
                        <span>{fish.hebrewName || fish.scientificName}</span>
                        <span className="text-gray-500">x{fish.quantity}</span>
                      </li>
                    ))}
                    {fishList.fishInstances.map((fish) => (
                      <li key={fish.instanceId} className="text-sm text-gray-700 flex justify-between">
                        <span>{fish.commonName || fish.scientificName}</span>
                        <span className="text-gray-500">x{fish.currentQuantity}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Reason selection */}
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">
              סיבת הריקון <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {Object.entries(reasonLabels).map(([key, { icon, label, desc }]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    reason === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={key}
                    checked={reason === key}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {icon} {label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">הערות (אופציונלי)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות נוספות..."
              rows="2"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors resize-y min-h-[60px] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {/* Warning */}
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium">
              {reason === EMPTY_REASONS.MORTALITY && '💀 כל הדגים יירשמו כתמותה במערכת הניטור'}
              {reason === EMPTY_REASONS.SHIPMENT && '📦 כמות הדגים תתאפס, הרשומות יישמרו להיסטוריה'}
              {reason === EMPTY_REASONS.DELETE && '🗑️ כל הדגים יימחקו לחלוטין ללא אפשרות שחזור'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6 pt-5 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all border-none cursor-pointer bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleEmpty}
              className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all border-none cursor-pointer bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || loadingFish || totalFishCount === 0}
            >
              {loading ? 'מרוקן...' : 'רוקן אקווריום'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickEmptyModal
