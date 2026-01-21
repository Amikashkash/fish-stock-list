/**
 * ImportPreview.jsx
 *
 * Displays parsed Excel data with validation results.
 * Simplified version - only 3 mandatory fields:
 * 1. Scientific Name (שם מדעי)
 * 2. Size (גודל)
 * 3. Box Number (מספר ארגז)
 */

import { cn } from '../../../lib/utils/cn'

/**
 * ImportPreview component
 *
 * @param {Object} props
 * @param {Array} props.data - Parsed shipment data
 * @param {Object} props.summary - Summary statistics
 * @param {string} props.error - Error message if any
 */
function ImportPreview({ data, summary, error }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        לא נמצאו נתונים להצגה
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="סה״כ שורות"
          value={summary.totalRows}
          icon="📊"
          color="blue"
        />
        <SummaryCard
          label="תקינות"
          value={summary.validRows}
          icon="✅"
          color="green"
        />
        {summary.errorRows > 0 && (
          <SummaryCard
            label="שגיאות"
            value={summary.errorRows}
            icon="❌"
            color="red"
          />
        )}
      </div>

      {/* Error Banner */}
      {summary.errorRows > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-red-900 mb-1">
                לא ניתן לייבא - {summary.errorRows} שורות עם שגיאות
              </p>
              <p className="text-sm text-red-700">
                יש לתקן את השגיאות בקובץ האקסל או לערוך אותן למטה לפני הייבוא.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">
                  שורה
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">
                  מספר ארגז
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">
                  שם מדעי
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">
                  גודל
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">
                  סטטוס
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <DataRow key={index} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm justify-end">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
          <span className="text-gray-600">תקין</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
          <span className="text-gray-600">שגיאה</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Summary card component
 */
function SummaryCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  }

  return (
    <div className={cn('border rounded-lg p-4', colors[color])}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

/**
 * Data row component - simplified for 3 mandatory fields
 */
function DataRow({ row }) {
  const hasErrors = row.errors && row.errors.length > 0

  const rowClass = cn(
    'hover:bg-gray-50 transition-colors',
    hasErrors && 'bg-red-50',
    !hasErrors && 'bg-green-50'
  )

  return (
    <>
      <tr className={rowClass}>
        <td className="px-3 py-3 text-sm text-gray-500 text-right">
          {row.rowNumber}
        </td>
        <td className="px-3 py-3 text-sm text-gray-900 text-right font-medium">
          {row.boxNumber}
        </td>
        <td className="px-3 py-3 text-sm text-gray-900 text-right">
          {row.scientificName}
        </td>
        <td className="px-3 py-3 text-sm text-gray-600 text-right">
          {row.size}
        </td>
        <td className="px-3 py-3 text-sm text-right">
          {hasErrors ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              שגיאה
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              תקין
            </span>
          )}
        </td>
      </tr>
      {/* Error Details Row */}
      {hasErrors && (
        <tr className={rowClass}>
          <td colSpan="5" className="px-3 py-2 text-right">
            <div className="space-y-1">
              {row.errors?.map((error, i) => (
                <div key={i} className="text-xs text-red-700 flex items-center gap-2 justify-end">
                  <span>{error.message}</span>
                  <span>❌</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default ImportPreview
