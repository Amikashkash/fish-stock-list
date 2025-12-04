/**
 * ImportPreview.jsx
 *
 * Displays parsed Excel data with validation results.
 * Shows summary statistics, errors, warnings, and data table.
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
        No data to preview
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Rows"
          value={summary.totalRows}
          icon="📊"
          color="blue"
        />
        <SummaryCard
          label="Valid"
          value={summary.validRows}
          icon="✅"
          color="green"
        />
        {summary.errorRows > 0 && (
          <SummaryCard
            label="Errors"
            value={summary.errorRows}
            icon="❌"
            color="red"
          />
        )}
        {summary.missingCodes > 0 && (
          <SummaryCard
            label="Missing Codes"
            value={summary.missingCodes}
            icon="⚠️"
            color="yellow"
          />
        )}
      </div>

      {/* Totals */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600 font-medium">Total Fish</p>
            <p className="text-2xl font-bold text-blue-900">{summary.totalFish}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600 font-medium">Total Cost</p>
            <p className="text-2xl font-bold text-blue-900">
              {summary.totalCost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {summary.errorRows > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-red-900 mb-1">
                Cannot Import - {summary.errorRows} rows have errors
              </p>
              <p className="text-sm text-red-700">
                Please fix the errors in your Excel file or edit them below before importing.
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
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Row
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Code
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Scientific Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Common Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
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
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
          <span className="text-gray-600">Valid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
          <span className="text-gray-600">Has Errors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
          <span className="text-gray-600">Has Warnings</span>
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
 * Data row component
 */
function DataRow({ row }) {
  const hasErrors = row.errors && row.errors.length > 0
  const hasWarnings = row.warnings && row.warnings.length > 0

  const rowClass = cn(
    'hover:bg-gray-50 transition-colors',
    hasErrors && 'bg-red-50',
    !hasErrors && hasWarnings && 'bg-yellow-50',
    !hasErrors && !hasWarnings && 'bg-green-50'
  )

  return (
    <>
      <tr className={rowClass}>
        <td className="px-3 py-4 text-sm text-gray-500">
          {row.rowNumber}
        </td>
        <td className="px-3 py-4 text-sm">
          <div className="flex items-center gap-2">
            {row.codeStatus === 'missing' && (
              <span className="text-yellow-500" title="Code missing">⚠️</span>
            )}
            <span className={cn(
              'font-mono text-xs',
              row.codeStatus === 'missing' && 'text-yellow-700'
            )}>
              {row.code}
            </span>
          </div>
        </td>
        <td className="px-3 py-4 text-sm text-gray-900">
          {row.scientificName}
        </td>
        <td className="px-3 py-4 text-sm text-gray-900">
          {row.commonName}
        </td>
        <td className="px-3 py-4 text-sm text-gray-600">
          {row.size}
        </td>
        <td className="px-3 py-4 text-sm text-gray-900 text-right font-medium">
          {row.total}
        </td>
        <td className="px-3 py-4 text-sm text-gray-900 text-right">
          {row.price?.toFixed(2)} {row.currency}
        </td>
        <td className="px-3 py-4 text-sm">
          {hasErrors && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Error
            </span>
          )}
          {!hasErrors && hasWarnings && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Warning
            </span>
          )}
          {!hasErrors && !hasWarnings && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Valid
            </span>
          )}
        </td>
      </tr>
      {/* Error/Warning Details Row */}
      {(hasErrors || hasWarnings) && (
        <tr className={rowClass}>
          <td colSpan="8" className="px-3 py-2">
            <div className="space-y-1">
              {row.errors?.map((error, i) => (
                <div key={i} className="text-xs text-red-700 flex items-start gap-2">
                  <span>❌</span>
                  <span><strong>{error.field}:</strong> {error.message}</span>
                </div>
              ))}
              {row.warnings?.map((warning, i) => (
                <div key={i} className="text-xs text-yellow-700 flex items-start gap-2">
                  <span>⚠️</span>
                  <span><strong>{warning.field}:</strong> {warning.message}</span>
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
