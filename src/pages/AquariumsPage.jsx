import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarm } from '../contexts/FarmContext'
import { getAquariums } from '../services/aquarium.service'
import AquariumCard from '../components/features/aquarium/AquariumCard'
import AquariumCreateModal from '../components/features/aquarium/AquariumCreateModal'
import AquariumEditModal from '../components/features/aquarium/AquariumEditModal'
import AquariumFishModal from '../components/features/aquarium/AquariumFishModal'
import FishTransferModal from '../components/features/transfer/FishTransferModal'

function AquariumsPage() {
  const navigate = useNavigate()
  const { currentFarm } = useFarm()
  const [aquariums, setAquariums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFishModal, setShowFishModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedAquarium, setSelectedAquarium] = useState(null)
  const [fishModalAquarium, setFishModalAquarium] = useState(null)
  const [transferSourceAquarium, setTransferSourceAquarium] = useState(null)
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
    setSelectedAquarium(aquarium)
    setShowEditModal(true)
  }

  function handleAquariumUpdated(updatedAquarium, isDeleted = false) {
    if (isDeleted) {
      // Remove from list
      setAquariums(aquariums.filter((aq) => aq.aquariumId !== selectedAquarium.aquariumId))
    } else {
      // Update in list
      setAquariums(
        aquariums.map((aq) => (aq.aquariumId === updatedAquarium.aquariumId ? updatedAquarium : aq))
      )
    }
    setShowEditModal(false)
    setSelectedAquarium(null)
  }

  function handleTransferClick(aquarium) {
    // Close edit modal and open transfer modal with source aquarium
    setShowEditModal(false)
    setTransferSourceAquarium(aquarium)
    setShowTransferModal(true)
  }

  function handleManageFish(aquarium) {
    setFishModalAquarium(aquarium)
    setShowFishModal(true)
  }

  function handleFishModalSuccess() {
    // Reload aquariums after fish changes
    loadAquariums()
  }

  function handleTransferSuccess(result) {
    // Reload aquariums after successful transfer
    loadAquariums()
    setShowTransferModal(false)
    setTransferSourceAquarium(null)
    alert(`הועברו ${result.transferred} ${result.fishName} בהצלחה!`)
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-5">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-3 gap-2">
          <button
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-300 rounded-lg cursor-pointer text-xs sm:text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 hover:border-gray-400"
            onClick={() => navigate('/home')}
          >
            ← חזרה
          </button>
          <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-gray-900 m-0 flex-1 text-center">ניהול אקווריומים</h1>
          <button
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap"
            onClick={() => setShowCreateModal(true)}
          >
            + חדש
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl shadow-md text-center">
          <div className="text-2xl sm:text-[32px] font-bold text-blue-500 mb-0.5 sm:mb-1">{stats.total}</div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">סה"כ</div>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl shadow-md text-center">
          <div className="text-2xl sm:text-[32px] font-bold text-blue-500 mb-0.5 sm:mb-1">{stats.occupied}</div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">תפוסים</div>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl shadow-md text-center">
          <div className="text-2xl sm:text-[32px] font-bold text-blue-500 mb-0.5 sm:mb-1">{stats.empty}</div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">ריקים</div>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl shadow-md text-center">
          <div className="text-2xl sm:text-[32px] font-bold text-blue-500 mb-0.5 sm:mb-1">{stats.maintenance}</div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">תחזוקה</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-md">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">חדר:</label>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
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

        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">סטטוס:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
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
        <div className="text-center py-10 sm:py-[60px] px-4 sm:px-5 bg-white rounded-lg sm:rounded-xl shadow-md">
          <div className="text-5xl sm:text-[80px] mb-3 sm:mb-4 opacity-50">🏊</div>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">אין אקווריומים</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
            {aquariums.length === 0
              ? 'התחל על ידי יצירת האקווריום הראשון שלך'
              : 'לא נמצאו אקווריומים התואמים את הסינון'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-6">
          {Object.entries(aquariumsByRoom).map(([room, roomAquariums]) => {
            const emptyCount = roomAquariums.filter(aq => aq.status === 'empty').length
            return (
              <div key={room} className="bg-white p-3 sm:p-6 rounded-lg sm:rounded-xl shadow-md">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span>{room}</span>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <span className="text-gray-500 font-medium">
                      סה"כ: {roomAquariums.length}
                    </span>
                    <span className="text-green-600 font-semibold bg-green-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">
                      ריקים: {emptyCount}
                    </span>
                  </div>
                </h2>

                <div className="flex flex-col gap-2">
                  {roomAquariums.map((aquarium) => (
                    <AquariumCard
                      key={aquarium.aquariumId}
                      aquarium={aquarium}
                      statusLabel={getStatusLabel(aquarium.status)}
                      onClick={() => handleAquariumClick(aquarium)}
                      onManageFish={handleManageFish}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <AquariumCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleAquariumCreated}
        existingAquariums={aquariums}
      />

      {/* Edit Modal */}
      <AquariumEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedAquarium(null)
        }}
        onSuccess={handleAquariumUpdated}
        onTransferClick={handleTransferClick}
        aquarium={selectedAquarium}
      />

      {/* Fish Management Modal */}
      <AquariumFishModal
        isOpen={showFishModal}
        onClose={() => {
          setShowFishModal(false)
          setFishModalAquarium(null)
        }}
        onSuccess={handleFishModalSuccess}
        aquarium={fishModalAquarium}
      />

      {/* Transfer Modal */}
      <FishTransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false)
          setTransferSourceAquarium(null)
        }}
        onSuccess={handleTransferSuccess}
        sourceAquarium={transferSourceAquarium}
      />
    </div>
  )
}

export default AquariumsPage
