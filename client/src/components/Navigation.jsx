import { Link, useLocation } from 'react-router-dom'

const Navigation = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-primary-700 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold">
            Meal Planner
          </Link>

          <div className="flex space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-primary-800 font-semibold'
                  : 'hover:bg-primary-600'
              }`}
            >
              Home
            </Link>
            <Link
              to="/meal-plan"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive('/meal-plan')
                  ? 'bg-primary-800 font-semibold'
                  : 'hover:bg-primary-600'
              }`}
            >
              This Week
            </Link>
            <Link
              to="/favorites"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive('/favorites')
                  ? 'bg-primary-800 font-semibold'
                  : 'hover:bg-primary-600'
              }`}
            >
              Favorites
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
