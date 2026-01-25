import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarm } from '../contexts/FarmContext'
import { updateFarm } from '../services/farm.service'
import { getAquariums } from '../services/aquarium.service'
import { getCurrentVersion, clearCacheAndReload, isNewVersionAvailable } from '../services/version.service'
import { createInvitation, getFarmInvitations, deleteInvitation } from '../services/invitation.service'

function FarmSettingsPage() {
  const navigate = useNavigate()
  const { currentFarm, reloadFarms } = useFarm()
  const [locations, setLocations] = useState(currentFarm?.settings?.aquariumRooms || [])
  const [fishSources, setFishSources] = useState(currentFarm?.settings?.fishSources || [])
  const [aquariums, setAquariums] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [newLocationLabel, setNewLocationLabel] = useState('')
  const [editingSourceId, setEditingSourceId] = useState(null)
  const [editingSourceLabel, setEditingSourceLabel] = useState('')
  const [newSourceLabel, setNewSourceLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('worker')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [invitations, setInvitations] = useState([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)

  // Load aquariums to check for location usage
  useEffect(() => {
    if (currentFarm) {
      loadAquariums()
      loadInvitations()
    }
  }, [currentFarm])

  // Check if update is available
  useEffect(() => {
    const hasUpdate = isNewVersionAvailable()
    setUpdateAvailable(hasUpdate)
  }, [])

  async function loadInvitations() {
    if (!currentFarm?.farmId) return
    try {
      setLoadingInvitations(true)
      const data = await getFarmInvitations(currentFarm.farmId)
      setInvitations(data)
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setLoadingInvitations(false)
    }
  }

  async function handleSendInvitation() {
    if (!inviteEmail.trim()) {
      setMessage({ type: 'error', text: 'נא להזין כתובת אימייל' })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail.trim())) {
      setMessage({ type: 'error', text: 'כתובת אימייל לא תקינה' })
      return
    }

    setSendingInvite(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await createInvitation(currentFarm.farmId, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        farmName: currentFarm.name
      })

      setInviteEmail('')
      setMessage({
        type: 'success',
        text: `הזמנה נשלחה בהצלחה! לינק ההצטרפות הועתק ללוח.`
      })

      // Copy invite link to clipboard
      if (result.inviteLink) {
        navigator.clipboard.writeText(result.inviteLink)
      }

      await loadInvitations()
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } catch (error) {
      console.error('Error sending invitation:', error)
      setMessage({ type: 'error', text: error.message || 'שגיאה בשליחת ההזמנה' })
    } finally {
      setSendingInvite(false)
    }
  }

  async function handleDeleteInvitation(invitationId) {
    if (!confirm('האם למחוק את ההזמנה?')) return

    try {
      await deleteInvitation(invitationId)
      await loadInvitations()
      setMessage({ type: 'success', text: 'ההזמנה נמחקה' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error deleting invitation:', error)
      setMessage({ type: 'error', text: 'שגיאה במחיקת ההזמנה' })
    }
  }

  function copyInviteLink(link) {
    navigator.clipboard.writeText(link)
    setMessage({ type: 'success', text: 'הלינק הועתק ללוח!' })
    setTimeout(() => setMessage({ type: '', text: '' }), 2000)
  }

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

  // ===== Fish Sources Management =====
  async function saveFishSources(updatedSources) {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      await updateFarm(currentFarm.farmId, {
        settings: {
          ...currentFarm.settings,
          fishSources: updatedSources,
        },
      })

      await reloadFarms()
      setMessage({ type: 'success', text: 'השינויים נשמרו בהצלחה!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error updating fish sources:', error)
      setMessage({ type: 'error', text: 'שגיאה בשמירת השינויים. נסה שוב.' })
    } finally {
      setSaving(false)
    }
  }

  function handleAddSource() {
    if (!newSourceLabel.trim()) {
      setMessage({ type: 'error', text: 'נא להזין שם מקור' })
      return
    }

    // Check for duplicate
    if (fishSources.some((src) => src.label === newSourceLabel.trim())) {
      setMessage({ type: 'error', text: 'מקור עם שם זה כבר קיים' })
      return
    }

    const newSource = {
      id: `src-${Date.now()}`,
      label: newSourceLabel.trim(),
    }

    const updatedSources = [...fishSources, newSource]
    setFishSources(updatedSources)
    setNewSourceLabel('')
    saveFishSources(updatedSources)
  }

  function handleStartEditSource(source) {
    setEditingSourceId(source.id)
    setEditingSourceLabel(source.label)
  }

  function handleCancelEditSource() {
    setEditingSourceId(null)
    setEditingSourceLabel('')
  }

  function handleSaveEditSource(sourceId) {
    if (!editingSourceLabel.trim()) {
      setMessage({ type: 'error', text: 'נא להזין שם מקור' })
      return
    }

    // Check for duplicate (excluding current source)
    if (
      fishSources.some(
        (src) => src.id !== sourceId && src.label === editingSourceLabel.trim()
      )
    ) {
      setMessage({ type: 'error', text: 'מקור עם שם זה כבר קיים' })
      return
    }

    const updatedSources = fishSources.map((src) =>
      src.id === sourceId ? { ...src, label: editingSourceLabel.trim() } : src
    )

    setFishSources(updatedSources)
    setEditingSourceId(null)
    setEditingSourceLabel('')
    saveFishSources(updatedSources)
  }

  function handleDeleteSource(sourceId) {
    const source = fishSources.find((src) => src.id === sourceId)
    if (!source) return

    if (!confirm(`האם אתה בטוח שברצונך למחוק את המקור "${source.label}"?`)) {
      return
    }

    const updatedSources = fishSources.filter((src) => src.id !== sourceId)
    setFishSources(updatedSources)
    saveFishSources(updatedSources)
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

      {/* Fish Sources Manager */}
      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">ניהול מקורות דגים</h2>
          <p className="text-[15px] text-gray-600">
            הוסף, ערוך או מחק מקורות דגים (משלוח מקומי, ריבוי בחווה וכו')
          </p>
        </div>

        {/* Add New Source */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 pb-8 border-b-2 border-gray-100">
          <input
            type="text"
            value={newSourceLabel}
            onChange={(e) => setNewSourceLabel(e.target.value)}
            placeholder="שם מקור חדש (למשל: קניה מספק, גידול עצמי)"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-[15px] transition-colors focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddSource()
              }
            }}
          />
          <button
            className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            onClick={handleAddSource}
            disabled={saving}
          >
            + הוסף מקור
          </button>
        </div>

        {/* Sources List */}
        {fishSources.length === 0 ? (
          <div className="text-center py-12 px-6 text-gray-600">
            <div className="text-6xl mb-4 opacity-50">🐟</div>
            <p className="my-2 text-base">אין מקורות מוגדרים</p>
            <p className="text-sm opacity-70">הוסף את המקור הראשון למעלה</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fishSources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-colors bg-green-50 hover:bg-green-100"
              >
                {editingSourceId === source.id ? (
                  <>
                    <input
                      type="text"
                      value={editingSourceLabel}
                      onChange={(e) => setEditingSourceLabel(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-green-500 rounded-lg text-base font-medium focus:outline-none focus:ring-4 focus:ring-green-500/10"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEditSource(source.id)
                        } else if (e.key === 'Escape') {
                          handleCancelEditSource()
                        }
                      }}
                    />
                    <div className="flex gap-2 mr-2">
                      <button
                        className="w-9 h-9 border-none rounded-lg cursor-pointer flex items-center justify-center text-lg transition-all bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSaveEditSource(source.id)}
                        disabled={saving}
                        title="שמור"
                      >
                        ✓
                      </button>
                      <button
                        className="w-9 h-9 border-none rounded-lg cursor-pointer flex items-center justify-center text-lg transition-all bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleCancelEditSource}
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
                      <span className="text-[15px] sm:text-base font-medium text-gray-900">{source.label}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="w-9 h-9 border-none rounded-lg cursor-pointer flex items-center justify-center text-lg transition-all bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleStartEditSource(source)}
                        disabled={saving}
                        title="ערוך"
                      >
                        ✎
                      </button>
                      <button
                        className="w-9 h-9 border-none rounded-lg cursor-pointer flex items-center justify-center text-lg transition-all bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDeleteSource(source.id)}
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

      {/* Application Settings */}
      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">הגדרות אפליקציה</h2>
          <p className="text-[15px] text-gray-600">
            בדוק עדכונים והגדרות כלליות
          </p>
        </div>

        {/* Invite Employee */}
        <div className="bg-purple-50 rounded-xl p-5 mb-6 border-2 border-purple-200">
          <div className="mb-4">
            <p className="text-sm font-semibold text-purple-800 mb-1">👥 הזמנת עובד לחווה</p>
            <p className="text-sm text-purple-700">
              שלח הזמנה באימייל לעובד חדש להצטרף לחווה שלך
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="כתובת אימייל של העובד"
              className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg text-[15px] focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
              dir="ltr"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-4 py-3 border-2 border-purple-300 rounded-lg text-[15px] bg-white focus:outline-none focus:border-purple-500"
            >
              <option value="worker">עובד</option>
              <option value="manager">מנהל</option>
            </select>
          </div>

          <button
            onClick={handleSendInvitation}
            disabled={sendingInvite}
            className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {sendingInvite ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                שולח הזמנה...
              </>
            ) : (
              <>
                📧 שלח הזמנה
              </>
            )}
          </button>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              <p className="text-sm font-semibold text-purple-800 mb-2">הזמנות ממתינות:</p>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.invitationId}
                    className="flex items-center justify-between bg-white rounded-lg p-3 text-sm"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{inv.email}</span>
                      <span className="text-gray-500 mr-2">
                        ({inv.role === 'manager' ? 'מנהל' : 'עובד'})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyInviteLink(inv.inviteLink)}
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="העתק לינק"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDeleteInvitation(inv.invitationId)}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        title="מחק הזמנה"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-purple-600 mt-3">
            לינק ההזמנה יועתק אוטומטית ללוח - שלח אותו לעובד בוואטסאפ או באימייל
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
