/**
 * ShipmentImportModal.jsx
 *
 * Complete shipment import flow:
 * 1. File upload
 * 2. Parse Excel
 * 3. Preview & validate
 * 4. Confirm and import to Firestore
 */

import { useState, useEffect, useRef } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { parseShipmentExcel, validateExcelFile } from '../../../services/excel-parser.service'
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

  /**
   * Load suppliers for autocomplete
   */
  async function loadSuppliers() {
    try {
      const supplierList = await getSuppliers(farmId)
      setSuppliers(supplierList)
    } catch (err) {
      console.error('Error loading suppliers:', err)
    }
  }

  /**
   * Format date to Israeli format (DD/MM/YYYY)
   */
  function formatDateToIsraeli(date) {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  /**
   * Parse Israeli date to ISO format for storage
   */
  function parseIsraeliDate(dateStr) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Handle supplier input change
   */
  function handleSupplierChange(value) {
    setShipmentData({ ...shipmentData, supplier: value })

    // Filter suppliers
    if (value.trim()) {
      const filtered = suppliers.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSuppliers(filtered)
      setShowSupplierDropdown(true)
    } else {
      setFilteredSuppliers(suppliers)
      setShowSupplierDropdown(false)
    }
  }

  /**
   * Handle supplier selection from dropdown
   */
  function handleSupplierSelect(supplier) {
    setShipmentData({ ...shipmentData, supplier })
    setShowSupplierDropdown(false)
  }

  /**
   * Handle file selection
   */
  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file
    const validation = validateExcelFile(selectedFile)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  /**
   * Parse the selected Excel file
   */
  async function handleParse() {
    if (!file) return

    try {
      setLoading(true)
      setError(null)

      const result = await parseShipmentExcel(file)

      if (!result.success) {
        setError(result.error)
        return
      }

      setParseResult(result)
      setStep('preview')

    } catch (err) {
      console.error('Parse error:', err)
      setError('Failed to parse Excel file. Please check the format.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle final import to Firestore
   */
  async function handleImport() {
    if (!parseResult || !farmId) return

    // Validate shipment metadata
    if (!shipmentData.supplier.trim()) {
      setError('Supplier name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setStep('importing')

      // Convert Israeli date to ISO format for storage
      const shipmentDataForImport = {
        ...shipmentData,
        dateReceived: parseIsraeliDate(shipmentData.dateReceived),
      }

      // Import to Firestore
      const result = await importShipment(
        farmId,
        shipmentDataForImport,
        parseResult.data
      )

      console.log('Import successful:', result)

      // Show success
      setStep('success')

      // Call success callback after a delay
      setTimeout(() => {
        onSuccess?.(result)
        handleClose()
      }, 2000)

    } catch (err) {
      console.error('Import error:', err)
      setError(`Import failed: ${err.message}`)
      setStep('preview') // Go back to preview
    } finally {
      setLoading(false)
    }
  }

  /**
   * Close modal and reset state
   */
  function handleClose() {
    setStep('upload')
    setFile(null)
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

  /**
   * Render upload step
   */
  function renderUploadStep() {
    return (
      <div className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel File
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm text-gray-600 mb-2">
                Click to select Excel file
              </p>
              <p className="text-xs text-gray-500">
                Supports .xlsx and .xls files (max 10MB)
              </p>
            </label>
          </div>
          {file && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <p className="text-sm font-medium text-green-900">File selected</p>
                  <p className="text-xs text-green-700">{file.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shipment Metadata */}
        <div className="space-y-4">
          <div ref={supplierInputRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Name <span className="text-red-500">*</span>
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
              placeholder="Enter or select supplier name"
              autoComplete="off"
            />
            {/* Supplier Dropdown */}
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredSuppliers.map((supplier, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSupplierSelect(supplier)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                  >
                    <span className="text-sm text-gray-900">{supplier}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Received <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shipmentData.dateReceived}
              onChange={(e) => setShipmentData({ ...shipmentData, dateReceived: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="DD/MM/YYYY"
              pattern="\d{2}/\d{2}/\d{4}"
            />
            <p className="text-xs text-gray-500 mt-1">Format: DD/MM/YYYY (e.g., 04/12/2024)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={shipmentData.notes}
              onChange={(e) => setShipmentData({ ...shipmentData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add any notes about this shipment"
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
        {(!file || !shipmentData.supplier.trim()) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>To continue:</strong> {!file && 'Select an Excel file'}
              {!file && !shipmentData.supplier.trim() && ' and '}
              {file && !shipmentData.supplier.trim() && 'Enter supplier name'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleParse}
            disabled={!file || !shipmentData.supplier.trim()}
            loading={loading}
            title={
              !file ? 'Please select a file first' :
              !shipmentData.supplier.trim() ? 'Please enter supplier name' :
              'Click to parse and preview the file'
            }
          >
            Parse & Preview
          </Button>
        </div>
      </div>
    )
  }

  /**
   * Render preview step
   */
  function renderPreviewStep() {
    if (!parseResult) return null

    return (
      <div className="space-y-6">
        <ImportPreview
          data={parseResult.data}
          summary={parseResult.summary}
          error={error}
        />

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep('upload')}
          >
            Back
          </Button>
          <Button
            onClick={handleImport}
            disabled={parseResult.summary.errorRows > 0}
            loading={loading}
          >
            Confirm Import ({parseResult.summary.totalRows} items)
          </Button>
        </div>
      </div>
    )
  }

  /**
   * Render importing step
   */
  function renderImportingStep() {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4" />
        <p className="text-lg font-medium text-gray-900">Importing shipment...</p>
        <p className="text-sm text-gray-600 mt-2">Please wait while we save your data</p>
      </div>
    )
  }

  /**
   * Render success step
   */
  function renderSuccessStep() {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <p className="text-xl font-semibold text-gray-900 mb-2">Import Successful!</p>
        <p className="text-gray-600">Shipment has been imported successfully</p>
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === 'upload' ? 'Import Shipment' :
        step === 'preview' ? 'Preview & Validate' :
        step === 'importing' ? 'Importing...' :
        'Success!'
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
