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

function AquariumCard({ aquarium, onClick, statusLabel }) {
  const statusColor = STATUS_COLORS[aquarium.status] || 'text-gray-500'
  const bgColor = STATUS_BG_COLORS[aquarium.status] || 'bg-gray-50'
  const shelfLabel = SHELF_LABELS[aquarium.shelf] || aquarium.shelf

  return (
    <div
      className={`${bgColor} rounded-lg px-4 py-2.5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border border-gray-200`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-gray-900 min-w-[80px]">{aquarium.aquariumNumber}</span>
        <span className={`font-semibold ${statusColor} min-w-[60px]`}>
          {statusLabel || aquarium.status}
        </span>
        <span className="text-gray-600 min-w-[50px]">{shelfLabel}</span>
        <span className="text-gray-900 font-medium">{aquarium.volume}L</span>
        {aquarium.status === 'occupied' && aquarium.totalFish > 0 && (
          <span className="text-blue-600 font-medium">🐠 {aquarium.totalFish}</span>
        )}
      </div>
    </div>
  )
}

export default AquariumCard
