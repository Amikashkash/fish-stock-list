import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { addReceptionItem, updateReceptionItem, deleteReceptionItem } from '../../../services/reception.service'
import { getFishCatalog } from '../../../services/farm-fish.service'

function FishListManagementModal({
  isOpen,
  onClose,
  planId,
  items = [],
  plan = null,
  previousFishNames = [],
  onItemsChanged = null,
}) {
  const { currentFarm } = useFarm()
  const [editingId, setEditingId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fishCatalog, setFishCatalog] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(false)

  // Load fish catalog when modal opens
  useEffect(() => {
    if (isOpen && currentFarm?.farmId) {
      loadFishCatalog()
    }
  }, [isOpen, currentFarm?.farmId])

  async function loadFishCatalog() {
    try {
      setCatalogLoading(true)
      const catalog = await getFishCatalog(currentFarm.farmId)
      setFishCatalog(catalog)
    } catch (err) {
      console.error('Error loading fish catalog:', err)
    } finally {
      setCatalogLoading(false)
    }
  }

  // Create map for quick lookup: hebrewName -> scientificName
  const fishNameMap = new Map(previousFishNames.map((f) => [f.hebrewName, f.scientificName]))

  const [newItem, setNewItem] = useState({
    hebrewName: '',
    scientificName: '',
    size: '',
    quantity: '',
    notes: '',
    code: '',
    boxNumber: '',
    boxPortion: '',
    price: '',
  })

  const [editItem, setEditItem] = useState(null)

  if (!isOpen) return null

  // Handle Hebrew name change and auto-fill scientific name
  function handleHebrewNameChange(value, isEditing = false) {
    if (isEditing) {
      setEditItem({ ...editItem, hebrewName: value })
    } else {
      setNewItem({ ...newItem, hebrewName: value })
    }

    // Auto-fill scientific name if Hebrew name matches a previous entry
    const scientificName = fishNameMap.get(value)
    if (scientificName) {
      if (isEditing) {
        setEditItem((prev) => ({ ...prev, scientificName }))
      } else {
        setNewItem((prev) => ({ ...prev, scientificName }))
      }
    }
  }

  async function handleAddItem() {
    if (!newItem.hebrewName || !newItem.scientificName || !newItem.size) {
      setError('חסרים שם עברי, שם מדעי וגודל')
      return
    }

    try {
      setLoading(true)
      setError('')
      await addReceptionItem(currentFarm.farmId, {
        planId,
        hebrewName: newItem.hebrewName,
        scientificName: newItem.scientificName,
        size: newItem.size,
        quantity: newItem.quantity || 1,
        notes: newItem.notes,
        code: newItem.code,
        boxNumber: newItem.boxNumber,
        boxPortion: newItem.boxPortion,
        price: newItem.price ? parseFloat(newItem.price) : null,
        priceUpdatedAt: newItem.price ? new Date().toISOString() : null,
        targetRoom: plan?.targetRoom || '',
        targetAquariumId: null,
        targetAquariumNumber: '',
      })
      setNewItem({
        hebrewName: '',
        scientificName: '',
        size: '',
        quantity: '',
        notes: '',
        code: '',
        boxNumber: '',
        boxPortion: '',
        price: '',
      })
      setIsAdding(false)
      if (onItemsChanged) onItemsChanged()
    } catch (err) {
      setError(err.message || 'שגיאה בהוספת הפריט')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateItem() {
    if (!editItem.hebrewName || !editItem.scientificName || !editItem.size) {
      setError('חסרים שם עברי, שם מדעי וגודל')
      return
    }

    try {
      setLoading(true)
      setError('')
      await updateReceptionItem(currentFarm.farmId, editItem.itemId, {
        hebrewName: editItem.hebrewName,
        scientificName: editItem.scientificName,
        size: editItem.size,
        quantity: editItem.quantity || 1,
        notes: editItem.notes,
        code: editItem.code,
        boxNumber: editItem.boxNumber,
        boxPortion: editItem.boxPortion,
        price: editItem.price ? parseFloat(editItem.price) : null,
        priceUpdatedAt: editItem.price ? new Date().toISOString() : editItem.priceUpdatedAt || null,
      })
      setEditingId(null)
      setEditItem(null)
      if (onItemsChanged) onItemsChanged()
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון הפריט')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteItem(itemId) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הפריט?')) return

    try {
      setLoading(true)
      setError('')
      await deleteReceptionItem(currentFarm.farmId, planId, itemId)
      if (onItemsChanged) onItemsChanged()
    } catch (err) {
      setError(err.message || 'שגיאה במחיקת הפריט')
    } finally {
      setLoading(false)
    }
  }

  // Add fish from catalog
  async function handleAddFromCatalog(catalogFish) {
    try {
      setLoading(true)
      setError('')
      await addReceptionItem(currentFarm.farmId, {
        planId,
        hebrewName: catalogFish.hebrewName || '',
        scientificName: catalogFish.scientificName,
        size: catalogFish.size,
        quantity: 1, // Default quantity, user can edit
        notes: '',
        code: '',
        boxNumber: catalogFish.boxNumber || '',
        boxPortion: '',
        price: catalogFish.price || null,
        priceUpdatedAt: catalogFish.price ? new Date().toISOString() : null,
        targetRoom: plan?.targetRoom || '',
        targetAquariumId: null,
        targetAquariumNumber: '',
      })
      if (onItemsChanged) onItemsChanged()
    } catch (err) {
      setError(err.message || 'שגיאה בהוספת הדג')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">ניהול רשימת דגים</h2>
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

          {/* Items List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              דגים בתכנית ({items.length})
            </h3>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🐟</div>
                <div>אין דגים בתכנית</div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) =>
                  editingId === item.itemId ? (
                    <div
                      key={item.itemId}
                      className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4"
                    >
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700">שם עברי</label>
                          <input
                            type="text"
                            value={editItem.hebrewName}
                            onChange={(e) => handleHebrewNameChange(e.target.value, true)}
                            list="edit-fish-names-list"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            disabled={loading}
                          />
                          <datalist id="edit-fish-names-list">
                            {previousFishNames.map((fish) => (
                              <option key={fish.hebrewName} value={fish.hebrewName} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700">שם מדעי</label>
                          <input
                            type="text"
                            value={editItem.scientificName}
                            onChange={(e) =>
                              setEditItem({ ...editItem, scientificName: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700">גודל</label>
                          <input
                            type="text"
                            value={editItem.size}
                            onChange={(e) => setEditItem({ ...editItem, size: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700">כמות</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editItem.quantity}
                            onChange={(e) => {
                              const num = parseInt(e.target.value) || ''
                              setEditItem({ ...editItem, quantity: num })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700">מחיר ליחידה (₪)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editItem.price || ''}
                            onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                            placeholder="אופציונלי"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            disabled={loading}
                          />
                          {editItem.priceUpdatedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              עודכן: {new Date(editItem.priceUpdatedAt).toLocaleDateString('he-IL')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700">קוד/מספר קטלוג</label>
                          <input
                            type="text"
                            value={editItem.code}
                            onChange={(e) => setEditItem({ ...editItem, code: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700">מספר ארגז</label>
                          <input
                            type="text"
                            value={editItem.boxNumber}
                            onChange={(e) => setEditItem({ ...editItem, boxNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700">חלק ארגז</label>
                          <input
                            type="text"
                            value={editItem.boxPortion}
                            onChange={(e) => setEditItem({ ...editItem, boxPortion: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            placeholder="רבע / חצי / שלם"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-700">הערות</label>
                        <textarea
                          value={editItem.notes}
                          onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 h-20"
                          disabled={loading}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateItem}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                        >
                          {loading ? 'שומר...' : 'שמור שינויים'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditItem(null)
                          }}
                          disabled={loading}
                          className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-50"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={item.itemId}
                      className="bg-white border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 mb-1">
                            {item.hebrewName}
                            {item.code && (
                              <span className="text-xs font-normal text-gray-500 mr-2">
                                ({item.code})
                              </span>
                            )}
                          </h4>
                          {item.scientificName && (
                            <p className="text-xs text-gray-600 italic mb-2">{item.scientificName}</p>
                          )}
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                          {item.quantity} יח'
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-600 mb-2">
                        <span>גודל: {item.size}</span>
                        {item.price && (
                          <span className="text-green-700 font-semibold">
                            | ₪{item.price.toFixed(2)}
                          </span>
                        )}
                        {item.boxNumber && <span>| 📦 {item.boxNumber}</span>}
                        {item.boxPortion && <span>| 📊 {item.boxPortion}</span>}
                        {item.notes && <span>| 💡 {item.notes}</span>}
                      </div>
                      {item.priceUpdatedAt && (
                        <div className="text-xs text-gray-500 mb-2">
                          מחיר עודכן: {new Date(item.priceUpdatedAt).toLocaleDateString('he-IL')}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(item.itemId)
                            setEditItem(item)
                          }}
                          className="flex-1 px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          ✏️ ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.itemId)}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          🗑️ מחק
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Fish Catalog Selection */}
          {showCatalog && (
            <div className="mb-6 bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900">בחר דג מהקטלוג</h4>
                <button
                  onClick={() => setShowCatalog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {catalogLoading ? (
                <div className="text-center py-4 text-gray-500">טוען קטלוג...</div>
              ) : fishCatalog.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="text-2xl mb-2">📋</div>
                  <div>אין דגים בקטלוג</div>
                  <div className="text-xs mt-1">יבא קובץ אקסל כדי להוסיף דגים לקטלוג</div>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {fishCatalog.map((fish) => (
                    <div
                      key={fish.catalogId}
                      className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center hover:border-purple-400 transition-all"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {fish.scientificName}
                        </div>
                        <div className="text-xs text-gray-500">
                          גודל: {fish.size}
                          {fish.boxNumber && ` | ארגז: ${fish.boxNumber}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFromCatalog(fish)}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs font-semibold bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                      >
                        ➕ הוסף
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add New Item */}
          {!isAdding && !showCatalog ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowCatalog(true)}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold bg-purple-500 text-white hover:bg-purple-600 transition-all"
              >
                📋 בחר מקטלוג ({fishCatalog.length})
              </button>
              <button
                onClick={() => setIsAdding(true)}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-all"
              >
                ➕ הוסף ידנית
              </button>
            </div>
          ) : !isAdding ? null : (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">דג חדש</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">שם עברי*</label>
                  <input
                    type="text"
                    value={newItem.hebrewName}
                    onChange={(e) => handleHebrewNameChange(e.target.value, false)}
                    list="new-fish-names-list"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    disabled={loading}
                  />
                  <datalist id="new-fish-names-list">
                    {previousFishNames.map((fish) => (
                      <option key={fish.hebrewName} value={fish.hebrewName} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">שם מדעי*</label>
                  <input
                    type="text"
                    value={newItem.scientificName}
                    onChange={(e) => setNewItem({ ...newItem, scientificName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">גודל*</label>
                  <input
                    type="text"
                    value={newItem.size}
                    onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">כמות</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newItem.quantity}
                    onChange={(e) => {
                      const num = parseInt(e.target.value) || ''
                      setNewItem({ ...newItem, quantity: num })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">מחיר ליחידה (₪)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="אופציונלי"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">קוד/מספר קטלוג</label>
                  <input
                    type="text"
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">מספר ארגז</label>
                  <input
                    type="text"
                    value={newItem.boxNumber}
                    onChange={(e) => setNewItem({ ...newItem, boxNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">חלק ארגז</label>
                  <input
                    type="text"
                    value={newItem.boxPortion}
                    onChange={(e) => setNewItem({ ...newItem, boxPortion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700">הערות</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 h-20"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddItem}
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
        </div>
      </div>
    </div>
  )
}

export default FishListManagementModal
