import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { updateAquarium, deleteAquarium } from '../../../services/aquarium.service'
import { updateFarm } from '../../../services/farm.service'
import { validateAquarium } from '../../../models/Aquarium'

function AquariumEditModal({ isOpen, onClose, onSuccess, aquarium, onTransferClick }) {
  const { currentFarm, reloadFarms } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    aquariumNumber: '',
    volume: '',
    shelf: 'bottom',
    room: '',
    status: 'empty',
    notes: '',
  })
  const [showNewRoomInput, setShowNewRoomInput] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  // Populate form when aquarium changes
  useEffect(() => {
    if (aquarium) {
      setFormData({
        aquariumNumber: aquarium.aquariumNumber || '',
        volume: aquarium.volume?.toString() || '',
        shelf: aquarium.shelf || 'bottom',
        room: aquarium.room || '',
        status: aquarium.status || 'empty',
        notes: aquarium.notes || '',
      })
    }
  }, [aquarium])

  function handleChange(field, value) {
    setFormData({ ...formData, [field]: value })
    setError('')

    // Show new room input if "new" is selected
    if (field === 'room' && value === '__new__') {
      setShowNewRoomInput(true)
      setFormData({ ...formData, room: '' })
    } else if (field === 'room') {
      setShowNewRoomInput(false)
    }
  }

  function handleNewRoomSubmit() {
    if (newRoomName.trim()) {
      setFormData({ ...formData, room: newRoomName.trim() })
      setShowNewRoomInput(false)
      setNewRoomName('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validate
    const validation = validateAquarium({
      ...formData,
      volume: Number(formData.volume),
    })

    if (!validation.valid) {
      setError(validation.errors.join(', '))
      return
    }

    setLoading(true)

    try {
      const updates = {
        aquariumNumber: formData.aquariumNumber,
        volume: Number(formData.volume),
        shelf: formData.shelf,
        room: formData.room,
        status: formData.status,
        notes: formData.notes,
      }

      // Check if room is new and needs to be added to farm settings
      const roomSuggestions = currentFarm?.settings?.aquariumRooms || []
      const roomExists = roomSuggestions.some((r) => r.label === formData.room)

      if (!roomExists && formData.room) {
        // Add new room to farm settings
        const newRoom = {
          id: formData.room.toLowerCase().replace(/\s+/g, '-'),
          label: formData.room,
        }

        const updatedRooms = [...roomSuggestions, newRoom]

        await updateFarm(currentFarm.farmId, {
          settings: {
            ...currentFarm.settings,
            aquariumRooms: updatedRooms,
          },
        })

        // Reload farm data to get updated settings
        await reloadFarms()
      }

      await updateAquarium(currentFarm.farmId, aquarium.aquariumId, updates)

      if (onSuccess) {
        onSuccess({ ...aquarium, ...updates })
      }

      onClose()
    } catch (err) {
      console.error('Error updating aquarium:', err)
      setError('שגיאה בעדכון האקווריום. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)

    try {
      await deleteAquarium(currentFarm.farmId, aquarium.aquariumId)

      if (onSuccess) {
        onSuccess(null, true) // null aquarium, deleted=true
      }

      onClose()
    } catch (err) {
      console.error('Error deleting aquarium:', err)
      setError('שגיאה במחיקת האקווריום. נסה שוב.')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!isOpen || !aquarium) return null

  // Get room suggestions from farm settings
  const roomSuggestions = currentFarm?.settings?.aquariumRooms || []
  const statusOptions = currentFarm?.settings?.aquariumStatuses || []

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-[600px] w-full sm:w-[95%] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">עריכת אקווריום</h2>
          <button
            className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Aquarium Number */}
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">
              מספר אקווריום <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.aquariumNumber}
              onChange={(e) => handleChange('aquariumNumber', e.target.value)}
              placeholder='למשל: "A-01", "14a"'
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              required
              autoFocus
            />
          </div>

          {/* Volume */}
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">
              נפח (ליטרים) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.volume}
              onChange={(e) => handleChange('volume', e.target.value)}
              placeholder="200"
              min="1"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              required
            />
          </div>

          {/* Shelf */}
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">מונח על מדף</label>
            <select
              value={formData.shelf}
              onChange={(e) => handleChange('shelf', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="bottom">תחתון</option>
              <option value="middle">אמצעי</option>
              <option value="top">עליון</option>
            </select>
          </div>

          {/* Location/Room Dropdown */}
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">
              מיקום בחווה <span className="text-red-500">*</span>
            </label>
            {!showNewRoomInput ? (
              <select
                value={formData.room}
                onChange={(e) => handleChange('room', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                required
              >
                <option value="">בחר מיקום...</option>
                {roomSuggestions.map((room) => (
                  <option key={room.id} value={room.label}>
                    {room.label}
                  </option>
                ))}
                <option value="__new__">+ הוסף מיקום חדש...</option>
              </select>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="שם המיקום החדש"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200"
                    onClick={() => {
                      setShowNewRoomInput(false)
                      setNewRoomName('')
                    }}
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={handleNewRoomSubmit}
                  >
                    הוסף
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">
              סטטוס <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              required
            >
              {statusOptions.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">הערות</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="הערות נוספות..."
              rows="2"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors resize-y min-h-[80px] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="mb-5 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-sm text-red-800 font-semibold mb-3">
                האם אתה בטוח שברצונך למחוק את האקווריום "{aquarium.aquariumNumber}"?
              </p>
              <p className="text-xs text-red-700 mb-4">פעולה זו לא ניתנת לביטול!</p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  ביטול
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'מוחק...' : 'מחק לצמיתות'}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-between mt-6 pt-5 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all border-none cursor-pointer bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || showDeleteConfirm}
              >
                מחק
              </button>
              {aquarium?.totalFish > 0 && onTransferClick && (
                <button
                  type="button"
                  onClick={() => onTransferClick(aquarium)}
                  className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all border-none cursor-pointer bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  🔄 העבר דגים
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all border-none cursor-pointer bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all border-none cursor-pointer bg-blue-500 text-white hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(33,150,243,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                disabled={loading}
              >
                {loading ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AquariumEditModal
