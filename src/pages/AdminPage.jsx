import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CleanupPanel from '../components/features/admin/CleanupPanel'

function AdminPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">ניהול מערכת</h1>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ← חזור לדף הבית
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CleanupPanel />
      </div>
    </div>
  )
}

export default AdminPage
