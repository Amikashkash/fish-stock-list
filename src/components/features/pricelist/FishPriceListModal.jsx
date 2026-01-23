import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getFarmFish } from '../../../services/farm-fish.service'

function FishPriceListModal({ isOpen, onClose }) {
  const { currentFarm } = useFarm()
  const [fish, setFish] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFish, setSelectedFish] = useState(null)

  useEffect(() => {
    if (isOpen && currentFarm?.farmId) {
      loadFish()
    }
  }, [isOpen, currentFarm?.farmId])

  async function loadFish() {
    try {
      setLoading(true)
      const allFish = await getFarmFish(currentFarm.farmId)
      // Sort by scientific name
      allFish.sort((a, b) => (a.scientificName || '').localeCompare(b.scientificName || ''))
      setFish(allFish)
    } catch (err) {
      console.error('Error loading fish:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const filteredFish = fish.filter((f) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (f.scientificName || '').toLowerCase().includes(term) ||
      (f.hebrewName || '').toLowerCase().includes(term) ||
      (f.size || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="m-0 text-[22px] font-semibold text-gray-900">
            {selectedFish ? 'פרטי דג' : 'מחירון דגים'}
          </h2>
          <button
            className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700"
            onClick={() => {
              if (selectedFish) {
                setSelectedFish(null)
              } else {
                onClose()
              }
            }}
          >
            {selectedFish ? '←' : '×'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedFish ? (
            // Fish Detail View
            <FishDetailView fish={selectedFish} />
          ) : (
            // Fish List View
            <>
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חפש דג..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  dir="rtl"
                />
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">טוען מחירון...</div>
              ) : filteredFish.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">💰</div>
                  <div>{searchTerm ? 'לא נמצאו תוצאות' : 'אין דגים במחירון'}</div>
                  <div className="text-xs mt-1">יבא קובץ אקסל כדי להוסיף דגים</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                    <div className="col-span-5 text-right">שם מדעי</div>
                    <div className="col-span-2 text-right">גודל</div>
                    <div className="col-span-3 text-right">מחיר אחרון</div>
                    <div className="col-span-2 text-right">מקור</div>
                  </div>

                  {/* Fish List */}
                  {filteredFish.map((f) => (
                    <div
                      key={f.fishId}
                      className="grid grid-cols-12 gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all items-center"
                      onClick={() => setSelectedFish(f)}
                    >
                      <div className="col-span-5 text-right">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {f.scientificName || 'ללא שם'}
                        </div>
                        {f.hebrewName && (
                          <div className="text-xs text-gray-500">{f.hebrewName}</div>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-sm text-gray-600">
                        {f.size || '-'}
                      </div>
                      <div className="col-span-3 text-right">
                        {f.price ? (
                          <span className="font-semibold text-green-700 text-sm">
                            {f.price.toFixed ? `₪${f.price.toFixed(2)}` : `₪${f.price}`}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">לא צוין</span>
                        )}
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs text-gray-500">
                          {f.source === 'excel-import' ? 'יבוא' : f.source || '-'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                    {filteredFish.length} דגים במחירון
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Fish detail view - shows price history and supplier info (future feature)
 */
function FishDetailView({ fish }) {
  return (
    <div className="space-y-6">
      {/* Fish Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{fish.scientificName}</h3>
        {fish.hebrewName && (
          <p className="text-sm text-gray-600 mb-3">{fish.hebrewName}</p>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">גודל</div>
            <div className="font-semibold text-gray-900">{fish.size || '-'}</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">מחיר אחרון</div>
            <div className="font-semibold text-green-700">
              {fish.price ? `₪${fish.price.toFixed ? fish.price.toFixed(2) : fish.price}` : 'לא צוין'}
            </div>
          </div>
          {fish.boxNumber && (
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">מספר ארגז</div>
              <div className="font-semibold text-gray-900">{fish.boxNumber}</div>
            </div>
          )}
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">מקור</div>
            <div className="font-semibold text-gray-900">
              {fish.source === 'excel-import' ? 'יבוא (אקסל)' : fish.source || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Price History - Future Feature */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>היסטוריית מחירים</span>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">בקרוב</span>
        </h4>
        <div className="text-center py-6 text-gray-400">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-sm">היסטוריית מחירים וספקים תהיה זמינה בגרסה הבאה</div>
        </div>
      </div>
    </div>
  )
}

export default FishPriceListModal
