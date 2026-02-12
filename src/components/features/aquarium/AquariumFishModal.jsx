import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getPreviousFishNames } from '../../../services/reception.service'
import { getFarmFish, addFarmFish, updateFarmFish, deleteFarmFish } from '../../../services/farm-fish.service'
import { getFishByAquarium, updateFishInstance, deleteFishInstance } from '../../../services/fish.service'
import { getPendingTasksForFish } from '../../../services/task.service'
import MortalityRecordModal from '../health/MortalityRecordModal'

// Default fallback sources if none defined in settings
const DEFAULT_FISH_SOURCES = [
  { id: 'local_delivery', label: 'משלוח מקומי' },
  { id: 'farm_breeding', label: 'ריבוי בחווה' },
  { id: 'store_return', label: 'החזרה מחנות' },
]

function AquariumFishModal({ isOpen, onClose, aquarium, onSuccess }) {
  const { currentFarm } = useFarm()

  // Get fish sources from farm settings or use defaults
  const fishSources = currentFarm?.settings?.fishSources?.length > 0
    ? currentFarm.settings.fishSources
    : DEFAULT_FISH_SOURCES

  // Helper to get source label by id
  const getSourceLabel = (sourceId) => {
    const source = fishSources.find(s => s.id === sourceId)
    return source?.label || sourceId
  }
  const [fishList, setFishList] = useState([])
  const [receptionFishList, setReceptionFishList] = useState([])
  const [previousFishNames, setPreviousFishNames] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [mortalityModalOpen, setMortalityModalOpen] = useState(false)
  const [selectedFishForMortality, setSelectedFishForMortality] = useState(null)

  // Get default source id
  const defaultSourceId = fishSources[0]?.id || 'local_delivery'

  const [newFish, setNewFish] = useState({
    hebrewName: '',
    scientificName: '',
    size: '',
    quantity: '',
    price: '',
    source: defaultSourceId,
    notes: '',
  })

  const [editData, setEditData] = useState({
    hebrewName: '',
    scientificName: '',
    size: '',
    quantity: '',
    price: '',
    source: '',
    notes: '',
  })

  useEffect(() => {
    if (isOpen && currentFarm && aquarium) {
      loadData()
      // If aquarium is empty, auto-open add form
      if (aquarium.status === 'empty' || aquarium.totalFish === 0) {
        setIsAdding(true)
      }
    }
  }, [isOpen, currentFarm, aquarium])

  async function loadData() {
    try {
      setLoading(true)
      const [fishData, receptionFish, previousNames] = await Promise.all([
        getFarmFish(currentFarm.farmId),
        getFishByAquarium(currentFarm.farmId, aquarium.aquariumId),
        getPreviousFishNames(currentFarm.farmId),
      ])
      // Filter only fish in this aquarium
      const aquariumFish = fishData.filter((f) => f.aquariumId === aquarium.aquariumId)
      setFishList(aquariumFish)
      setReceptionFishList(receptionFish)
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
        price: newFish.price ? parseFloat(newFish.price) : null,
        priceUpdatedAt: newFish.price ? new Date().toISOString() : null,
        source: newFish.source,
        notes: newFish.notes,
        aquariumId: aquarium.aquariumId, // Assign to this aquarium immediately
      })

      // Reset form
      setNewFish({
        hebrewName: '',
        scientificName: '',
        size: '',
        quantity: '',
        price: '',
        source: 'local_delivery',
        notes: '',
      })
      setIsAdding(false)

      if (onSuccess) onSuccess()

      // Close modal automatically after adding fish
      onClose()
    } catch (err) {
      setError(err.message || 'שגיאה בהוספת דג')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateFish(fishId) {
    if (!editData.hebrewName?.trim()) {
      setError('שם עברי הוא שדה חובה')
      return
    }
    if (!editData.quantity || editData.quantity < 0) {
      setError('כמות לא תקינה')
      return
    }

    try {
      setLoading(true)
      setError('')
      await updateFarmFish(currentFarm.farmId, fishId, {
        hebrewName: editData.hebrewName.trim(),
        scientificName: editData.scientificName?.trim() || '',
        size: editData.size?.trim() || '',
        quantity: parseInt(editData.quantity),
        price: editData.price ? parseFloat(editData.price) : null,
        source: editData.source,
        notes: editData.notes || '',
      })
      setEditingId(null)
      setEditData({ hebrewName: '', scientificName: '', size: '', quantity: '', price: '', source: '', notes: '' })
      await loadData()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון דג')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateReceptionFish(instanceId) {
    if (!editData.quantity || editData.quantity < 0) {
      setError('כמות לא תקינה')
      return
    }

    if (!editData.commonName || !editData.scientificName) {
      setError('שם עברי ושם מדעי הם שדות חובה')
      return
    }

    try {
      setLoading(true)
      setError('')

      const updates = {
        commonName: editData.commonName,
        scientificName: editData.scientificName,
        code: editData.code,
        size: editData.size,
        currentQuantity: parseInt(editData.quantity),
        notes: editData.notes,
      }

      // Add price if provided
      if (editData.price) {
        updates.price = parseFloat(editData.price)
      }

      await updateFishInstance(currentFarm.farmId, instanceId, updates)
      setEditingId(null)
      setEditData({
        commonName: '',
        scientificName: '',
        code: '',
        size: '',
        quantity: '',
        price: '',
        notes: ''
      })
      await loadData()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון דג מיובא')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteFish(fishId) {
    try {
      // Check for pending transfer tasks
      const pendingTasks = await getPendingTasksForFish(currentFarm.farmId, fishId)
      if (pendingTasks.length > 0) {
        const taskNames = pendingTasks.map(t => t.title).join(', ')
        setError(`לא ניתן למחוק דג זה - יש ${pendingTasks.length} משימות העברה ממתינות: ${taskNames}. יש לבטל את המשימות תחילה.`)
        return
      }
    } catch (err) {
      // If we can't check, allow deletion with warning
    }

    if (!window.confirm('האם אתה בטוח שברצונך למחוק דג זה?')) return

    try {
      setLoading(true)
      setError('')
      await deleteFarmFish(currentFarm.farmId, fishId)
      await loadData()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message || 'שגיאה במחיקת הדג')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteReceptionFish(instanceId) {
    try {
      // Check for pending transfer tasks
      const pendingTasks = await getPendingTasksForFish(currentFarm.farmId, instanceId)
      if (pendingTasks.length > 0) {
        const taskNames = pendingTasks.map(t => t.title).join(', ')
        setError(`לא ניתן למחוק דג זה - יש ${pendingTasks.length} משימות העברה ממתינות: ${taskNames}. יש לבטל את המשימות תחילה.`)
        return
      }
    } catch (err) {
      // If we can't check, allow deletion with warning
    }

    if (!window.confirm('האם אתה בטוח שברצונך למחוק דג מיובא זה?')) return

    try {
      setLoading(true)
      setError('')
      await deleteFishInstance(currentFarm.farmId, instanceId)
      await loadData()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message || 'שגיאה במחיקת הדג המיובא')
    } finally {
      setLoading(false)
    }
  }

  function startEditing(fish) {
    setEditingId(fish.fishId)
    setEditData({
      hebrewName: fish.hebrewName || '',
      scientificName: fish.scientificName || '',
      size: fish.size || '',
      quantity: fish.quantity,
      price: fish.price || '',
      source: fish.source || defaultSourceId,
      notes: fish.notes || ''
    })
  }

  function startEditingReceptionFish(fish) {
    setEditingId(fish.instanceId)
    setEditData({
      commonName: fish.commonName || '',
      scientificName: fish.scientificName || '',
      code: fish.code || '',
      size: fish.size || '',
      quantity: fish.currentQuantity,
      price: fish.price || '',
      notes: fish.notes || ''
    })
  }

  function handleOpenMortalityModal(fish, fishSource) {
    setSelectedFishForMortality({
      ...fish,
      fishSource,
      aquariumNumber: aquarium.aquariumNumber,
      // Normalize quantity field - farmFish uses 'quantity', reception uses 'currentQuantity'
      currentQuantity: fish.currentQuantity || fish.quantity,
    })
    setMortalityModalOpen(true)
  }

  function handleMortalityRecorded() {
    loadData()
    if (onSuccess) onSuccess()
  }

  if (!isOpen || !aquarium) return null

  const totalFish = fishList.reduce((sum, fish) => sum + (fish.quantity || 0), 0) +
                    receptionFishList.reduce((sum, fish) => sum + (fish.currentQuantity || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-0 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="m-0 text-[22px] font-semibold text-gray-900">
              דגים באקווריום #{aquarium.aquariumNumber}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {aquarium.room} | {aquarium.volume}L
            </p>
          </div>
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

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="text-sm text-blue-800">
              <span className="font-semibold">סה"כ דגים באקווריום:</span> {totalFish}
            </div>
            {(fishList.length > 0 || receptionFishList.length > 0) && (
              <div className="text-xs text-blue-700 mt-1">
                {fishList.length + receptionFishList.length} {(fishList.length + receptionFishList.length) === 1 ? 'מין' : 'מינים'}
              </div>
            )}
          </div>

          {loading && fishList.length === 0 && receptionFishList.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Reception Fish List */}
              {receptionFishList.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">דגים שנקלטו ({receptionFishList.length})</h3>
                  <div className="space-y-3">
                    {receptionFishList.map((fish) => (
                      <div
                        key={fish.instanceId}
                        className="bg-purple-50 border border-purple-300 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{fish.commonName}</h4>
                            <p className="text-xs text-gray-600 italic">{fish.scientificName}</p>
                          </div>
                          <div className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                            קליטה
                          </div>
                        </div>

                        {editingId === fish.instanceId ? (
                          <div className="bg-white rounded-lg p-3 border border-purple-200 mb-2">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  שם עברי: *
                                </label>
                                <input
                                  type="text"
                                  value={editData.commonName}
                                  onChange={(e) =>
                                    setEditData({ ...editData, commonName: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  שם מדעי: *
                                </label>
                                <input
                                  type="text"
                                  value={editData.scientificName}
                                  onChange={(e) =>
                                    setEditData({ ...editData, scientificName: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  קוד:
                                </label>
                                <input
                                  type="text"
                                  value={editData.code}
                                  onChange={(e) =>
                                    setEditData({ ...editData, code: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  גודל:
                                </label>
                                <input
                                  type="text"
                                  value={editData.size}
                                  onChange={(e) =>
                                    setEditData({ ...editData, size: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  כמות: *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editData.quantity}
                                  onChange={(e) =>
                                    setEditData({ ...editData, quantity: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="text-xs font-semibold text-gray-700 block mb-2">
                                מחיר (₪):
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editData.price}
                                onChange={(e) =>
                                  setEditData({ ...editData, price: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            <div className="mb-3">
                              <label className="text-xs font-semibold text-gray-700 block mb-2">
                                הערות:
                              </label>
                              <textarea
                                value={editData.notes}
                                onChange={(e) =>
                                  setEditData({ ...editData, notes: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                rows="2"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateReceptionFish(fish.instanceId)}
                                disabled={loading}
                                className="flex-1 px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {loading ? 'שומר...' : '💾 שמור'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditData({
                                    commonName: '',
                                    scientificName: '',
                                    code: '',
                                    size: '',
                                    quantity: '',
                                    price: '',
                                    notes: ''
                                  })
                                }}
                                className="px-3 py-2 text-xs font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-xs text-gray-700">
                              <div className="font-semibold text-lg text-purple-600">
                                {fish.currentQuantity} יח'
                              </div>
                              <div>גודל: {fish.size}</div>
                              {fish.code && <div>קוד: {fish.code}</div>}
                              {fish.price && (
                                <div className="font-semibold text-green-700">
                                  💰 מחיר: ₪{fish.price.toFixed(2)}
                                </div>
                              )}
                              {fish.arrivalDate && (
                                <div className="text-gray-600 mt-1">
                                  תאריך הגעה: {new Date(fish.arrivalDate).toLocaleDateString('he-IL')}
                                </div>
                              )}
                              {fish.notes && <div className="text-gray-600 mt-1">📝 {fish.notes}</div>}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => startEditingReceptionFish(fish)}
                                className="flex-1 px-3 py-2 text-xs font-semibold bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                              >
                                ✏️ ערוך
                              </button>
                              <button
                                onClick={() => handleOpenMortalityModal(fish, 'reception')}
                                className="flex-1 px-3 py-2 text-xs font-semibold bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                              >
                                💀 תמותה
                              </button>
                              <button
                                onClick={() => handleDeleteReceptionFish(fish.instanceId)}
                                className="px-3 py-2 text-xs font-semibold bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                🗑️
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fish List */}
              {fishList.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">דגים מקומיים ({fishList.length})</h3>
                  <div className="space-y-3">
                    {fishList.map((fish) => (
                      <div
                        key={fish.fishId}
                        className="bg-blue-50 border border-blue-300 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{fish.hebrewName}</h4>
                            <p className="text-xs text-gray-600 italic">{fish.scientificName}</p>
                          </div>
                          <div className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            {getSourceLabel(fish.source)}
                          </div>
                        </div>

                        {editingId === fish.fishId ? (
                          <div className="bg-white rounded-lg p-3 border border-blue-200 mb-2">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  שם עברי: *
                                </label>
                                <input
                                  type="text"
                                  value={editData.hebrewName}
                                  onChange={(e) =>
                                    setEditData({ ...editData, hebrewName: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                  disabled={loading}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  שם מדעי:
                                </label>
                                <input
                                  type="text"
                                  value={editData.scientificName}
                                  onChange={(e) =>
                                    setEditData({ ...editData, scientificName: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                  disabled={loading}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  גודל:
                                </label>
                                <input
                                  type="text"
                                  value={editData.size}
                                  onChange={(e) =>
                                    setEditData({ ...editData, size: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                  disabled={loading}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  כמות: *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editData.quantity}
                                  onChange={(e) =>
                                    setEditData({ ...editData, quantity: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                  disabled={loading}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-2">
                                  מחיר (₪):
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editData.price}
                                  onChange={(e) =>
                                    setEditData({ ...editData, price: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                  disabled={loading}
                                />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="text-xs font-semibold text-gray-700 block mb-2">
                                מקור:
                              </label>
                              <select
                                value={editData.source}
                                onChange={(e) =>
                                  setEditData({ ...editData, source: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                disabled={loading}
                              >
                                {fishSources.map((source) => (
                                  <option key={source.id} value={source.id}>
                                    {source.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="text-xs font-semibold text-gray-700 block mb-2">
                                הערות:
                              </label>
                              <textarea
                                value={editData.notes}
                                onChange={(e) =>
                                  setEditData({ ...editData, notes: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 h-16 resize-none"
                                disabled={loading}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateFish(fish.fishId)}
                                disabled={loading}
                                className="flex-1 px-3 py-2 text-xs font-semibold bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                              >
                                💾 שמור
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditData({ hebrewName: '', scientificName: '', size: '', quantity: '', price: '', source: '', notes: '' })
                                }}
                                disabled={loading}
                                className="px-3 py-2 text-xs font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-xs text-gray-700 mb-3">
                              <div className="font-semibold text-lg text-blue-600">
                                {fish.quantity} יח'
                              </div>
                              <div>גודל: {fish.size}</div>
                              {fish.price && (
                                <div className="text-green-700 font-semibold mt-1">
                                  ₪{fish.price.toFixed(2)} ליחידה
                                </div>
                              )}
                              {fish.priceUpdatedAt && (
                                <div className="text-xs text-gray-500">
                                  מחיר עודכן: {new Date(fish.priceUpdatedAt).toLocaleDateString('he-IL')}
                                </div>
                              )}
                              {fish.notes && <div className="text-gray-600 mt-1">📝 {fish.notes}</div>}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenMortalityModal(fish, 'local')}
                                className="flex-1 px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                💀 רשום תמותה
                              </button>
                              <button
                                onClick={() => startEditing(fish)}
                                className="flex-1 px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                ✏️ ערוך
                              </button>
                              <button
                                onClick={() => handleDeleteFish(fish.fishId)}
                                className="px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                              >
                                🗑️ מחק
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Fish */}
              {!isAdding ? (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full px-4 py-3 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-all"
                >
                  ➕ הוסף דג חדש לאקווריום
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
                        list="scientific-names-list"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                        disabled={loading}
                      />
                      <datalist id="scientific-names-list">
                        {previousFishNames.map((fish) => (
                          <option key={fish.scientificName} value={fish.scientificName} />
                        ))}
                      </datalist>
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
                        type="number"
                        min="1"
                        value={newFish.quantity}
                        onChange={(e) => setNewFish({ ...newFish, quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">מחיר ליחידה (₪)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newFish.price}
                        onChange={(e) => setNewFish({ ...newFish, price: e.target.value })}
                        placeholder="אופציונלי"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                        disabled={loading}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        תאריך העדכון יירשם אוטומטית
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-700">מקור*</label>
                    <select
                      value={newFish.source}
                      onChange={(e) => setNewFish({ ...newFish, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                      disabled={loading}
                    >
                      {fishSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-700">הערות</label>
                    <textarea
                      value={newFish.notes}
                      onChange={(e) => setNewFish({ ...newFish, notes: e.target.value })}
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
              {fishList.length === 0 && receptionFishList.length === 0 && !isAdding && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">🐠</div>
                  <div>אין דגים באקווריום זה</div>
                  <div className="text-sm mt-2">לחץ על "הוסף דג חדש" למעלה</div>
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

      {/* Mortality Recording Modal */}
      <MortalityRecordModal
        isOpen={mortalityModalOpen}
        onClose={() => {
          setMortalityModalOpen(false)
          setSelectedFishForMortality(null)
        }}
        fishData={selectedFishForMortality}
        onMortalityRecorded={handleMortalityRecorded}
      />
    </div>
  )
}

export default AquariumFishModal
