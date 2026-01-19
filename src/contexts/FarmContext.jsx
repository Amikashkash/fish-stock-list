/**
 * Farm Context
 * Manages current farm state across the application
 */

import { createContext, useState, useEffect, useContext } from 'react'
import { auth } from '../firebase/config'
import { getUserFarms, updateFarm } from '../services/farm.service'

// Default aquarium settings for migration
const DEFAULT_AQUARIUM_SETTINGS = {
  aquariumRooms: [],
  aquariumStatuses: [
    { id: 'empty', label: 'ריק', color: '#95a5a6' },
    { id: 'occupied', label: 'תפוס', color: '#3498db' },
    { id: 'maintenance', label: 'תחזוקה', color: '#f39c12' },
    { id: 'in-transfer', label: 'בהעברה', color: '#9b59b6' },
  ],
  fishSources: [
    { id: 'local_delivery', label: 'משלוח מקומי' },
    { id: 'farm_breeding', label: 'ריבוי בחווה' },
    { id: 'store_return', label: 'החזרה מחנות' },
  ],
}

const FarmContext = createContext()

export function FarmProvider({ children }) {
  const [currentFarm, setCurrentFarm] = useState(null)
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load user's farms when authenticated
  useEffect(() => {
    const user = auth.currentUser

    if (!user) {
      setFarms([])
      setCurrentFarm(null)
      setLoading(false)
      return
    }

    loadUserFarms(user.uid)
  }, [])

  /**
   * Migrate farm to add missing aquarium settings
   */
  async function migrateFarmSettings(farm) {
    try {
      // Check if farm needs migration
      if (!farm.settings?.aquariumRooms || !farm.settings?.aquariumStatuses || !farm.settings?.fishSources) {
        console.log(`Migrating farm ${farm.name} with settings...`)

        const updates = {
          settings: {
            ...DEFAULT_AQUARIUM_SETTINGS,  // Defaults first
            ...farm.settings,              // Then farm settings to override
          },
        }

        await updateFarm(farm.farmId, updates)

        // Return updated farm
        return {
          ...farm,
          ...updates,
        }
      }

      return farm
    } catch (err) {
      console.error('Error migrating farm:', err)
      return farm // Return original farm if migration fails
    }
  }

  /**
   * Load all farms for the current user
   */
  async function loadUserFarms(userId) {
    try {
      setLoading(true)
      setError(null)

      let userFarms = await getUserFarms(userId)

      // Migrate farms if needed
      userFarms = await Promise.all(userFarms.map((farm) => migrateFarmSettings(farm)))

      setFarms(userFarms)

      // Auto-select first farm if available
      if (userFarms.length > 0 && !currentFarm) {
        setCurrentFarm(userFarms[0])
        localStorage.setItem('currentFarmId', userFarms[0].farmId)
      } else {
        // Try to restore previously selected farm
        const savedFarmId = localStorage.getItem('currentFarmId')
        if (savedFarmId) {
          const savedFarm = userFarms.find((f) => f.farmId === savedFarmId)
          if (savedFarm) {
            setCurrentFarm(savedFarm)
          }
        }
      }
    } catch (err) {
      console.error('Error loading farms:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Switch to a different farm
   */
  function switchFarm(farmId) {
    const farm = farms.find((f) => f.farmId === farmId)
    if (farm) {
      setCurrentFarm(farm)
      localStorage.setItem('currentFarmId', farmId)
    }
  }

  /**
   * Add a newly created farm to the list
   */
  function addFarm(farm) {
    setFarms((prev) => [...prev, farm])
    setCurrentFarm(farm)
    localStorage.setItem('currentFarmId', farm.farmId)
  }

  /**
   * Update the current farm data
   */
  function updateCurrentFarm(updates) {
    if (!currentFarm) return

    const updatedFarm = { ...currentFarm, ...updates }
    setCurrentFarm(updatedFarm)

    // Update in farms list
    setFarms((prev) =>
      prev.map((f) => (f.farmId === updatedFarm.farmId ? updatedFarm : f))
    )
  }

  /**
   * Reload farms from Firestore
   */
  async function reloadFarms() {
    const user = auth.currentUser
    if (user) {
      await loadUserFarms(user.uid)
    }
  }

  const value = {
    currentFarm,
    farms,
    loading,
    error,
    switchFarm,
    addFarm,
    updateCurrentFarm,
    reloadFarms,
  }

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}

/**
 * Hook to use farm context
 */
export function useFarm() {
  const context = useContext(FarmContext)
  if (!context) {
    throw new Error('useFarm must be used within FarmProvider')
  }
  return context
}

export default FarmContext
