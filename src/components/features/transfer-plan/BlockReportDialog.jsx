import { useState } from 'react'

function BlockReportDialog({ isOpen, onConfirm, onCancel }) {
  const [reason, setReason] = useState('temperature')
  const [notes, setNotes] = useState('')

  function handleConfirm() {
    onConfirm({ reason, notes })
    // Reset
    setReason('temperature')
    setNotes('')
  }

  function handleCancel() {
    onCancel()
    // Reset
    setReason('temperature')
    setNotes('')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1100]"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-[500px] w-full mx-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-red-200 bg-red-50">
          <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            דיווח על תקלה
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            למה אי אפשר לבצע את ההעברה?
          </p>

          {/* Reason Selection */}
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">
              סיבה <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white focus:outline-none focus:border-red-500"
            >
              <option value="temperature">🌡️ בעיית טמפרטורה</option>
              <option value="size">📏 גודל אקווריום לא מתאים</option>
              <option value="leak">💧 דליפה / בעיה טכנית</option>
              <option value="other">❓ אחר</option>
            </select>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-900 text-sm">
              הערות נוספות
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500 resize-none"
              rows="3"
              placeholder="תאר את הבעיה בקצרה..."
            />
          </div>

          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
            💡 המנהל יקבל התראה על התקלה ויוכל להחליט אם להמשיך או לבטל את המשימה.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all bg-red-500 text-white hover:bg-red-600"
          >
            דווח תקלה
          </button>
        </div>
      </div>
    </div>
  )
}

export default BlockReportDialog
