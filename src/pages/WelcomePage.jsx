import { useNavigate } from 'react-router-dom'
import './WelcomePage.css'

function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="welcome-icon">🐠</div>

        <h1>ברוכים הבאים</h1>
        <p className="subtitle">מערכת ניהול חוות דגי נוי</p>

        <div className="welcome-question">
          <h2>האם אתה בעל חוות דגי נוי?</h2>
        </div>

        <div className="action-buttons">
          <button
            className="btn-primary-large"
            onClick={() => navigate('/home')}
          >
            <span className="btn-icon">➕</span>
            <div className="btn-content">
              <div className="btn-title">כן, אני רוצה ליצור חווה חדשה</div>
            </div>
          </button>

          <button
            className="btn-secondary-large"
            onClick={() => alert('תכונה זו תהיה זמינה בקרוב')}
          >
            <span className="btn-icon">🔗</span>
            <div className="btn-content">
              <div className="btn-title">לא, יש לי קוד הזמנה</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomePage
