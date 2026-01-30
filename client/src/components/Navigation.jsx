import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, signOut } = useAuth()

  const isActive = (path) => location.pathname === path

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  return (
    <nav className="bg-primary-700 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold">
            Meal Planner
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
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
                <span className="text-primary-200 text-sm px-2">
                  {user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg bg-primary-800 hover:bg-primary-900 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive('/login')
                      ? 'bg-primary-800 font-semibold'
                      : 'hover:bg-primary-600'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive('/register')
                      ? 'bg-primary-800 font-semibold'
                      : 'hover:bg-primary-600'
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
