import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getReceptionPlans, deleteReceptionPlan } from '../../../services/reception.service'
import ReceptionPlanningModal from './ReceptionPlanningModal'
import ReceiveFishModal from './ReceiveFishModal'

function ReceptionPlansModal({ isOpen, onClose }) {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plans, setPlans] = useState([])
  const [showPlanningModal, setShowPlanningModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (currentFarm && isOpen) {
      loadPlans()
    }
  }, [currentFarm, isOpen])

  async function loadPlans() {
    try {
      setLoading(true)
      const data = await getReceptionPlans(currentFarm.farmId)
      setPlans(data)
    } catch (err) {
      console.error('Error loading reception plans:', err)
      setError('שגיאה בטעינת תוכניות קליטה')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePlan(planId) {
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את התוכנית?')
    if (!confirmed) return

    try {
      await deleteReceptionPlan(currentFarm.farmId, planId)
      setPlans(plans.filter((p) => p.planId !== planId))
    } catch (err) {
      console.error('Error deleting plan:', err)
      alert('שגיאה במחיקת התוכנית')
    }
  }

  function handleOpenReceive(planId) {
    setSelectedPlanId(planId)
    setShowReceiveModal(true)
  }

  function handlePlanningSuccess(plan) {
    loadPlans() // Reload to show new plan
    setShowPlanningModal(false)
  }

  function handleReceiveSuccess(plan) {
    loadPlans() // Reload to update plan status
  }

  function handleClose() {
    setPlans([])
    setError('')
    setStatusFilter('all')
    onClose()
  }

  if (!isOpen) return null

  const filteredPlans = plans.filter((plan) => {
    if (statusFilter === 'all') return true
    return plan.status === statusFilter
  })

  const getStatusBadge = (status) => {
    const badges = {
      planning: { text: 'תכנון', color: 'bg-gray-100 text-gray-700' },
      ready: { text: 'מוכן', color: 'bg-blue-100 text-blue-700' },
      'in-progress': { text: 'בתהליך', color: 'bg-yellow-100 text-yellow-700' },
      completed: { text: 'הושלם', color: 'bg-green-100 text-green-700' },
      cancelled: { text: 'בוטל', color: 'bg-red-100 text-red-700' },
    }
    const badge = badges[status] || badges.planning
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5 overflow-y-auto"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-[900px] w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="m-0 text-[22px] font-semibold text-gray-900">תוכניות איכלוס</h2>
            <button
              className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
              onClick={handleClose}
            >
              ×
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            {/* Filter and New Button */}
            <div className="flex justify-between items-center mb-5 gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="planning">תכנון</option>
                <option value="ready">מוכן</option>
                <option value="in-progress">בתהליך</option>
                <option value="completed">הושלם</option>
                <option value="cancelled">בוטל</option>
              </select>

              <button
                onClick={() => setShowPlanningModal(true)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600"
              >
                ➕ תוכנית חדשה
              </button>
            </div>

            {/* Plans List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-3">📋</div>
                <div className="text-lg">
                  {statusFilter === 'all'
                    ? 'אין תוכניות קליטה עדיין'
                    : 'אין תוכניות בסטטוס זה'}
                </div>
                <button
                  onClick={() => setShowPlanningModal(true)}
                  className="mt-4 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600"
                >
                  צור תוכנית ראשונה
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredPlans.map((plan) => (
                  <div
                    key={plan.planId}
                    className="bg-white border border-gray-300 rounded-xl p-5 hover:border-blue-400 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 m-0">
                            {new Date(plan.expectedDate).toLocaleDateString('he-IL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h3>
                          {getStatusBadge(plan.status)}
                        </div>
                        {plan.shipmentReference && (
                          <div className="text-sm text-gray-600">משלוח: {plan.shipmentReference}</div>
                        )}
                        {plan.notes && (
                          <div className="text-sm text-gray-600 mt-1">{plan.notes}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-semibold">פריטים:</span> {plan.itemCount || 0}
                      </div>
                      <div>
                        <span className="font-semibold">התקבלו:</span> {plan.receivedCount || 0}
                      </div>
                      {plan.itemCount > 0 && (
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-green-500 h-full transition-all duration-300"
                              style={{
                                width: `${((plan.receivedCount || 0) / plan.itemCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {plan.status !== 'completed' && plan.status !== 'cancelled' && (
                        <button
                          onClick={() => handleOpenReceive(plan.planId)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-green-500 text-white hover:bg-green-600"
                        >
                          📦 קבל דגים
                        </button>
                      )}

                      {plan.status === 'completed' && (
                        <button
                          onClick={() => handleOpenReceive(plan.planId)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600"
                        >
                          👁️ צפה
                        </button>
                      )}

                      {plan.status === 'planning' && (
                        <button
                          onClick={() => handleDeletePlan(plan.planId)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          🗑️ מחק
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Planning Modal */}
      <ReceptionPlanningModal
        isOpen={showPlanningModal}
        onClose={() => setShowPlanningModal(false)}
        onSuccess={handlePlanningSuccess}
      />

      {/* Receive Modal */}
      <ReceiveFishModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        planId={selectedPlanId}
        onSuccess={handleReceiveSuccess}
      />
    </>
  )
}

export default ReceptionPlansModal
