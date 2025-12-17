import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getAquariums } from '../../../services/aquarium.service'
import { getPreviousFishNames } from '../../../services/reception.service'
import { getFarmFish, addFarmFish, updateFarmFishAquarium, deleteFarmFish } from '../../../services/farm-fish.service'

const SOURCE_TYPES = {
  local_delivery: 'משלוח מקומי',
  farm_breeding: 'ריבוי בחווה',
  store_return: 'החזרתי מאחת החנויות',
}

const SHELF_LABELS = {
  bottom: 'תחתון',
  middle: 'אמצעי',
  top: 'עליון',
}

function FarmFishModal({ isOpen, onClose }) {
  const { currentFarm } = useFarm()
  const [farmFish, setFarmFish] = useState([])
  const [aquariums, setAquariums] = useState([])
  const [previousFishNames, setPreviousFishNames] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [assigningId, setAssigningId] = useState(null)

  const [newFish, setNewFish] = useState({
    hebrewName: '',
    scientificName: '',
    size: '',
    quantity: '',
    source: 'local_delivery',
    notes: '',
  })

  useEffect(() => {
    if (isOpen && currentFarm) {
      loadData()
    }
  }, [isOpen, currentFarm])

  async function loadData() {
    try {
      setLoading(true)
      const [fishData, aquariumsData, previousNames] = await Promise.all([
        getFarmFish(currentFarm.farmId),
        getAquariums(currentFarm.farmId),
        getPreviousFishNames(currentFarm.farmId),
      ])
      setFarmFish(fishData)
      setAquariums(aquariumsData)
      setPreviousFishNames(previousNames)
    } catch (err) {
      setError('שגיאה בטעינת הנתונים: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create map for quick lookup: hebrewName -> scientificName
  const fishNameMap = new Map(previousFishNames.map((f) => [f.hebrewName, f.scientificName]))

  // Handle Hebrew name change and auto-fill scientific name
  function handleHebrewNameChange(value) {
    setNewFish({ ...newFish, hebrewName: value })

    // Auto-fill scientific name if Hebrew name matches a previous entry
    const scientificName = fishNameMap.get(value)
    if (scientificName) {
      setNewFish((prev) => ({ ...prev, scientificName }))
    }
  }

  async function handleAddFish() {
    if (!newFish.hebrewName || !newFish.scientificName || !newFish.size) {
      setError('חסרים: שם עברי, שם מדעי וגודל')
      return
    }

    try {
      setLoading(true)
      setError('')
      await addFarmFish(currentFarm.farmId, {
        hebrewName: newFish.hebrewName,
        scientificName: newFish.scientificName,
        size: newFish.size,
        quantity: newFish.quantity || 1,
        source: newFish.source,
        notes: newFish.notes,
      })
      setNewFish({
        hebrewName: '',
        scientificName: '',
        size: '',
        quantity: '',
        source: 'local_delivery',
        notes: '',
      })
      setIsAdding(false)
      await loadData()
    } catch (err) {
      setError(err.message || 'שגיאה בהוספת דג')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignAquarium(fishId, aquariumId) {
    try {
      setLoading(true)
      setError('')
      await updateFarmFishAquarium(currentFarm.farmId, fishId, aquariumId)
      setAssigningId(null)
      await loadData()
    } catch (err) {
      setError(err.message || 'שגיאה בהקצאת אקווריום')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveAssignment(fishId) {
    try {
      setLoading(true)
      setError('')
      await updateFarmFishAquarium(currentFarm.farmId, fishId, null)
      await loadData()
    } catch (err) {
      setError(err.message || 'שגיאה בהסרת הקצאה')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteFish(fishId) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק דג זה?')) return

    try {
      setLoading(true)
      setError('')
      await deleteFarmFish(currentFarm.farmId, fishId)
      await loadData()
    } catch (err) {
      setError(err.message || 'שגיאה במחיקת הדג')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const unassignedFish = farmFish.filter((f) => !f.aquariumId)
  const assignedFish = farmFish.filter((f) => f.aquariumId)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">דגים לאקווריום</h2>
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

          {/* Status Summary */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm text-yellow-800">
                <span className="font-semibold">ממתין הקצאה:</span> {unassignedFish.length}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                <span className="font-semibold">מוקצה:</span> {assignedFish.length}
              </div>
            </div>
          </div>

          {loading && !farmFish.length ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Unassigned Fish */}
              {unassignedFish.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    ממתין הקצאה ({unassignedFish.length})
                  </h3>
                  <div className="space-y-2">
                    {unassignedFish.map((fish) => (
                      <div
                        key={fish.fishId}
                        className="border-2 border-yellow-300 rounded-lg p-3 bg-yellow-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{fish.hebrewName}</h4>
                            <p className="text-xs text-gray-600 italic">{fish.scientificName}</p>
                          </div>
                          <div className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                            {SOURCE_TYPES[fish.source]}
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 mb-3">
                          <div className="font-semibold">{fish.quantity} יח'</div>
                          <div>גודל: {fish.size}</div>
                          {fish.notes && <div className="text-gray-600 mt-1">📝 {fish.notes}</div>}
                        </div>

                        {assigningId === fish.fishId ? (
                          <div className="bg-white rounded-lg p-3 border border-yellow-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2">
                              בחר אקווריום להקצאה:
                            </div>
                            {aquariums.length === 0 ? (
                              <div className="text-xs text-red-600 py-2">
                                אין אקווריומים זמינים
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {aquariums.map((aquarium) => {
                                  const shelfLabel = SHELF_LABELS[aquarium.shelf] || aquarium.shelf
                                  return (
                                    <button
                                      key={aquarium.aquariumId}
                                      onClick={() =>
                                        handleAssignAquarium(fish.fishId, aquarium.aquariumId)
                                      }
                                      className={`w-full p-2 rounded text-xs transition-all text-left ${
                                        aquarium.status === 'occupied'
                                          ? 'bg-red-100 text-red-700 opacity-60 cursor-not-allowed'
                                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                                      }`}
                                      disabled={aquarium.status === 'occupied'}
                                    >
                                      <div className="font-semibold flex justify-between items-center">
                                        <span>#{aquarium.aquariumNumber}</span>
                                        {aquarium.status === 'occupied' && (
                                          <span className="text-xs">(תפוס)</span>
                                        )}
                                      </div>
                                      <div className="text-xs opacity-75 mt-1 flex gap-2">
                                        <span>📏 {aquarium.volume}L</span>
                                        <span>📍 {shelfLabel}</span>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                            <button
                              onClick={() => setAssigningId(null)}
                              className="w-full mt-2 px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              ביטול
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningId(fish.fishId)}
                            className="w-full px-3 py-2 text-xs font-semibold bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            הקצה לאקווריום
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Fish */}
              {assignedFish.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    מוקצה ({assignedFish.length})
                  </h3>
                  <div className="space-y-2">
                    {assignedFish.map((fish) => {
                      const aquarium = aquariums.find((a) => a.aquariumId === fish.aquariumId)
                      const shelfLabel = aquarium
                        ? SHELF_LABELS[aquarium.shelf] || aquarium.shelf
                        : ''
                      return (
                        <div
                          key={fish.fishId}
                          className="bg-green-50 border border-green-300 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{fish.hebrewName}</h4>
                              <p className="text-xs text-gray-600 italic">
                                {fish.scientificName}
                              </p>
                            </div>
                            <div className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                              {SOURCE_TYPES[fish.source]}
                            </div>
                          </div>
                          <div className="text-xs text-gray-700 mb-3">
                            <div className="font-semibold">{fish.quantity} יח'</div>
                            <div>גודל: {fish.size}</div>
                            {fish.notes && <div className="text-gray-600 mt-1">📝 {fish.notes}</div>}
                          </div>
                          <div className="mb-3 p-2 bg-white rounded border border-green-200">
                            <div className="text-xs text-green-700">
                              ✅ אקווריום: <span className="font-bold">#{aquarium?.aquariumNumber}</span>
                              {aquarium && (
                                <>
                                  <span className="ml-2">📏 {aquarium.volume}L</span>
                                  <span className="ml-2">📍 {shelfLabel}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAssigningId(fish.fishId)}
                              className="flex-1 px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              📍 שנה אקווריום
                            </button>
                            <button
                              onClick={() => handleRemoveAssignment(fish.fishId)}
                              className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                            >
                              הסר
                            </button>
                            <button
                              onClick={() => handleDeleteFish(fish.fishId)}
                              className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              🗑️ מחק
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Add New Fish */}
              {!isAdding ? (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full px-4 py-3 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-all"
                >
                  ➕ הוסף דג חדש
                </button>
              ) : (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">דג חדש</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">שם עברי*</label>
                      <input
                        type="text"
                        value={newFish.hebrewName}
                        onChange={(e) => handleHebrewNameChange(e.target.value)}
                        list="fish-names-list"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                        disabled={loading}
                      />
                      <datalist id="fish-names-list">
                        {previousFishNames.map((fish) => (
                          <option key={fish.hebrewName} value={fish.hebrewName} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">שם מדעי*</label>
                      <input
                        type="text"
                        value={newFish.scientificName}
                        onChange={(e) =>
                          setNewFish({ ...newFish, scientificName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">גודל*</label>
                      <input
                        type="text"
                        value={newFish.size}
                        onChange={(e) => setNewFish({ ...newFish, size: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">כמות</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newFish.quantity}
                        onChange={(e) => {
                          const num = parseInt(e.target.value) || ''
                          setNewFish({ ...newFish, quantity: num })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-700">מקור*</label>
                    <select
                      value={newFish.source}
                      onChange={(e) =>
                        setNewFish({ ...newFish, source: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                      disabled={loading}
                    >
                      {Object.entries(SOURCE_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-700">הערות</label>
                    <textarea
                      value={newFish.notes}
                      onChange={(e) =>
                        setNewFish({ ...newFish, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 h-16"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddFish}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                    >
                      {loading ? 'מוסיף...' : 'הוסף'}
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false)
                        setError('')
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-50"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {farmFish.length === 0 && !isAdding && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">🏠</div>
                  <div>אין דגים מקומיים עדיין</div>
                </div>
              )}
            </>
          )}

          {/* Close Button */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmFishModal
