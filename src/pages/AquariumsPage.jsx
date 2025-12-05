import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarm } from '../contexts/FarmContext'
import { getAquariums } from '../services/aquarium.service'
import AquariumCard from '../components/features/aquarium/AquariumCard'
import AquariumCreateModal from '../components/features/aquarium/AquariumCreateModal'
import './AquariumsPage.css'

function AquariumsPage() {
  const navigate = useNavigate()
  const { currentFarm } = useFarm()
  const [aquariums, setAquariums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterRoom, setFilterRoom] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (currentFarm) {
      loadAquariums()
    }
  }, [currentFarm])

  async function loadAquariums() {
    setLoading(true)
    try {
      const data = await getAquariums(currentFarm.farmId)
      setAquariums(data)
    } catch (error) {
      console.error('Error loading aquariums:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleAquariumCreated(aquarium) {
    setAquariums([...aquariums, aquarium])
  }

  function handleAquariumClick(aquarium) {
    // TODO: Navigate to aquarium details or open edit modal
    console.log('Aquarium clicked:', aquarium)
  }

  function getStatusLabel(statusId) {
    const status = currentFarm?.settings?.aquariumStatuses?.find((s) => s.id === statusId)
    return status?.label || statusId
  }

  // Filter aquariums
  const filteredAquariums = aquariums.filter((aq) => {
    if (filterRoom !== 'all' && aq.room !== filterRoom) return false
    if (filterStatus !== 'all' && aq.status !== filterStatus) return false
    return true
  })

  // Group by room
  const aquariumsByRoom = filteredAquariums.reduce((acc, aq) => {
    if (!acc[aq.room]) acc[aq.room] = []
    acc[aq.room].push(aq)
    return acc
  }, {})

  // Stats
  const stats = {
    total: aquariums.length,
    empty: aquariums.filter((a) => a.status === 'empty').length,
    occupied: aquariums.filter((a) => a.status === 'occupied').length,
    maintenance: aquariums.filter((a) => a.status === 'maintenance').length,
  }

  if (loading) {
    return (
      <div className="aquariums-page">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>טוען אקווריומים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="aquariums-page">
      {/* Header */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          ← חזרה
        </button>
        <h1>ניהול אקווריומים</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + אקווריום חדש
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">סה"כ אקווריומים</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.occupied}</div>
          <div className="stat-label">תפוסים</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.empty}</div>
          <div className="stat-label">ריקים</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.maintenance}</div>
          <div className="stat-label">בתחזוקה</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>חדר:</label>
          <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)}>
            <option value="all">הכל</option>
            {/* Get unique rooms from actual aquariums */}
            {[...new Set(aquariums.map((aq) => aq.room))].map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>סטטוס:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">הכל</option>
            {currentFarm?.settings?.aquariumStatuses?.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aquariums List */}
      {filteredAquariums.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏊</div>
          <h3>אין אקווריומים</h3>
          <p>
            {aquariums.length === 0
              ? 'התחל על ידי יצירת האקווריום הראשון שלך (לחץ על "אקווריום חדש" למעלה)'
              : 'לא נמצאו אקווריומים התואמים את הסינון'}
          </p>
        </div>
      ) : (
        <div className="aquariums-content">
          {Object.entries(aquariumsByRoom).map(([room, roomAquariums]) => (
            <div key={room} className="room-section">
              <h2 className="room-title">
                {room}
                <span className="room-count">({roomAquariums.length})</span>
              </h2>

              <div className="aquariums-grid">
                {roomAquariums.map((aquarium) => (
                  <AquariumCard
                    key={aquarium.aquariumId}
                    aquarium={aquarium}
                    statusLabel={getStatusLabel(aquarium.status)}
                    onClick={() => handleAquariumClick(aquarium)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AquariumCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleAquariumCreated}
      />
    </div>
  )
}

export default AquariumsPage
