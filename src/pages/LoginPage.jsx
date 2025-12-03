import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../firebase/config'
import './LoginPage.css'

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isLogin && password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    if (!isLogin && password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      setError('שגיאה בהתחברות עם Google: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('אנא הזן כתובת דוא"ל לשחזור סיסמה')
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      alert('נשלח אימייל לשחזור סיסמה')
    } catch (err) {
      setError(getErrorMessage(err.code))
    }
  }

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/user-not-found':
        return 'לא נמצא משתמש עם כתובת דוא"ל זו'
      case 'auth/wrong-password':
        return 'סיסמה שגויה'
      case 'auth/invalid-email':
        return 'כתובת דוא"ל לא תקינה'
      case 'auth/user-disabled':
        return 'חשבון משתמש זה הושבת'
      case 'auth/email-already-in-use':
        return 'כתובת דוא"ל זו כבר בשימוש'
      case 'auth/weak-password':
        return 'הסיסמה חלשה מדי'
      case 'auth/too-many-requests':
        return 'יותר מדי ניסיונות. נסה שוב מאוחר יותר'
      default:
        return 'שגיאה: ' + code
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="icon">🐠</div>
          <h1>ניהול חוות דגי נוי</h1>
          <p>מערכת ניהול מקצועית לחוות דגים</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>דוא"ל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label>סיסמה</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                dir="ltr"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>אימות סיסמה</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          {isLogin && (
            <button
              type="button"
              className="forgot-password"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              שכחת סיסמה?
            </button>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'טוען...' : (isLogin ? 'התחבר' : 'הרשם')}
          </button>
        </form>

        <div className="divider">
          <span>או</span>
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <span className="google-icon">G</span>
          התחבר עם Google
        </button>

        <div className="toggle-mode">
          {isLogin ? 'אין לך חשבון?' : 'יש לך כבר חשבון?'}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setConfirmPassword('')
            }}
          >
            {isLogin ? 'הרשם כעת' : 'התחבר'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
