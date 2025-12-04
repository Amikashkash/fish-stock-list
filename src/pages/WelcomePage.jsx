import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'
import { useFarm } from '../contexts/FarmContext'
import FarmCreateModal from '../components/features/farm/FarmCreateModal'
import './WelcomePage.css'

function WelcomePage() {
  const navigate = useNavigate()
  const { farms, addFarm, loading } = useFarm()
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Auto-navigate if user already has farms
  useEffect(() => {
    if (!loading && farms.length > 0) {
      navigate('/home')
    }
  }, [farms, loading, navigate])

  function handleFarmCreated(farm) {
    addFarm(farm)
    navigate('/home')
  }

  async function handleSignOut() {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  if (loading) {
    return (
      <div className="welcome-page">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="welcome-page">
      {/* Sign Out Button */}
      <button
        className="sign-out-btn"
        onClick={handleSignOut}
        title="התנתק"
      >
        ← יציאה
      </button>

      <div className="welcome-container">
        <div className="welcome-icon">🐠</div>

        <h1>ברוכים הבאים</h1>
        <p className="subtitle">מערכת ניהול חוות דגי נוי</p>

        <h2 className="welcome-question-text">בחר אפשרות:</h2>

        <div className="action-buttons">
          <button
            className="btn-primary-large"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-icon">➕</span>
            <div className="btn-content">
              <div className="btn-title">יצירת חווה חדשה</div>
              <div className="btn-subtitle">אני בעלים חדש</div>
            </div>
          </button>

          <button
            className="btn-secondary-large"
            onClick={() => alert('תכונה זו תהיה זמינה בקרוב')}
          >
            <span className="btn-icon">🔗</span>
            <div className="btn-content">
              <div className="btn-title">הצטרפות לחווה קיימת</div>
              <div className="btn-subtitle">יש לי קוד הזמנה</div>
            </div>
          </button>
        </div>
      </div>

      <FarmCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleFarmCreated}
      />
    </div>
  )
}

export default WelcomePage
