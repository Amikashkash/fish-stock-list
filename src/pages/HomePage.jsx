import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'
import { useFarm } from '../contexts/FarmContext'
import ShipmentImportModal from '../components/features/shipments/ShipmentImportModal'
import FishTransferModal from '../components/features/transfer/FishTransferModal'

function HomePage() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const { currentFarm } = useFarm()
  const [showImportModal, setShowImportModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)

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

  const handleImportSuccess = (result) => {
    console.log('Import successful:', result)
    alert(`Success! Imported ${result.fishCount} fish types (${result.totalFish} total fish)`)
  }

  const handleTransferSuccess = (result) => {
    console.log('Transfer successful:', result)
    alert(`הועברו ${result.transferred} ${result.fishName} בהצלחה!`)
  }

  const actionCards = [
    { icon: '📋', label: 'משימות', color: '#2196F3', action: 'tasks' },
    { icon: '🐠', label: 'אקווריומים', color: '#00BCD4', action: 'aquariums' },
    { icon: '🔄', label: 'העברת דגים', color: '#9C27B0', action: 'transfer' },
    { icon: '📥', label: 'ייבוא משלוח', color: '#4CAF50', action: 'import' },
    { icon: '🚚', label: 'משלוחים', color: '#FF9800', action: 'shipments' },
  ]

  const handleCardClick = (action) => {
    if (action === 'import') {
      setShowImportModal(true)
    } else if (action === 'transfer') {
      setShowTransferModal(true)
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white px-4 py-4 flex justify-between items-center shadow-md sticky top-0 z-[100]">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 m-0">{currentFarm.name}</h1>
        <div className="flex gap-2.5 items-center">
          <button
            className="bg-transparent border-none text-2xl cursor-pointer"
            onClick={() => navigate('/settings')}
            title="הגדרות חווה"
          >
            ⚙️
          </button>
          <button
            className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-110 overflow-hidden flex items-center justify-center"
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
        <div className="bg-white rounded-xl shadow-md p-5 md:p-6 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 m-0 mb-4">
              שלום, {user?.displayName || user?.email || 'משתמש'}!
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-base">🏢</span>
                <span>חוות ראשית</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-base">👔</span>
                <span>בעלים</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {actionCards.map((card, index) => (
            <button
              key={index}
              className="bg-white rounded-xl shadow-md p-6 md:p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all border-none border-t-4 min-h-[120px] hover:-translate-y-1 hover:shadow-xl"
              style={{ borderTopColor: card.color }}
              onClick={() => handleCardClick(card.action)}
            >
              <div className="text-[40px]" style={{ color: card.color }}>
                {card.icon}
              </div>
              <div className="text-base font-semibold text-gray-900">{card.label}</div>
            </button>
          ))}
        </div>

        <div className="bg-green-50 border border-green-300 rounded-xl shadow-md p-6 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-lg font-bold text-green-800 m-0 mb-2">המערכת מוכנה לשימוש</h3>
          <p className="text-sm text-green-700 m-0">כל התשתיות מוכנות - ניתן להתחיל לעבוד</p>
        </div>
      </main>

      {/* Import Modal */}
      <ShipmentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        farmId={currentFarm.farmId}
        onSuccess={handleImportSuccess}
      />

      {/* Transfer Modal */}
      <FishTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={handleTransferSuccess}
      />
    </div>
  )
}

export default HomePage
