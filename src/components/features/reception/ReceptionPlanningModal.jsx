import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import {
  createReceptionPlan,
  getReceptionItems,
  getPreviousCountries,
  getPreviousSuppliers,
  updatePlanStatus,
  lockReceptionPlan,
} from '../../../services/reception.service'
import { getAquariums } from '../../../services/aquarium.service'
import { validatePlanComplete } from '../../../models/ReceptionPlan'
import { formatDateDDMMYYYY } from '../../../utils/dateFormatter'

// New components
import WorkRequirementsReport from './WorkRequirementsReport'
import ExcelTemplateDisplay from './ExcelTemplateDisplay'
import FishListManagementModal from './FishListManagementModal'
import AquariumAssignmentModal from './AquariumAssignmentModal'

function ReceptionPlanningModal({ isOpen, onClose, onSuccess }) {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: create plan, 2: add fish, 3: work requirements, 4: assign aquariums, 5: review & lock

  // Plan data
  const [currentPlan, setCurrentPlan] = useState(null)
  const [planItems, setPlanItems] = useState([])

  // Plan form
  const [expectedDate, setExpectedDate] = useState('')
  const [countryOfOrigin, setCountryOfOrigin] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [targetRoom, setTargetRoom] = useState('')
  const [shipmentReference, setShipmentReference] = useState('')
  const [expectedAquariumCount, setExpectedAquariumCount] = useState('')
  const [planNotes, setPlanNotes] = useState('')

  // Lists for dropdowns
  const [previousCountries, setPreviousCountries] = useState([])
  const [previousSuppliers, setPreviousSuppliers] = useState([])
  const [rooms, setRooms] = useState([])

  // Modals
  const [showFishListModal, setShowFishListModal] = useState(false)
  const [showExcelTemplate, setShowExcelTemplate] = useState(false)
  const [showAquariumAssignment, setShowAquariumAssignment] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (currentFarm && isOpen) {
      loadPreviousData()
      loadRooms()
    }
  }, [currentFarm, isOpen])

  // Load fish items when plan is created
  useEffect(() => {
    if (currentPlan && currentPlan.planId) {
      loadPlanItems()
    }
  }, [currentPlan, step])

  async function loadPreviousData() {
    try {
      const [countries, suppliers] = await Promise.all([
        getPreviousCountries(currentFarm.farmId),
        getPreviousSuppliers(currentFarm.farmId),
      ])
      setPreviousCountries(countries)
      setPreviousSuppliers(suppliers)
    } catch (err) {
      console.error('Error loading previous data:', err)
    }
  }

  async function loadRooms() {
    try {
      const aquariums = await getAquariums(currentFarm.farmId)
      const uniqueRooms = [...new Set(aquariums.map((aq) => aq.location || aq.room))].filter(Boolean).sort()
      setRooms(uniqueRooms)
    } catch (err) {
      console.error('Error loading rooms:', err)
    }
  }

  async function loadPlanItems() {
    try {
      const items = await getReceptionItems(currentFarm.farmId, currentPlan.planId)
      setPlanItems(items)
    } catch (err) {
      console.error('Error loading plan items:', err)
    }
  }

  async function handleCreatePlan() {
    if (!expectedDate) {
      setError('נא להזין תאריך צפוי')
      return
    }

    if (!countryOfOrigin.trim()) {
      setError('נא לבחור/להזין ארץ מוצא')
      return
    }

    if (!supplierName.trim()) {
      setError('נא לבחור/להזין שם ספק או חוות מקור')
      return
    }

    if (!targetRoom.trim()) {
      setError('נא לבחור חדר/אזור יעד')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createReceptionPlan(currentFarm.farmId, {
        expectedDate,
        source: 'manual',
        countryOfOrigin: countryOfOrigin.trim(),
        supplierName: supplierName.trim(),
        targetRoom: targetRoom.trim(),
        shipmentReference: shipmentReference.trim() || undefined,
        notes: planNotes,
        expectedAquariumCount: expectedAquariumCount ? parseInt(expectedAquariumCount) : 0,
      })

      setCurrentPlan(result.plan)
      await updatePlanStatus(currentFarm.farmId, result.plan.planId, 'proforma_received')
      setStep(2)
    } catch (err) {
      console.error('Error creating reception plan:', err)
      setError(err.message || 'שגיאה ביצירת תוכנית קליטה')
    } finally {
      setLoading(false)
    }
  }

  async function handleFinalizePlan() {
    try {
      setError('')
      const validation = validatePlanComplete(planItems)
      if (!validation.valid) {
        setError(validation.errors.join(', '))
        return
      }

      setLoading(true)
      await updatePlanStatus(currentFarm.farmId, currentPlan.planId, 'finalized')
      setStep(5)
    } catch (err) {
      setError('שגיאה בסיום תכנון: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLockPlan() {
    try {
      setError('')
      setLoading(true)
      await lockReceptionPlan(currentFarm.farmId, currentPlan.planId)
      if (onSuccess) {
        onSuccess({ ...currentPlan, isLocked: true })
      }
      handleClose()
    } catch (err) {
      setError(err.message || 'שגיאה בנעילת התוכנית')
    } finally {
      setLoading(false)
    }
  }

  function handleFishListChanged() {
    loadPlanItems()
  }

  function handleClose() {
    setStep(1)
    setCurrentPlan(null)
    setPlanItems([])
    setExpectedDate('')
    setCountryOfOrigin('')
    setSupplierName('')
    setTargetRoom('')
    setShipmentReference('')
    setExpectedAquariumCount('')
    setPlanNotes('')
    setShowFishListModal(false)
    setShowExcelTemplate(false)
    setShowAquariumAssignment(false)
    setError('')
    onClose()
  }

  function goBack() {
    if (step > 1) {
      setError('')
      setStep(step - 1)
    }
  }

  if (!isOpen) return null

  const completionStatus = {
    hasFish: planItems.length > 0,
    allAssigned: planItems.every((item) => item.targetAquariumId),
    totalItems: planItems.length,
    assignedItems: planItems.filter((item) => item.targetAquariumId).length,
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5 overflow-y-auto"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="m-0 text-[22px] font-semibold text-gray-900">תוכנית קליטה חדשה</h2>
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

            {/* Step Indicator */}
            {currentPlan && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700">שלב בתהליך:</span>
                  <span className="text-sm text-gray-600">
                    {step}/5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(step / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-xs">
                      <span className="font-semibold">דגים:</span> {completionStatus.totalItems}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold">מוקצים:</span> {completionStatus.assignedItems}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Create Plan */}
            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">צור תוכנית קליטה</h3>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-2 font-semibold text-gray-900 text-sm">
                        תאריך צפוי <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold text-gray-900 text-sm">
                        מספר אקווריומים צפויים
                      </label>
                      <input
                        type="number"
                        value={expectedAquariumCount}
                        onChange={(e) => setExpectedAquariumCount(e.target.value)}
                        min="0"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-900 text-sm">
                      ארץ מוצא <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      list="countries-list"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      placeholder="בחר או הקלד ארץ..."
                    />
                    <datalist id="countries-list">
                      {previousCountries.map((country) => (
                        <option key={country} value={country} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-900 text-sm">
                      ספק / חוות מקור <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      list="suppliers-list"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      placeholder="בחר או הקלד שם ספק..."
                    />
                    <datalist id="suppliers-list">
                      {previousSuppliers.map((supplier) => (
                        <option key={supplier} value={supplier} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-900 text-sm">
                      חדר / אזור יעד <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={targetRoom}
                      onChange={(e) => setTargetRoom(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">בחר חדר...</option>
                      {rooms.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-900 text-sm">
                      מספר משלוח / אסמכתא
                      <span className="text-gray-500 text-xs mr-1">(אופציונלי)</span>
                    </label>
                    <input
                      type="text"
                      value={shipmentReference}
                      onChange={(e) => setShipmentReference(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      placeholder="לדוגמה: משלוח-2025-001"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-900 text-sm">
                      הערות
                    </label>
                    <textarea
                      value={planNotes}
                      onChange={(e) => setPlanNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      placeholder="הערות לגבי התוכנית..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Add Fish */}
            {step === 2 && currentPlan && (
              <div>
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">תוכנית:</h4>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatDateDDMMYYYY(currentPlan.expectedDate)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-semibold">{currentPlan.countryOfOrigin}</span> |{' '}
                        {currentPlan.supplierName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">משלוח</div>
                      <div className="text-sm font-mono font-bold text-gray-900">
                        {currentPlan.shipmentReference}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">הוסף רשימת דגים</h3>

                  <button
                    onClick={() => setShowExcelTemplate(true)}
                    className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="font-semibold text-blue-900 mb-1">📋 צפה בטבלת Excel</div>
                    <div className="text-xs text-blue-700">
                      ראה את הפורמט הצפוי לייבוא מאקסל
                    </div>
                  </button>

                  <button
                    onClick={() => setShowFishListModal(true)}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                  >
                    ➕ הוסף דגים ({completionStatus.totalItems})
                  </button>

                  {completionStatus.totalItems > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      ✅ {completionStatus.totalItems} דגים בתוכנית
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Work Requirements */}
            {step === 3 && currentPlan && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">בחן דרישות עבודה</h3>
                <WorkRequirementsReport items={planItems} plan={currentPlan} />
              </div>
            )}

            {/* Step 4: Assign Aquariums */}
            {step === 4 && currentPlan && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">הקצה אקווריומים</h3>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
                  הצמד כל דג לאקווריום ספציפי. אם אין מספיק אקווריומים פנויים, חזור למסך הטרנספר.
                </div>
                <button
                  onClick={() => setShowAquariumAssignment(true)}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                >
                  🎯 הצמד אקווריומים
                </button>
                {completionStatus.allAssigned && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    ✅ כל הדגים מוקצים לאקווריומים
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review & Lock */}
            {step === 5 && currentPlan && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">בדיקה סופית ונעילה</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="font-semibold text-gray-900 mb-3">סיכום התוכנית:</div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>תאריך צפוי:</span>
                        <span className="font-semibold">
                          {formatDateDDMMYYYY(currentPlan.expectedDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>מקור:</span>
                        <span className="font-semibold">{currentPlan.countryOfOrigin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ספק:</span>
                        <span className="font-semibold">{currentPlan.supplierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>חדר יעד:</span>
                        <span className="font-semibold">{currentPlan.targetRoom}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
                        <span>סה"כ דגים:</span>
                        <span className="font-semibold text-lg">{completionStatus.totalItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>מוקצים:</span>
                        <span className="font-semibold text-green-700">{completionStatus.assignedItems}</span>
                      </div>
                    </div>
                  </div>

                  {completionStatus.allAssigned ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                      ✅ התוכנית מוכנה לנעילה - כל הדגים יש אקווריום
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      ⚠️ {completionStatus.totalItems - completionStatus.assignedItems} דגים ללא הקצאת אקווריום
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-between mt-6 pt-5 border-t border-gray-200">
              <div>
                {step > 1 && (
                  <button
                    onClick={goBack}
                    className="px-6 py-3 rounded-lg text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200"
                    disabled={loading}
                  >
                    ← חזור
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 rounded-lg text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200"
                  disabled={loading}
                >
                  ביטול
                </button>

                {step === 1 && (
                  <button
                    onClick={handleCreatePlan}
                    className="px-6 py-3 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                    disabled={loading || !expectedDate}
                  >
                    {loading ? 'יוצר...' : 'המשך'}
                  </button>
                )}

                {step === 2 && completionStatus.hasFish && (
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600"
                  >
                    המשך ➜
                  </button>
                )}

                {step === 3 && (
                  <button
                    onClick={() => setStep(4)}
                    className="px-6 py-3 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600"
                  >
                    המשך ➜
                  </button>
                )}

                {step === 4 && completionStatus.allAssigned && (
                  <button
                    onClick={handleFinalizePlan}
                    className="px-6 py-3 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'מסיים...' : 'המשך ➜'}
                  </button>
                )}

                {step === 5 && completionStatus.allAssigned && (
                  <button
                    onClick={handleLockPlan}
                    className="px-6 py-3 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'נועל...' : '🔒 נעל תוכנית'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {showFishListModal && (
        <FishListManagementModal
          isOpen={showFishListModal}
          onClose={() => setShowFishListModal(false)}
          planId={currentPlan?.planId}
          items={planItems}
          plan={currentPlan}
          onItemsChanged={handleFishListChanged}
        />
      )}

      {showAquariumAssignment && (
        <AquariumAssignmentModal
          isOpen={showAquariumAssignment}
          onClose={() => setShowAquariumAssignment(false)}
          items={planItems}
          plan={currentPlan}
          onAssignmentsChanged={handleFishListChanged}
        />
      )}

      {showExcelTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1002] p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ExcelTemplateDisplay onClose={() => setShowExcelTemplate(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ReceptionPlanningModal
