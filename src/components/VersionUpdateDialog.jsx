import { useState } from 'react'
import { clearCacheAndReload, getCurrentVersion } from '../services/version.service'

function VersionUpdateDialog({ isOpen, onClose }) {
  const [isClearing, setIsClearing] = useState(false)

  if (!isOpen) return null

  async function handleUpdate() {
    setIsClearing(true)
    await clearCacheAndReload()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="text-5xl mb-3">✨</div>
          <h2 className="text-2xl font-bold text-gray-900">גרסה חדשה זמינה!</h2>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            גרסה חדשה של האפליקציה זמינה. עדכן כדי לקבל את התכונות החדשות ותיקונים.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">גרסה נוכחית:</span> {getCurrentVersion()}
            </div>
            <p className="text-xs text-gray-500">
              לאחר העדכון, ניתן לגזור בדפדפן את המטמון של האתר או סגור ופתח מחדש את האפליקציה.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isClearing}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300 transition-all disabled:opacity-50"
          >
            לא עכשיו
          </button>
          <button
            onClick={handleUpdate}
            disabled={isClearing}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isClearing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                מעדכן...
              </>
            ) : (
              <>
                ⬇️ עדכן עכשיו
              </>
            )}
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          עדכון יחזקה את המטמון ויטען את הגרסה החדשה
        </p>
      </div>
    </div>
  )
}

export default VersionUpdateDialog
