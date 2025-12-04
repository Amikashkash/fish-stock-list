/**
 * Farm Settings Modal
 * Allows farm owners to edit farm details
 */

import { useState, useEffect } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { updateFarm } from '../../../services/farm.service'
import { useFarm } from '../../../contexts/FarmContext'

function FarmSettingsModal({ isOpen, onClose }) {
  const { currentFarm, updateCurrentFarm } = useFarm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [farmData, setFarmData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Israel',
    },
    contact: {
      phone: '',
      email: '',
      website: '',
    },
  })

  // Load current farm data when modal opens
  useEffect(() => {
    if (isOpen && currentFarm) {
      setFarmData({
        name: currentFarm.name || '',
        description: currentFarm.description || '',
        address: currentFarm.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Israel',
        },
        contact: currentFarm.contact || {
          phone: '',
          email: '',
          website: '',
        },
      })
    }
  }, [isOpen, currentFarm])

  function handleChange(field, value) {
    setFarmData((prev) => ({ ...prev, [field]: value }))
  }

  function handleAddressChange(field, value) {
    setFarmData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }))
  }

  function handleContactChange(field, value) {
    setFarmData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }))
  }

  async function handleSave() {
    if (!currentFarm) {
      setError('No farm selected')
      return
    }

    if (!farmData.name.trim()) {
      setError('Farm name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const updates = {
        name: farmData.name.trim(),
        description: farmData.description.trim(),
        address: farmData.address,
        contact: farmData.contact,
      }

      await updateFarm(currentFarm.farmId, updates)
      updateCurrentFarm(updates)

      handleClose()
    } catch (err) {
      console.error('Error updating farm:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setError(null)
    onClose()
  }

  if (!currentFarm) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Farm Settings" size="lg">
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Farm Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={farmData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter farm name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={farmData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tell us about your farm"
              />
            </div>
          </div>
        </div>

        {/* Owner Info (Read-only) */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Owner Information
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Name:</span>
              <span className="text-sm font-medium text-gray-900">
                {currentFarm.ownerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm font-medium text-gray-900">
                {currentFarm.ownerEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street
              </label>
              <input
                type="text"
                value={farmData.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={farmData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Region
              </label>
              <input
                type="text"
                value={farmData.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="State or region"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code
              </label>
              <input
                type="text"
                value={farmData.address.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Zip code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={farmData.address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={farmData.contact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={farmData.contact.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Email address"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={farmData.contact.website}
                onChange={(e) => handleContactChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={loading} disabled={!farmData.name.trim()}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default FarmSettingsModal
