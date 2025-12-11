import { calculateWorkRequirements } from '../../../models/ReceptionPlan'

function WorkRequirementsReport({ items = [], plan = null, onClose }) {
  const requirements = calculateWorkRequirements(items)

  if (items.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">📋</div>
        <div className="text-blue-800 font-semibold mb-1">אין נתונים</div>
        <div className="text-sm text-blue-700">הוסף דגים לתוכנית כדי לראות דרישות עבודה</div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">📊 דרישות עבודה</h3>
        <p className="text-sm text-gray-600">
          סה"כ פריטים בשיפלוח: <span className="font-semibold">{requirements.totalItems}</span>
        </p>
      </div>

      {/* By Room */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">📍 לפי חדר</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(requirements.byRoom).map(([room, data]) => (
            <div key={room} className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">{room}</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                  {data.count} פריטים
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {Object.entries(data.sizes).map(([size, count]) => (
                  <div key={size} className="flex justify-between text-gray-700">
                    <span className="text-gray-600">גודל {size}:</span>
                    <span className="font-semibold">{count} {count === 1 ? 'אקווריום' : 'אקווריומים'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Size */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-3">📏 לפי גודל</h4>
        <div className="space-y-2">
          {Object.entries(requirements.bySize).map(([size, data]) => (
            <div key={size} className="bg-white rounded-lg p-3 border border-indigo-100 flex justify-between items-center">
              <div>
                <span className="font-semibold text-gray-900">גודל {size}</span>
                <div className="text-xs text-gray-600 mt-1">
                  {data.items.slice(0, 3).join(', ')}
                  {data.items.length > 3 && ` +${data.items.length - 3}`}
                </div>
              </div>
              <div className="text-right">
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
                  {data.count}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.count === 1 ? 'אקווריום' : 'אקווריומים'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Note */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-sm text-yellow-800">
          <span className="font-semibold">💡 רמז:</span> בדוק כמה אקווריומים פנויים יש לך בחדר קליטה.
          אם אין מספיק, בחזור למסך הטרנספר והעבר דגים כדי לפנות מקום.
        </div>
      </div>
    </div>
  )
}

export default WorkRequirementsReport
