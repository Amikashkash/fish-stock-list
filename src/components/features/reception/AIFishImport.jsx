/**
 * AIFishImport.jsx
 *
 * Compact AI-powered fish import widget for the reception plan Step 2.
 * Accepts PDF, Excel, CSV, images, or pasted text → Claude extracts fish rows
 * → each item is saved as a reception_item linked to the plan.
 */

import { useState } from 'react'
import { parseShipmentWithClaude } from '../../../services/claude-parser.service'
import { addReceptionItem } from '../../../services/reception.service'

/**
 * Map Claude-extracted items to reception_item schema.
 * hebrewName falls back to commonName → scientificName.
 * quantity uses totalQuantity → bags*qtyPerBag → 1.
 */
function mapToReceptionItem(item, planId) {
  const quantity =
    item.totalQuantity ||
    (item.bags && item.qtyPerBag ? item.bags * item.qtyPerBag : null) ||
    1

  return {
    planId,
    hebrewName: item.commonName?.trim() || item.scientificName || '',
    scientificName: item.scientificName || '',
    size: item.size || '',
    boxNumber: item.boxNumber?.toString() || '',
    code: item.code || '',
    quantity,
    price: item.price ?? null,
    targetAquariumId: null,
    targetAquariumNumber: '',
    targetRoom: '',
  }
}

/**
 * AIFishImport component
 *
 * @param {string} farmId
 * @param {string} planId
 * @param {Function} onImported(count) - called after items saved to Firestore
 */
function AIFishImport({ farmId, planId, onImported }) {
  const [file, setFile] = useState(null)
  const [pastedText, setPastedText] = useState('')
  const [showPaste, setShowPaste] = useState(false)

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)
  const [result, setResult] = useState(null) // parseShipmentWithClaude result

  // Adding state
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPastedText('')
    setResult(null)
    setAnalyzeError(null)
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setAnalyzeError(null)
    setResult(null)

    const parsed = await parseShipmentWithClaude(file, pastedText)
    setAnalyzing(false)

    if (!parsed.success) {
      setAnalyzeError(parsed.error)
      return
    }
    setResult(parsed)
  }

  async function handleAddToPlan() {
    if (!result) return
    const validItems = result.data.filter(r => r.isValid)
    if (validItems.length === 0) return

    setAdding(true)
    setAddError(null)

    try {
      for (const item of validItems) {
        await addReceptionItem(farmId, mapToReceptionItem(item, planId))
      }
      onImported(validItems.length)
      // Reset
      setFile(null)
      setPastedText('')
      setResult(null)
      setShowPaste(false)
    } catch (err) {
      console.error('Error adding items to plan:', err)
      setAddError(`שגיאה בשמירה: ${err.message}`)
    } finally {
      setAdding(false)
    }
  }

  const hasInput = file || pastedText.trim()
  const validCount = result?.data?.filter(r => r.isValid).length ?? 0
  const errorCount = result?.summary?.errorRows ?? 0

  return (
    <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <div>
          <div className="font-semibold text-purple-900 text-sm">ייבוא עם Claude AI</div>
          <div className="text-xs text-purple-700">העלה חשבונית, אקסל, PDF, תמונה או הדבק טקסט</div>
        </div>
      </div>

      {/* File input */}
      {!result && (
        <>
          <div className="flex items-center gap-2">
            <label
              htmlFor="ai-fish-upload"
              className="flex-1 cursor-pointer flex items-center gap-2 px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm hover:bg-purple-50 transition-colors"
            >
              <span>📎</span>
              <span className="text-gray-700 truncate">
                {file ? file.name : 'בחר קובץ...'}
              </span>
              <input
                id="ai-fish-upload"
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.txt,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => { setShowPaste(p => !p); setFile(null) }}
              className="px-3 py-2 text-xs text-purple-700 border border-purple-300 bg-white rounded-lg hover:bg-purple-50 transition-colors whitespace-nowrap"
            >
              {showPaste ? 'סגור טקסט' : '✏️ הדבק טקסט'}
            </button>
          </div>

          {showPaste && !file && (
            <textarea
              value={pastedText}
              onChange={(e) => { setPastedText(e.target.value); setResult(null); setAnalyzeError(null) }}
              rows={4}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm font-mono focus:outline-none focus:border-purple-500 bg-white"
              placeholder="הדבק כאן טקסט חשבונית, רשימת מחירים או כל טקסט אחר..."
            />
          )}
        </>
      )}

      {/* Analyze error */}
      {analyzeError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {analyzeError}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-2">
          <div className={`p-2 rounded text-xs font-medium ${
            errorCount > 0 ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
            'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {errorCount > 0
              ? `נמצאו ${result.summary.totalRows} שורות — ${validCount} תקינות, ${errorCount} עם שגיאות`
              : `✅ נמצאו ${validCount} דגים תקינים`
            }
          </div>

          {/* Item preview */}
          <div className="max-h-36 overflow-y-auto space-y-1">
            {result.data.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                  item.isValid ? 'bg-white border border-gray-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <span>{item.isValid ? '✅' : '❌'}</span>
                <span className="flex-1 truncate font-medium">{item.scientificName || '—'}</span>
                <span className="text-gray-500">{item.size}</span>
                <span className="text-gray-400">ארגז {item.boxNumber}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setResult(null); setFile(null); setPastedText('') }}
            className="text-xs text-purple-600 hover:underline"
          >
            נקה ונסה שוב
          </button>
        </div>
      )}

      {/* Add error */}
      {addError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {addError}
        </div>
      )}

      {/* Action buttons */}
      {!result ? (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!hasInput || analyzing}
          className="w-full py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {analyzing ? '⏳ מנתח עם AI...' : '✨ נתח עם AI'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAddToPlan}
          disabled={validCount === 0 || adding}
          className="w-full py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {adding ? '⏳ שומר...' : `➕ הוסף ${validCount} דגים לתוכנית`}
        </button>
      )}
    </div>
  )
}

export default AIFishImport
