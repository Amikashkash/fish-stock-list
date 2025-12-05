import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'
import { useFarm } from '../contexts/FarmContext'
import FarmCreateModal from '../components/features/farm/FarmCreateModal'

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <p className="mt-4 text-base text-white">טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      {/* Sign Out Button */}
      <button
        className="absolute top-5 left-5 sm:top-2.5 sm:left-2.5 px-5 py-2.5 sm:px-4 sm:py-2 bg-white/20 text-white border border-white/30 rounded-lg cursor-pointer text-sm font-semibold backdrop-blur-md transition-all hover:bg-white/30 hover:-translate-x-0.5"
        onClick={handleSignOut}
        title="התנתק"
      >
        ← יציאה
      </button>

      <div className="w-full max-w-[500px] text-center">
        <div className="text-[80px] sm:text-[64px] mb-6 animate-float">
          🐠
        </div>

        <h1 className="text-[32px] sm:text-[28px] text-white mb-2 font-bold">ברוכים הבאים</h1>
        <p className="text-lg sm:text-base text-white/90 mb-12">מערכת ניהול חוות דגי נוי</p>

        <h2 className="text-[22px] sm:text-lg text-white font-semibold m-0 mb-8 drop-shadow-md">
          בחר אפשרות:
        </h2>

        <div className="flex flex-col gap-4">
          <button
            className="flex items-center gap-4 p-5 rounded-2xl border-none cursor-pointer transition-all min-h-[80px] bg-white text-gray-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.2)]"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="text-[32px] flex-shrink-0">➕</span>
            <div className="flex-1 text-right">
              <div className="text-lg sm:text-base font-bold mb-1">יצירת חווה חדשה</div>
              <div className="text-[13px] sm:text-xs opacity-70 font-normal">אני בעלים חדש</div>
            </div>
          </button>

          <button
            className="flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all min-h-[80px] bg-white/20 text-white border-2 border-white backdrop-blur-md hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.2)]"
            onClick={() => alert('תכונה זו תהיה זמינה בקרוב')}
          >
            <span className="text-[32px] flex-shrink-0">🔗</span>
            <div className="flex-1 text-right">
              <div className="text-lg sm:text-base font-bold mb-1">הצטרפות לחווה קיימת</div>
              <div className="text-[13px] sm:text-xs opacity-70 font-normal">יש לי קוד הזמנה</div>
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
