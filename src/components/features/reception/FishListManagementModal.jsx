import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { addReceptionItem, updateReceptionItem, deleteReceptionItem } from '../../../services/reception.service'
import { getAquariums } from '../../../services/aquarium.service'

const SHELF_LABELS = {
  bottom: 'תחתון',
  middle: 'אמצעי',
  top: 'עליון',
}

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aquariums, setAquariums] = useState([])

  useEffect(() => {
    if (isOpen && currentFarm?.farmId) {
      loadAquariums()
    }
  }, [isOpen, currentFarm?.farmId])

  async function loadAquariums() {
    try {
      const data = await getAquariums(currentFarm.farmId)
      if (plan?.targetRoom) {
        setAquariums(data.filter((aq) => aq.room === plan.targetRoom))
      } else {
        setAquariums(data)
      }
    } catch (err) {
      console.error('Error loading aquariums:', err)
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
    targetAquariumId: null,
    targetAquariumNumber: '',
  })

  const [editItem, setEditItem] = useState(null)

  // Split state
  const [splittingId, setSplittingId] = useState(null)
  const [splitRows, setSplitRows] = useState([]) // [{quantity, aquariumId, aquariumNumber}]

  if (!isOpen) return null

  // ── Split helpers ────────────────────────────────────────────────────────────

  function handleStartSplit(item) {
    setSplittingId(item.itemId)
    setSplitRows([
      { quantity: Math.floor(item.quantity / 2), aquariumId: '', aquariumNumber: '' },
      { quantity: item.quantity - Math.floor(item.quantity / 2), aquariumId: '', aquariumNumber: '' },
    ])
    setError('')
  }

  function handleSplitRowChange(index, field, value) {
    setSplitRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ))
  }

  function handleSplitAquariumChange(index, aquariumId) {
    const selected = aquariums.find(aq => aq.aquariumId === aquariumId)
    setSplitRows(prev => prev.map((row, i) =>
      i === index
        ? { ...row, aquariumId: aquariumId || '', aquariumNumber: selected?.aquariumNumber || '' }
        : row
    ))
  }

  function handleAddSplitRow() {
    setSplitRows(prev => [...prev, { quantity: 0, aquariumId: '', aquariumNumber: '' }])
  }

  function handleRemoveSplitRow(index) {
    if (splitRows.length <= 2) return
    setSplitRows(prev => prev.filter((_, i) => i !== index))
  }

  async function handleConfirmSplit(item) {
    const total = splitRows.reduce((sum, r) => sum + (parseInt(r.quantity) || 0), 0)
    if (total !== item.quantity) {
      setError(`סך הכמויות (${total}) חייב להיות שווה לכמות המקורית (${item.quantity})`)
      return
    }
    const hasZero = splitRows.some(r => (parseInt(r.quantity) || 0) <= 0)
    if (hasZero) {
      setError('כל שורה חייבת להכיל כמות גדולה מ-0')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Update original item with first row's data
      const first = splitRows[0]
      await updateReceptionItem(currentFarm.farmId, item.itemId, {
        quantity: parseInt(first.quantity),
        targetAquariumId: first.aquariumId || null,
        targetAquariumNumber: first.aquariumNumber || '',
      })

      // Create new items for remaining rows
      for (let i = 1; i < splitRows.length; i++) {
        const row = splitRows[i]
        await addReceptionItem(currentFarm.farmId, {
          planId,
          hebrewName: item.hebrewName,
          scientificName: item.scientificName,
          size: item.size,
          quantity: parseInt(row.quantity),
          notes: item.notes || '',
          code: item.code || '',
          boxNumber: item.boxNumber || '',
          boxPortion: item.boxPortion || '',
          price: item.price ?? null,
          priceUpdatedAt: item.priceUpdatedAt || null,
          targetRoom: item.targetRoom || '',
          targetAquariumId: row.aquariumId || null,
          targetAquariumNumber: row.aquariumNumber || '',
        })
      }

      setSplittingId(null)
      setSplitRows([])
      if (onItemsChanged) onItemsChanged()
    } catch (err) {
      setError(err.message || 'שגיאה בפיצול הפריט')
    } finally {
      setLoading(false)
    }
  }

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

  function handleAquariumChange(aquariumId, isEditing = false) {
    const selected = aquariums.find((aq) => aq.aquariumId === aquariumId)
    if (isEditing) {
      setEditItem({
        ...editItem,
        targetAquariumId: aquariumId || null,
        targetAquariumNumber: selected?.aquariumNumber || '',
      })
    } else {
      setNewItem({
        ...newItem,
        targetAquariumId: aquariumId || null,
        targetAquariumNumber: selected?.aquariumNumber || '',
      })
    }
  }

  function getAquariumOptionLabel(aq) {
    const shelf = SHELF_LABELS[aq.shelf] || aq.shelf || ''
    const status = aq.status === 'occupied' ? ' (תפוס)' : ''
    const assignedItem = items.find((i) => i.targetAquariumId === aq.aquariumId)
    const assigned = assignedItem ? ` ⚠️ → ${assignedItem.hebrewName}` : ''
    return `#${aq.aquariumNumber} | ${shelf} | ${aq.volume}L${status}${assigned}`
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
        targetAquariumId: newItem.targetAquariumId,
        targetAquariumNumber: newItem.targetAquariumNumber || '',
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
        targetAquariumId: null,
        targetAquariumNumber: '',
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
        targetAquariumId: editItem.targetAquariumId || null,
        targetAquariumNumber: editItem.targetAquariumNumber || '',
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
                      <div className="mb-3">
                        <label className="text-xs font-semibold text-gray-700">אקווריום יעד</label>
                        <select
                          value={editItem.targetAquariumId || ''}
                          onChange={(e) => handleAquariumChange(e.target.value, true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                          disabled={loading}
                        >
                          <option value="">-- לא הוקצה --</option>
                          {aquariums.map((aq) => (
                            <option key={aq.aquariumId} value={aq.aquariumId}>
                              {getAquariumOptionLabel(aq)}
                            </option>
                          ))}
                        </select>
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
                      {item.targetAquariumNumber ? (
                        <div className="text-xs text-green-700 font-semibold mb-2">
                          ✅ אקווריום: {item.targetAquariumNumber}
                        </div>
                      ) : (
                        <div className="text-xs text-yellow-700 mb-2">⚠️ לא הוקצה אקווריום</div>
                      )}
                      {item.priceUpdatedAt && (
                        <div className="text-xs text-gray-500 mb-2">
                          מחיר עודכן: {new Date(item.priceUpdatedAt).toLocaleDateString('he-IL')}
                        </div>
                      )}

                      {/* Split UI */}
                      {splittingId === item.itemId && (
                        <div className="mt-3 mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="text-xs font-bold text-purple-900 mb-2">
                            ✂️ פצל {item.quantity} יח' לאקווריומים שונים
                          </div>
                          <div className="space-y-2 mb-2">
                            {splitRows.map((row, idx) => {
                              const usedTotal = splitRows.reduce((s, r) => s + (parseInt(r.quantity) || 0), 0)
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-4 shrink-0">{idx + 1}.</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={row.quantity}
                                    onChange={(e) => handleSplitRowChange(idx, 'quantity', e.target.value)}
                                    className="w-20 px-2 py-1.5 border border-purple-300 rounded text-sm text-center focus:outline-none focus:border-purple-500"
                                    placeholder="כמות"
                                  />
                                  <select
                                    value={row.aquariumId}
                                    onChange={(e) => handleSplitAquariumChange(idx, e.target.value)}
                                    className="flex-1 px-2 py-1.5 border border-purple-300 rounded text-xs bg-white focus:outline-none focus:border-purple-500"
                                  >
                                    <option value="">-- אקווריום --</option>
                                    {aquariums.map((aq) => (
                                      <option key={aq.aquariumId} value={aq.aquariumId}>
                                        {getAquariumOptionLabel(aq)}
                                      </option>
                                    ))}
                                  </select>
                                  {splitRows.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSplitRow(idx)}
                                      className="text-red-400 hover:text-red-600 text-sm px-1"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Running total */}
                          {(() => {
                            const used = splitRows.reduce((s, r) => s + (parseInt(r.quantity) || 0), 0)
                            const remaining = item.quantity - used
                            return (
                              <div className={`text-xs mb-2 font-medium ${remaining === 0 ? 'text-green-700' : remaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                {remaining === 0 ? '✅ ' : remaining > 0 ? '⚠️ ' : '❌ '}
                                סה"כ: {used} / {item.quantity}
                                {remaining > 0 && ` · נותרו ${remaining} לחלוקה`}
                                {remaining < 0 && ` · חריגה של ${Math.abs(remaining)}`}
                              </div>
                            )
                          })()}

                          {splitRows.length < 6 && (
                            <button
                              type="button"
                              onClick={handleAddSplitRow}
                              className="text-xs text-purple-700 hover:text-purple-900 mb-2 block"
                            >
                              + הוסף אקווריום נוסף
                            </button>
                          )}

                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleConfirmSplit(item)}
                              disabled={loading}
                              className="flex-1 py-1.5 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 disabled:opacity-50"
                            >
                              {loading ? 'שומר...' : 'אשר פיצול'}
                            </button>
                            <button
                              onClick={() => { setSplittingId(null); setSplitRows([]); setError('') }}
                              disabled={loading}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(item.itemId)
                            setEditItem(item)
                            setSplittingId(null)
                          }}
                          className="flex-1 px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          ✏️ ערוך
                        </button>
                        {item.quantity > 1 && splittingId !== item.itemId && (
                          <button
                            onClick={() => { handleStartSplit(item); setEditingId(null) }}
                            className="px-3 py-1.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            title="פצל לאקווריומים שונים"
                          >
                            ✂️ פצל
                          </button>
                        )}
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
              ➕ הוסף דג
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
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-700">אקווריום יעד</label>
                <select
                  value={newItem.targetAquariumId || ''}
                  onChange={(e) => handleAquariumChange(e.target.value, false)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 bg-white"
                  disabled={loading}
                >
                  <option value="">-- לא הוקצה --</option>
                  {aquariums.map((aq) => (
                    <option key={aq.aquariumId} value={aq.aquariumId}>
                      {getAquariumOptionLabel(aq)}
                    </option>
                  ))}
                </select>
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
