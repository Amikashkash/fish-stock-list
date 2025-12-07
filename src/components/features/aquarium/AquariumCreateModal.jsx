import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarm } from '../../../contexts/FarmContext'
import { createAquarium } from '../../../services/aquarium.service'
import { validateAquarium } from '../../../models/Aquarium'

function AquariumCreateModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate()
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    aquariumNumber: '',
    volume: '',
    shelf: 'bottom',
    room: '',
    notes: '',
  })

  function handleChange(field, value) {
    setFormData({ ...formData, [field]: value })
    setError('')
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
      const aquariumData = {
        aquariumNumber: formData.aquariumNumber,
        volume: Number(formData.volume),
        shelf: formData.shelf,
        room: formData.room,
        status: 'empty',
        notes: formData.notes,
      }

      const result = await createAquarium(currentFarm.farmId, aquariumData)

      if (onSuccess) {
        onSuccess(result.aquarium)
      }

      // Reset form
      setFormData({
        aquariumNumber: '',
        volume: '',
        shelf: 'bottom',
        room: '',
        notes: '',
      })

      onClose()
    } catch (err) {
      console.error('Error creating aquarium:', err)
      setError('שגיאה ביצירת האקווריום. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Get room suggestions from farm settings
  const roomSuggestions = currentFarm?.settings?.aquariumRooms || []

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
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">אקווריום חדש</h2>
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
            </select>
            {roomSuggestions.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">אין מיקומים מוגדרים</p>
            )}
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/settings')
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              ⚙️ ניהול מיקומים בחווה
            </button>
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
              type="submit"
              className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all border-none cursor-pointer bg-blue-500 text-white hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(33,150,243,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              disabled={loading}
            >
              {loading ? 'יוצר...' : 'צור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AquariumCreateModal
