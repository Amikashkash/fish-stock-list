import { useState } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { createAquarium } from '../../../services/aquarium.service'
import { validateAquarium } from '../../../models/Aquarium'
import './AquariumModal.css'

function AquariumCreateModal({ isOpen, onClose, onSuccess }) {
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
  const [showNewRoomInput, setShowNewRoomInput] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

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
      setShowNewRoomInput(false)
      setNewRoomName('')

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content aquarium-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>אקווריום חדש</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Aquarium Number */}
          <div className="form-group">
            <label>
              מספר אקווריום <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.aquariumNumber}
              onChange={(e) => handleChange('aquariumNumber', e.target.value)}
              placeholder='למשל: "A-01", "14a"'
              required
              autoFocus
            />
          </div>

          {/* Volume */}
          <div className="form-group">
            <label>
              נפח (ליטרים) <span className="required">*</span>
            </label>
            <input
              type="number"
              value={formData.volume}
              onChange={(e) => handleChange('volume', e.target.value)}
              placeholder="200"
              min="1"
              required
            />
          </div>

          {/* Shelf */}
          <div className="form-group">
            <label>מונח על מדף</label>
            <select
              value={formData.shelf}
              onChange={(e) => handleChange('shelf', e.target.value)}
            >
              <option value="bottom">תחתון</option>
              <option value="middle">אמצעי</option>
              <option value="top">עליון</option>
            </select>
          </div>

          {/* Location/Room Dropdown */}
          <div className="form-group">
            <label>
              מיקום בחווה <span className="required">*</span>
            </label>
            {!showNewRoomInput ? (
              <select
                value={formData.room}
                onChange={(e) => handleChange('room', e.target.value)}
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
              <div className="new-room-input">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="שם המיקום החדש"
                  autoFocus
                />
                <div className="new-room-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowNewRoomInput(false)
                      setNewRoomName('')
                    }}
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleNewRoomSubmit}
                  >
                    הוסף
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>הערות</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="הערות נוספות..."
              rows="2"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              ביטול
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'יוצר...' : 'צור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AquariumCreateModal
