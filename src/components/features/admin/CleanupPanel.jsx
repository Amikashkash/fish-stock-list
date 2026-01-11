import { useState } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import { cleanupDuplicateReceptionFish, getDuplicateFishSummary } from '../../../services/cleanup.service'

function CleanupPanel() {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleGetSummary() {
    if (!currentFarm) return

    try {
      setLoading(true)
      setError('')
      const summaryData = await getDuplicateFishSummary(currentFarm.farmId)
      setSummary(summaryData)
    } catch (err) {
      setError('שגיאה בטעינת סיכום: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCleanup() {
    if (!currentFarm) return

    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק ${summary.count} רשומות כפולות?\n\n` +
        'פעולה זו תמחק את כל רשומות farmFish שנוצרו בטעות מקליטה.\n' +
        'הדגים עצמם יישארו כ-fish_instances ויופיעו באקווריומים.'
    )

    if (!confirmed) return

    try {
      setLoading(true)
      setError('')
      const cleanupResult = await cleanupDuplicateReceptionFish(currentFarm.farmId)
      setResult(cleanupResult)
      setSummary(null) // Clear summary after cleanup
    } catch (err) {
      setError('שגיאה בניקוי: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ניקוי רשומות כפולות</h1>
        <p className="text-sm text-gray-600 mb-6">
          כלי זה מנקה רשומות farmFish שנוצרו בטעות מקליטת דגים מיובאים. הדגים יישארו כ-fish_instances
          ויופיעו באקווריומים.
        </p>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">{error}</div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
            <div className="font-bold mb-2">✅ {result.message}</div>
            <div className="text-sm">נמחקו {result.deletedCount} רשומות</div>
          </div>
        )}

        {/* Step 1: Get Summary */}
        {!summary && !result && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-semibold text-blue-900 mb-2">שלב 1: בדוק רשומות כפולות</div>
              <div className="text-sm text-blue-700 mb-4">
                לחץ על הכפתור כדי לראות כמה רשומות כפולות קיימות במערכת
              </div>
              <button
                onClick={handleGetSummary}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'בודק...' : 'בדוק רשומות כפולות'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review and Cleanup */}
        {summary && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-semibold text-yellow-900 mb-2">
                נמצאו {summary.count} רשומות כפולות
              </div>
              {summary.count > 0 && (
                <>
                  <div className="text-sm text-yellow-700 mb-4">רשימת רשומות למחיקה:</div>
                  <div className="bg-white rounded border border-yellow-200 p-3 max-h-64 overflow-y-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">שם עברי</th>
                          <th className="text-right p-2">שם מדעי</th>
                          <th className="text-right p-2">כמות</th>
                          <th className="text-right p-2">אקווריום</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.duplicates.map((fish, index) => (
                          <tr key={fish.id} className="border-b">
                            <td className="p-2">{fish.hebrewName}</td>
                            <td className="p-2 text-gray-600 text-xs">{fish.scientificName}</td>
                            <td className="p-2">{fish.quantity}</td>
                            <td className="p-2 text-gray-600">{fish.aquariumId || 'לא משוייך'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCleanup}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'מוחק...' : `מחק ${summary.count} רשומות`}
                    </button>
                    <button
                      onClick={() => setSummary(null)}
                      disabled={loading}
                      className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
                    >
                      ביטול
                    </button>
                  </div>
                </>
              )}
              {summary.count === 0 && (
                <div className="text-sm text-green-700">✅ אין רשומות כפולות למחיקה!</div>
              )}
            </div>
          </div>
        )}

        {/* Reset after result */}
        {result && (
          <button
            onClick={() => {
              setResult(null)
              handleGetSummary() // Check again
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            בדוק שוב
          </button>
        )}
      </div>
    </div>
  )
}

export default CleanupPanel
