import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarm } from '../contexts/FarmContext'
import { updateFarm } from '../services/farm.service'
import { getAquariums, fixAllAquariumStatuses } from '../services/aquarium.service'
import { getCurrentVersion, clearCacheAndReload, isNewVersionAvailable } from '../services/version.service'

function FarmSettingsPage() {
  const navigate = useNavigate()
  const { currentFarm, reloadFarms } = useFarm()
  const [locations, setLocations] = useState(currentFarm?.settings?.aquariumRooms || [])
  const [aquariums, setAquariums] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [newLocationLabel, setNewLocationLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [fixingAquariums, setFixingAquariums] = useState(false)

  // Load aquariums to check for location usage
  useEffect(() => {
    if (currentFarm) {
      loadAquariums()
    }
  }, [currentFarm])

  // Check if update is available
  useEffect(() => {
    const hasUpdate = isNewVersionAvailable()
    setUpdateAvailable(hasUpdate)
  }, [])

  async function handleCheckUpdates() {
    setCheckingUpdates(true)
    try {
      // Simulate checking for updates
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (isNewVersionAvailable()) {
        setMessage({ type: 'success', text: 'גרסה חדשה זמינה! לחץ על "עדכן עכשיו" כדי להתקין.' })
        setUpdateAvailable(true)
      } else {
        setMessage({ type: 'success', text: 'אתה משתמש בגרסה העדכנית ביותר!' })
        setUpdateAvailable(false)
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } finally {
      setCheckingUpdates(false)
    }
  }

  async function handleUpdateNow() {
    await clearCacheAndReload()
  }

  async function handleFixAquariumStatuses() {
    if (!confirm('פעולה זו תתקן את סטטוס כל האקווריומים בחווה על בסיס ספירת דגים בפועל.\n\nהאם להמשיך?')) {
      return
    }

    setFixingAquariums(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await fixAllAquariumStatuses(currentFarm.farmId)

      // Reload aquariums to show updated statuses
      await loadAquariums()

      setMessage({
        type: 'success',
        text: `✓ תוקנו ${result.fixed} אקווריומים בהצלחה! (${result.errors} שגיאות)`
      })

      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } catch (error) {
      console.error('Error fixing aquarium statuses:', error)
      setMessage({
        type: 'error',
        text: 'שגיאה בתיקון סטטוס אקווריומים. נסה שוב.'
      })
    } finally {
      setFixingAquariums(false)
    }
  }

  async function loadAquariums() {
    try {
      const data = await getAquariums(currentFarm.farmId)
      setAquariums(data)
    } catch (error) {
      console.error('Error loading aquariums:', error)
    }
  }

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

      await reloadFarms()
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
    const location = locations.find((loc) => loc.id === locationId)
    if (!location) return

    // Check if any aquariums are using this location
    const aquariumsUsingLocation = aquariums.filter((aq) => aq.room === location.label)

    if (aquariumsUsingLocation.length > 0) {
      // Show detailed warning
      const aquariumNumbers = aquariumsUsingLocation
        .map((aq) => aq.aquariumNumber)
        .slice(0, 5)
        .join(', ')

      const moreCount = aquariumsUsingLocation.length > 5
        ? ` ועוד ${aquariumsUsingLocation.length - 5}`
        : ''

      const message = `לא ניתן למחוק את המיקום "${location.label}"!\n\n` +
        `${aquariumsUsingLocation.length} אקווריומים משתמשים במיקום זה:\n` +
        `${aquariumNumbers}${moreCount}\n\n` +
        `יש למחוק או להעביר תחילה את האקווריומים הללו למיקום אחר.`

      alert(message)
      setMessage({
        type: 'error',
        text: `המיקום "${location.label}" בשימוש ב-${aquariumsUsingLocation.length} אקווריומים ולא ניתן למחוק אותו`
      })
      return
    }

    // If no aquariums are using it, allow deletion
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המיקום "${location.label}"?`)) {
      return
    }

    const updatedLocations = locations.filter((loc) => loc.id !== locationId)
    setLocations(updatedLocations)
    saveLocations(updatedLocations)
  }

  return (
    <div className="max-w-[900px] mx-auto p-4 sm:p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          onClick={() => navigate('/home')}
        >
          ← חזרה
        </button>
        <h1 className="text-2xl font-semibold">הגדרות חווה</h1>
        <div className="w-20"></div> {/* Spacer for alignment */}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`px-5 py-4 rounded-xl mb-6 text-[15px] font-medium ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Locations Manager */}
      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">ניהול מיקומים בחווה</h2>
          <p className="text-[15px] text-gray-600">
            הוסף, ערוך או מחק מיקומים לאקווריומים בחווה שלך
          </p>
        </div>

        {/* Add New Location */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 pb-8 border-b-2 border-gray-100">
          <input
            type="text"
            value={newLocationLabel}
            onChange={(e) => setNewLocationLabel(e.target.value)}
            placeholder="שם מיקום חדש (למשל: קליטה, ראשי, הסגר)"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-[15px] transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddLocation()
              }
            }}
          />
          <button
            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            onClick={handleAddLocation}
            disabled={saving}
          >
            + הוסף מיקום
          </button>
        </div>

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="text-center py-12 px-6 text-gray-600">
            <div className="text-6xl mb-4 opacity-50">📍</div>
            <p className="my-2 text-base">אין מיקומים מוגדרים</p>
            <p className="text-sm opacity-70">הוסף את המיקום הראשון למעלה</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {locations.map((location) => {
              const usageCount = aquariums.filter((aq) => aq.room === location.label).length
              const isInUse = usageCount > 0

              return (
                <div
                  key={location.id}
                  className={`flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-colors ${
                    isInUse
                      ? 'bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {editingId === location.id ? (
                    <>
                      <input
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(location.id)
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                      />
                      <div className="flex gap-2 mr-2">
                        <button
                          className="w-9 h-9 border-none rounded-lg cursor-pointer flex items-center justify-center text-lg transition-all bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleSaveEdit(location.id)}
                          disabled={saving}
                          title="שמור"
                        >
                          ✓
                        </button>
                        <button
                          className="w-9 h-9 border-none rounded-lg cursor-pointer flex items-center justify-center text-lg transition-all bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-[15px] sm:text-base font-medium text-gray-900">{location.label}</span>
                        {isInUse && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 text-white rounded-xl text-[13px] font-semibold"
                            title={`${usageCount} אקווריומים במיקום זה`}
                          >
                            {usageCount} 🐠
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="w-9 h-9 border-none rounded-lg cursor-pointer flex items-center justify-center text-lg transition-all bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleStartEdit(location)}
                          disabled={saving}
                          title="ערוך"
                        >
                          ✎
                        </button>
                        <button
                          className="w-9 h-9 border-none rounded-lg cursor-pointer flex items-center justify-center text-lg transition-all bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDeleteLocation(location.id)}
                          disabled={saving}
                          title={isInUse ? `לא ניתן למחוק - ${usageCount} אקווריומים בשימוש` : 'מחק'}
                        >
                          🗑
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Application Settings */}
      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">הגדרות אפליקציה</h2>
          <p className="text-[15px] text-gray-600">
            בדוק עדכונים והגדרות כלליות
          </p>
        </div>

        {/* Aquarium Status Fix */}
        <div className="bg-orange-50 rounded-xl p-5 mb-6 border-2 border-orange-200">
          <div className="mb-4">
            <p className="text-sm font-semibold text-orange-800 mb-1">🔧 תיקון סטטוס אקווריומים</p>
            <p className="text-sm text-orange-700">
              אם יש אקווריומים המוצגים כ"תפוסים" למרות שהם ריקים, לחץ על הכפתור למטה לתקן אוטומטית.
            </p>
          </div>

          <button
            onClick={handleFixAquariumStatuses}
            disabled={fixingAquariums}
            className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {fixingAquariums ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                מתקן סטטוס אקווריומים...
              </>
            ) : (
              <>
                🔄 תקן סטטוס כל האקווריומים
              </>
            )}
          </button>

          <p className="text-xs text-orange-600 mt-3">
            פעולה זו תספור את הדגים בכל אקווריום ותעדכן את הסטטוס בהתאם (ריק/תפוס)
          </p>
        </div>

        {/* Version Info */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">גרסה נוכחית</p>
              <p className="text-2xl font-bold text-gray-900">{getCurrentVersion()}</p>
            </div>
            {updateAvailable && (
              <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                ✨ עדכון זמין
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCheckUpdates}
              disabled={checkingUpdates}
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {checkingUpdates ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  בודק...
                </>
              ) : (
                <>
                  🔄 בדוק עדכונים
                </>
              )}
            </button>

            {updateAvailable && (
              <button
                onClick={handleUpdateNow}
                className="flex-1 sm:flex-none px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                ⬇️ עדכן עכשיו
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            עדכון יחזקה את המטמון של הדפדפן ויטען את הגרסה החדשה
          </p>
        </div>
      </div>
    </div>
  )
}

export default FarmSettingsPage
