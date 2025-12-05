import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarm } from '../contexts/FarmContext'
import { getAquariums } from '../services/aquarium.service'
import AquariumCard from '../components/features/aquarium/AquariumCard'
import AquariumCreateModal from '../components/features/aquarium/AquariumCreateModal'

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
      <div className="min-h-screen bg-gray-50 p-5 md:p-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-base text-gray-500">טוען אקווריומים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-5 md:p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap md:flex-nowrap">
        <button
          className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg cursor-pointer text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 hover:border-gray-400"
          onClick={() => navigate('/home')}
        >
          ← חזרה
        </button>
        <h1 className="text-[28px] md:text-[22px] font-bold text-gray-900 m-0 flex-1 text-center">ניהול אקווריומים</h1>
        <button
          className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          onClick={() => setShowCreateModal(true)}
        >
          + אקווריום חדש
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-md text-center">
          <div className="text-[32px] font-bold text-blue-500 mb-1">{stats.total}</div>
          <div className="text-sm text-gray-500 font-medium">סה"כ אקווריומים</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md text-center">
          <div className="text-[32px] font-bold text-blue-500 mb-1">{stats.occupied}</div>
          <div className="text-sm text-gray-500 font-medium">תפוסים</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md text-center">
          <div className="text-[32px] font-bold text-blue-500 mb-1">{stats.empty}</div>
          <div className="text-sm text-gray-500 font-medium">ריקים</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md text-center">
          <div className="text-[32px] font-bold text-blue-500 mb-1">{stats.maintenance}</div>
          <div className="text-sm text-gray-500 font-medium">בתחזוקה</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-900">חדר:</label>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">הכל</option>
            {/* Get unique rooms from actual aquariums */}
            {[...new Set(aquariums.map((aq) => aq.room))].map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-900">סטטוס:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
          >
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
        <div className="text-center py-[60px] px-5 bg-white rounded-xl shadow-md">
          <div className="text-[80px] mb-4 opacity-50">🏊</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">אין אקווריומים</h3>
          <p className="text-base text-gray-500 mb-6">
            {aquariums.length === 0
              ? 'התחל על ידי יצירת האקווריום הראשון שלך (לחץ על "אקווריום חדש" למעלה)'
              : 'לא נמצאו אקווריומים התואמים את הסינון'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(aquariumsByRoom).map(([room, roomAquariums]) => (
            <div key={room} className="bg-white p-6 md:p-4 rounded-xl shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-100 flex items-center gap-2">
                {room}
                <span className="text-sm font-medium text-gray-500">({roomAquariums.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
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
