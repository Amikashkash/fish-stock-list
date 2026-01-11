const SHELF_LABELS = {
  bottom: 'תחתון',
  middle: 'אמצעי',
  top: 'עליון',
}

const STATUS_COLORS = {
  empty: 'text-gray-500',
  occupied: 'text-blue-600',
  maintenance: 'text-yellow-600',
  'in-transfer': 'text-purple-600',
}

const STATUS_BG_COLORS = {
  empty: 'bg-gray-50',
  occupied: 'bg-blue-50',
  maintenance: 'bg-yellow-50',
  'in-transfer': 'bg-purple-50',
}

function AquariumCard({ aquarium, onClick, statusLabel, onManageFish }) {
  const statusColor = STATUS_COLORS[aquarium.status] || 'text-gray-500'
  const bgColor = STATUS_BG_COLORS[aquarium.status] || 'bg-gray-50'
  const shelfLabel = SHELF_LABELS[aquarium.shelf] || aquarium.shelf

  const handleCardClick = (e) => {
    // Only trigger onClick if not clicking on the manage fish button
    if (e.target.closest('.manage-fish-btn')) {
      return
    }
    onClick()
  }

  const handleManageFishClick = (e) => {
    e.stopPropagation()
    onManageFish(aquarium)
  }

  const isEmpty = aquarium.status === 'empty' || !aquarium.totalFish || aquarium.totalFish === 0

  return (
    <div
      className={`${bgColor} rounded-lg px-3 sm:px-4 py-2.5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border border-gray-200`}
      onClick={handleCardClick}
    >
      {/* Mobile Layout - Stacked */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-900 text-base">{aquarium.aquariumNumber}</span>
          <span className={`font-semibold text-sm ${statusColor}`}>
            {statusLabel || aquarium.status}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <div className="flex items-center gap-3">
            <span>{shelfLabel}</span>
            <span className="text-gray-900 font-medium">{aquarium.volume}L</span>
            {!isEmpty && (
              <span className="text-blue-600 font-medium">🐠 {aquarium.totalFish}</span>
            )}
          </div>
        </div>
        <button
          onClick={handleManageFishClick}
          className="manage-fish-btn w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer bg-green-500 text-white hover:bg-green-600"
        >
          {isEmpty ? '➕ הוסף דג' : '🐠 ערוך דגים'}
        </button>
      </div>

      {/* Desktop Layout - Horizontal */}
      <div className="hidden sm:flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-gray-900 min-w-[80px]">{aquarium.aquariumNumber}</span>
        <span className={`font-semibold ${statusColor} min-w-[60px]`}>
          {statusLabel || aquarium.status}
        </span>
        <span className="text-gray-600 min-w-[50px]">{shelfLabel}</span>
        <span className="text-gray-900 font-medium">{aquarium.volume}L</span>
        {!isEmpty && (
          <span className="text-blue-600 font-medium">🐠 {aquarium.totalFish}</span>
        )}
        <button
          onClick={handleManageFishClick}
          className="manage-fish-btn px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer bg-green-500 text-white hover:bg-green-600"
        >
          {isEmpty ? '➕ הוסף דג' : '🐠 ערוך דגים'}
        </button>
      </div>
    </div>
  )
}

export default AquariumCard
