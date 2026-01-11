import { useState } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import {
  compareReceptionToFishInstances,
  recreateMissingFishInstances,
  debugFishAquariumMismatch,
  fixAllAquariumReferences,
} from '../../../services/debug.service'

function DebugPanel() {
  const { currentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [debugReport, setDebugReport] = useState(null)
  const [receptionReport, setReceptionReport] = useState(null)
  const [fixResult, setFixResult] = useState(null)
  const [recreateResult, setRecreateResult] = useState(null)
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

  async function handleCheckReception() {
    if (!currentFarm) return

    try {
      setLoading(true)
      setError('')
      const report = await compareReceptionToFishInstances(currentFarm.farmId)
      setReceptionReport(report)
    } catch (err) {
      setError('שגיאה בבדיקת קליטה: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRecreate() {
    if (!currentFarm) return

    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך ליצור ${receptionReport.missingCount} רשומות דגים חסרות?\n\n` +
        'פעולה זו תיצור fish_instances לדגים שנקלטו אבל לא נוצרו במערכת.'
    )

    if (!confirmed) return

    try {
      setLoading(true)
      setError('')
      const result = await recreateMissingFishInstances(currentFarm.farmId)
      setRecreateResult(result)
      setReceptionReport(null) // Clear report after recreation
    } catch (err) {
      setError('שגיאה ביצירת דגים: ' + err.message)
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">תיקון דגים מיובאים</h1>
        <p className="text-sm text-gray-600 mb-6">
          כלי זה מתקן בעיות של דגים מיובאים שלא מופיעים באקווריומים.
        </p>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">{error}</div>
        )}

        {/* Reception Recreation Result */}
        {recreateResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
            <div className="font-bold mb-2">✅ {recreateResult.message}</div>
            <div className="text-sm">נוצרו {recreateResult.created} רשומות דגים חדשות</div>
            <div className="text-xs mt-2 text-green-600">
              עכשיו הרץ "תקן פניות אקווריומים" בשלב הבא
            </div>
          </div>
        )}

        {/* Aquarium Fix Result */}
        {fixResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
            <div className="font-bold mb-2">✅ התיקון הושלם בהצלחה!</div>
            <div className="text-sm">עודכנו {fixResult.updatedCount} אקווריומים</div>
            <div className="text-xs mt-2 text-green-600">
              רענן את הדף כדי לראות את השינויים
            </div>
          </div>
        )}

        {/* Step 0: Check Reception */}
        {!receptionReport && !recreateResult && !debugReport && !fixResult && (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="font-semibold text-purple-900 mb-2">שלב 1: בדוק דגים שנקלטו</div>
              <div className="text-sm text-purple-700 mb-4">
                בדוק אילו דגים סומנו כ"התקבלו" אבל לא נוצרה להם רשומה במערכת
              </div>
              <button
                onClick={handleCheckReception}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'בודק...' : 'בדוק קליטה'}
              </button>
            </div>
          </div>
        )}

        {/* Reception Report */}
        {receptionReport && (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="font-semibold text-orange-900 mb-2">
                נמצאו {receptionReport.missingCount} דגים חסרים!
              </div>
              <div className="bg-white rounded border border-orange-200 p-3 mb-4">
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-semibold">פריטים שהתקבלו:</span>{' '}
                    {receptionReport.summary.totalReceivedItems}
                  </div>
                  <div>
                    <span className="font-semibold">רשומות דגים קיימות:</span>{' '}
                    {receptionReport.summary.totalFishInstances}
                  </div>
                  <div>
                    <span className="font-semibold">דגים חסרים:</span>{' '}
                    {receptionReport.summary.missingCount}
                  </div>
                </div>
              </div>
              {receptionReport.missingCount > 0 && (
                <>
                  <div className="text-sm text-orange-700 mb-4">דגים שצריך ליצור:</div>
                  <div className="bg-white rounded border border-orange-200 p-3 max-h-48 overflow-y-auto mb-4">
                    <div className="space-y-1 text-sm">
                      {receptionReport.missingFish.map((fish, idx) => (
                        <div key={idx}>
                          • {fish.hebrewName} ({fish.quantity} יח') → אקווריום {fish.targetAquariumNumber}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRecreate}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
                    >
                      {loading ? 'יוצר...' : `צור ${receptionReport.missingCount} דגים`}
                    </button>
                    <button
                      onClick={() => setReceptionReport(null)}
                      disabled={loading}
                      className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
                    >
                      ביטול
                    </button>
                  </div>
                </>
              )}
              {receptionReport.missingCount === 0 && (
                <div className="text-sm text-green-700">✅ כל הדגים שנקלטו קיימים במערכת!</div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Debug Aquarium References */}
        {!debugReport && !fixResult && (recreateResult || receptionReport?.missingCount === 0) && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-semibold text-blue-900 mb-2">שלב 2: תקן פניות אקווריומים</div>
              <div className="text-sm text-blue-700 mb-4">
                עכשיו צריך לעדכן את האקווריומים שיצביעו על הדגים שנוצרו
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
