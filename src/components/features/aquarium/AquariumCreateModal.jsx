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
    location: '',
    room: 'main',
    status: 'empty',
    equipment: {
      heater: false,
      filter: false,
      aerator: false,
    },
    notes: '',
  })

  function handleChange(field, value) {
    setFormData({ ...formData, [field]: value })
    setError('')
  }

  function handleEquipmentChange(equipment, checked) {
    setFormData({
      ...formData,
      equipment: {
        ...formData.equipment,
        [equipment]: checked,
      },
    })
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
        ...formData,
        volume: Number(formData.volume),
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
        location: '',
        room: 'main',
        status: 'empty',
        equipment: {
          heater: false,
          filter: false,
          aerator: false,
        },
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>יצירת אקווריום חדש</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-message" style={{ marginBottom: '16px' }}>
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
              placeholder='למשל: "A-01" או "14a"'
              required
            />
            <small>מזהה ייחודי לאקווריום (למשל: A-01, 14a)</small>
          </div>

          <div className="form-row">
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
          </div>

          <div className="form-row">
            {/* Location */}
            <div className="form-group">
              <label>
                מיקום בחווה <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder='למשל: "קיר צפוני", "מדף 3"'
                required
              />
            </div>

            {/* Room */}
            <div className="form-group">
              <label>חדר</label>
              <select
                value={formData.room}
                onChange={(e) => handleChange('room', e.target.value)}
              >
                <option value="reception">קליטה</option>
                <option value="main">ראשי</option>
                <option value="quarantine">הסגר</option>
                <option value="display">תצוגה</option>
              </select>
            </div>
          </div>

          {/* Equipment */}
          <div className="form-group">
            <label>ציוד</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.equipment.heater}
                  onChange={(e) => handleEquipmentChange('heater', e.target.checked)}
                />
                <span>חימום</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.equipment.filter}
                  onChange={(e) => handleEquipmentChange('filter', e.target.checked)}
                />
                <span>פילטר</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.equipment.aerator}
                  onChange={(e) => handleEquipmentChange('aerator', e.target.checked)}
                />
                <span>אוורור</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>הערות</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="הערות נוספות על האקווריום..."
              rows="3"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              ביטול
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'יוצר...' : 'צור אקווריום'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AquariumCreateModal
