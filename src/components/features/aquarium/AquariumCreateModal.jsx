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
    shelf: 'bottom',
    volume: '',
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
        shelf: formData.shelf,
        volume: Number(formData.volume),
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
        shelf: 'bottom',
        volume: '',
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

          <div className="form-row">
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
              <label>מיקום במדף</label>
              <select
                value={formData.shelf}
                onChange={(e) => handleChange('shelf', e.target.value)}
              >
                <option value="bottom">תחתון</option>
                <option value="middle">אמצעי</option>
                <option value="top">עליון</option>
              </select>
            </div>
          </div>

          {/* Room/Location (combined) */}
          <div className="form-group">
            <label>
              חדר/מיקום בחווה <span className="required">*</span>
            </label>
            <input
              type="text"
              list="room-suggestions"
              value={formData.room}
              onChange={(e) => handleChange('room', e.target.value)}
              placeholder='למשל: "קליטה", "ראשי", "חדר 1"'
              required
            />
            <datalist id="room-suggestions">
              {roomSuggestions.map((room) => (
                <option key={room.id} value={room.label} />
              ))}
            </datalist>
            <small>בחר מהרשימה או הזן מיקום חדש</small>
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
