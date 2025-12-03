import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'
import './HomePage.css'

function HomePage() {
  const user = auth.currentUser

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const actionCards = [
    { icon: '📋', label: 'משימות', color: '#2196F3' },
    { icon: '🐠', label: 'אקווריומים', color: '#00BCD4' },
    { icon: '📄', label: 'פרופורמה', color: '#FF9800' },
    { icon: '🚚', label: 'משלוחים', color: '#4CAF50' },
  ]

  return (
    <div className="home-page">
      <header className="app-header">
        <h1>חוות הדגים שלי</h1>
        <button className="user-menu" onClick={handleSignOut}>
          👤
        </button>
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
          {actionCards.map((action, index) => (
            <button
              key={index}
              className="action-card card"
              style={{ borderTopColor: action.color }}
              onClick={() => alert(`${action.label} - בקרוב`)}
            >
              <div className="action-icon" style={{ color: action.color }}>
                {action.icon}
              </div>
              <div className="action-label">{action.label}</div>
            </button>
          ))}
        </div>

        <div className="status-card card">
          <div className="status-icon">✅</div>
          <h3>המערכת מוכנה לשימוש</h3>
          <p>כל התשתיות מוכנות - ניתן להתחיל לעבוד</p>
        </div>
      </main>
    </div>
  )
}

export default HomePage
