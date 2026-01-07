import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getAquariums } from '../../../services/aquarium.service'
import { updateReceptionItem } from '../../../services/reception.service'

const SHELF_LABELS = {
  bottom: 'תחתון',
  middle: 'אמצעי',
  top: 'עליון',
}

function AquariumAssignmentModal({
  isOpen,
  onClose,
  items = [],
  plan = null,
  onAssignmentsChanged = null,
}) {
  const { currentFarm } = useFarm()
  const [aquariums, setAquariums] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedItemId, setExpandedItemId] = useState(null)

  useEffect(() => {
    if (isOpen && currentFarm) {
      loadAquariums()
    }
  }, [isOpen, currentFarm])

  async function loadAquariums() {
    try {
      setLoading(true)
      const data = await getAquariums(currentFarm.farmId)
      // Filter aquariums by target room if specified
      if (plan?.targetRoom) {
        setAquariums(data.filter((aq) => aq.room === plan.targetRoom))
      } else {
        setAquariums(data)
      }
    } catch (err) {
      setError('שגיאה בטעינת אקווריומים: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignAquarium(itemId, aquariumId, aquariumNumber) {
    try {
      setError('')
      await updateReceptionItem(currentFarm.farmId, itemId, {
        targetAquariumId: aquariumId,
        targetAquariumNumber: aquariumNumber,
      })
      setExpandedItemId(null)
      if (onAssignmentsChanged) onAssignmentsChanged()
    } catch (err) {
      setError('שגיאה בהקצאת אקווריום: ' + err.message)
    }
  }

  async function handleRemoveAssignment(itemId) {
    try {
      setError('')
      await updateReceptionItem(currentFarm.farmId, itemId, {
        targetAquariumId: null,
        targetAquariumNumber: '',
      })
      setExpandedItemId(null)
      if (onAssignmentsChanged) onAssignmentsChanged()
    } catch (err) {
      setError('שגיאה בהסרת הקצאה: ' + err.message)
    }
  }

  if (!isOpen) return null

  const assignedItems = items.filter((item) => item.targetAquariumId)
  const unassignedItems = items.filter((item) => !item.targetAquariumId)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">הקצאת אקווריומים</h2>
          <button
            className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
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

          {/* Status Summary */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm text-yellow-800">
                <span className="font-semibold">ממתין הקצאה:</span> {unassignedItems.length}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                <span className="font-semibold">מוקצה:</span> {assignedItems.length}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Unassigned Items */}
              {unassignedItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    ממתין הקצאה ({unassignedItems.length})
                  </h3>
                  <div className="space-y-2">
                    {unassignedItems.map((item) => (
                      <div key={item.itemId} className="border-2 border-yellow-300 rounded-lg p-3 bg-yellow-50">
                        <div
                          onClick={() =>
                            setExpandedItemId(expandedItemId === item.itemId ? null : item.itemId)
                          }
                          className="cursor-pointer flex justify-between items-start mb-3"
                        >
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{item.hebrewName}</h4>
                            <p className="text-xs text-gray-600 italic">{item.scientificName}</p>
                            <div className="text-xs text-gray-700 mt-1 space-y-1">
                              <div>
                                <span className="font-semibold">{item.quantity} יח'</span> | גודל: {item.size}
                              </div>
                              {item.boxPortion && (
                                <div className="text-yellow-700 font-semibold">
                                  📦 חלק ארגז: {item.boxPortion}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-2xl">
                            {expandedItemId === item.itemId ? '▼' : '▶'}
                          </div>
                        </div>

                        {expandedItemId === item.itemId && (
                          <div className="bg-white rounded-lg p-3 border border-yellow-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2">
                              בחר אקווריום מהרשימה:
                            </div>
                            {aquariums.length === 0 ? (
                              <div className="text-xs text-red-600 py-2">
                                אין אקווריומים זמינים בחדר {plan?.targetRoom}
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {aquariums.map((aquarium) => {
                                  const shelfLabel = SHELF_LABELS[aquarium.shelf] || aquarium.shelf

                                  // Check if this aquarium is already assigned to another fish in this plan
                                  const assignedItem = assignedItems.find(
                                    (i) => i.targetAquariumId === aquarium.aquariumId
                                  )
                                  const isAssignedInPlan = !!assignedItem
                                  const isOccupied = aquarium.status === 'occupied'

                                  return (
                                    <button
                                      key={aquarium.aquariumId}
                                      onClick={() => {
                                        if (isAssignedInPlan) {
                                          const confirmMsg = `⚠️ אזהרה: אקווריום ${aquarium.aquariumNumber} כבר מיועד ל-${assignedItem.hebrewName}!\n\nהאם אתה בטוח שברצונך להקצות אותו גם ל-${item.hebrewName}?\n(שני דגים באותו אקווריום)`
                                          if (!confirm(confirmMsg)) {
                                            return
                                          }
                                        }
                                        handleAssignAquarium(
                                          item.itemId,
                                          aquarium.aquariumId,
                                          aquarium.aquariumNumber
                                        )
                                      }}
                                      className={`w-full p-2 rounded text-xs transition-all text-left ${
                                        isOccupied
                                          ? 'bg-red-100 text-red-700 opacity-60 cursor-not-allowed'
                                          : isAssignedInPlan
                                          ? 'bg-orange-100 text-orange-800 border-2 border-orange-400 hover:bg-orange-200'
                                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                                      }`}
                                      disabled={isOccupied}
                                    >
                                      <div className="font-semibold flex justify-between items-center">
                                        <span>#{aquarium.aquariumNumber}</span>
                                        {isOccupied && (
                                          <span className="text-xs">(תפוס)</span>
                                        )}
                                        {isAssignedInPlan && (
                                          <span className="text-xs bg-orange-200 px-1.5 py-0.5 rounded">
                                            ⚠️ מיועד
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs opacity-75 mt-1 flex gap-2">
                                        <span>📏 {aquarium.volume}L</span>
                                        <span>📍 {shelfLabel}</span>
                                      </div>
                                      {isAssignedInPlan && (
                                        <div className="text-xs mt-1 font-semibold">
                                          → {assignedItem.hebrewName}
                                        </div>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Items */}
              {assignedItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    מוקצה ({assignedItems.length})
                  </h3>
                  <div className="space-y-2">
                    {assignedItems.map((item) => (
                      <div key={item.itemId} className="bg-green-50 border border-green-300 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{item.hebrewName}</h4>
                            <p className="text-xs text-gray-600 italic">{item.scientificName}</p>
                            <div className="text-xs text-gray-700 mt-1 space-y-1">
                              <div>
                                <span className="font-semibold">{item.quantity} יח'</span> | גודל: {item.size}
                              </div>
                              {item.boxPortion && (
                                <div className="text-yellow-700 font-semibold">
                                  📦 חלק ארגז: {item.boxPortion}
                                </div>
                              )}
                            </div>
                            <div className="mt-2 p-2 bg-white rounded border border-green-200">
                              <div className="text-xs text-green-700">
                                ✅ אקווריום: <span className="font-bold">{item.targetAquariumNumber}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAssignment(item.itemId)}
                            className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            הסר
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {items.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">📦</div>
                  <div>אין פריטים להקצאה</div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AquariumAssignmentModal
