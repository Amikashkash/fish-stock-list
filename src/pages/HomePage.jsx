import { useState } from 'react'
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'
import { useFarm } from '../contexts/FarmContext'
import ShipmentImportModal from '../components/features/shipments/ShipmentImportModal'
import FarmSettingsModal from '../components/features/farm/FarmSettingsModal'
import './HomePage.css'

function HomePage() {
  const user = auth.currentUser
  const { currentFarm } = useFarm()
  const [showImportModal, setShowImportModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const handleImportSuccess = (result) => {
    console.log('Import successful:', result)
    alert(`Success! Imported ${result.fishCount} fish types (${result.totalFish} total fish)`)
  }

  const actionCards = [
    { icon: '📋', label: 'משימות', color: '#2196F3', action: 'tasks' },
    { icon: '🐠', label: 'אקווריומים', color: '#00BCD4', action: 'aquariums' },
    { icon: '📥', label: 'ייבוא משלוח', color: '#4CAF50', action: 'import' },
    { icon: '🚚', label: 'משלוחים', color: '#FF9800', action: 'shipments' },
  ]

  const handleCardClick = (action) => {
    if (action === 'import') {
      setShowImportModal(true)
    } else {
      alert(`${action} - בקרוב`)
    }
  }

  if (!currentFarm) {
    return (
      <div className="home-page">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <header className="app-header">
        <h1>{currentFarm.name}</h1>
        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="icon-button"
            onClick={() => setShowSettingsModal(true)}
            title="הגדרות חווה"
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            ⚙️
          </button>
          <button className="user-menu" onClick={handleSignOut} title="התנתק">
            👤
          </button>
        </div>
      </header>

      <main className="home-content">
        <div className="welcome-card card">
          <div className="welcome-text">
            <h2>שלום, {user?.displayName || user?.email || 'משתמש'}!</h2>
            <div className="farm-info">
              <div className="info-row">
                <span className="info-icon">🏢</span>
                <span>חוות ראשית</span>
              </div>
              <div className="info-row">
                <span className="info-icon">👔</span>
                <span>בעלים</span>
              </div>
            </div>
          </div>
        </div>

        <div className="actions-grid">
          {actionCards.map((card, index) => (
            <button
              key={index}
              className="action-card card"
              style={{ borderTopColor: card.color }}
              onClick={() => handleCardClick(card.action)}
            >
              <div className="action-icon" style={{ color: card.color }}>
                {card.icon}
              </div>
              <div className="action-label">{card.label}</div>
            </button>
          ))}
        </div>

        <div className="status-card card">
          <div className="status-icon">✅</div>
          <h3>המערכת מוכנה לשימוש</h3>
          <p>כל התשתיות מוכנות - ניתן להתחיל לעבוד</p>
        </div>
      </main>

      {/* Import Modal */}
      <ShipmentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        farmId={currentFarm.farmId}
        onSuccess={handleImportSuccess}
      />

      {/* Farm Settings Modal */}
      <FarmSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  )
}

export default HomePage
