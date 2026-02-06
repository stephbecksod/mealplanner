import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { MealPlanProvider } from './context/MealPlanContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { ToastProvider } from './components/Toast'
import Navigation from './components/Navigation'
import OfflineBanner from './components/OfflineBanner'
import DataMigrationModal from './components/DataMigrationModal'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import MealPlan from './pages/MealPlan'
import Favorites from './pages/Favorites'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <MealPlanProvider>
            <FavoritesProvider>
              <OfflineBanner />
              <DataMigrationModal />
              <div className="min-h-screen bg-gray-50">
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Home />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/meal-plan"
                      element={
                        <ProtectedRoute>
                          <MealPlan />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </FavoritesProvider>
          </MealPlanProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
