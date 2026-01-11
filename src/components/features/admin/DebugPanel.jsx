import { useState } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import {
  debugFishAquariumMismatch,
  fixAllAquariumReferences,
} from '../../../services/debug.service'

function DebugPanel() {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [debugReport, setDebugReport] = useState(null)
  const [fixResult, setFixResult] = useState(null)
  const [error, setError] = useState('')

  async function handleDebug() {
    if (!currentFarm) return

    try {
      setLoading(true)
      setError('')
      const report = await debugFishAquariumMismatch(currentFarm.farmId)
      setDebugReport(report)
    } catch (err) {
      setError('שגיאה בבדיקה: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleFix() {
    if (!currentFarm) return

    const confirmed = window.confirm(
      'האם אתה בטוח שברצונך לתקן את כל הפניות לדגים באקווריומים?\n\n' +
        'פעולה זו תעדכן את כל האקווריומים כך שיצביעו נכון על הדגים שלהם.'
    )

    if (!confirmed) return

    try {
      setLoading(true)
      setError('')
      const result = await fixAllAquariumReferences(currentFarm.farmId)
      setFixResult(result)
      setDebugReport(null) // Clear debug report after fix
    } catch (err) {
      setError('שגיאה בתיקון: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">תיקון פניות דגים באקווריומים</h1>
        <p className="text-sm text-gray-600 mb-6">
          כלי זה מתקן את הבעיה שבה דגים מיובאים לא מופיעים באקווריומים. הוא מעדכן את כל
          האקווריומים כך שיצביעו נכון על הדגים שנקלטו אליהם.
        </p>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">{error}</div>
        )}

        {fixResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
            <div className="font-bold mb-2">✅ התיקון הושלם בהצלחה!</div>
            <div className="text-sm">עודכנו {fixResult.updatedCount} אקווריומים</div>
            <div className="text-xs mt-2 text-green-600">
              רענן את הדף כדי לראות את השינויים
            </div>
          </div>
        )}

        {/* Step 1: Debug */}
        {!debugReport && !fixResult && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-semibold text-blue-900 mb-2">שלב 1: בדוק בעיות</div>
              <div className="text-sm text-blue-700 mb-4">
                לחץ על הכפתור כדי לבדוק אילו אקווריומים לא מצביעים נכון על הדגים שלהם
              </div>
              <button
                onClick={handleDebug}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'בודק...' : 'בדוק בעיות'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review and Fix */}
        {debugReport && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-semibold text-yellow-900 mb-2">
                נמצאו {debugReport.mismatches.length} אקווריומים עם בעיות
              </div>

              {debugReport.summary && (
                <div className="bg-white rounded border border-yellow-200 p-3 mb-4">
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-semibold">סה"כ דגים במערכת:</span>{' '}
                      {debugReport.summary.totalFish}
                    </div>
                    <div>
                      <span className="font-semibold">סה"כ אקווריומים:</span>{' '}
                      {debugReport.summary.totalAquariums}
                    </div>
                    <div>
                      <span className="font-semibold">אקווריומים עם בעיות:</span>{' '}
                      {debugReport.summary.aquariumsWithMismatches}
                    </div>
                  </div>
                </div>
              )}

              {debugReport.mismatches.length > 0 && (
                <>
                  <div className="text-sm text-yellow-700 mb-4">פירוט אקווריומים עם בעיות:</div>
                  <div className="bg-white rounded border border-yellow-200 p-3 max-h-96 overflow-y-auto mb-4">
                    <div className="space-y-3">
                      {debugReport.mismatches.map((mismatch, index) => (
                        <div key={index} className="border-b border-yellow-100 pb-3 last:border-b-0">
                          <div className="font-semibold text-gray-900">
                            אקווריום #{mismatch.aquariumNumber} - {mismatch.room}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <div>סטטוס: {mismatch.status}</div>
                            <div>
                              דגים מוצהרים: {mismatch.totalFish} | דגים בפועל:{' '}
                              {mismatch.actualFishCount}
                            </div>
                          </div>
                          {mismatch.actualFish && mismatch.actualFish.length > 0 && (
                            <div className="mt-2 bg-green-50 rounded p-2">
                              <div className="text-xs font-semibold text-green-800 mb-1">
                                דגים שצריכים להופיע:
                              </div>
                              {mismatch.actualFish.map((fish, idx) => (
                                <div key={idx} className="text-xs text-green-700">
                                  • {fish.commonName} ({fish.quantity} יח')
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleFix}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'מתקן...' : `תקן ${debugReport.mismatches.length} אקווריומים`}
                    </button>
                    <button
                      onClick={() => setDebugReport(null)}
                      disabled={loading}
                      className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
                    >
                      ביטול
                    </button>
                  </div>
                </>
              )}

              {debugReport.mismatches.length === 0 && (
                <div className="text-sm text-green-700">✅ כל האקווריומים תקינים!</div>
              )}
            </div>
          </div>
        )}

        {/* Reset after result */}
        {fixResult && (
          <button
            onClick={() => {
              setFixResult(null)
              handleDebug() // Check again
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

export default DebugPanel
