import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import {
  getReceptionPlan,
  getReceptionItems,
  receiveItem,
} from '../../../services/reception.service'
import { formatDateDDMMYYYY } from '../../../utils/dateFormatter'

function ReceiveFishModal({ isOpen, onClose, planId, onSuccess }) {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState(null)
  const [items, setItems] = useState([])
  const [receivingItemId, setReceivingItemId] = useState(null)

  useEffect(() => {
    if (currentFarm && isOpen && planId) {
      loadPlanData()
    }
  }, [currentFarm, isOpen, planId])

  async function loadPlanData() {
    try {
      setLoading(true)
      const [planData, itemsData] = await Promise.all([
        getReceptionPlan(currentFarm.farmId, planId),
        getReceptionItems(currentFarm.farmId, planId),
      ])
      setPlan(planData)
      setItems(itemsData)
    } catch (err) {
      console.error('Error loading plan data:', err)
      setError('שגיאה בטעינת נתוני התוכנית')
    } finally {
      setLoading(false)
    }
  }

  async function handleReceiveItem(itemId) {
    setReceivingItemId(itemId)
    setError('')

    try {
      await receiveItem(currentFarm.farmId, itemId)

      // Update local state
      setItems(
        items.map((item) =>
          item.itemId === itemId
            ? { ...item, status: 'received', receivedAt: new Date() }
            : item
        )
      )

      // Reload plan to update counts
      const updatedPlan = await getReceptionPlan(currentFarm.farmId, planId)
      setPlan(updatedPlan)
    } catch (err) {
      console.error('Error receiving item:', err)
      setError(err.message || 'שגיאה בקבלת הפריט')
    } finally {
      setReceivingItemId(null)
    }
  }

  function handleClose() {
    if (onSuccess && plan?.status === 'completed') {
      onSuccess(plan)
    }
    setPlan(null)
    setItems([])
    setError('')
    onClose()
  }

  if (!isOpen) return null

  const pendingItems = items.filter((item) => item.status === 'planned')
  const receivedItems = items.filter((item) => item.status === 'received')
  const progressPercent = items.length > 0 ? (receivedItems.length / items.length) * 100 : 0

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-[900px] w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="m-0 text-[22px] font-semibold text-gray-900">קבלת דגים</h2>
            <button
              className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
              onClick={handleClose}
            >
              ×
            </button>
          </div>

          {plan && (
            <div>
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">תאריך צפוי:</span> {formatDateDDMMYYYY(plan.expectedDate)}
                {plan.countryOfOrigin && <span> | 🌍 {plan.countryOfOrigin}</span>}
                {plan.supplierName && <span> | 🏢 {plan.supplierName}</span>}
                {plan.targetRoom && <span> | 📍 {plan.targetRoom}</span>}
                {plan.shipmentReference && <span> | משלוח: {plan.shipmentReference}</span>}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>התקדמות</span>
                  <span>
                    {receivedItems.length} / {items.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Pending Items */}
              {pendingItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    ממתין לקבלה ({pendingItems.length})
                  </h3>
                  <div className="flex flex-col gap-3">
                    {pendingItems.map((item) => (
                      <div
                        key={item.itemId}
                        className="bg-white border-2 border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <div className="flex-shrink-0 pt-1">
                            <button
                              onClick={() => handleReceiveItem(item.itemId)}
                              disabled={receivingItemId === item.itemId}
                              className="w-7 h-7 border-2 border-gray-400 rounded-md hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {receivingItemId === item.itemId && (
                                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </button>
                          </div>

                          {/* Item Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-lg font-bold text-gray-900 m-0">
                                  {item.hebrewName}
                                  {item.boxNumber && (
                                    <span className="text-sm font-normal text-gray-500 mr-2">
                                      (ארגז {item.boxNumber})
                                    </span>
                                  )}
                                </h4>
                                {item.scientificName && (
                                  <p className="text-sm text-gray-600 italic m-0">
                                    {item.scientificName}
                                  </p>
                                )}
                              </div>
                              <div className="text-left">
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  {item.quantity} יח'
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-semibold">גודל:</span> {item.size}
                              </div>
                              {item.code && (
                                <div>
                                  <span className="font-semibold">קוד:</span> {item.code}
                                </div>
                              )}
                            </div>

                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="text-gray-600">→</span>
                              <span className="font-semibold text-green-700">
                                {item.targetAquariumNumber}
                              </span>
                              <span className="text-gray-500">({item.targetRoom})</span>
                            </div>

                            {item.notes && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-gray-700">
                                💡 {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Received Items */}
              {receivedItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    התקבלו ({receivedItems.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {receivedItems.map((item) => (
                      <div
                        key={item.itemId}
                        className="bg-green-50 border border-green-300 rounded-lg p-3 opacity-75"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                            ✓
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {item.hebrewName}
                              {item.boxNumber && ` (ארגז ${item.boxNumber})`}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.quantity} יח' | גודל: {item.size} → {item.targetAquariumNumber} (
                              {item.targetRoom})
                            </div>
                          </div>
                          {item.receivedAt && (
                            <div className="text-xs text-gray-500">
                              {new Date(item.receivedAt).toLocaleTimeString('he-IL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {items.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-3">📦</div>
                  <div className="text-lg">אין פריטים בתוכנית זו</div>
                </div>
              )}

              {/* Completion Message */}
              {items.length > 0 && pendingItems.length === 0 && (
                <div className="bg-green-100 border-2 border-green-400 rounded-xl p-6 text-center">
                  <div className="text-5xl mb-3">🎉</div>
                  <div className="text-xl font-bold text-green-800 mb-1">
                    כל הדגים התקבלו בהצלחה!
                  </div>
                  <div className="text-sm text-green-700">
                    התוכנית הושלמה - כל הדגים הוכנסו לאקווריומים
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-gray-100 text-gray-900 hover:bg-gray-200"
            >
              {pendingItems.length === 0 ? 'סגור' : 'סגור (תוכל לחזור מאוחר יותר)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiveFishModal
