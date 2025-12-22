import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getAquariums } from '../../../services/aquarium.service'
import { getFishInAquarium } from '../../../services/transfer.service'
import {
  createTransferPlan,
  addTransferTask,
  getTransferTasks,
  validateTaskWarnings,
  finalizeTransferPlan,
  deleteTransferPlan,
} from '../../../services/transfer-plan.service'
import WarningDialog from './WarningDialog'

function TransferPlanModal({ isOpen, onClose, onSuccess }) {
  const { currentFarm, user } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: select source, 2: select fish, 3: select destination

  // Plan state
  const [currentPlan, setCurrentPlan] = useState(null)
  const [planName, setPlanName] = useState('')
  const [tasks, setTasks] = useState([])

  // Selection state
  const [aquariums, setAquariums] = useState([])
  const [selectedSourceAquarium, setSelectedSourceAquarium] = useState(null)
  const [fishInSource, setFishInSource] = useState([])
  const [selectedFish, setSelectedFish] = useState(null)
  const [transferQuantity, setTransferQuantity] = useState('')
  const [selectedDestAquarium, setSelectedDestAquarium] = useState(null)
  const [filterRoom, setFilterRoom] = useState('all')
  const [allowMixing, setAllowMixing] = useState(false)
  const [taskNotes, setTaskNotes] = useState('')

  // Warning dialog
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [warnings, setWarnings] = useState([])
  const [pendingTaskData, setPendingTaskData] = useState(null)

  // Virtual state for aquarium status
  const [virtualState, setVirtualState] = useState(new Map())

  // Load aquariums on mount
  useEffect(() => {
    if (currentFarm && isOpen) {
      loadAquariums()
      initializePlan()
    }
  }, [currentFarm, isOpen])

  async function initializePlan() {
    try {
      const date = new Date().toLocaleDateString('he-IL')
      const defaultName = `תוכנית העברה - ${date}`
      setPlanName(defaultName)
    } catch (err) {
      console.error('Error initializing plan:', err)
    }
  }

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

  async function loadTasks() {
    if (!currentPlan) return
    try {
      const taskList = await getTransferTasks(currentFarm.farmId, currentPlan)
      setTasks(taskList)
    } catch (err) {
      console.error('Error loading tasks:', err)
    }
  }

  function handleSourceSelect(aquarium) {
    setSelectedSourceAquarium(aquarium)
    setStep(2)
    loadFishInAquarium(aquarium.aquariumId)
  }

  function handleFishSelect(fish) {
    setSelectedFish(fish)
    setTransferQuantity(fish.quantity.toString())
    setStep(3)
  }

  async function handleAddTask() {
    if (!selectedFish || !selectedDestAquarium || !transferQuantity) {
      setError('נא למלא את כל השדות')
      return
    }

    const quantity = parseInt(transferQuantity)
    if (quantity <= 0 || quantity > selectedFish.quantity) {
      setError(`הכמות חייבת להיות בין 1 ל-${selectedFish.quantity}`)
      return
    }

    // Create plan if doesn't exist
    let planId = currentPlan
    if (!planId) {
      try {
        setLoading(true)
        const result = await createTransferPlan(currentFarm.farmId, {
          planName: planName || `תוכנית העברה - ${new Date().toLocaleDateString('he-IL')}`,
          createdBy: user?.email || 'unknown',
        })
        planId = result.planId
        setCurrentPlan(planId)
      } catch (err) {
        console.error('Error creating plan:', err)
        setError('שגיאה ביצירת תוכנית')
        setLoading(false)
        return
      }
    }

    // Prepare task data
    const taskData = {
      planId: planId,
      fishId: selectedFish.instanceId,
      fishName: selectedFish.commonName,
      scientificName: selectedFish.scientificName,
      size: selectedFish.size,
      quantity: quantity,
      sourceAquariumId: selectedSourceAquarium.aquariumId,
      sourceAquariumNumber: selectedSourceAquarium.aquariumNumber,
      sourceRoom: selectedSourceAquarium.room,
      targetAquariumId: selectedDestAquarium.aquariumId,
      targetAquariumNumber: selectedDestAquarium.aquariumNumber,
      targetRoom: selectedDestAquarium.room,
      order: tasks.length,
      allowMixing: allowMixing,
      notes: taskNotes,
    }

    // Validate and check for warnings
    try {
      const taskWarnings = await validateTaskWarnings(currentFarm.farmId, planId, taskData)

      if (taskWarnings.length > 0) {
        // Show warning dialog
        setWarnings(taskWarnings)
        setPendingTaskData(taskData)
        setShowWarningDialog(true)
        setLoading(false)
        return
      }

      // No warnings - add task directly
      await addTaskToPlan(taskData)
    } catch (err) {
      console.error('Error validating task:', err)
      setError('שגיאה בבדיקת התנגשויות')
      setLoading(false)
    }
  }

  async function addTaskToPlan(taskData) {
    try {
      setLoading(true)
      await addTransferTask(currentFarm.farmId, taskData)
      await loadTasks()

      // Reset step 3 selections
      setSelectedDestAquarium(null)
      setTransferQuantity('')
      setAllowMixing(false)
      setTaskNotes('')
      setError('')

      // Go back to step 2 to add more fish from same source
      setStep(2)
    } catch (err) {
      console.error('Error adding task:', err)
      setError('שגיאה בהוספת משימה')
    } finally {
      setLoading(false)
    }
  }

  function handleWarningConfirm() {
    setShowWarningDialog(false)
    if (pendingTaskData) {
      addTaskToPlan(pendingTaskData)
      setPendingTaskData(null)
    }
  }

  function handleWarningCancel() {
    setShowWarningDialog(false)
    setPendingTaskData(null)
    setLoading(false)
  }

  async function handleFinalizePlan() {
    if (!currentPlan) return
    if (tasks.length === 0) {
      setError('לא ניתן לסיים תוכנית ריקה. הוסף לפחות משימה אחת.')
      return
    }

    try {
      setLoading(true)
      await finalizeTransferPlan(currentFarm.farmId, currentPlan)

      if (onSuccess) {
        onSuccess()
      }

      handleClose()
    } catch (err) {
      console.error('Error finalizing plan:', err)
      setError('שגיאה בסיום התוכנית')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePlan() {
    if (!currentPlan) return

    if (!confirm('האם אתה בטוח שברצונך למחוק את התוכנית? כל המשימות יימחקו.')) {
      return
    }

    try {
      setLoading(true)
      await deleteTransferPlan(currentFarm.farmId, currentPlan)
      handleClose()
    } catch (err) {
      console.error('Error deleting plan:', err)
      setError('שגיאה במחיקת התוכנית')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep(1)
    setCurrentPlan(null)
    setPlanName('')
    setTasks([])
    setSelectedSourceAquarium(null)
    setSelectedFish(null)
    setSelectedDestAquarium(null)
    setFishInSource([])
    setTransferQuantity('')
    setFilterRoom('all')
    setAllowMixing(false)
    setTaskNotes('')
    setError('')
    onClose()
  }

  function goBack() {
    if (step === 3) {
      setStep(2)
      setSelectedDestAquarium(null)
      setTransferQuantity(selectedFish?.quantity.toString() || '')
      setAllowMixing(false)
      setTaskNotes('')
      setError('')
    } else if (step === 2) {
      setStep(1)
      setSelectedSourceAquarium(null)
      setSelectedFish(null)
      setFishInSource([])
      setError('')
    }
  }

  if (!isOpen) return null

  const rooms = [...new Set(aquariums.map((aq) => aq.room))]

  const availableDestinations = aquariums.filter((aq) => {
    if (selectedSourceAquarium && aq.aquariumId === selectedSourceAquarium.aquariumId) return false
    if (filterRoom !== 'all' && aq.room !== filterRoom) return false
    return true
  })

  // Calculate aquarium status based on virtual state
  const getAquariumStatus = (aquarium) => {
    const state = virtualState.get(aquarium.aquariumId)
    if (!state) {
      return aquarium.totalFish > 0 ? 'occupied' : 'empty'
    }

    if (state.willBeEmpty) return 'emptying'
    if (state.willBeOccupied) return 'filling'
    return aquarium.totalFish > 0 ? 'occupied' : 'empty'
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-[800px] w-full max-h-[90vh] flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
            <div>
              <h2 className="m-0 text-[22px] font-semibold text-gray-900">
                תכנון העברות דגים
              </h2>
              {currentPlan && (
                <p className="text-sm text-gray-600 mt-1">
                  {tasks.length} משימות בתוכנית
                </p>
              )}
            </div>
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

            {/* Plan name input (only if no plan yet) */}
            {!currentPlan && step === 1 && (
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-gray-900 text-sm">
                  שם התוכנית
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  placeholder="תוכנית העברה..."
                />
              </div>
            )}

            {/* Tasks Summary */}
            {currentPlan && tasks.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  משימות שנוספו ({tasks.length})
                </h3>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {tasks.map((task, index) => (
                    <div key={task.taskId} className="text-xs bg-white p-2 rounded border border-blue-100">
                      <span className="font-bold text-blue-700">#{index + 1}</span>{' '}
                      {task.fishName} ({task.quantity}) →
                      אקווריום {task.targetAquariumNumber} ({task.targetRoom})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Select Source */}
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
                        <div className="text-lg font-semibold text-gray-900 mb-1">
                          אין אקווריומים עם דגים
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
                              <span className="font-bold text-gray-900">
                                אקווריום {aquarium.aquariumNumber}
                              </span>
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
                    אקווריום {selectedSourceAquarium.aquariumNumber} - {selectedSourceAquarium.room}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  שלב 2: בחר דגים להעברה
                </h3>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : fishInSource.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">אין דגים באקווריום זה</div>
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

            {/* Step 3: Select Destination */}
            {step === 3 && (
              <div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">מתכנן העברה:</h3>
                  <div className="text-lg font-bold text-gray-900">{selectedFish.commonName}</div>
                  <div className="text-sm text-gray-600">{selectedFish.scientificName}</div>
                </div>

                {/* Quantity */}
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">זמין: {selectedFish.quantity}</p>
                </div>

                {/* Notes */}
                <div className="mb-5">
                  <label className="block mb-2 font-semibold text-gray-900 text-sm">
                    הערות (אופציונלי)
                  </label>
                  <input
                    type="text"
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    placeholder="הערות על ההעברה..."
                  />
                </div>

                {/* Room Filter */}
                <div className="mb-4">
                  <label className="block mb-2 font-semibold text-gray-900 text-sm">
                    סנן לפי חדר:
                  </label>
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
                              <span className="font-bold text-gray-900">
                                אקווריום {aquarium.aquariumNumber}
                              </span>
                              {hasExistingFish && (
                                <span className="text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded font-semibold">
                                  🐠 תפוס
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-600">{aquarium.room}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {aquarium.totalFish} דגים | {aquarium.volume}L
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

                {/* Allow Mixing Checkbox */}
                {selectedDestAquarium && selectedDestAquarium.totalFish > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowMixing}
                        onChange={(e) => setAllowMixing(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-yellow-900">
                        אני מאשר לערבב דגים באקווריום זה
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-between flex-shrink-0 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-gray-100 text-gray-900 hover:bg-gray-200"
                  disabled={loading}
                >
                  ← חזור
                </button>
              )}
              {currentPlan && tasks.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeletePlan}
                  className="px-4 py-3 rounded-lg text-[15px] font-semibold transition-all bg-red-50 text-red-600 hover:bg-red-100"
                  disabled={loading}
                >
                  🗑️ מחק תוכנית
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
                  onClick={handleAddTask}
                  className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                  disabled={loading || !selectedDestAquarium || !transferQuantity}
                >
                  {loading ? 'מוסיף...' : '➕ הוסף למשימות'}
                </button>
              )}
              {currentPlan && tasks.length > 0 && step < 3 && (
                <button
                  type="button"
                  onClick={handleFinalizePlan}
                  className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'משלים...' : '✓ סיים תכנון'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Dialog */}
      <WarningDialog
        isOpen={showWarningDialog}
        warnings={warnings}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />
    </>
  )
}

export default TransferPlanModal
