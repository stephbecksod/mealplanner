import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MealPlanProvider } from './context/MealPlanContext'
import { FavoritesProvider } from './context/FavoritesContext'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import MealPlan from './pages/MealPlan'
import Favorites from './pages/Favorites'

function App() {
  return (
    <Router>
      <MealPlanProvider>
        <FavoritesProvider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/meal-plan" element={<MealPlan />} />
                <Route path="/favorites" element={<Favorites />} />
              </Routes>
            </main>
          </div>
        </FavoritesProvider>
      </MealPlanProvider>
    </Router>
  )
}

export default App
