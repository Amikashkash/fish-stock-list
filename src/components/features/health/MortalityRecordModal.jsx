import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { recordMortalityEvent, detectAbnormalMortality } from '../../../services/mortality.service'

const MORTALITY_TYPES = [
  { value: 'doa', label: 'DOA - מת בהגעה' },
  { value: 'reception', label: 'תקופת קליטה (14 יום)' },
  { value: 'regular', label: 'תמותה רגילה' },
]

const MORTALITY_CAUSES = [
  { value: 'disease', label: 'מחלה' },
  { value: 'aggression', label: 'תוקפנות' },
  { value: 'environmental', label: 'תנאי סביבה' },
  { value: 'stress', label: 'מתח' },
  { value: 'injury', label: 'פציעה' },
  { value: 'age', label: 'גיל' },
  { value: 'unknown', label: 'לא ידוע' },
]

function MortalityRecordModal({ isOpen, onClose, fishData, onMortalityRecorded = null }) {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alerts, setAlerts] = useState([])

  const [formData, setFormData] = useState({
    mortalityType: 'regular',
    quantity: '',
    cause: 'unknown',
    notes: '',
  })

  useEffect(() => {
    if (isOpen && fishData) {
      // Auto-detect mortality type based on days from reception
      const daysFromReception = calculateDaysFromReception()
      let defaultType = 'regular'

      if (daysFromReception === 0) {
        defaultType = 'doa'
      } else if (daysFromReception <= 14) {
        defaultType = 'reception'
      }

      setFormData({
        mortalityType: defaultType,
        quantity: '',
        cause: 'unknown',
        notes: '',
      })
      setError('')
      setAlerts([])
    }
  }, [isOpen, fishData])

  function calculateDaysFromReception() {
    if (!fishData?.arrivalDate) return 999

    let arrival
    if (fishData.arrivalDate instanceof Date) {
      arrival = fishData.arrivalDate
    } else if (typeof fishData.arrivalDate.toDate === 'function') {
      arrival = fishData.arrivalDate.toDate()
    } else if (typeof fishData.arrivalDate === 'string') {
      arrival = new Date(fishData.arrivalDate)
    } else {
      return 999
    }

    return Math.floor((Date.now() - arrival.getTime()) / (1000 * 60 * 60 * 24))
  }

  function handleInputChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!currentFarm || !fishData) {
      setError('נתונים חסרים')
      return
    }

    const quantity = parseInt(formData.quantity)

    if (!formData.quantity || isNaN(quantity) || quantity < 1) {
      setError('יש להזין כמות תקינה (לפחות 1)')
      return
    }

    if (quantity > fishData.currentQuantity) {
      setError(`לא ניתן לרשום ${quantity} מתים - יש רק ${fishData.currentQuantity} דגים`)
      return
    }

    try {
      setLoading(true)
      setError('')

      const eventData = {
        fishSource: fishData.fishSource || 'reception',
        fishId: fishData.instanceId || fishData.fishId || fishData.farmFishId,
        scientificName: fishData.scientificName,
        commonName: fishData.commonName || fishData.hebrewName,
        aquariumId: fishData.aquariumId,
        aquariumNumber: fishData.aquariumNumber,
        mortalityType: formData.mortalityType,
        quantity: quantity,
        cause: formData.cause,
        notes: formData.notes,
        receptionDate: fishData.arrivalDate,
      }

      // Record the mortality event
      await recordMortalityEvent(currentFarm.farmId, eventData)

      // Check for abnormal patterns
      const alertInfo = await detectAbnormalMortality(currentFarm.farmId, eventData)

      if (alertInfo.hasAlerts) {
        setAlerts(alertInfo.alerts)
        // Don't close modal yet - show alerts
      } else {
        // No alerts - close modal
        if (onMortalityRecorded) onMortalityRecorded()
        onClose()
      }
    } catch (err) {
      setError('שגיאה ברישום תמותה: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCloseWithAlerts() {
    if (onMortalityRecorded) onMortalityRecorded()
    onClose()
  }

  if (!isOpen || !fishData) return null

  const daysFromReception = calculateDaysFromReception()
  const enteredQuantity = parseInt(formData.quantity) || 0
  const remainingQuantity = fishData.currentQuantity - enteredQuantity

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-0 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">רישום תמותה</h2>
          <button
            className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Fish Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-900 text-lg">{fishData.commonName || fishData.hebrewName}</h3>
            <p className="text-sm text-gray-600 italic">{fishData.scientificName}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">כמות נוכחית:</span> {fishData.currentQuantity}
              </div>
              <div>
                <span className="font-semibold">ימים מקליטה:</span> {daysFromReception}
              </div>
              <div>
                <span className="font-semibold">אקווריום:</span> {fishData.aquariumNumber || 'לא משוייך'}
              </div>
              <div>
                <span className="font-semibold">גודל:</span> {fishData.size}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="font-semibold text-red-700 text-lg">התראות</h3>
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-400 text-red-800'
                      : 'bg-orange-50 border-orange-400 text-orange-800'
                  }`}
                >
                  <div className="font-bold mb-1">{alert.message}</div>
                  <div className="text-sm">{alert.recommendation}</div>
                </div>
              ))}
              <button
                onClick={handleCloseWithAlerts}
                className="w-full px-4 py-3 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
              >
                אישור והמשך
              </button>
            </div>
          )}

          {/* Form */}
          {alerts.length === 0 && (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}

              {/* Mortality Type */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">סוג תמותה</label>
                <div className="space-y-2">
                  {MORTALITY_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.mortalityType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mortalityType"
                        value={type.value}
                        checked={formData.mortalityType === type.value}
                        onChange={(e) => handleInputChange('mortalityType', e.target.value)}
                        className="ml-3"
                      />
                      <span className="font-medium">{type.label}</span>
                    </label>
                  ))}
                </div>
                {daysFromReception <= 14 && (
                  <div className="mt-2 text-xs text-blue-600">
                    הדג עדיין בתקופת קליטה (יום {daysFromReception} מתוך 14)
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">כמות דגים מתים</label>
                <input
                  type="number"
                  min="1"
                  max={fishData.currentQuantity}
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                  placeholder="הזן כמות"
                />
                <div className="mt-1 text-sm text-gray-600">
                  יישאר: <span className="font-semibold">{remainingQuantity}</span> דגים
                </div>
                {remainingQuantity === 0 && (
                  <div className="mt-1 text-sm text-orange-600 font-semibold">
                    תמותה מלאה - כל הדגים ימחקו
                  </div>
                )}
              </div>

              {/* Cause */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">סיבת תמותה</label>
                <select
                  value={formData.cause}
                  onChange={(e) => handleInputChange('cause', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {MORTALITY_CAUSES.map((cause) => (
                    <option key={cause.value} value={cause.value}>
                      {cause.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">הערות (אופציונלי)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows="3"
                  placeholder="תיאור מפורט של הסימפטומים, תנאים, או כל מידע רלוונטי אחר..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-lg text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'שומר...' : 'רשום תמותה'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default MortalityRecordModal
