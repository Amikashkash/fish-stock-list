/**
 * Farm type definitions
 */

/**
 * @typedef {Object} FarmAddress
 * @property {string} street
 * @property {string} city
 * @property {string} state
 * @property {string} zipCode
 * @property {string} country
 */

/**
 * @typedef {Object} FarmContact
 * @property {string} phone
 * @property {string} email
 * @property {string} website
 */

/**
 * @typedef {Object} Farm
 * @property {string} farmId - Unique farm identifier
 * @property {string} name - Farm name
 * @property {string} ownerId - User ID of the owner
 * @property {string} ownerName - Display name of owner
 * @property {string} ownerEmail - Email of owner
 * @property {FarmAddress} [address] - Farm address
 * @property {FarmContact} [contact] - Contact information
 * @property {string} [description] - Farm description
 * @property {string} [logoUrl] - URL to farm logo
 * @property {Array<string>} memberIds - Array of user IDs who are members
 * @property {Object<string, string>} memberRoles - Map of userId to role (owner, manager, staff)
 * @property {Object} settings - Farm settings
 * @property {string} settings.currency - Default currency (ILS, USD, EUR, etc.)
 * @property {string} settings.language - Default language (he, en)
 * @property {string} settings.timezone - Timezone
 * @property {Array<{id: string, label: string}>} settings.aquariumRooms - Custom aquarium room types
 * @property {Array<{id: string, label: string, color: string}>} settings.aquariumStatuses - Custom aquarium statuses
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

export default {}
