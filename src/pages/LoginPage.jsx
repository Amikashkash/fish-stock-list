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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-ocean-600 via-ocean-500 to-aqua-400 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-coral-300/20 rounded-full blur-3xl -top-48 -right-48 animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-sunset-300/20 rounded-full blur-3xl -bottom-40 -left-40 animate-pulse delay-700"></div>
        <div className="absolute w-64 h-64 bg-aqua-300/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-lg rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 border border-white/20">
        <div className="text-center mb-10">
          <div className="text-7xl mb-5 animate-float">🐠</div>
          <h1 className="text-3xl mb-3 bg-gradient-to-r from-ocean-600 to-ocean-400 bg-clip-text text-transparent font-bold">ניהול חוות דגי נוי</h1>
          <p className="text-base text-gray-600 font-medium">מערכת ניהול מקצועית לחוות דגים</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">דוא"ל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3.5 border-2 border-aqua-200 rounded-xl text-base transition-all focus:outline-none focus:border-ocean-400 focus:shadow-lg bg-white/80"
              required
              dir="ltr"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">סיסמה</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-aqua-200 rounded-xl text-base transition-all focus:outline-none focus:border-ocean-400 focus:shadow-lg bg-white/80"
                required
                dir="ltr"
              />
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-xl cursor-pointer p-1 hover:scale-110 transition-transform"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-gray-900 text-sm">אימות סיסמה</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-aqua-200 rounded-xl text-base transition-all focus:outline-none focus:border-ocean-400 focus:shadow-lg bg-white/80"
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-xl cursor-pointer p-1 hover:scale-110 transition-transform"
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
              className="block mb-5 bg-transparent text-ocean-600 text-sm font-medium text-right border-none cursor-pointer hover:text-ocean-700 hover:underline transition-colors"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              שכחת סיסמה?
            </button>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white border-none rounded-xl text-base font-bold cursor-pointer transition-all hover:from-ocean-600 hover:to-ocean-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
          >
            {loading ? 'טוען...' : (isLogin ? 'התחבר' : 'הרשם')}
          </button>
        </form>

        <div className="flex items-center my-7 text-gray-500 text-sm before:content-[''] before:flex-1 before:h-px before:bg-gradient-to-r before:from-transparent before:to-gray-300 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-l after:from-transparent after:to-gray-300">
          <span className="px-5 font-medium">או</span>
        </div>

        <button
          type="button"
          className="w-full py-4 bg-white text-gray-900 border-2 border-aqua-200 rounded-xl text-base font-semibold cursor-pointer flex items-center justify-center gap-3 transition-all hover:bg-aqua-50 hover:border-aqua-300 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <span className="font-bold text-xl text-[#4285F4]">G</span>
          התחבר עם Google
        </button>

        <div className="mt-7 text-center text-base text-gray-600">
          {isLogin ? 'אין לך חשבון?' : 'יש לך כבר חשבון?'}
          <button
            type="button"
            className="bg-transparent text-ocean-600 font-bold mr-2 border-none cursor-pointer hover:text-ocean-700 hover:underline transition-colors"
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
