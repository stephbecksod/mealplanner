import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMealPlan } from '../context/MealPlanContext'
import { useFavorites } from '../context/FavoritesContext'
import { migrationService } from '../services/supabaseData'

const DataMigrationModal = () => {
  const { isAuthenticated, user } = useAuth()
  const { refreshMealPlan } = useMealPlan()
  const { refreshFavorites } = useFavorites()

  const [showModal, setShowModal] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [progress, setProgress] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  // Check for localStorage data when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      const hasData = migrationService.hasLocalData()
      const hasMigrated = migrationService.hasMigrated()

      if (hasData && !hasMigrated) {
        setShowModal(true)
      }
    }
  }, [isAuthenticated, user])

  const handleMigrate = async () => {
    setMigrating(true)
    setError(null)
    setProgress('Starting migration...')

    try {
      const migrationResults = await migrationService.migrateFromLocalStorage(setProgress)
      setResults(migrationResults)

      // Refresh data from Supabase
      await Promise.all([
        refreshMealPlan(),
        refreshFavorites(),
      ])

      setProgress('Migration complete!')
    } catch (err) {
      console.error('Migration failed:', err)
      setError(err.message || 'Migration failed. Please try again.')
    } finally {
      setMigrating(false)
    }
  }

  const handleClearLocal = () => {
    migrationService.clearLocalStorage()
    setShowModal(false)
  }

  const handleSkip = () => {
    // Mark as migrated so we don't ask again
    migrationService.markMigrated()
    setShowModal(false)
  }

  const handleClose = () => {
    setShowModal(false)
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Migrate Your Data
            </h2>
            <p className="text-sm text-gray-500">
              Found existing data on this device
            </p>
          </div>
        </div>

        {/* Content */}
        {!results ? (
          <>
            <p className="text-gray-600 mb-4">
              We found meal plans and favorites stored locally on this device.
              Would you like to migrate them to your account so they sync across all your devices?
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {migrating && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-blue-700">{progress}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {migrating ? 'Migrating...' : 'Migrate Data'}
              </button>
              <button
                onClick={handleSkip}
                disabled={migrating}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Skip (Start Fresh)
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500 text-center">
              If you skip, your local data will remain but won't be synced to your account.
            </p>
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Migration Complete!</h3>
              <p className="text-gray-600 text-sm">Your data has been synced to your account.</p>
            </div>

            {/* Results summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Migrated:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {results.mealPlan && <li>Current meal plan with dinners</li>}
                {results.recipes > 0 && <li>{results.recipes} saved recipe{results.recipes !== 1 ? 's' : ''}</li>}
                {results.cocktails > 0 && <li>{results.cocktails} saved cocktail{results.cocktails !== 1 ? 's' : ''}</li>}
                {results.sideDishes > 0 && <li>{results.sideDishes} saved side dish{results.sideDishes !== 1 ? 'es' : ''}</li>}
                {!results.mealPlan && results.recipes === 0 && results.cocktails === 0 && results.sideDishes === 0 && (
                  <li>No data to migrate</li>
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleClearLocal}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Clear Local Data & Continue
              </button>
              <button
                onClick={handleClose}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Keep Local Data
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500 text-center">
              We recommend clearing local data to avoid confusion.
              Your data is now safely stored in your account.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default DataMigrationModal
