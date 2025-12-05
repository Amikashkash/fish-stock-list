const SHELF_LABELS = {
  bottom: 'תחתון',
  middle: 'אמצעי',
  top: 'עליון',
}

const STATUS_BORDER_COLORS = {
  empty: 'border-gray-200',
  occupied: 'border-blue-400',
  maintenance: 'border-yellow-500',
  'in-transfer': 'border-purple-500',
}

const STATUS_BADGE_COLORS = {
  empty: 'bg-gray-200 text-gray-600',
  occupied: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-600',
  'in-transfer': 'bg-purple-100 text-purple-600',
}

function AquariumCard({ aquarium, onClick, statusLabel }) {
  const occupancyPercent = Math.round(aquarium.occupancyRate * 100)
  const borderColor = STATUS_BORDER_COLORS[aquarium.status] || 'border-gray-200'
  const badgeColor = STATUS_BADGE_COLORS[aquarium.status] || 'bg-gray-200 text-gray-600'

  return (
    <div
      className={`bg-white rounded-xl p-4 sm:p-3 shadow-md cursor-pointer transition-all border-2 ${borderColor} hover:shadow-xl hover:-translate-y-0.5`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
        <div className="text-xl sm:text-lg font-bold text-gray-900">{aquarium.aquariumNumber}</div>
        <div className={`px-3 py-1 rounded-xl text-xs font-semibold ${badgeColor}`}>
          {statusLabel || aquarium.status}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Shelf */}
        <div className="flex justify-between text-sm sm:text-[13px]">
          <span className="text-gray-500 font-medium">מדף:</span>
          <span className="text-gray-900 font-semibold">{SHELF_LABELS[aquarium.shelf] || aquarium.shelf}</span>
        </div>

        {/* Room */}
        <div className="flex justify-between text-sm sm:text-[13px]">
          <span className="text-gray-500 font-medium">מיקום:</span>
          <span className="text-gray-900 font-semibold">{aquarium.room}</span>
        </div>

        {/* Volume */}
        <div className="flex justify-between text-sm sm:text-[13px]">
          <span className="text-gray-500 font-medium">נפח:</span>
          <span className="text-gray-900 font-semibold">{aquarium.volume}L</span>
        </div>

        {/* Fish Count */}
        {aquarium.status === 'occupied' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-900 mb-2">
              🐠 {aquarium.totalFish} דגים
            </div>
            {aquarium.occupancyRate > 0 && (
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(occupancyPercent, 100)}%`,
                    backgroundColor:
                      occupancyPercent > 80 ? '#e74c3c' : occupancyPercent > 60 ? '#f39c12' : '#27ae60',
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AquariumCard
