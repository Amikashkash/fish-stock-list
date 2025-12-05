import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../firebase/config'

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div className="w-full max-w-[400px] bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐠</div>
          <h1 className="text-2xl mb-2 text-gray-900 font-semibold">ניהול חוות דגי נוי</h1>
          <p className="text-sm text-gray-600">מערכת ניהול מקצועית לחוות דגים</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 font-medium text-gray-900 text-sm">דוא"ל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500"
              required
              dir="ltr"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-medium text-gray-900 text-sm">סיסמה</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500"
                required
                dir="ltr"
              />
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-xl cursor-pointer p-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="mb-5">
              <label className="block mb-2 font-medium text-gray-900 text-sm">אימות סיסמה</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500"
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-xl cursor-pointer p-1"
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
              className="block mb-4 bg-transparent text-blue-500 text-sm underline text-right border-none cursor-pointer"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              שכחת סיסמה?
            </button>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'טוען...' : (isLogin ? 'התחבר' : 'הרשם')}
          </button>
        </form>

        <div className="flex items-center my-6 text-gray-600 text-sm before:content-[''] before:flex-1 before:h-px before:bg-gray-300 after:content-[''] after:flex-1 after:h-px after:bg-gray-300">
          <span className="px-4">או</span>
        </div>

        <button
          type="button"
          className="w-full py-3.5 bg-white text-gray-900 border border-gray-300 rounded-lg text-base font-medium cursor-pointer flex items-center justify-center gap-2 transition-colors hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <span className="font-bold text-lg text-[#4285F4]">G</span>
          התחבר עם Google
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? 'אין לך חשבון?' : 'יש לך כבר חשבון?'}
          <button
            type="button"
            className="bg-transparent text-blue-500 font-semibold mr-1 underline border-none cursor-pointer"
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
