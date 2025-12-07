import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FarmProvider, useFarm } from './contexts/FarmContext'
import { auth } from './firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import WelcomePage from './pages/WelcomePage'
import AquariumsPage from './pages/AquariumsPage'
import FarmSettingsPage from './pages/FarmSettingsPage'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

function AppRoutes() {
  const { farms, loading: farmsLoading } = useFarm()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Wait for auth and farms to load before making routing decisions
  if (authLoading || farmsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 text-base">טוען...</p>
      </div>
    )
  }

  const hasFarms = farms.length > 0

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={hasFarms ? "/home" : "/welcome"} /> : <LoginPage />}
      />
      <Route
        path="/welcome"
        element={user ? (hasFarms ? <Navigate to="/home" /> : <WelcomePage />) : <Navigate to="/login" />}
      />
      <Route
        path="/home"
        element={user ? (hasFarms ? <HomePage /> : <Navigate to="/welcome" />) : <Navigate to="/login" />}
      />
      <Route
        path="/aquariums"
        element={user ? (hasFarms ? <AquariumsPage /> : <Navigate to="/welcome" />) : <Navigate to="/login" />}
      />
      <Route
        path="/settings"
        element={user ? (hasFarms ? <FarmSettingsPage /> : <Navigate to="/welcome" />) : <Navigate to="/login" />}
      />
      <Route
        path="/"
        element={<Navigate to={user ? (hasFarms ? "/home" : "/welcome") : "/login"} />}
      />
    </Routes>
  )
}

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 text-base">טוען...</p>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <FarmProvider>
        <Router>
          <AppRoutes />
        </Router>
      </FarmProvider>
    </QueryClientProvider>
  )
}

export default App
