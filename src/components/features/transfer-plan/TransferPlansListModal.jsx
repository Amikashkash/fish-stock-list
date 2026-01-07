import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getTransferPlans, deleteTransferPlan } from '../../../services/transfer-plan.service'
import TransferPlanModal from './TransferPlanModal'

function TransferPlansListModal({ isOpen, onClose }) {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (currentFarm && isOpen) {
      loadPlans()
    }
  }, [currentFarm, isOpen])

  async function loadPlans() {
    try {
      setLoading(true)
      const allPlans = await getTransferPlans(currentFarm.farmId)
      // Show all plans that are not completed or cancelled
      const editablePlans = allPlans.filter(
        (plan) => plan.status !== 'completed' && plan.status !== 'cancelled'
      )
      setPlans(editablePlans)
      setError('')
    } catch (err) {
      console.error('Error loading plans:', err)
      setError('שגיאה בטעינת תוכניות')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePlan(planId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התוכנית? כל המשימות יימחקו.')) {
      return
    }

    try {
      setLoading(true)
      await deleteTransferPlan(currentFarm.farmId, planId)
      await loadPlans()
      setError('')
    } catch (err) {
      console.error('Error deleting plan:', err)
      setError('שגיאה במחיקת התוכנית')
    } finally {
      setLoading(false)
    }
  }

  function handleEditPlan(plan) {
    setSelectedPlan(plan)
    setShowEditModal(true)
  }

  function handleEditClose() {
    setShowEditModal(false)
    setSelectedPlan(null)
    loadPlans() // Reload plans after editing
  }

  function handleClose() {
    setPlans([])
    setError('')
    onClose()
  }

  if (!isOpen) return null

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'planning':
        return 'בתכנון'
      case 'ready':
        return 'מוכן לביצוע'
      case 'in-progress':
        return 'בביצוע'
      case 'completed':
        return 'הושלם'
      case 'cancelled':
        return 'בוטל'
      default:
        return status
    }
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
                תוכניות העברות קיימות
              </h2>
              {plans.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">{plans.length} תוכניות</p>
              )}
            </div>
            <button
              className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
              onClick={handleClose}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-3">📝</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  אין תוכניות העברות
                </div>
                <p className="text-sm">צור תוכנית חדשה כדי להתחיל</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.planId}
                    className="bg-white border-2 border-aqua-200 rounded-xl p-4 hover:shadow-card transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {plan.planName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>📅 {new Date(plan.createdAt).toLocaleDateString('he-IL')}</span>
                          <span>•</span>
                          <span>👤 {plan.createdBy}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(plan.status)}`}>
                        {getStatusText(plan.status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">משימות:</span>
                        <span className="text-gray-900">{plan.taskCount || 0}</span>
                      </div>
                      {plan.completedTaskCount > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-green-700">הושלמו:</span>
                          <span className="text-green-900">{plan.completedTaskCount}</span>
                        </div>
                      )}
                      {plan.blockedTaskCount > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-red-700">חסומות:</span>
                          <span className="text-red-900">{plan.blockedTaskCount}</span>
                        </div>
                      )}
                    </div>

                    {plan.notes && (
                      <div className="text-sm text-gray-600 mb-4 italic">
                        {plan.notes}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:from-ocean-600 hover:to-ocean-700 hover:shadow-md"
                        disabled={loading}
                      >
                        ✏️ ערוך תוכנית
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.planId)}
                        className="px-4 py-2 bg-white text-red-600 border-2 border-red-300 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-red-50 hover:border-red-400"
                        disabled={loading}
                      >
                        🗑️ מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
            <button
              className="px-5 py-2.5 bg-gray-200 text-gray-800 border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors hover:bg-gray-300"
              onClick={handleClose}
            >
              סגור
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedPlan && (
        <TransferPlanModal
          isOpen={showEditModal}
          onClose={handleEditClose}
          existingPlan={selectedPlan}
          onSuccess={() => {
            handleEditClose()
          }}
        />
      )}
    </>
  )
}

export default TransferPlansListModal
