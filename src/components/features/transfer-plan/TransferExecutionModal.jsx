import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import {
  getTransferPlans,
  getTransferPlan,
  getTransferTasks,
  executeTransferTask,
  blockTransferTask,
  unblockTransferTask,
} from '../../../services/transfer-plan.service'
import BlockReportDialog from './BlockReportDialog'

function TransferExecutionModal({ isOpen, onClose, onSuccess }) {
  const { currentFarm, user } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [tasks, setTasks] = useState([])
  const [currentTask, setCurrentTask] = useState(null)

  // Block dialog state
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [taskToBlock, setTaskToBlock] = useState(null)

  // Load ready plans on mount
  useEffect(() => {
    if (currentFarm && isOpen) {
      loadReadyPlans()
    }
  }, [currentFarm, isOpen])

  // Load tasks when plan is selected
  useEffect(() => {
    if (selectedPlan) {
      loadTasks()
    }
  }, [selectedPlan])

  async function loadReadyPlans() {
    try {
      setLoading(true)
      const allPlans = await getTransferPlans(currentFarm.farmId)
      // Filter for ready and in-progress plans
      const activePlans = allPlans.filter(
        (plan) => plan.status === 'ready' || plan.status === 'in-progress'
      )
      setPlans(activePlans)
    } catch (err) {
      console.error('Error loading plans:', err)
      setError('שגיאה בטעינת תוכניות')
    } finally {
      setLoading(false)
    }
  }

  async function loadTasks() {
    if (!selectedPlan) return
    try {
      setLoading(true)
      const taskList = await getTransferTasks(currentFarm.farmId, selectedPlan.planId)
      setTasks(taskList)

      // Find current task (first pending)
      const pending = taskList.find((t) => t.status === 'pending')
      setCurrentTask(pending || null)

      setError('')
    } catch (err) {
      console.error('Error loading tasks:', err)
      setError('שגיאה בטעינת משימות - חסר אינדקס Firebase. אנא צור את האינדקס או חכה כמה דקות.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectPlan(plan) {
    setSelectedPlan(plan)
    setCurrentTask(null)
  }

  async function handleExecuteTask(taskId) {
    try {
      setLoading(true)
      await executeTransferTask(currentFarm.farmId, taskId)

      // Reload tasks and plan
      await loadTasks()
      await loadReadyPlans()

      if (onSuccess) {
        onSuccess()
      }

      setError('')
    } catch (err) {
      console.error('Error executing task:', err)
      setError(err.message || 'שגיאה בביצוע המשימה')
    } finally {
      setLoading(false)
    }
  }

  function handleReportIssue(task) {
    setTaskToBlock(task)
    setShowBlockDialog(true)
  }

  async function handleBlockConfirm(blockData) {
    if (!taskToBlock) return

    try {
      setLoading(true)
      await blockTransferTask(currentFarm.farmId, selectedPlan.planId, taskToBlock.taskId, blockData)

      // Reload tasks
      await loadTasks()
      await loadReadyPlans()

      setShowBlockDialog(false)
      setTaskToBlock(null)
      setError('')
    } catch (err) {
      console.error('Error blocking task:', err)
      setError('שגיאה בדיווח תקלה')
    } finally {
      setLoading(false)
    }
  }

  function handleBlockCancel() {
    setShowBlockDialog(false)
    setTaskToBlock(null)
  }

  async function handleUnblock(taskId, action) {
    try {
      setLoading(true)
      await unblockTransferTask(currentFarm.farmId, selectedPlan.planId, taskId, action)

      // Reload tasks
      await loadTasks()
      await loadReadyPlans()

      setError('')
    } catch (err) {
      console.error('Error unblocking task:', err)
      setError('שגיאה בשחרור חסימה')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setSelectedPlan(null)
    setTasks([])
    setCurrentTask(null)
    setError('')
    onClose()
  }

  function goBack() {
    setSelectedPlan(null)
    setTasks([])
    setCurrentTask(null)
    setError('')
  }

  if (!isOpen) return null

  // Calculate progress
  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const totalCount = tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Check if user is manager (can unblock)
  const isManager = user?.role === 'manager' || user?.role === 'admin'

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
              <h2 className="m-0 text-[22px] font-semibold text-gray-900">ביצוע העברות</h2>
              {selectedPlan && (
                <p className="text-sm text-gray-600 mt-1">{selectedPlan.planName}</p>
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

            {/* Select Plan */}
            {!selectedPlan && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">בחר תוכנית לביצוע</h3>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-3">📋</div>
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      אין תוכניות מוכנות לביצוע
                    </div>
                    <div className="text-sm text-gray-600">
                      צור תוכנית העברה חדשה כדי להתחיל
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.planId}
                        className="bg-white rounded-lg px-5 py-4 text-right hover:bg-blue-50 transition-colors border border-gray-300 hover:border-blue-400"
                        onClick={() => handleSelectPlan(plan)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-900 text-lg">{plan.planName}</div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              plan.status === 'ready'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {plan.status === 'ready' ? 'מוכן' : 'בביצוע'}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>✓ {plan.completedTaskCount || 0} בוצעו</span>
                          <span>📋 {plan.taskCount} סה"כ משימות</span>
                          {plan.blockedTaskCount > 0 && (
                            <span className="text-red-600">⚠️ {plan.blockedTaskCount} חסומות</span>
                          )}
                        </div>
                        {plan.createdAt && (
                          <div className="text-xs text-gray-500 mt-2">
                            נוצר: {new Date(plan.createdAt).toLocaleDateString('he-IL')}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Execute Tasks */}
            {selectedPlan && (
              <div>
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">התקדמות</span>
                    <span className="text-sm text-gray-600">
                      {completedCount} / {totalCount} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Tasks List */}
                <h3 className="text-lg font-semibold text-gray-900 mb-4">רשימת משימות</h3>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task, index) => {
                      const isCompleted = task.status === 'completed'
                      const isBlocked = task.status === 'blocked'
                      const isCancelled = task.status === 'cancelled'
                      const isPending = task.status === 'pending'
                      const isCurrent = currentTask?.taskId === task.taskId

                      return (
                        <div
                          key={task.taskId}
                          className={`rounded-lg p-4 border-2 ${
                            isCompleted
                              ? 'bg-green-50 border-green-300'
                              : isBlocked
                              ? 'bg-red-50 border-red-300'
                              : isCancelled
                              ? 'bg-gray-100 border-gray-300'
                              : isCurrent
                              ? 'bg-blue-50 border-blue-400'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-start gap-3">
                              <span
                                className={`font-bold text-lg ${
                                  isCompleted
                                    ? 'text-green-700'
                                    : isBlocked
                                    ? 'text-red-700'
                                    : isCancelled
                                    ? 'text-gray-500'
                                    : 'text-gray-900'
                                }`}
                              >
                                #{index + 1}
                              </span>
                              <div>
                                <div className="font-bold text-gray-900">{task.fishName}</div>
                                <div className="text-sm text-gray-600">{task.scientificName}</div>
                                <div className="text-sm text-gray-700 mt-1">
                                  כמות: {task.quantity} | גודל: {task.size}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                isCompleted
                                  ? 'bg-green-200 text-green-800'
                                  : isBlocked
                                  ? 'bg-red-200 text-red-800'
                                  : isCancelled
                                  ? 'bg-gray-300 text-gray-700'
                                  : 'bg-blue-200 text-blue-800'
                              }`}
                            >
                              {isCompleted && '✓ בוצע'}
                              {isBlocked && '⚠️ חסום'}
                              {isCancelled && '✕ בוטל'}
                              {isPending && 'ממתין'}
                            </span>
                          </div>

                          {/* Transfer details */}
                          <div className="flex items-center gap-2 text-sm text-gray-700 my-3">
                            <span className="font-semibold">
                              אקווריום {task.sourceAquariumNumber}
                            </span>
                            <span className="text-gray-500">({task.sourceRoom})</span>
                            <span className="text-blue-500">→</span>
                            {task.isShipment ? (
                              <span className="font-semibold text-orange-600 flex items-center gap-1">
                                📦 משלוח
                              </span>
                            ) : (
                              <>
                                <span className="font-semibold">
                                  אקווריום {task.targetAquariumNumber}
                                </span>
                                <span className="text-gray-500">({task.targetRoom})</span>
                              </>
                            )}
                          </div>

                          {/* Block reason */}
                          {isBlocked && (
                            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-sm">
                              <div className="font-semibold text-red-900 mb-1">
                                סיבת חסימה: {task.blockReason}
                              </div>
                              {task.blockNotes && (
                                <div className="text-red-700">{task.blockNotes}</div>
                              )}
                            </div>
                          )}

                          {/* Notes */}
                          {task.notes && (
                            <div className="mt-3 p-3 bg-purple-50 border border-purple-300 rounded text-sm">
                              <div className="font-semibold text-purple-900 mb-1 flex items-center gap-1">
                                📝 הערות
                              </div>
                              <div className="text-purple-700">{task.notes}</div>
                            </div>
                          )}

                          {/* Actions */}
                          {isPending && isCurrent && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleExecuteTask(task.taskId)}
                                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                                disabled={loading}
                              >
                                ✓ בוצע
                              </button>
                              <button
                                onClick={() => handleReportIssue(task)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                                disabled={loading}
                              >
                                ⚠️ תקוע
                              </button>
                            </div>
                          )}

                          {/* Manager actions for blocked tasks */}
                          {isBlocked && isManager && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleUnblock(task.taskId, 'continue')}
                                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-colors disabled:opacity-50"
                                disabled={loading}
                              >
                                המשך בכל זאת
                              </button>
                              <button
                                onClick={() => handleUnblock(task.taskId, 'cancel')}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
                                disabled={loading}
                              >
                                בטל משימה
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-between flex-shrink-0 bg-white rounded-b-2xl">
            <div>
              {selectedPlan && (
                <button
                  type="button"
                  onClick={goBack}
                  className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-gray-100 text-gray-900 hover:bg-gray-200"
                  disabled={loading}
                >
                  ← חזור לרשימה
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-gray-100 text-gray-900 hover:bg-gray-200"
              disabled={loading}
            >
              סגור
            </button>
          </div>
        </div>
      </div>

      {/* Block Report Dialog */}
      <BlockReportDialog
        isOpen={showBlockDialog}
        onConfirm={handleBlockConfirm}
        onCancel={handleBlockCancel}
      />
    </>
  )
}

export default TransferExecutionModal
