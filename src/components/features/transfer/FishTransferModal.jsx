import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getAquariums } from '../../../services/aquarium.service'
import { getFishInAquarium, transferFish } from '../../../services/transfer.service'

function FishTransferModal({ isOpen, onClose, onSuccess, sourceAquarium = null, zIndex = 1000 }) {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: select source, 2: select fish, 3: select destination

  const [aquariums, setAquariums] = useState([])
  const [selectedSourceAquarium, setSelectedSourceAquarium] = useState(null)
  const [fishInSource, setFishInSource] = useState([])
  const [selectedFish, setSelectedFish] = useState(null)
  const [transferQuantity, setTransferQuantity] = useState('')
  const [selectedDestAquarium, setSelectedDestAquarium] = useState(null)
  const [filterRoom, setFilterRoom] = useState('all')

  // Load aquariums on mount
  useEffect(() => {
    if (currentFarm && isOpen) {
      loadAquariums()
    }
  }, [currentFarm, isOpen])

  // Set source aquarium if provided; reload fish every time modal opens
  useEffect(() => {
    if (sourceAquarium && isOpen) {
      setSelectedSourceAquarium(sourceAquarium)
      setStep(2)
      loadFishInAquarium(sourceAquarium.aquariumId)
    } else if (!sourceAquarium) {
      setStep(1)
    }
  }, [sourceAquarium, isOpen])

  async function loadAquariums() {
    try {
      const data = await getAquariums(currentFarm.farmId)
      setAquariums(data)
    } catch (err) {
      console.error('Error loading aquariums:', err)
      setError('שגיאה בטעינת אקווריומים')
    }
  }

  async function loadFishInAquarium(aquariumId) {
    try {
      setLoading(true)
      const fish = await getFishInAquarium(currentFarm.farmId, aquariumId)
      setFishInSource(fish)
      setError('')
    } catch (err) {
      console.error('Error loading fish:', err)
      setError('שגיאה בטעינת דגים')
    } finally {
      setLoading(false)
    }
  }

  function handleSourceSelect(aquarium) {
    setSelectedSourceAquarium(aquarium)
    setStep(2)
    loadFishInAquarium(aquarium.aquariumId)
  }

  function handleFishSelect(fish) {
    setSelectedFish(fish)
    setTransferQuantity(fish.quantity.toString()) // Default to all
    setStep(3)
  }

  async function handleTransfer() {
    if (!selectedFish || !selectedDestAquarium || !transferQuantity) {
      setError('נא למלא את כל השדות')
      return
    }

    const quantity = parseInt(transferQuantity)

    if (quantity <= 0 || quantity > selectedFish.quantity) {
      setError(`הכמות חייבת להיות בין 1 ל-${selectedFish.quantity}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await transferFish(currentFarm.farmId, {
        sourceAquariumId: selectedSourceAquarium.aquariumId,
        destinationAquariumId: selectedDestAquarium.aquariumId,
        fishInstanceId: selectedFish.instanceId,
        fishSource: selectedFish.source,
        quantity: quantity,
      })

      if (onSuccess) {
        onSuccess(result)
      }

      // Reset and close
      handleClose()
    } catch (err) {
      console.error('Error transferring fish:', err)
      setError(err.message || 'שגיאה בהעברת הדגים')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep(sourceAquarium ? 2 : 1)
    setSelectedFish(null)
    setTransferQuantity('')
    setSelectedDestAquarium(null)
    setError('')
    setFilterRoom('all')
    if (!sourceAquarium) {
      setSelectedSourceAquarium(null)
      setFishInSource([])
    }
    onClose()
  }

  function goBack() {
    if (step === 3) {
      setStep(2)
      setSelectedDestAquarium(null)
      setError('')
    } else if (step === 2 && !sourceAquarium) {
      setStep(1)
      setSelectedSourceAquarium(null)
      setFishInSource([])
      setError('')
    }
  }

  if (!isOpen) return null

  // Get unique rooms for filter
  const rooms = [...new Set(aquariums.map((aq) => aq.room))]

  // Filter aquariums for destination (exclude source)
  const availableDestinations = aquariums.filter((aq) => {
    if (selectedSourceAquarium && aq.aquariumId === selectedSourceAquarium.aquariumId) return false
    if (filterRoom !== 'all' && aq.room !== filterRoom) return false
    return true
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-5"
      style={{ zIndex }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-[700px] w-full max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">
            העברת דגים בין אקווריומים
          </h2>
          <button
            className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Select Source Aquarium */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                שלב 1: בחר אקווריום מקור
              </h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {aquariums.filter((aq) => aq.totalFish > 0).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-5xl mb-3">🐠</div>
                      <div className="text-lg font-semibold text-gray-900 mb-1">אין אקווריומים עם דגים</div>
                      <div className="text-sm text-gray-600">
                        כל האקווריומים ריקים כרגע. אין אפשרות להעביר דגים.
                      </div>
                    </div>
                  ) : (
                    aquariums
                      .filter((aq) => aq.totalFish > 0)
                      .map((aquarium) => (
                        <button
                          key={aquarium.aquariumId}
                          className="bg-blue-50 rounded-lg px-4 py-3 text-right hover:bg-blue-100 transition-colors border border-blue-200"
                          onClick={() => handleSourceSelect(aquarium)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">{aquarium.aquariumNumber}</span>
                            <span className="text-sm text-gray-600">{aquarium.room}</span>
                          </div>
                          <div className="text-sm text-blue-600 mt-1">
                            🐠 {aquarium.totalFish} דגים
                          </div>
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Fish */}
          {step === 2 && (
            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">אקווריום מקור:</h3>
                <div className="text-lg font-bold text-gray-900">
                  {selectedSourceAquarium.aquariumNumber} - {selectedSourceAquarium.room}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">שלב 2: בחר דגים להעברה</h3>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : fishInSource.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  אין דגים באקווריום זה
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {fishInSource.map((fish) => (
                    <button
                      key={fish.instanceId}
                      className="bg-white rounded-lg px-4 py-3 text-right hover:bg-gray-50 transition-colors border border-gray-300"
                      onClick={() => handleFishSelect(fish)}
                    >
                      <div className="font-bold text-gray-900">{fish.commonName}</div>
                      <div className="text-sm text-gray-600">{fish.scientificName}</div>
                      <div className="text-sm text-blue-600 mt-1">
                        כמות: {fish.quantity} | גודל: {fish.size}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Destination and Quantity */}
          {step === 3 && (
            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">מעביר:</h3>
                <div className="text-lg font-bold text-gray-900">{selectedFish.commonName}</div>
                <div className="text-sm text-gray-600">{selectedFish.scientificName}</div>
              </div>

              {/* Quantity Input */}
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-900 text-sm">
                  כמות להעברה <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  min="1"
                  max={selectedFish.quantity}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder={`מקסימום: ${selectedFish.quantity}`}
                />
                <p className="text-xs text-gray-500 mt-1">זמין: {selectedFish.quantity} דגים</p>
              </div>

              {/* Room Filter */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-gray-900 text-sm">סנן לפי חדר:</label>
                <select
                  value={filterRoom}
                  onChange={(e) => setFilterRoom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">כל החדרים</option>
                  {rooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Aquariums */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">בחר אקווריום יעד</h3>

              {/* Warning if destination has fish */}
              {selectedDestAquarium && selectedDestAquarium.totalFish > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <span className="font-semibold">⚠️ שים לב:</span> באקווריום יעד זה כבר יש <span className="font-bold">{selectedDestAquarium.totalFish} דגים</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    הדגים החדשים יצורפו לדגים הקיימים באקווריום
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {availableDestinations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    אין אקווריומים זמינים בסינון זה
                  </div>
                ) : (
                  availableDestinations.map((aquarium) => {
                    const hasExistingFish = aquarium.totalFish > 0
                    return (
                      <button
                        key={aquarium.aquariumId}
                        className={`rounded-lg px-4 py-3 text-right transition-colors border ${
                          selectedDestAquarium?.aquariumId === aquarium.aquariumId
                            ? 'bg-green-100 border-green-500'
                            : hasExistingFish
                            ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedDestAquarium(aquarium)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{aquarium.aquariumNumber}</span>
                            {hasExistingFish && (
                              <span className="text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded font-semibold">
                                🐠 יש דגים
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">{aquarium.room}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          סטטוס: {aquarium.status} | {aquarium.totalFish} דגים | {aquarium.volume}L
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Fixed Footer with Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-between flex-shrink-0 bg-white rounded-b-2xl">
          <div>
            {step > 1 && !sourceAquarium && (
              <button
                type="button"
                onClick={goBack}
                className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-gray-100 text-gray-900 hover:bg-gray-200"
                disabled={loading}
              >
                ← חזור
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-gray-100 text-gray-900 hover:bg-gray-200"
              disabled={loading}
            >
              ביטול
            </button>
            {step === 3 && (
              <button
                type="button"
                onClick={handleTransfer}
                className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !selectedDestAquarium || !transferQuantity}
              >
                {loading ? 'מעביר...' : 'העבר דגים'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FishTransferModal
