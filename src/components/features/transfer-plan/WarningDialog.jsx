function WarningDialog({ isOpen, warnings, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1100]"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-[500px] w-full mx-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-yellow-200 bg-yellow-50">
          <h3 className="text-xl font-bold text-yellow-900 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            התראות
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            המערכת זיהתה התנגשויות אפשריות בתוכנית:
          </p>

          <div className="space-y-3">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  warning.severity === 'error'
                    ? 'bg-red-50 border-red-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${
                    warning.severity === 'error' ? 'text-red-900' : 'text-yellow-900'
                  }`}
                >
                  {warning.type === 'target_has_pending_removals' && '🔄 אקווריום מתוכנן להתרוקן'}
                  {warning.type === 'source_has_pending_additions' && '📥 אקווריום מתוכנן לקבל דגים'}
                  {warning.type === 'target_occupied' && '🐠 אקווריום תפוס'}
                </div>
                <div
                  className={`text-sm ${
                    warning.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                  }`}
                >
                  {warning.message}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 mt-4">
            האם אתה בטוח שברצונך להמשיך?
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all bg-yellow-500 text-white hover:bg-yellow-600"
          >
            המשך בכל זאת
          </button>
        </div>
      </div>
    </div>
  )
}

export default WarningDialog
