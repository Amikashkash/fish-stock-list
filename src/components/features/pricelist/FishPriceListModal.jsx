import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { getFarmFish } from '../../../services/farm-fish.service'
import { getFishInstances } from '../../../services/fish.service'
import { getAquariums } from '../../../services/aquarium.service'

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

      // Load all data sources in parallel
      const [catalogFish, fishInstances, aquariums] = await Promise.all([
        getFarmFish(currentFarm.farmId),
        getFishInstances(currentFarm.farmId),
        getAquariums(currentFarm.farmId)
      ])

      // Create aquarium lookup map
      const aquariumMap = new Map()
      aquariums.forEach(aq => {
        aquariumMap.set(aq.aquariumId, {
          room: aq.room || '',
          number: aq.aquariumNumber || ''
        })
      })

      // Normalize size: extract leading number so "3cm" and "3-4cm" share the same key
      const sizeKey = (s) => {
        const n = (s || '').toLowerCase().replace(/\s+/g, '')
        const m = n.match(/^(\d+\.?\d*)/)
        return m ? m[1] : n
      }

      // Create a map to merge catalog + instances by scientificName+commonName+sizeBase
      // Including common name allows fish with the same scientific name but different
      // common names (e.g. "Koi Cobra" vs "Koi Tuxedo") to be separate entries
      const fishMap = new Map()

      // First, add all catalog fish
      // Preserve the catalog's aquariumId so it can serve as a fallback
      // when the matching fish_instance still has aquariumId: null
      catalogFish.forEach(f => {
        const key = `${(f.scientificName || '').toLowerCase()}_${(f.hebrewName || '').toLowerCase()}_${sizeKey(f.size)}`
        const catAqInfo = f.aquariumId ? aquariumMap.get(f.aquariumId) : null
        fishMap.set(key, {
          ...f,
          currentQuantity: f.quantity || 0,
          aquariumId: f.aquariumId || null,
          aquariumRoom: catAqInfo?.room || '',
          aquariumNumber: catAqInfo?.number || ''
        })
      })

      // Then, merge/add fish instances (they have actual stock and prices)
      fishInstances.forEach(inst => {
        // Skip non-active instances
        if (inst.status && inst.status !== 'active') return
        // Skip instances whose aquariumId points to a deleted/non-existent aquarium
        // (null aquariumId is valid — direct shipment imports are not yet assigned to an aquarium)
        if (inst.aquariumId && !aquariumMap.has(inst.aquariumId)) return

        const key = `${(inst.scientificName || '').toLowerCase()}_${(inst.commonName || '').toLowerCase()}_${sizeKey(inst.size)}`
        const existing = fishMap.get(key)

        // Get aquarium info
        const aqInfo = aquariumMap.get(inst.aquariumId)

        // Get price from instance (might be in costs object or direct price field)
        const instancePrice = inst.price || inst.costs?.invoiceCostPerFish || null

        const instQty = inst.currentQuantity || 0

        if (existing) {
          // Merge: add quantity, prefer instance price if available
          // Pick size/aquarium from whichever entry has more fish
          const mergedQty = (existing.currentQuantity || 0) + instQty
          const useInstance = instQty > (existing.currentQuantity || 0)
          fishMap.set(key, {
            ...existing,
            size: useInstance ? (inst.size || existing.size) : existing.size,
            currentQuantity: mergedQty,
            price: instancePrice || existing.price,
            aquariumId: useInstance ? (inst.aquariumId || existing.aquariumId) : existing.aquariumId,
            aquariumRoom: useInstance ? (aqInfo?.room || existing.aquariumRoom || '') : existing.aquariumRoom,
            aquariumNumber: useInstance ? (aqInfo?.number || existing.aquariumNumber || '') : existing.aquariumNumber,
          })
        } else {
          // Add new entry from instance
          fishMap.set(key, {
            fishId: inst.instanceId,
            scientificName: inst.scientificName || '',
            hebrewName: inst.commonName || '',
            size: inst.size || '',
            price: instancePrice,
            currentQuantity: instQty,
            aquariumId: inst.aquariumId,
            aquariumRoom: aqInfo?.room || '',
            aquariumNumber: aqInfo?.number || '',
            source: 'fish-instance'
          })
        }
      })

      // Convert map to array and sort
      const allFish = Array.from(fishMap.values())
      allFish.sort((a, b) =>
        (a.hebrewName || a.scientificName || '').localeCompare(b.hebrewName || b.scientificName || '', 'he')
      )
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

  // Categorize fish into 4 sections
  const inStockWithPrice    = filteredFish.filter(f => (f.currentQuantity || 0) > 0 && f.price)
  const outOfStockWithPrice = filteredFish.filter(f => (f.currentQuantity || 0) <= 0 && f.price)
  const noPriceInStock      = filteredFish.filter(f => (f.currentQuantity || 0) > 0 && !f.price)
  const noPriceOutOfStock   = filteredFish.filter(f => (f.currentQuantity || 0) <= 0 && !f.price)

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
                <div className="space-y-6">
                  {/* Section 1: In Stock with Price */}
                  {inStockWithPrice.length > 0 && (
                    <FishSection
                      title="במלאי"
                      icon="✅"
                      color="green"
                      fish={inStockWithPrice}
                      onSelect={setSelectedFish}
                    />
                  )}

                  {/* Section 2: Out of Stock with Price */}
                  {outOfStockWithPrice.length > 0 && (
                    <FishSection
                      title="נגמר במלאי"
                      icon="📦"
                      color="orange"
                      fish={outOfStockWithPrice}
                      onSelect={setSelectedFish}
                    />
                  )}

                  {/* Section 3: In stock, no price */}
                  {noPriceInStock.length > 0 && (
                    <FishSection
                      title="ללא מחיר - יש לעדכן"
                      icon="⚠️"
                      color="red"
                      fish={noPriceInStock}
                      onSelect={setSelectedFish}
                    />
                  )}

                  {/* Section 4: Not in stock, no price — bottom of list */}
                  {noPriceOutOfStock.length > 0 && (
                    <FishSection
                      title="לא במלאי"
                      icon="🚫"
                      color="gray"
                      fish={noPriceOutOfStock}
                      onSelect={setSelectedFish}
                    />
                  )}

                  {/* Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                    {filteredFish.length} דגים במחירון
                    {inStockWithPrice.length > 0 && ` | ${inStockWithPrice.length} במלאי`}
                    {noPriceInStock.length > 0 && ` | ${noPriceInStock.length} ללא מחיר`}
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
 * Fish section component - displays a category of fish
 */
function FishSection({ title, icon, color, fish, onSelect }) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-gray-50 border-gray-200'
  }

  const headerColors = {
    green: 'text-green-800',
    orange: 'text-orange-800',
    red: 'text-red-800',
    gray: 'text-gray-500'
  }

  return (
    <div className={`rounded-xl border ${colorClasses[color]} p-4`}>
      <h3 className={`text-sm font-semibold ${headerColors[color]} mb-3 flex items-center gap-2`}>
        <span>{icon}</span>
        <span>{title}</span>
        <span className="text-xs font-normal">({fish.length})</span>
      </h3>
      <div className="space-y-2">
        {fish.map((f, idx) => (
          <div
            key={f.fishId || idx}
            className="grid grid-cols-12 gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all items-center text-sm"
            onClick={() => onSelect(f)}
          >
            {/* Fish Name */}
            <div className="col-span-4 text-right">
              <div className="font-medium text-gray-900 truncate">
                {f.hebrewName || f.scientificName || 'ללא שם'}
              </div>
              {f.scientificName && (
                <div className="text-xs text-gray-500 italic truncate">{f.scientificName}</div>
              )}
            </div>
            {/* Size */}
            <div className="col-span-2 text-right text-gray-600">
              {f.size || '-'}
            </div>
            {/* Price */}
            <div className="col-span-2 text-right">
              {f.price ? (
                <span className="font-semibold text-green-700">
                  ₪{typeof f.price === 'number' ? f.price.toFixed(2) : f.price}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            {/* Quantity */}
            <div className="col-span-2 text-right">
              <span className={f.currentQuantity > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                {f.currentQuantity || 0}
              </span>
            </div>
            {/* Location */}
            <div className="col-span-2 text-right text-xs text-gray-500">
              {f.aquariumRoom && f.aquariumNumber ? (
                `${f.aquariumRoom} #${f.aquariumNumber}`
              ) : (
                '-'
              )}
            </div>
          </div>
        ))}
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
        <h3 className="text-lg font-bold text-gray-900 mb-1">{fish.hebrewName || fish.scientificName}</h3>
        {fish.hebrewName && fish.scientificName && (
          <p className="text-sm italic text-gray-600 mb-3">{fish.scientificName}</p>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">גודל</div>
            <div className="font-semibold text-gray-900">{fish.size || '-'}</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">מחיר אחרון</div>
            <div className="font-semibold text-green-700">
              {fish.price ? `₪${typeof fish.price === 'number' ? fish.price.toFixed(2) : fish.price}` : 'לא צוין'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">כמות במלאי</div>
            <div className={`font-semibold ${fish.currentQuantity > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              {fish.currentQuantity || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">מיקום</div>
            <div className="font-semibold text-gray-900">
              {fish.aquariumRoom && fish.aquariumNumber
                ? `${fish.aquariumRoom} #${fish.aquariumNumber}`
                : 'לא משויך'}
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
