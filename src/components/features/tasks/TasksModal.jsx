import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getAquariums } from '../../../services/aquarium.service'
import { getFarmFish } from '../../../services/farm-fish.service'
import { getFishInAquarium } from '../../../services/transfer.service'
import { getFishByAquarium } from '../../../services/fish.service'
import {
  getTasks,
  createTask,
  createTransferTask,
  completeTask,
  deleteTask,
  blockTask,
  unblockTask,
} from '../../../services/task.service'
import BlockReportDialog from '../transfer-plan/BlockReportDialog'

function TasksModal({ isOpen, onClose, onSuccess }) {
  const { currentFarm, user } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('list') // list, add
  const [statusFilter, setStatusFilter] = useState('pending') // pending, completed, blocked, all

  // Tasks state
  const [tasks, setTasks] = useState([])

  // Add task state
  const [taskType, setTaskType] = useState('general') // general, transfer
  const [taskTitle, setTaskTitle] = useState('')
  const [taskNotes, setTaskNotes] = useState('')

  // Transfer-specific state
  const [step, setStep] = useState(1) // 1: source, 2: fish, 3: destination
  const [aquariums, setAquariums] = useState([])
  const [allFish, setAllFish] = useState([])
  const [selectedSourceAquarium, setSelectedSourceAquarium] = useState(null)
  const [fishInSource, setFishInSource] = useState([])
  const [selectedFish, setSelectedFish] = useState(null)
  const [transferQuantity, setTransferQuantity] = useState('')
  const [selectedDestAquarium, setSelectedDestAquarium] = useState(null)
  const [filterSourceRoom, setFilterSourceRoom] = useState('all')
  const [filterDestRoom, setFilterDestRoom] = useState('all')
  const [isShipment, setIsShipment] = useState(false)

  // Block report dialog
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [blockingTaskId, setBlockingTaskId] = useState(null)

  // Load tasks on mount
  useEffect(() => {
    if (currentFarm && isOpen) {
      loadTasks()
      loadAquariums()
      loadAllFish()
    }
  }, [currentFarm, isOpen])

  async function loadTasks() {
    try {
      setLoading(true)
      const filter = statusFilter === 'all' ? null : statusFilter
      const taskList = await getTasks(currentFarm.farmId, filter)
      setTasks(taskList)
      setError('')
    } catch (err) {
      console.error('Error loading tasks:', err)
      setError('שגיאה בטעינת המשימות')
    } finally {
      setLoading(false)
    }
  }

  async function loadAquariums() {
    try {
      const data = await getAquariums(currentFarm.farmId)
      setAquariums(data)
    } catch (err) {
      console.error('Error loading aquariums:', err)
    }
  }

  async function loadAllFish() {
    try {
      const fish = await getFarmFish(currentFarm.farmId)
      setAllFish(fish)
    } catch (err) {
      console.error('Error loading fish:', err)
    }
  }

  // Reload tasks when filter changes
  useEffect(() => {
    if (currentFarm && isOpen) {
      loadTasks()
    }
  }, [statusFilter])

  function handleClose() {
    resetForm()
    onClose()
  }

  function resetForm() {
    setTaskType('general')
    setTaskTitle('')
    setTaskNotes('')
    setStep(1)
    setSelectedSourceAquarium(null)
    setFishInSource([])
    setSelectedFish(null)
    setTransferQuantity('')
    setSelectedDestAquarium(null)
    setFilterSourceRoom('all')
    setFilterDestRoom('all')
    setIsShipment(false)
    setError('')
  }

  function switchToAddMode() {
    resetForm()
    setViewMode('add')
  }

  function switchToListMode() {
    resetForm()
    setViewMode('list')
    loadTasks()
  }

  // Get fish for a specific aquarium
  function getFishForAquarium(aquariumId) {
    return allFish.filter(fish => fish.aquariumId === aquariumId)
  }

  async function handleSourceSelect(aquarium) {
    setSelectedSourceAquarium(aquarium)
    try {
      setLoading(true)

      // Load fish from BOTH collections:
      // 1. farmFish - directly added fish
      // 2. fish_instances - fish from reception/shipments
      const [farmFish, receptionFish] = await Promise.all([
        getFishInAquarium(currentFarm.farmId, aquarium.aquariumId),
        getFishByAquarium(currentFarm.farmId, aquarium.aquariumId),
      ])

      // Transform reception fish to same format as farm fish
      const transformedReceptionFish = receptionFish.map(fish => ({
        instanceId: fish.instanceId,
        quantity: fish.currentQuantity,
        dateAdded: fish.arrivalDate,
        code: fish.code || '',
        scientificName: fish.scientificName,
        commonName: fish.commonName, // reception fish use commonName
        size: fish.size,
        currentQuantity: fish.currentQuantity,
        isReceptionFish: true, // flag to identify source
      }))

      // Combine both lists
      const allFishInAquarium = [...farmFish, ...transformedReceptionFish]
      console.log('Combined fish in aquarium:', allFishInAquarium)

      setFishInSource(allFishInAquarium)
      setStep(2)
    } catch (err) {
      console.error('Error loading fish:', err)
      setError('שגיאה בטעינת הדגים')
    } finally {
      setLoading(false)
    }
  }

  function handleFishSelect(fish) {
    setSelectedFish(fish)
    setTransferQuantity(fish.quantity.toString())
    setStep(3)
  }

  function handleDestinationSelect(aquarium) {
    setSelectedDestAquarium(aquarium)
  }

  async function handleCreateGeneralTask() {
    if (!taskTitle.trim()) {
      setError('יש להזין כותרת למשימה')
      return
    }

    try {
      setLoading(true)
      await createTask(currentFarm.farmId, {
        type: 'general',
        title: taskTitle.trim(),
        notes: taskNotes.trim(),
        createdBy: user?.email || 'unknown',
      })

      switchToListMode()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error creating task:', err)
      setError('שגיאה ביצירת המשימה')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTransferTask() {
    if (!selectedFish || !transferQuantity) {
      setError('יש לבחור דג וכמות')
      return
    }

    if (!isShipment && !selectedDestAquarium) {
      setError('יש לבחור אקווריום יעד או לסמן כמשלוח')
      return
    }

    const quantity = parseInt(transferQuantity)
    if (isNaN(quantity) || quantity <= 0 || quantity > selectedFish.quantity) {
      setError('כמות לא תקינה')
      return
    }

    try {
      setLoading(true)
      await createTransferTask(currentFarm.farmId, {
        sourceAquariumId: selectedSourceAquarium.aquariumId,
        sourceAquariumNumber: selectedSourceAquarium.aquariumNumber,
        sourceRoom: selectedSourceAquarium.room,
        fishId: selectedFish.instanceId,
        fishName: selectedFish.commonName,
        scientificName: selectedFish.scientificName,
        size: selectedFish.size,
        quantity: quantity,
        targetAquariumId: isShipment ? 'SHIPMENT' : selectedDestAquarium.aquariumId,
        targetAquariumNumber: isShipment ? 'shipment' : selectedDestAquarium.aquariumNumber,
        targetRoom: isShipment ? '' : selectedDestAquarium.room,
        isShipment: isShipment,
        allowMixing: false,
        notes: taskNotes.trim(),
        createdBy: user?.email || 'unknown',
      })

      switchToListMode()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error creating transfer task:', err)
      setError('שגיאה ביצירת משימת ההעברה')
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteTask(taskId) {
    try {
      setLoading(true)
      await completeTask(currentFarm.farmId, taskId)
      await loadTasks()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error completing task:', err)
      setError(err.message || 'שגיאה בביצוע המשימה')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTask(taskId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) {
      return
    }

    try {
      setLoading(true)
      await deleteTask(currentFarm.farmId, taskId)
      await loadTasks()
    } catch (err) {
      console.error('Error deleting task:', err)
      setError('שגיאה במחיקת המשימה')
    } finally {
      setLoading(false)
    }
  }

  function openBlockDialog(taskId) {
    setBlockingTaskId(taskId)
    setShowBlockDialog(true)
  }

  async function handleBlockTask(blockData) {
    try {
      setLoading(true)
      await blockTask(currentFarm.farmId, blockingTaskId, blockData)
      setShowBlockDialog(false)
      setBlockingTaskId(null)
      await loadTasks()
    } catch (err) {
      console.error('Error blocking task:', err)
      setError('שגיאה בדיווח על תקלה')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnblockTask(taskId, action) {
    try {
      setLoading(true)
      await unblockTask(currentFarm.farmId, taskId, action)
      await loadTasks()
    } catch (err) {
      console.error('Error unblocking task:', err)
      setError('שגיאה בטיפול במשימה')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const rooms = [...new Set(aquariums.map((aq) => aq.room))]

  // Filter source aquariums (only those with fish)
  const availableSources = aquariums.filter((aq) => {
    if (aq.totalFish === 0) return false
    if (filterSourceRoom !== 'all' && aq.room !== filterSourceRoom) return false
    return true
  })

  // Filter destination aquariums
  const availableDestinations = aquariums.filter((aq) => {
    if (selectedSourceAquarium && aq.aquariumId === selectedSourceAquarium.aquariumId) return false
    if (filterDestRoom !== 'all' && aq.room !== filterDestRoom) return false
    return true
  })

  // Filter tasks for display
  const displayedTasks = tasks

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
          <div className="px-6 pt-6 pb-2 border-b border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="m-0 text-[22px] font-semibold text-gray-900">
                  משימות
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {viewMode === 'list' ? `${tasks.length} משימות` : 'הוספת משימה חדשה'}
                </p>
              </div>
              <button
                className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
                onClick={handleClose}
              >
                x
              </button>
            </div>

            {/* View Mode Tabs */}
            <div className="flex gap-1 border-b-2 border-gray-100">
              <button
                onClick={switchToListMode}
                className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 ${
                  viewMode === 'list'
                    ? 'border-ocean-500 text-ocean-600'
                    : 'border-transparent text-gray-600 hover:text-ocean-500'
                }`}
              >
                רשימה
              </button>
              <button
                onClick={switchToAddMode}
                className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 ${
                  viewMode === 'add'
                    ? 'border-ocean-500 text-ocean-600'
                    : 'border-transparent text-gray-600 hover:text-ocean-500'
                }`}
              >
                + משימה חדשה
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <>
                {/* Status Filter */}
                <div className="mb-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === 'pending'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ממתינות
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    בוצעו
                  </button>
                  <button
                    onClick={() => setStatusFilter('blocked')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === 'blocked'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    תקועות
                  </button>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === 'all'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    הכל
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : displayedTasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-3">
                      {statusFilter === 'completed' ? '✅' : statusFilter === 'blocked' ? '⚠️' : '📋'}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      אין משימות {statusFilter === 'pending' ? 'ממתינות' : statusFilter === 'completed' ? 'שבוצעו' : statusFilter === 'blocked' ? 'תקועות' : ''}
                    </div>
                    {statusFilter === 'pending' && (
                      <button
                        onClick={switchToAddMode}
                        className="mt-4 px-4 py-2 bg-ocean-500 text-white rounded-lg font-medium hover:bg-ocean-600 transition-colors"
                      >
                        + הוסף משימה חדשה
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedTasks.map((task) => (
                      <div
                        key={task.taskId}
                        className={`bg-white border-2 rounded-xl p-4 transition-all ${
                          task.status === 'completed'
                            ? 'border-green-200 bg-green-50/50'
                            : task.status === 'blocked'
                            ? 'border-red-200 bg-red-50/50'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {task.type === 'transfer' ? '🐟' : '📋'}
                            </span>
                            <h3 className="font-bold text-gray-900">{task.title}</h3>
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              task.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : task.status === 'blocked'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {task.status === 'completed'
                              ? 'בוצע'
                              : task.status === 'blocked'
                              ? 'תקוע'
                              : 'ממתין'}
                          </div>
                        </div>

                        {/* Transfer details */}
                        {task.type === 'transfer' && task.transfer && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">מ:</span> אקווריום {task.transfer.sourceAquariumNumber} ({task.transfer.sourceRoom})
                            <span className="mx-2">→</span>
                            <span className="font-medium">אל:</span>{' '}
                            {task.transfer.isShipment ? (
                              <span className="text-orange-600 font-semibold">📦 משלוח</span>
                            ) : (
                              <>אקווריום {task.transfer.targetAquariumNumber} ({task.transfer.targetRoom})</>
                            )}
                          </div>
                        )}

                        {/* Block reason */}
                        {task.status === 'blocked' && task.blockReason && (
                          <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-2">
                            <span className="font-medium">סיבה:</span>{' '}
                            {task.blockReason === 'temperature'
                              ? '🌡️ טמפרטורה'
                              : task.blockReason === 'size'
                              ? '📏 גודל'
                              : task.blockReason === 'leak'
                              ? '💧 נזילה'
                              : '❓ אחר'}
                            {task.blockNotes && <span> - {task.blockNotes}</span>}
                          </div>
                        )}

                        {/* Notes */}
                        {task.notes && (
                          <div className="text-sm text-gray-500 italic mb-2">
                            📝 {task.notes}
                          </div>
                        )}

                        {/* Created date */}
                        <div className="text-xs text-gray-400 mb-3">
                          נוצר: {task.createdAt ? new Date(task.createdAt).toLocaleString('he-IL') : 'לא ידוע'}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleCompleteTask(task.taskId)}
                                className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                disabled={loading}
                              >
                                ✓ בוצע
                              </button>
                              <button
                                onClick={() => openBlockDialog(task.taskId)}
                                className="px-3 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                                disabled={loading}
                              >
                                ⚠️ תקלה
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.taskId)}
                                className="px-3 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                disabled={loading}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                          {task.status === 'blocked' && (
                            <>
                              <button
                                onClick={() => handleUnblockTask(task.taskId, 'continue')}
                                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                                disabled={loading}
                              >
                                המשך
                              </button>
                              <button
                                onClick={() => handleUnblockTask(task.taskId, 'cancel')}
                                className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                disabled={loading}
                              >
                                בטל משימה
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ADD VIEW */}
            {viewMode === 'add' && (
              <>
                {/* Task Type Tabs */}
                <div className="mb-6 flex gap-2">
                  <button
                    onClick={() => {
                      setTaskType('general')
                      setStep(1)
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                      taskType === 'general'
                        ? 'border-ocean-500 bg-ocean-50 text-ocean-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    📋 משימה כללית
                  </button>
                  <button
                    onClick={() => {
                      setTaskType('transfer')
                      setStep(1)
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                      taskType === 'transfer'
                        ? 'border-ocean-500 bg-ocean-50 text-ocean-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    🐟 העברת דגים
                  </button>
                </div>

                {/* General Task Form */}
                {taskType === 'general' && (
                  <div>
                    <div className="mb-4">
                      <label className="block mb-2 font-semibold text-gray-900 text-sm">
                        כותרת המשימה <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        placeholder="מה צריך לעשות?"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block mb-2 font-semibold text-gray-900 text-sm">
                        הערות
                      </label>
                      <textarea
                        value={taskNotes}
                        onChange={(e) => setTaskNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="פרטים נוספים..."
                      />
                    </div>

                    <button
                      onClick={handleCreateGeneralTask}
                      disabled={loading || !taskTitle.trim()}
                      className="w-full px-4 py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg font-semibold hover:from-ocean-600 hover:to-ocean-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'יוצר...' : '+ צור משימה'}
                    </button>
                  </div>
                )}

                {/* Transfer Task Form */}
                {taskType === 'transfer' && (
                  <>
                    {/* Step 1: Select Source Aquarium */}
                    {step === 1 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          שלב 1: בחר אקווריום מקור
                        </h3>

                        {/* Room Filter */}
                        <div className="mb-4">
                          <label className="block mb-2 font-semibold text-gray-900 text-sm">
                            סנן לפי אזור:
                          </label>
                          <select
                            value={filterSourceRoom}
                            onChange={(e) => setFilterSourceRoom(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="all">כל האזורים</option>
                            {rooms.map((room) => (
                              <option key={room} value={room}>
                                {room}
                              </option>
                            ))}
                          </select>
                        </div>

                        {loading ? (
                          <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                          </div>
                        ) : availableSources.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <div className="text-5xl mb-3">🐠</div>
                            <div className="text-lg font-semibold text-gray-900 mb-1">
                              אין אקווריומים עם דגים
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                            {availableSources.map((aquarium) => {
                              const fishInAq = getFishForAquarium(aquarium.aquariumId)
                              return (
                                <button
                                  key={aquarium.aquariumId}
                                  className="bg-blue-50 rounded-lg px-4 py-3 text-right hover:bg-blue-100 transition-colors border border-blue-200"
                                  onClick={() => handleSourceSelect(aquarium)}
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-900">
                                      אקווריום {aquarium.aquariumNumber}
                                    </span>
                                    <span className="text-sm text-gray-600">{aquarium.room}</span>
                                  </div>
                                  <div className="text-sm text-blue-600 mb-2">
                                    🐠 {aquarium.totalFish} דגים
                                  </div>
                                  {fishInAq.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-blue-200">
                                      {fishInAq.map((fish, idx) => (
                                        <div key={idx} className="text-xs text-gray-700 py-0.5">
                                          • {fish.hebrewName} ({fish.quantity}) - {fish.size}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </button>
                              )
                            })}
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

                        <button
                          onClick={() => setStep(1)}
                          className="mb-4 text-sm text-ocean-600 hover:text-ocean-700"
                        >
                          ← חזור לבחירת מקור
                        </button>

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
                          <h3 className="text-sm font-semibold text-gray-600 mb-1">מעביר:</h3>
                          <div className="text-lg font-bold text-gray-900">{selectedFish.commonName}</div>
                          <div className="text-sm text-gray-600">{selectedFish.scientificName}</div>
                        </div>

                        <button
                          onClick={() => setStep(2)}
                          className="mb-4 text-sm text-ocean-600 hover:text-ocean-700"
                        >
                          ← חזור לבחירת דג
                        </button>

                        {/* Quantity */}
                        <div className="mb-4">
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
                          <p className="text-xs text-gray-500 mt-1">
                            מתוך {selectedFish.quantity} זמינים
                          </p>
                        </div>

                        {/* Shipment checkbox */}
                        <div className="mb-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isShipment}
                              onChange={(e) => {
                                setIsShipment(e.target.checked)
                                if (e.target.checked) {
                                  setSelectedDestAquarium(null)
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              📦 זוהי הכנה למשלוח (לא לאקווריום אחר)
                            </span>
                          </label>
                        </div>

                        {/* Destination aquarium selection */}
                        {!isShipment && (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              שלב 3: בחר אקווריום יעד
                            </h3>

                            {/* Room Filter */}
                            <div className="mb-4">
                              <label className="block mb-2 font-semibold text-gray-900 text-sm">
                                סנן לפי אזור:
                              </label>
                              <select
                                value={filterDestRoom}
                                onChange={(e) => setFilterDestRoom(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
                              >
                                <option value="all">כל האזורים</option>
                                {rooms.map((room) => (
                                  <option key={room} value={room}>
                                    {room}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto mb-4">
                              {availableDestinations.map((aquarium) => (
                                <button
                                  key={aquarium.aquariumId}
                                  className={`rounded-lg px-4 py-3 text-right transition-colors border ${
                                    selectedDestAquarium?.aquariumId === aquarium.aquariumId
                                      ? 'bg-green-100 border-green-400'
                                      : 'bg-white border-gray-200 hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleDestinationSelect(aquarium)}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-900">
                                      אקווריום {aquarium.aquariumNumber}
                                    </span>
                                    <span className="text-sm text-gray-600">{aquarium.room}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {aquarium.totalFish > 0 ? `🐠 ${aquarium.totalFish} דגים` : 'ריק'}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Notes */}
                        <div className="mb-4">
                          <label className="block mb-2 font-semibold text-gray-900 text-sm">
                            הערות
                          </label>
                          <textarea
                            value={taskNotes}
                            onChange={(e) => setTaskNotes(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                            placeholder="הערות להעברה..."
                          />
                        </div>

                        {/* Create button */}
                        <button
                          onClick={handleCreateTransferTask}
                          disabled={loading || (!isShipment && !selectedDestAquarium)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg font-semibold hover:from-ocean-600 hover:to-ocean-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'יוצר...' : '+ צור משימת העברה'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Block Report Dialog */}
      {showBlockDialog && (
        <BlockReportDialog
          isOpen={showBlockDialog}
          onCancel={() => {
            setShowBlockDialog(false)
            setBlockingTaskId(null)
          }}
          onConfirm={handleBlockTask}
        />
      )}
    </>
  )
}

export default TasksModal
