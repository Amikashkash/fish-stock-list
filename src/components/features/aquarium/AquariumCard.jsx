import './AquariumCard.css'

const ROOM_LABELS = {
  reception: 'קליטה',
  main: 'ראשי',
  quarantine: 'הסגר',
  display: 'תצוגה',
}

const STATUS_LABELS = {
  empty: 'ריק',
  occupied: 'תפוס',
  'in-transfer': 'בהעברה',
  maintenance: 'תחזוקה',
}

const SHELF_LABELS = {
  bottom: 'תחתון',
  middle: 'אמצעי',
  top: 'עליון',
}

function AquariumCard({ aquarium, onClick }) {
  const statusClass = `status-${aquarium.status}`
  const occupancyPercent = Math.round(aquarium.occupancyRate * 100)

  return (
    <div className={`aquarium-card ${statusClass}`} onClick={onClick}>
      <div className="aquarium-card-header">
        <div className="aquarium-number">{aquarium.aquariumNumber}</div>
        <div className={`aquarium-status ${statusClass}`}>
          {STATUS_LABELS[aquarium.status] || aquarium.status}
        </div>
      </div>

      <div className="aquarium-card-body">
        {/* Room & Shelf */}
        <div className="aquarium-info-row">
          <span className="label">חדר:</span>
          <span className="value">{ROOM_LABELS[aquarium.room] || aquarium.room}</span>
        </div>

        <div className="aquarium-info-row">
          <span className="label">מדף:</span>
          <span className="value">{SHELF_LABELS[aquarium.shelf] || aquarium.shelf}</span>
        </div>

        {/* Volume */}
        <div className="aquarium-info-row">
          <span className="label">נפח:</span>
          <span className="value">{aquarium.volume}L</span>
        </div>

        {/* Location */}
        <div className="aquarium-info-row">
          <span className="label">מיקום:</span>
          <span className="value">{aquarium.location}</span>
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

        {/* Equipment */}
        {(aquarium.equipment?.heater || aquarium.equipment?.filter || aquarium.equipment?.aerator) && (
          <div className="aquarium-equipment">
            {aquarium.equipment.heater && <span className="equipment-icon" title="חימום">🌡️</span>}
            {aquarium.equipment.filter && <span className="equipment-icon" title="פילטר">🔄</span>}
            {aquarium.equipment.aerator && <span className="equipment-icon" title="אוורור">💨</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default AquariumCard
