import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { auth } from '../firebase/config'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { getInvitationByCode, acceptInvitation } from '../services/invitation.service'
import { useFarm } from '../contexts/FarmContext'

function JoinPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const { reloadFarms } = useFarm()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [success, setSuccess] = useState(false)

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Load invitation when code is available
  useEffect(() => {
    if (inviteCode) {
      loadInvitation()
    }
  }, [inviteCode])

  async function loadInvitation() {
    try {
      setLoading(true)
      setError('')

      const inv = await getInvitationByCode(inviteCode)

      if (!inv) {
        setError('ההזמנה לא נמצאה או שפג תוקפה')
        return
      }

      setInvitation(inv)
    } catch (err) {
      console.error('Error loading invitation:', err)
      setError('שגיאה בטעינת ההזמנה')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Error signing in:', err)
      setError('שגיאה בהתחברות עם Google')
    }
  }

  async function handleJoinFarm() {
    if (!user || !invitation) return

    setJoining(true)
    setError('')

    try {
      await acceptInvitation(invitation.invitationId, user.uid)
      setSuccess(true)

      // Reload farms to include the new one
      await reloadFarms()

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/home')
      }, 2000)
    } catch (err) {
      console.error('Error joining farm:', err)
      setError(err.message || 'שגיאה בהצטרפות לחווה')
    } finally {
      setJoining(false)
    }
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען הזמנה...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הזמנה לא תקינה</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הצטרפת בהצלחה!</h1>
          <p className="text-gray-600 mb-4">
            ברוך הבא לחווה <span className="font-semibold">{invitation?.farmName}</span>
          </p>
          <p className="text-sm text-gray-500">מעביר אותך לדף הבית...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הזמנה להצטרף לחווה</h1>
          <p className="text-gray-600">
            הוזמנת להצטרף לחווה <span className="font-semibold text-purple-600">{invitation?.farmName}</span>
          </p>
        </div>

        {/* Invitation Details */}
        <div className="bg-purple-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-700">תפקיד:</span>
            <span className="font-semibold text-purple-900">
              {invitation?.role === 'manager' ? 'מנהל' : 'עובד'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-700">הוזמן ע"י:</span>
            <span className="font-semibold text-purple-900">{invitation?.invitedByEmail}</span>
          </div>
        </div>

        {/* Action */}
        {!user ? (
          // Not logged in - show sign in button
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              יש להתחבר כדי להצטרף לחווה
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              התחבר עם Google
            </button>
          </div>
        ) : (
          // Logged in - show join button
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-10 h-10 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.displayName}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleJoinFarm}
              disabled={joining}
              className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  מצטרף...
                </>
              ) : (
                <>
                  🚀 הצטרף לחווה
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default JoinPage
