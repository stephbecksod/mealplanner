import { useState } from 'react'
import { useMealPlan } from '../context/MealPlanContext'
import { useFavorites } from '../context/FavoritesContext'
import MealCard from '../components/MealCard'
import GroceryList from '../components/GroceryList'

const MealPlan = () => {
  const { mealPlan, regenerateMeal, removeMeal, clearMealPlan, loading, addMeal, generateNewMeal } = useMealPlan()
  const { savedRecipes } = useFavorites()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmType, setConfirmType] = useState(null)
  const [confirmMealId, setConfirmMealId] = useState(null)
  const [showAddMealModal, setShowAddMealModal] = useState(false)
  const [generatingMeal, setGeneratingMeal] = useState(false)

  if (!mealPlan || !mealPlan.dinners || mealPlan.dinners.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            No meal plan yet
          </h2>
          <p className="text-gray-600 mb-6">
            Generate your first meal plan to get started!
          </p>
          <a href="/" className="btn-primary inline-block">
            Generate Meal Plan
          </a>
        </div>
      </div>
    )
  }

  const handleRegenerateClick = (mealId) => {
    setConfirmType('regenerate')
    setConfirmMealId(mealId)
    setShowConfirm(true)
  }

  const handleRemoveClick = (mealId) => {
    setConfirmType('remove')
    setConfirmMealId(mealId)
    setShowConfirm(true)
  }

  const handleClearAllClick = () => {
    setConfirmType('clearAll')
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    try {
      if (confirmType === 'regenerate') {
        const meal = mealPlan.dinners.find(d => d.id === confirmMealId)
        await regenerateMeal(confirmMealId, {
          servings: meal.servings,
          dietaryPreferences: mealPlan.dietaryPreferences || [],
          cuisinePreferences: mealPlan.cuisinePreferences || [],
        })
      } else if (confirmType === 'remove') {
        await removeMeal(confirmMealId)
      } else if (confirmType === 'clearAll') {
        clearMealPlan()
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setShowConfirm(false)
      setConfirmType(null)
      setConfirmMealId(null)
    }
  }

  const handleAddFromFavorites = (recipe) => {
    addMeal(recipe, 4)
    setShowAddMealModal(false)
  }

  const handleGenerateNewMeal = async () => {
    setGeneratingMeal(true)
    try {
      await generateNewMeal(4)
      setShowAddMealModal(false)
    } catch (error) {
      console.error('Failed to generate new meal:', error)
    } finally {
      setGeneratingMeal(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          This Week's Meal Plan
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddMealModal(true)}
            className="btn-outline"
          >
            Add Meal
          </button>
          <button
            onClick={handleClearAllClick}
            className="bg-red-100 text-red-700 hover:bg-red-200 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {mealPlan.dinners.map((dinner, index) => (
            <MealCard
              key={dinner.id}
              dinner={dinner}
              dayNumber={index + 1}
              onRegenerate={() => handleRegenerateClick(dinner.id)}
              onRemove={() => handleRemoveClick(dinner.id)}
            />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <GroceryList />
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmType === 'regenerate' &&
                'Are you sure you want to regenerate this meal? This will replace it with a new recipe.'}
              {confirmType === 'remove' &&
                'Are you sure you want to remove this meal from your plan?'}
              {confirmType === 'clearAll' &&
                'Are you sure you want to clear all meals and start over?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Add Meal
              </h3>
              <button
                onClick={() => setShowAddMealModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Generate New Meal Option */}
            <div className="mb-6">
              <button
                onClick={handleGenerateNewMeal}
                disabled={generatingMeal}
                className={`w-full p-4 border-2 rounded-lg transition-colors flex items-center justify-center gap-3 ${
                  generatingMeal
                    ? 'border-primary-300 bg-primary-50 cursor-wait'
                    : 'border-primary-500 bg-primary-50 hover:bg-primary-100'
                }`}
              >
                {generatingMeal ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="font-semibold text-primary-700">Generating New Meal...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-semibold text-primary-700">Generate New Meal</span>
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 text-center mt-2">
                Let AI create a new recipe for you
              </p>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or add from favorites</span>
              </div>
            </div>

            {/* Favorites Section */}
            {savedRecipes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No saved recipes yet. Save some favorites first!
              </p>
            ) : (
              <div className="space-y-3">
                {savedRecipes.map((recipe) => (
                  <div key={recipe.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <h4 className="font-bold text-gray-800">{recipe.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{recipe.cuisine}</p>
                    <button
                      onClick={() => handleAddFromFavorites(recipe)}
                      className="btn-primary text-sm"
                    >
                      Add to Week
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MealPlan
