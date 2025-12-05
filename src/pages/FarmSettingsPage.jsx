import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarm } from '../contexts/FarmContext'
import { updateFarm } from '../services/farm.service'
import './FarmSettingsPage.css'

function FarmSettingsPage() {
  const navigate = useNavigate()
  const { currentFarm, refreshFarms } = useFarm()
  const [locations, setLocations] = useState(currentFarm?.settings?.aquariumRooms || [])
  const [editingId, setEditingId] = useState(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [newLocationLabel, setNewLocationLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  async function saveLocations(updatedLocations) {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      await updateFarm(currentFarm.farmId, {
        settings: {
          ...currentFarm.settings,
          aquariumRooms: updatedLocations,
        },
      })

      await refreshFarms()
      setMessage({ type: 'success', text: 'השינויים נשמרו בהצלחה!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error updating locations:', error)
      setMessage({ type: 'error', text: 'שגיאה בשמירת השינויים. נסה שוב.' })
    } finally {
      setSaving(false)
    }
  }

  function handleAddLocation() {
    if (!newLocationLabel.trim()) {
      setMessage({ type: 'error', text: 'נא להזין שם מיקום' })
      return
    }

    // Check for duplicate
    if (locations.some((loc) => loc.label === newLocationLabel.trim())) {
      setMessage({ type: 'error', text: 'מיקום עם שם זה כבר קיים' })
      return
    }

    const newLocation = {
      id: `loc-${Date.now()}`,
      label: newLocationLabel.trim(),
    }

    const updatedLocations = [...locations, newLocation]
    setLocations(updatedLocations)
    setNewLocationLabel('')
    saveLocations(updatedLocations)
  }

  function handleStartEdit(location) {
    setEditingId(location.id)
    setEditingLabel(location.label)
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditingLabel('')
  }

  function handleSaveEdit(locationId) {
    if (!editingLabel.trim()) {
      setMessage({ type: 'error', text: 'נא להזין שם מיקום' })
      return
    }

    // Check for duplicate (excluding current location)
    if (
      locations.some(
        (loc) => loc.id !== locationId && loc.label === editingLabel.trim()
      )
    ) {
      setMessage({ type: 'error', text: 'מיקום עם שם זה כבר קיים' })
      return
    }

    const updatedLocations = locations.map((loc) =>
      loc.id === locationId ? { ...loc, label: editingLabel.trim() } : loc
    )

    setLocations(updatedLocations)
    setEditingId(null)
    setEditingLabel('')
    saveLocations(updatedLocations)
  }

  function handleDeleteLocation(locationId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המיקום?')) {
      return
    }

    const updatedLocations = locations.filter((loc) => loc.id !== locationId)
    setLocations(updatedLocations)
    saveLocations(updatedLocations)
  }

  return (
    <div className="farm-settings-page">
      {/* Header */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          ← חזרה
        </button>
        <h1>הגדרות חווה</h1>
        <div style={{ width: '80px' }}></div> {/* Spacer for alignment */}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Locations Manager */}
      <div className="settings-section">
        <div className="section-header">
          <h2>ניהול מיקומים בחווה</h2>
          <p className="section-description">
            הוסף, ערוך או מחק מיקומים לאקווריומים בחווה שלך
          </p>
        </div>

        {/* Add New Location */}
        <div className="add-location-form">
          <input
            type="text"
            value={newLocationLabel}
            onChange={(e) => setNewLocationLabel(e.target.value)}
            placeholder="שם מיקום חדש (למשל: קליטה, ראשי, הסגר)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddLocation()
              }
            }}
          />
          <button
            className="btn-primary"
            onClick={handleAddLocation}
            disabled={saving}
          >
            + הוסף מיקום
          </button>
        </div>

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <p>אין מיקומים מוגדרים</p>
            <p className="empty-hint">הוסף את המיקום הראשון למעלה</p>
          </div>
        ) : (
          <div className="locations-list">
            {locations.map((location) => (
              <div key={location.id} className="location-item">
                {editingId === location.id ? (
                  <>
                    <input
                      type="text"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      className="edit-input"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(location.id)
                        } else if (e.key === 'Escape') {
                          handleCancelEdit()
                        }
                      }}
                    />
                    <div className="location-actions">
                      <button
                        className="btn-icon btn-success"
                        onClick={() => handleSaveEdit(location.id)}
                        disabled={saving}
                        title="שמור"
                      >
                        ✓
                      </button>
                      <button
                        className="btn-icon btn-secondary"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        title="ביטול"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="location-label">{location.label}</span>
                    <div className="location-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleStartEdit(location)}
                        disabled={saving}
                        title="ערוך"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteLocation(location.id)}
                        disabled={saving}
                        title="מחק"
                      >
                        🗑
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FarmSettingsPage
