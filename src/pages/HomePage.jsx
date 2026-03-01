import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'
import { useFarm } from '../contexts/FarmContext'
import FishPriceListModal from '../components/features/pricelist/FishPriceListModal'
import ReceptionPlansModal from '../components/features/reception/ReceptionPlansModal'
import TasksModal from '../components/features/tasks/TasksModal'
import OrdersModal from '../components/features/orders/OrdersModal'
import { VERSION } from '../version'

function HomePage() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const { currentFarm } = useFarm()
  const [showPriceListModal, setShowPriceListModal] = useState(false)
  const [showReceptionModal, setShowReceptionModal] = useState(false)
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [showOrdersModal, setShowOrdersModal] = useState(false)

  const handleSignOut = async () => {
    const confirmed = window.confirm('האם אתה בטוח שברצונך להתנתק?')
    if (!confirmed) return

    try {
      await signOut(auth)
      navigate('/login')
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const actionCards = [
    { icon: '📋', label: 'משימות', gradient: 'from-ocean-400 to-ocean-600', action: 'tasks' },
    { icon: '🐠', label: 'אקווריומים', gradient: 'from-aqua-400 to-aqua-600', action: 'aquariums' },
    { icon: '💰', label: 'מחירון דגים', gradient: 'from-coral-300 to-coral-500', action: 'pricelist' },
{ icon: '📦', label: 'דגים מיבוא', gradient: 'from-coral-400 to-sunset-500', action: 'reception' },
    { icon: '🛒', label: 'הזמנות', gradient: 'from-purple-400 to-purple-600', action: 'orders' },
  ]

  const handleCardClick = (action) => {
    if (action === 'pricelist') {
      setShowPriceListModal(true)
    } else if (action === 'reception') {
      setShowReceptionModal(true)
    } else if (action === 'tasks') {
      setShowTasksModal(true)
    } else if (action === 'orders') {
      setShowOrdersModal(true)
    } else if (action === 'aquariums') {
      navigate('/aquariums')
    } else {
      alert(`${action} - בקרוב`)
    }
  }

  if (!currentFarm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-base text-gray-500">טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-aqua-50 via-white to-ocean-50">
      <header className="bg-white/80 backdrop-blur-md px-4 py-4 flex justify-between items-center shadow-soft sticky top-0 z-[100] border-b border-aqua-100">
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-ocean-600 to-ocean-400 bg-clip-text text-transparent m-0">{currentFarm.name}</h1>
          <span className="text-xs text-gray-500 mt-0.5 font-medium">גרסה {VERSION}</span>
        </div>
        <div className="flex gap-2.5 items-center">
          <button
            className="bg-transparent border-none text-2xl cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate('/settings')}
            title="הגדרות חווה"
          >
            ⚙️
          </button>
          <button
            className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 border-2 border-white shadow-card cursor-pointer transition-all hover:scale-110 hover:shadow-card-hover overflow-hidden flex items-center justify-center"
            onClick={handleSignOut}
            title="התנתק"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white text-xl">👤</span>
            )}
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-[1200px] mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card p-6 md:p-8 mb-6 border border-aqua-100">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 m-0 mb-5">
              שלום, {user?.displayName || user?.email || 'משתמש'}! 👋
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 bg-aqua-50 rounded-lg p-3">
                <span className="text-xl">🏢</span>
                <span className="font-medium">חוות ראשית</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 bg-ocean-50 rounded-lg p-3">
                <span className="text-xl">👔</span>
                <span className="font-medium">בעלים</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-6">
          {actionCards.map((card, index) => (
            <button
              key={index}
              className={`bg-gradient-to-br ${card.gradient} rounded-2xl shadow-card p-6 md:p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all border-none min-h-[140px] hover:-translate-y-2 hover:shadow-card-hover group relative overflow-hidden`}
              onClick={() => handleCardClick(card.action)}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-[42px] filter drop-shadow-lg relative z-10">
                {card.icon}
              </div>
              <div className="text-base font-bold text-white relative z-10 drop-shadow-md">{card.label}</div>
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl shadow-card p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          <h3 className="text-xl font-bold text-green-800 m-0 mb-3">המערכת מוכנה לשימוש</h3>
          <p className="text-base text-green-700 m-0 font-medium">כל התשתיות מוכנות - ניתן להתחיל לעבוד</p>
        </div>
      </main>

      {/* Price List Modal */}
      <FishPriceListModal
        isOpen={showPriceListModal}
        onClose={() => setShowPriceListModal(false)}
      />

      {/* Reception Plans Modal */}
      <ReceptionPlansModal
        isOpen={showReceptionModal}
        onClose={() => setShowReceptionModal(false)}
      />

      {/* Orders Modal */}
      <OrdersModal
        isOpen={showOrdersModal}
        onClose={() => setShowOrdersModal(false)}
      />

      {/* Tasks Modal */}
      <TasksModal
        isOpen={showTasksModal}
        onClose={() => setShowTasksModal(false)}
        onSuccess={() => {
          // Task created/completed successfully
        }}
      />
    </div>
  )
}

export default HomePage
