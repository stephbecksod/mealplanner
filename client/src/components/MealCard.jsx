import { useState } from 'react'
import { useFavorites } from '../context/FavoritesContext'
import RecipeDetail from './RecipeDetail'

const MealCard = ({ dinner, onRegenerate, onRemove, showActions = true }) => {
  const [showDetail, setShowDetail] = useState(false)
  const { saveRecipe, isRecipeSaved } = useFavorites()
  const isSaved = isRecipeSaved(dinner.recipe.id)

  const handleSave = () => {
    const success = saveRecipe(dinner.recipe)
    if (success) {
      alert('Recipe saved to favorites!')
    } else {
      alert('Recipe is already in favorites')
    }
  }

  return (
    <>
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {dinner.recipe.name}
            </h3>
            <p className="text-sm text-gray-500">{dinner.dayOfWeek}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaved}
              className={`p-2 rounded-lg transition-colors ${
                isSaved
                  ? 'text-yellow-500 bg-yellow-50'
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
              title={isSaved ? 'Already saved' : 'Save to favorites'}
            >
              <svg className="w-6 h-6" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Cuisine:</span> {dinner.recipe.cuisine}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Servings:</span> {dinner.servings} people
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Time:</span> {dinner.recipe.prepTime} min prep, {dinner.recipe.cookTime} min cook
          </p>
          {dinner.recipe.dietaryInfo && dinner.recipe.dietaryInfo.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {dinner.recipe.dietaryInfo.map((info, idx) => (
                <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {info}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowDetail(true)}
            className="flex-1 btn-primary"
          >
            View Recipe
          </button>
          {showActions && (
            <>
              <button
                onClick={onRegenerate}
                className="flex-1 btn-outline"
              >
                Regenerate
              </button>
              <button
                onClick={onRemove}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition-colors"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {showDetail && (
        <RecipeDetail
          recipe={dinner.recipe}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}

export default MealCard
