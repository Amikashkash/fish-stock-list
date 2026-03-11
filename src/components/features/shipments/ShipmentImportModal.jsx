/**
 * ShipmentImportModal.jsx
 *
 * Shipment import flow powered by Claude AI:
 * 1. Upload any document (PDF, Excel, image, CSV, text) OR paste invoice text
 * 2. Claude extracts fish data → Preview & validate
 * 3. Confirm and import to Firestore
 */

import { useState, useEffect, useRef } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { parseShipmentWithClaude } from '../../../services/claude-parser.service'
import { importShipment } from '../../../services/shipment.service'
import { getSuppliers } from '../../../services/supplier.service'
import ImportPreview from './ImportPreview'

/**
 * ShipmentImportModal component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {string} props.farmId - Current farm ID
 * @param {Function} props.onSuccess - Success callback
 */
function ShipmentImportModal({ isOpen, onClose, farmId, onSuccess }) {
  // State
  const [step, setStep] = useState('upload') // 'upload', 'preview', 'importing', 'success'
  const [file, setFile] = useState(null)
  const [pastedText, setPastedText] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [shipmentData, setShipmentData] = useState({
    supplier: '',
    dateReceived: formatDateToIsraeli(new Date()),
    notes: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const supplierInputRef = useRef(null)

  // Load suppliers when modal opens
  useEffect(() => {
    if (isOpen && farmId) {
      loadSuppliers()
    }
  }, [isOpen, farmId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (supplierInputRef.current && !supplierInputRef.current.contains(event.target)) {
        setShowSupplierDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadSuppliers() {
    try {
      const supplierList = await getSuppliers(farmId)
      setSuppliers(supplierList)
    } catch (err) {
      console.error('Error loading suppliers:', err)
    }
  }

  function formatDateToIsraeli(date) {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  function parseIsraeliDate(dateStr) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return new Date().toISOString().split('T')[0]
  }

  function handleSupplierChange(value) {
    setShipmentData({ ...shipmentData, supplier: value })
    if (value.trim()) {
      const filtered = suppliers.filter(s => s.toLowerCase().includes(value.toLowerCase()))
      setFilteredSuppliers(filtered)
      setShowSupplierDropdown(true)
    } else {
      setFilteredSuppliers(suppliers)
      setShowSupplierDropdown(false)
    }
  }

  function handleSupplierSelect(supplier) {
    setShipmentData({ ...shipmentData, supplier })
    setShowSupplierDropdown(false)
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setPastedText('') // clear text if file is chosen
    setError(null)
  }

  /**
   * Send document to Claude AI for extraction
   */
  async function handleAnalyze() {
    const hasInput = file || pastedText.trim()
    if (!hasInput) return

    try {
      setLoading(true)
      setError(null)

      const result = await parseShipmentWithClaude(file, pastedText)

      if (!result.success) {
        setError(result.error)
        return
      }

      // Pre-fill supplier/date if Claude found them in the document
      if (result.extractedMeta) {
        setShipmentData(prev => ({
          ...prev,
          supplier: result.extractedMeta.supplier && !prev.supplier.trim()
            ? result.extractedMeta.supplier
            : prev.supplier,
          dateReceived: result.extractedMeta.dateReceived && prev.dateReceived === formatDateToIsraeli(new Date())
            ? result.extractedMeta.dateReceived
            : prev.dateReceived,
        }))
      }

      setParseResult(result)
      setStep('preview')

    } catch (err) {
      console.error('Claude analysis error:', err)
      setError('שגיאה בניתוח המסמך. בדוק את מפתח ה-API ונסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle final import to Firestore
   */
  async function handleImport() {
    if (!parseResult || !farmId) return

    if (!shipmentData.supplier.trim()) {
      setError('שם ספק הוא שדה חובה')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setStep('importing')

      const shipmentDataForImport = {
        ...shipmentData,
        dateReceived: parseIsraeliDate(shipmentData.dateReceived),
      }

      // Only pass valid rows to the import
      const validItems = parseResult.data.filter(item => item.isValid)
      const result = await importShipment(farmId, shipmentDataForImport, validItems)
      console.log('Import successful:', result)

      setStep('success')
      setTimeout(() => {
        onSuccess?.(result)
        handleClose()
      }, 2000)

    } catch (err) {
      console.error('Import error:', err)
      setError(`שגיאה ביבוא: ${err.message}`)
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('upload')
    setFile(null)
    setPastedText('')
    setParseResult(null)
    setShipmentData({
      supplier: '',
      dateReceived: formatDateToIsraeli(new Date()),
      notes: '',
    })
    setError(null)
    setLoading(false)
    setShowSupplierDropdown(false)
    onClose()
  }

  function renderUploadStep() {
    const hasInput = file || pastedText.trim()

    return (
      <div className="space-y-6" dir="rtl">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            העלה חשבונית או מסמך
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,.txt,image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">🤖</div>
              <p className="text-sm text-gray-600 mb-1">
                לחץ להעלאת קובץ — PDF, אקסל, CSV, תמונה או טקסט
              </p>
              <p className="text-xs text-gray-500">
                בינה מלאכותית תחלץ את נתוני הדגים אוטומטית
              </p>
            </label>
          </div>
          {file && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <span className="text-blue-600 text-xl">📎</span>
              <div>
                <p className="text-sm font-medium text-blue-900">קובץ מוכן</p>
                <p className="text-xs text-blue-700">{file.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mr-auto text-xs text-blue-500 hover:text-blue-700"
              >
                הסר
              </button>
            </div>
          )}
        </div>

        {/* OR divider + paste area */}
        {!file && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 font-medium">או</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                הדבק טקסט חשבונית
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-mono"
                placeholder="הדבק כאן טקסט מהחשבונית — עברית, אנגלית, טבלאות, הכל..."
              />
            </div>
          </>
        )}

        {/* Shipment Metadata */}
        <div className="space-y-4">
          <div ref={supplierInputRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם ספק <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shipmentData.supplier}
              onChange={(e) => handleSupplierChange(e.target.value)}
              onFocus={() => {
                if (suppliers.length > 0) {
                  setFilteredSuppliers(suppliers)
                  setShowSupplierDropdown(true)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="הזן או בחר שם ספק"
              autoComplete="off"
            />
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredSuppliers.map((supplier, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSupplierSelect(supplier)}
                    className="w-full text-right px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                  >
                    <span className="text-sm text-gray-900">{supplier}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תאריך קבלה <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shipmentData.dateReceived}
              onChange={(e) => setShipmentData({ ...shipmentData, dateReceived: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="DD/MM/YYYY"
              pattern="\d{2}/\d{2}/\d{4}"
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">פורמט: DD/MM/YYYY (לדוגמה: 04/12/2024)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              הערות (לא חובה)
            </label>
            <textarea
              value={shipmentData.notes}
              onChange={(e) => setShipmentData({ ...shipmentData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="הוסף הערות לגבי המשלוח"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Help Text */}
        {!hasInput && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              העלה קובץ חשבונית או הדבק טקסט, ולאחר מכן הזן את שם הספק.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-start">
          <Button variant="outline" onClick={handleClose}>
            ביטול
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={!hasInput || !shipmentData.supplier.trim()}
            loading={loading}
            title={
              !hasInput ? 'העלה קובץ או הדבק טקסט תחילה' :
              !shipmentData.supplier.trim() ? 'הזן שם ספק' :
              'נתח עם Claude AI'
            }
          >
            {loading ? 'מנתח...' : '✨ נתח עם AI'}
          </Button>
        </div>
      </div>
    )
  }

  function renderPreviewStep() {
    if (!parseResult) return null

    const validCount = parseResult.summary.validRows

    return (
      <div className="space-y-6" dir="rtl">
        <ImportPreview
          data={parseResult.data}
          summary={parseResult.summary}
          error={error}
        />

        {parseResult.summary.errorRows > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            {parseResult.summary.errorRows} שורות שגויות יידלגו — רק {validCount} פריטים תקינים ייובאו.
          </div>
        )}

        <div className="flex gap-3 justify-start pt-4 border-t">
          <Button variant="outline" onClick={() => setStep('upload')}>
            חזרה
          </Button>
          <Button
            onClick={handleImport}
            disabled={validCount === 0}
            loading={loading}
          >
            אשר יבוא ({validCount} פריטים תקינים)
          </Button>
        </div>
      </div>
    )
  }

  function renderImportingStep() {
    return (
      <div className="text-center py-12" dir="rtl">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4" />
        <p className="text-lg font-medium text-gray-900">מייבא משלוח...</p>
        <p className="text-sm text-gray-600 mt-2">אנא המתן בזמן שהנתונים נשמרים</p>
      </div>
    )
  }

  function renderSuccessStep() {
    return (
      <div className="text-center py-12" dir="rtl">
        <div className="text-6xl mb-4">✅</div>
        <p className="text-xl font-semibold text-gray-900 mb-2">היבוא הושלם בהצלחה!</p>
        <p className="text-gray-600">המשלוח יובא בהצלחה</p>
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === 'upload' ? 'יבוא משלוח עם AI' :
        step === 'preview' ? 'תצוגה מקדימה ואימות' :
        step === 'importing' ? 'מייבא...' :
        'הצלחה!'
      }
      size={step === 'preview' ? 'xl' : 'lg'}
    >
      {step === 'upload' && renderUploadStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'importing' && renderImportingStep()}
      {step === 'success' && renderSuccessStep()}
    </Modal>
  )
}

export default ShipmentImportModal
