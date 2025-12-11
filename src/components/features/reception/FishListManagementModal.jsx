import { useState } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { addReceptionItem, updateReceptionItem, deleteReceptionItem } from '../../../services/reception.service'

function FishListManagementModal({
  isOpen,
  onClose,
  planId,
  items = [],
  plan = null,
  onItemsChanged = null,
}) {
  const { currentFarm } = useFarm()
  const [editingId, setEditingId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [newItem, setNewItem] = useState({
    hebrewName: '',
    scientificName: '',
    size: 'M',
    quantity: 1,
    notes: '',
    code: '',
    boxNumber: '',
  })

  const [editItem, setEditItem] = useState(null)

  if (!isOpen) return null

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
        quantity: newItem.quantity,
        notes: newItem.notes,
        code: newItem.code,
        boxNumber: newItem.boxNumber,
        targetRoom: plan?.targetRoom || '',
        targetAquariumId: null,
        targetAquariumNumber: '',
      })
      setNewItem({
        hebrewName: '',
        scientificName: '',
        size: 'M',
        quantity: 1,
        notes: '',
        code: '',
        boxNumber: '',
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
        quantity: editItem.quantity,
        notes: editItem.notes,
        code: editItem.code,
        boxNumber: editItem.boxNumber,
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
                            onChange={(e) =>
                              setEditItem({ ...editItem, hebrewName: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            disabled={loading}
                          />
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
                            type="number"
                            value={editItem.quantity}
                            onChange={(e) =>
                              setEditItem({ ...editItem, quantity: parseInt(e.target.value) || 1 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            disabled={loading}
                          />
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
                          <label className="text-xs font-semibold text-gray-700">קטע/ארגז</label>
                          <input
                            type="text"
                            value={editItem.boxNumber}
                            onChange={(e) => setEditItem({ ...editItem, boxNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
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
                        {item.boxNumber && <span>| 📦 {item.boxNumber}</span>}
                        {item.notes && <span>| 💡 {item.notes}</span>}
                      </div>
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

          {/* Add New Item */}
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
                    value={newItem.hebrewName}
                    onChange={(e) => setNewItem({ ...newItem, hebrewName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    placeholder="טילפיה"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">שם מדעי*</label>
                  <input
                    type="text"
                    value={newItem.scientificName}
                    onChange={(e) => setNewItem({ ...newItem, scientificName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    placeholder="Oreochromis niloticus"
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
                    placeholder="M"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">כמות</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })
                    }
                    min="1"
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
                    placeholder="CAT-001"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">קטע/ארגז</label>
                  <input
                    type="text"
                    value={newItem.boxNumber}
                    onChange={(e) => setNewItem({ ...newItem, boxNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    placeholder="Box-001"
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
                  placeholder="הערות או הנחיות מיוחדות..."
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
