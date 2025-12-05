import './AquariumCard.css'

function AquariumCard({ aquarium, onClick, statusLabel }) {
  const statusClass = `status-${aquarium.status}`
  const occupancyPercent = Math.round(aquarium.occupancyRate * 100)

  return (
    <div className={`aquarium-card ${statusClass}`} onClick={onClick}>
      <div className="aquarium-card-header">
        <div className="aquarium-number">{aquarium.aquariumNumber}</div>
        <div className={`aquarium-status ${statusClass}`}>
          {statusLabel || aquarium.status}
        </div>
      </div>

      <div className="aquarium-card-body">
        {/* Room */}
        <div className="aquarium-info-row">
          <span className="label">מיקום:</span>
          <span className="value">{aquarium.room}</span>
        </div>

        {/* Volume */}
        <div className="aquarium-info-row">
          <span className="label">נפח:</span>
          <span className="value">{aquarium.volume}L</span>
        </div>

        {/* Fish Count */}
        {aquarium.status === 'occupied' && (
          <div className="aquarium-fish-info">
            <div className="fish-count">
              🐠 {aquarium.totalFish} דגים
            </div>
            {aquarium.occupancyRate > 0 && (
              <div className="occupancy-bar">
                <div
                  className="occupancy-fill"
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
