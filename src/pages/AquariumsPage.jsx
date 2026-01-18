import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarm } from '../contexts/FarmContext'
import { getAquariums } from '../services/aquarium.service'
import AquariumCard from '../components/features/aquarium/AquariumCard'
import AquariumCreateModal from '../components/features/aquarium/AquariumCreateModal'
import AquariumEditModal from '../components/features/aquarium/AquariumEditModal'
import AquariumFishModal from '../components/features/aquarium/AquariumFishModal'
import QuickEmptyModal from '../components/features/aquarium/QuickEmptyModal'
import FishTransferModal from '../components/features/transfer/FishTransferModal'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'

function AquariumsPage() {
  const navigate = useNavigate()
  const { currentFarm } = useFarm()
  const [aquariums, setAquariums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFishModal, setShowFishModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showQuickEmptyModal, setShowQuickEmptyModal] = useState(false)
  const [selectedAquarium, setSelectedAquarium] = useState(null)
  const [fishModalAquarium, setFishModalAquarium] = useState(null)
  const [transferSourceAquarium, setTransferSourceAquarium] = useState(null)
  const [quickEmptyAquarium, setQuickEmptyAquarium] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null) // null = room selection screen
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

      // Load fish names for each aquarium
      const aquariumsWithFish = await Promise.all(
        data.map(async (aquarium) => {
          const fishNames = []

          // Get imported fish (fish_instances)
          const fishInstancesRef = collection(db, 'farms', currentFarm.farmId, 'fish_instances')
          const fishInstancesQuery = query(
            fishInstancesRef,
            where('aquariumId', '==', aquarium.aquariumId)
          )
          const fishInstancesSnapshot = await getDocs(fishInstancesQuery)
          fishInstancesSnapshot.docs.forEach((doc) => {
            const fish = doc.data()
            if (fish.currentQuantity > 0) {
              fishNames.push(fish.commonName || fish.scientificName)
            }
          })

          // Get local fish (farmFish)
          const farmFishRef = collection(db, 'farmFish')
          const farmFishQuery = query(
            farmFishRef,
            where('farmId', '==', currentFarm.farmId),
            where('aquariumId', '==', aquarium.aquariumId)
          )
          const farmFishSnapshot = await getDocs(farmFishQuery)
          farmFishSnapshot.docs.forEach((doc) => {
            const fish = doc.data()
            if (fish.quantity > 0) {
              fishNames.push(fish.hebrewName || fish.scientificName)
            }
          })

          return {
            ...aquarium,
            fishNames: fishNames.length > 0 ? fishNames : null,
          }
        })
      )

      setAquariums(aquariumsWithFish)
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

  function handleQuickEmpty(aquarium) {
    setQuickEmptyAquarium(aquarium)
    setShowQuickEmptyModal(true)
  }

  function handleQuickEmptySuccess() {
    // Reload aquariums after emptying
    loadAquariums()
    setShowQuickEmptyModal(false)
    setQuickEmptyAquarium(null)
  }

  function getStatusLabel(statusId) {
    const status = currentFarm?.settings?.aquariumStatuses?.find((s) => s.id === statusId)
    return status?.label || statusId
  }

  // Get unique rooms
  const rooms = [...new Set(aquariums.map((aq) => aq.room))].sort()

  // Filter aquariums
  const filteredAquariums = aquariums.filter((aq) => {
    if (selectedRoom && aq.room !== selectedRoom) return false
    if (filterStatus !== 'all' && aq.status !== filterStatus) return false
    return true
  })

  // Group by room (only when room is selected)
  const aquariumsByRoom = selectedRoom ? {
    [selectedRoom]: filteredAquariums
  } : {}

  // Stats (for selected room or all)
  const relevantAquariums = selectedRoom
    ? aquariums.filter(a => a.room === selectedRoom)
    : aquariums

  const stats = {
    total: relevantAquariums.length,
    empty: relevantAquariums.filter((a) => a.status === 'empty').length,
    occupied: relevantAquariums.filter((a) => a.status === 'occupied').length,
    maintenance: relevantAquariums.filter((a) => a.status === 'maintenance').length,
  }

  // Room stats for selection screen
  const roomStats = rooms.map(room => {
    const roomAquariums = aquariums.filter(a => a.room === room)
    return {
      room,
      total: roomAquariums.length,
      empty: roomAquariums.filter(a => a.status === 'empty').length,
      occupied: roomAquariums.filter(a => a.status === 'occupied').length,
      maintenance: roomAquariums.filter(a => a.status === 'maintenance').length,
    }
  })

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

  // Room Selection Screen
  if (!selectedRoom) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-5">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3 gap-2">
            <button
              className="px-3 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-300 rounded-lg cursor-pointer text-xs sm:text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 hover:border-gray-400"
              onClick={() => navigate('/home')}
            >
              ← חזרה
            </button>
            <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-gray-900 m-0 flex-1 text-center">בחר אזור</h1>
            <div className="w-[60px] sm:w-[100px]"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Room Selection Cards */}
        <div className="max-w-4xl mx-auto">
          {rooms.length === 0 ? (
            <div className="text-center py-20 px-4 bg-white rounded-xl shadow-md">
              <div className="text-6xl mb-4 opacity-50">🏊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">אין אקווריומים</h3>
              <p className="text-base text-gray-500 mb-6">
                התחל על ידי יצירת האקווריום הראשון שלך
              </p>
              <button
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                onClick={() => setShowCreateModal(true)}
              >
                + צור אקווריום ראשון
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomStats.map(({ room, total, empty, occupied, maintenance }) => (
                <button
                  key={room}
                  onClick={() => setSelectedRoom(room)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-right border-2 border-transparent hover:border-blue-400 hover:-translate-y-1 cursor-pointer"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{room}</h2>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">סה"כ אקווריומים:</span>
                      <span className="text-lg font-bold text-blue-600">{total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ריקים:</span>
                      <span className="text-base font-semibold text-green-600">{empty}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">תפוסים:</span>
                      <span className="text-base font-semibold text-blue-600">{occupied}</span>
                    </div>
                    {maintenance > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">בתחזוקה:</span>
                        <span className="text-base font-semibold text-yellow-600">{maintenance}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-blue-500 font-semibold">לחץ לצפייה →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        <AquariumCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAquariumCreated}
          existingAquariums={aquariums}
        />
      </div>
    )
  }

  // Aquariums View (when room is selected)
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-5">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-3 gap-2">
          <button
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-300 rounded-lg cursor-pointer text-xs sm:text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 hover:border-gray-400"
            onClick={() => setSelectedRoom(null)}
          >
            ← כל האזורים
          </button>
          <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-gray-900 m-0 flex-1 text-center">{selectedRoom}</h1>
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
      <div className="flex items-center gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-md">
        <label className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">סינון:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">כל הסטטוסים</option>
          {currentFarm?.settings?.aquariumStatuses?.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Aquariums List */}
      {filteredAquariums.length === 0 ? (
        <div className="text-center py-10 sm:py-[60px] px-4 sm:px-5 bg-white rounded-lg sm:rounded-xl shadow-md">
          <div className="text-5xl sm:text-[80px] mb-3 sm:mb-4 opacity-50">🏊</div>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">אין אקווריומים</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
            {filterStatus !== 'all'
              ? `אין אקווריומים עם סטטוס "${currentFarm?.settings?.aquariumStatuses?.find(s => s.id === filterStatus)?.label}" באזור ${selectedRoom}`
              : `אין אקווריומים באזור ${selectedRoom}`}
          </p>
        </div>
      ) : (
        <div className="bg-white p-3 sm:p-6 rounded-lg sm:rounded-xl shadow-md">
          <div className="flex flex-col gap-2">
            {filteredAquariums.map((aquarium) => (
              <AquariumCard
                key={aquarium.aquariumId}
                aquarium={aquarium}
                statusLabel={getStatusLabel(aquarium.status)}
                onClick={() => handleAquariumClick(aquarium)}
                onManageFish={handleManageFish}
                onQuickEmpty={handleQuickEmpty}
              />
            ))}
          </div>
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

      {/* Quick Empty Modal */}
      <QuickEmptyModal
        isOpen={showQuickEmptyModal}
        onClose={() => {
          setShowQuickEmptyModal(false)
          setQuickEmptyAquarium(null)
        }}
        onSuccess={handleQuickEmptySuccess}
        aquarium={quickEmptyAquarium}
      />
    </div>
  )
}

export default AquariumsPage
