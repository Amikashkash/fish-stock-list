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

function AquariumCard({ aquarium, onClick, statusLabel, onManageFish, onQuickEmpty }) {
  const statusColor = STATUS_COLORS[aquarium.status] || 'text-gray-500'
  const bgColor = STATUS_BG_COLORS[aquarium.status] || 'bg-gray-50'
  const shelfLabel = SHELF_LABELS[aquarium.shelf] || aquarium.shelf

  const handleCardClick = (e) => {
    // Only trigger onClick if not clicking on buttons
    if (e.target.closest('.manage-fish-btn') || e.target.closest('.quick-empty-btn')) {
      return
    }
    onClick()
  }

  const handleManageFishClick = (e) => {
    e.stopPropagation()
    onManageFish(aquarium)
  }

  const handleQuickEmptyClick = (e) => {
    e.stopPropagation()
    if (onQuickEmpty) {
      onQuickEmpty(aquarium)
    }
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
          <div className="flex-1">
            <span className="font-bold text-gray-900 text-base">{aquarium.aquariumNumber}</span>
            {aquarium.fishNames && aquarium.fishNames.length > 0 && (
              <span className="text-xs text-gray-600 mr-2">
                - {aquarium.fishNames.join(', ')}
              </span>
            )}
          </div>
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
        <div className="flex gap-2">
          <button
            onClick={handleManageFishClick}
            className="manage-fish-btn flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer bg-green-500 text-white hover:bg-green-600"
          >
            {isEmpty ? '➕ הוסף דג' : '🐠 ערוך דגים'}
          </button>
          {!isEmpty && onQuickEmpty && (
            <button
              onClick={handleQuickEmptyClick}
              className="quick-empty-btn px-3 py-2 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer bg-red-500 text-white hover:bg-red-600"
              title="ריקון מהיר"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Desktop Layout - Horizontal */}
      <div className="hidden sm:flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="font-bold text-gray-900">{aquarium.aquariumNumber}</span>
          {aquarium.fishNames && aquarium.fishNames.length > 0 && (
            <span className="text-sm text-blue-700 font-medium">
              - {aquarium.fishNames.join(', ')}
            </span>
          )}
        </div>
        <span className={`font-semibold ${statusColor} min-w-[60px]`}>
          {statusLabel || aquarium.status}
        </span>
        <span className="text-gray-600 min-w-[50px]">{shelfLabel}</span>
        <span className="text-gray-900 font-medium">{aquarium.volume}L</span>
        {!isEmpty && (
          <span className="text-blue-600 font-medium">🐠 {aquarium.totalFish}</span>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleManageFishClick}
            className="manage-fish-btn px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer bg-green-500 text-white hover:bg-green-600 whitespace-nowrap"
          >
            {isEmpty ? '➕ הוסף דג' : '🐠 ערוך דגים'}
          </button>
          {!isEmpty && onQuickEmpty && (
            <button
              onClick={handleQuickEmptyClick}
              className="quick-empty-btn px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer bg-red-500 text-white hover:bg-red-600 whitespace-nowrap"
              title="ריקון מהיר"
            >
              🗑️ רוקן
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AquariumCard
