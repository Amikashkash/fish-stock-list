function ExcelTemplateDisplay({ onClose }) {
  const templateColumns = [
    {
      name: 'שם מדעי',
      key: 'scientificName',
      example: 'Oreochromis niloticus',
      description: 'השם המדעי של המין (חובה)',
    },
    {
      name: 'כמות',
      key: 'quantity',
      example: '100',
      description: 'מספר הדגים במשלוח (חובה)',
    },
    {
      name: 'גודל',
      key: 'size',
      example: 'S / M / L',
      description: 'קטגוריית הגודל (חובה)',
    },
    {
      name: 'מספר קטלוג',
      key: 'code',
      example: 'CAT-001',
      description: 'מספר הזיהוי מהספק (רשות)',
    },
    {
      name: 'מספר ארגז',
      key: 'boxNumber',
      example: 'Box-001',
      description: 'מספר מזהה הארגז (רשות)',
    },
    {
      name: 'חלק ארגז',
      key: 'boxPortion',
      example: 'חצי / רבע / שלם',
      description: 'איזה חלק מהארגז (רבע, חצי, שלם וכו\') (רשות)',
    },
  ]

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">📊 טבלת פורמט Excel</h3>
        <p className="text-sm text-gray-600">
          הנה הפורמט הצפוי לקובץ Excel שתעלה. חשוב שהעמודות יהיו בהיגיון הזה.
        </p>
      </div>

      {/* Visual Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100 border border-blue-200">
              {templateColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-bold text-gray-900 border border-blue-200"
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                scientificName: 'Oreochromis niloticus',
                quantity: '50',
                size: 'M',
                code: 'NILO-001',
                boxNumber: 'Box-101',
                boxPortion: 'חצי',
              },
              {
                scientificName: 'Clarias gariepinus',
                quantity: '30',
                size: 'L',
                code: 'CLAR-002',
                boxNumber: 'Box-102',
                boxPortion: 'שלם',
              },
              {
                scientificName: 'Mugil cephalus',
                quantity: '100',
                size: 'S',
                code: 'MUGIL-003',
                boxNumber: 'Box-103',
                boxPortion: 'רבע',
              },
            ].map((row, idx) => (
              <tr key={idx} className="border border-gray-200 hover:bg-gray-50">
                {templateColumns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm text-gray-700 border border-gray-200"
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Column Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {templateColumns.map((col) => (
          <div key={col.key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="font-semibold text-gray-900 mb-1">{col.name}</div>
            <div className="text-xs text-gray-600 mb-2">
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                {col.key}
              </span>
              <span className="text-gray-500">{col.description}</span>
            </div>
            <div className="text-sm text-gray-700 font-mono bg-white p-2 rounded border border-gray-300">
              דוגמה: {col.example}
            </div>
          </div>
        ))}
      </div>

      {/* Important Notes */}
      <div className="space-y-3 mb-6">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <span className="font-semibold">⚠️ חשוב:</span> ודא שהשורה הראשונה מכילה כותרות עמודות
          </div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <span className="font-semibold">ℹ️ הערה:</span> אתה יכול להוסיף עמודות נוספות (שם עברי, הערות וכו')
            - המערכת תשאל אותך לכל נתון חסר
          </div>
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            <span className="font-semibold">✅ גמישות:</span> שם עברי של הדג יוכל להתייחס למספר שורות
            (לדוגמה, כל הטילפיה בגודל M תוכל להיות בשורה אחת עם כמות)
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300 transition-all"
        >
          הבנתי
        </button>
      </div>
    </div>
  )
}

export default ExcelTemplateDisplay
