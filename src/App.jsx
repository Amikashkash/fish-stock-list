import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FarmProvider } from './contexts/FarmContext'
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

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
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
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/welcome" /> : <LoginPage />}
            />
            <Route
              path="/welcome"
              element={user ? <WelcomePage /> : <Navigate to="/login" />}
            />
            <Route
              path="/home"
              element={user ? <HomePage /> : <Navigate to="/login" />}
            />
            <Route
              path="/aquariums"
              element={user ? <AquariumsPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/settings"
              element={user ? <FarmSettingsPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={<Navigate to={user ? "/welcome" : "/login"} />}
            />
          </Routes>
        </Router>
      </FarmProvider>
    </QueryClientProvider>
  )
}

export default App
