/**
 * @typedef {'empty' | 'occupied' | 'in-transfer' | 'maintenance'} AquariumStatus
 * @typedef {'bottom' | 'middle' | 'top'} ShelfLevel
 * @typedef {'reception' | 'main' | 'quarantine' | 'display'} RoomType
 */

/**
 * @typedef {Object} FishInAquarium
 * @property {string} instanceId - Fish instance ID
 * @property {number} quantity - Number of fish in this aquarium
 * @property {Date} dateAdded - When fish were added to aquarium
 */

/**
 * @typedef {Object} Aquarium
 * @property {string} aquariumId - Unique identifier
 * @property {string} aquariumNumber - User-defined number (e.g., "A-01", "14a")
 *
 * Physical properties
 * @property {ShelfLevel} shelf - Position on shelf
 * @property {number} volume - Volume in liters
 * @property {string} room - Room/location (customizable per farm)
 *
 * Status
 * @property {AquariumStatus} status - Current status
 *
 * Fish tracking
 * @property {FishInAquarium[]} fishInstances - Fish currently in aquarium
 * @property {number} totalFish - Total number of fish
 * @property {number} occupancyRate - Occupancy percentage (0-1)
 *
 * Maintenance
 * @property {Date|null} [lastCleaned] - Last cleaning date
 * @property {Date|null} [lastWaterChange] - Last water change date
 *
 * @property {string} [notes] - Additional notes
 *
 * Metadata
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Creates a new aquarium object with default values
 * @param {Partial<Aquarium>} data - Aquarium data
 * @returns {Aquarium}
 */
export function createAquarium(data) {
  const now = new Date()

  return {
    aquariumId: data.aquariumId || '',
    aquariumNumber: data.aquariumNumber || '',

    // Physical properties
    shelf: data.shelf || 'bottom',
    volume: data.volume || 0,
    room: data.room || 'main',

    // Status
    status: data.status || 'empty',

    // Fish tracking
    fishInstances: data.fishInstances || [],
    totalFish: data.totalFish || 0,
    occupancyRate: data.occupancyRate || 0,

    // Maintenance
    lastCleaned: data.lastCleaned || null,
    lastWaterChange: data.lastWaterChange || null,

    notes: data.notes || '',

    // Metadata
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  }
}

/**
 * Validates aquarium data
 * @param {Partial<Aquarium>} data - Aquarium data to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateAquarium(data) {
  const errors = []

  if (!data.aquariumNumber || data.aquariumNumber.trim() === '') {
    errors.push('Aquarium number is required')
  }

  if (!data.volume || data.volume <= 0) {
    errors.push('Volume must be greater than 0')
  }

  if (!data.room || data.room.trim() === '') {
    errors.push('Room/Location is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
