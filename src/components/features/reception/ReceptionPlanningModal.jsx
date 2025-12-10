import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getAquariums } from '../../../services/aquarium.service'
import {
  createReceptionPlan,
  addReceptionItem,
  getReceptionItems,
  getPreviousCountries,
  getPreviousSuppliers,
} from '../../../services/reception.service'
import { generateShipmentReference } from '../../../models/ReceptionPlan'
import { formatDateDDMMYYYY } from '../../../utils/dateFormatter'

function ReceptionPlanningModal({ isOpen, onClose, onSuccess }) {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: choose method, 2: create plan, 3: add items, 4: review

  // Plan data
  const [planMethod, setPlanMethod] = useState('') // 'excel' or 'manual'
  const [currentPlan, setCurrentPlan] = useState(null)
  const [planItems, setPlanItems] = useState([])

  // Plan form
  const [expectedDate, setExpectedDate] = useState('')
  const [countryOfOrigin, setCountryOfOrigin] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [shipmentReference, setShipmentReference] = useState('')
  const [expectedAquariumCount, setExpectedAquariumCount] = useState('')
  const [planNotes, setPlanNotes] = useState('')

  // Lists for dropdowns
  const [previousCountries, setPreviousCountries] = useState([])
  const [previousSuppliers, setPreviousSuppliers] = useState([])

  // Item form
  const [aquariums, setAquariums] = useState([])
  const [filterRoom, setFilterRoom] = useState('all')
  const [selectedAquarium, setSelectedAquarium] = useState(null)
  const [hebrewName, setHebrewName] = useState('')
  const [scientificName, setScientificName] = useState('')
  const [size, setSize] = useState('')
  const [boxNumber, setBoxNumber] = useState('')
  const [code, setCode] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [itemNotes, setItemNotes] = useState('')

  // Load aquariums and previous data on mount
  useEffect(() => {
    if (currentFarm && isOpen) {
      loadAquariums()
      loadPreviousData()
    }
  }, [currentFarm, isOpen])

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

  async function loadAquariums() {
    try {
      const data = await getAquariums(currentFarm.farmId)
      setAquariums(data)
    } catch (err) {
      console.error('Error loading aquariums:', err)
      setError('שגיאה בטעינת אקווריומים')
    }
  }

  function handleMethodSelect(method) {
    setPlanMethod(method)
    if (method === 'excel') {
      // TODO: Integrate with existing Excel import
      setError('ייבוא מאקסל יתווסף בהמשך')
    } else {
      setStep(2)
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

    setLoading(true)
    setError('')

    try {
      const finalShipmentRef = shipmentReference.trim() || generateShipmentReference()

      const result = await createReceptionPlan(currentFarm.farmId, {
        expectedDate,
        source: 'manual',
        countryOfOrigin: countryOfOrigin.trim(),
        supplierName: supplierName.trim(),
        shipmentReference: finalShipmentRef,
        notes: planNotes,
        expectedAquariumCount: expectedAquariumCount ? parseInt(expectedAquariumCount) : 0,
      })

      setCurrentPlan(result.plan)
      setStep(3)
    } catch (err) {
      console.error('Error creating reception plan:', err)
      setError(err.message || 'שגיאה ביצירת תוכנית קליטה')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddItem() {
    if (!selectedAquarium) {
      setError('נא לבחור אקווריום')
      return
    }

    if (!hebrewName || !size) {
      setError('נא למלא שם עברי וגודל')
      return
    }

    const qty = parseInt(quantity)
    if (qty <= 0) {
      setError('כמות חייבת להיות גדולה מ-0')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await addReceptionItem(currentFarm.farmId, {
        planId: currentPlan.planId,
        targetAquariumId: selectedAquarium.aquariumId,
        targetAquariumNumber: selectedAquarium.aquariumNumber,
        targetRoom: selectedAquarium.room,
        hebrewName,
        scientificName,
        size,
        boxNumber,
        code,
        quantity: qty,
        notes: itemNotes,
      })

      // Add to local list
      setPlanItems([...planItems, result.item])

      // Clear form
      setSelectedAquarium(null)
      setHebrewName('')
      setScientificName('')
      setSize('')
      setBoxNumber('')
      setCode('')
      setQuantity('1')
      setItemNotes('')
      setFilterRoom('all')
      setError('')
    } catch (err) {
      console.error('Error adding reception item:', err)
      setError(err.message || 'שגיאה בהוספת פריט')
    } finally {
      setLoading(false)
    }
  }

  function handleFinishPlanning() {
    if (planItems.length === 0) {
      setError('נא להוסיף לפחות פריט אחד לתוכנית')
      return
    }

    if (onSuccess) {
      onSuccess(currentPlan)
    }

    handleClose()
  }

  function handleClose() {
    setStep(1)
    setPlanMethod('')
    setCurrentPlan(null)
    setPlanItems([])
    setExpectedDate('')
    setCountryOfOrigin('')
    setSupplierName('')
    setShipmentReference('')
    setExpectedAquariumCount('')
    setPlanNotes('')
    setSelectedAquarium(null)
    setHebrewName('')
    setScientificName('')
    setSize('')
    setBoxNumber('')
    setCode('')
    setQuantity('1')
    setItemNotes('')
    setFilterRoom('all')
    setError('')
    onClose()
  }

  function goBack() {
    if (step === 3) {
      setStep(2)
      setError('')
    } else if (step === 2) {
      setStep(1)
      setPlanMethod('')
      setError('')
    }
  }

  if (!isOpen) return null

  // Get unique rooms for filter
  const rooms = [...new Set(aquariums.map((aq) => aq.room))]

  // Filter aquariums by room
  const filteredAquariums = aquariums.filter((aq) => {
    if (filterRoom !== 'all' && aq.room !== filterRoom) return false
    return true
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-[800px] w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">איכלוס אקווריומים</h2>
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

          {/* Step 1: Choose Method */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                בחר שיטת איכלוס
              </h3>
              <div className="flex flex-col gap-3">
                <button
                  className="bg-blue-50 rounded-lg px-6 py-5 text-right hover:bg-blue-100 transition-colors border-2 border-blue-200 hover:border-blue-400"
                  onClick={() => handleMethodSelect('excel')}
                >
                  <div className="font-bold text-lg text-gray-900 mb-1">📊 ייבוא מקובץ Excel</div>
                  <div className="text-sm text-gray-600">
                    ייבוא רשימת דגים מקובץ אקסל (כמו בגרסה הקודמת)
                  </div>
                </button>

                <button
                  className="bg-green-50 rounded-lg px-6 py-5 text-right hover:bg-green-100 transition-colors border-2 border-green-200 hover:border-green-400"
                  onClick={() => handleMethodSelect('manual')}
                >
                  <div className="font-bold text-lg text-gray-900 mb-1">✍️ איכלוס ידני</div>
                  <div className="text-sm text-gray-600">
                    הוסף דגים באופן ידני לפי אקווריומים
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Create Plan */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                צור תוכנית קליטה חדשה
              </h3>

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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      placeholder="כמה אקווריומים יקבלו דגים?"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-900 text-sm">
                    ארץ מוצא <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      list="countries-list"
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      placeholder="בחר או הקלד ארץ..."
                    />
                    <datalist id="countries-list">
                      {previousCountries.map((country) => (
                        <option key={country} value={country} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-900 text-sm">
                    ספק / חוות מקור <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      list="suppliers-list"
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      placeholder="בחר או הקלד שם ספק..."
                    />
                    <datalist id="suppliers-list">
                      {previousSuppliers.map((supplier) => (
                        <option key={supplier} value={supplier} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-900 text-sm">
                    מספר משלוח / אסמכתא
                    <span className="text-gray-500 text-xs mr-1">(אופציונלי - יופק אוטומטי אם לא מהוקלד)</span>
                  </label>
                  <input
                    type="text"
                    value={shipmentReference}
                    onChange={(e) => setShipmentReference(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    placeholder="לדוגמה: משלוח-2025-001"
                  />
                  {!shipmentReference && (
                    <p className="text-xs text-gray-500 mt-1">
                      📝 יופק אוטומטי: {generateShipmentReference()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-900 text-sm">
                    הערות
                  </label>
                  <textarea
                    value={planNotes}
                    onChange={(e) => setPlanNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    placeholder="הערות לגבי התוכנית..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Add Items */}
          {step === 3 && (
            <div>
              <div className="bg-blue-50 p-4 rounded-lg mb-5 border border-blue-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">תוכנית קליטה:</h3>
                    <div className="text-lg font-bold text-gray-900">
                      {formatDateDDMMYYYY(currentPlan.expectedDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">משלוח</div>
                    <div className="text-sm font-mono font-bold text-gray-900">
                      {currentPlan.shipmentReference}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 text-sm text-gray-600 border-t border-blue-200 pt-2">
                  <div>
                    <span className="font-semibold">מקור:</span> {currentPlan.countryOfOrigin}
                  </div>
                  <div>
                    <span className="font-semibold">ספק:</span> {currentPlan.supplierName}
                  </div>
                </div>
                <div className="text-sm text-blue-600 mt-2">
                  📋 פריטים בתוכנית: {planItems.length}
                  {currentPlan.expectedAquariumCount > 0 && (
                    <span> / אקווריומים צפויים: {currentPlan.expectedAquariumCount}</span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">הוסף דגים לתוכנית</h3>

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

              {/* Aquarium Selection */}
              {!selectedAquarium ? (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">בחר אקווריום יעד</h4>
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto mb-4">
                    {filteredAquariums.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        אין אקווריומים זמינים בסינון זה
                      </div>
                    ) : (
                      filteredAquariums.map((aquarium) => (
                        <button
                          key={aquarium.aquariumId}
                          className="bg-white rounded-lg px-4 py-3 text-right hover:bg-gray-50 transition-colors border border-gray-300"
                          onClick={() => setSelectedAquarium(aquarium)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">
                              {aquarium.aquariumNumber}
                            </span>
                            <span className="text-sm text-gray-600">{aquarium.room}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            סטטוס: {aquarium.status} | {aquarium.totalFish} דגים | {aquarium.volume}L
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Selected Aquarium Info */}
                  <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-1">
                          אקווריום יעד:
                        </h4>
                        <div className="text-lg font-bold text-gray-900">
                          {selectedAquarium.aquariumNumber} - {selectedAquarium.room}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAquarium(null)}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        שנה אקווריום
                      </button>
                    </div>
                  </div>

                  {/* Fish Details Form */}
                  <h4 className="text-md font-semibold text-gray-900 mb-3">פרטי הדג</h4>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 font-semibold text-gray-900 text-sm">
                          שם עברי <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={hebrewName}
                          onChange={(e) => setHebrewName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                          placeholder="לדוגמה: דג זהב"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 font-semibold text-gray-900 text-sm">
                          שם מדעי
                        </label>
                        <input
                          type="text"
                          value={scientificName}
                          onChange={(e) => setScientificName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                          placeholder="לדוגמה: Carassius auratus"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block mb-1 font-semibold text-gray-900 text-sm">
                          גודל <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                          placeholder="L, XL..."
                        />
                      </div>

                      <div>
                        <label className="block mb-1 font-semibold text-gray-900 text-sm">
                          מספר ארגז
                        </label>
                        <input
                          type="text"
                          value={boxNumber}
                          onChange={(e) => setBoxNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                          placeholder="1, 2, 3..."
                        />
                      </div>

                      <div>
                        <label className="block mb-1 font-semibold text-gray-900 text-sm">
                          כמות <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold text-gray-900 text-sm">
                        קוד מזהה
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        placeholder="קוד פנימי..."
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold text-gray-900 text-sm">
                        הערות
                      </label>
                      <textarea
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        placeholder="הערות לגבי הדג..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full px-4 py-3 rounded-lg text-[15px] font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      {loading ? 'מוסיף...' : '➕ הוסף דג לתוכנית'}
                    </button>
                  </div>

                  {/* Items List */}
                  {planItems.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">
                        דגים בתוכנית ({planItems.length})
                      </h4>
                      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                        {planItems.map((item) => (
                          <div
                            key={item.itemId}
                            className="bg-gray-50 rounded-lg px-4 py-2 border border-gray-200"
                          >
                            <div className="font-semibold text-gray-900">
                              {item.hebrewName}
                              {item.boxNumber && ` (ארגז ${item.boxNumber})`}
                            </div>
                            <div className="text-sm text-gray-600">
                              גודל: {item.size} | כמות: {item.quantity} →{' '}
                              {item.targetAquariumNumber} ({item.targetRoom})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-between mt-6 pt-5 border-t border-gray-200">
            <div>
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
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleCreatePlan}
                  className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !expectedDate}
                >
                  {loading ? 'יוצר...' : 'המשך להוספת דגים'}
                </button>
              )}
              {step === 3 && planItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleFinishPlanning}
                  className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-green-500 text-white hover:bg-green-600"
                >
                  ✓ סיים ושמור תוכנית
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceptionPlanningModal
