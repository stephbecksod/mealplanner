import { useState } from 'react'
import { useFavorites } from '../context/FavoritesContext'
import { useMealPlan } from '../context/MealPlanContext'
import RecipeDetail from './RecipeDetail'
import SideDishDetail from './SideDishDetail'
import BeverageDetail from './BeverageDetail'

const StarIcon = ({ filled, className = "w-4 h-4" }) => (
  <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

const MealCard = ({ dinner, onRegenerate, onRemove, showActions = true }) => {
  const [showMainDetail, setShowMainDetail] = useState(false)
  const [showSideDetail, setShowSideDetail] = useState(false)
  const [showBeverageDetail, setShowBeverageDetail] = useState(null)

  const { saveRecipe, saveCocktail, isRecipeSaved, isCocktailSaved, saveSideDish, isSideDishSaved, removeRecipe, removeSideDish: removeSideDishFromFavorites, removeCocktail: removeCocktailFromFavorites } = useFavorites()
  const {
    addSideDish,
    removeSideDish,
    addCocktail,
    addWinePairing,
    removeCocktail,
    removeWinePairing,
    loading,
  } = useMealPlan()

  const mainDish = dinner.mainDish || dinner.recipe
  const sideDish = dinner.sideDish
  const beveragePairing = dinner.beveragePairing

  const isMainSaved = isRecipeSaved(mainDish?.id)
  const isSideSaved = sideDish && isSideDishSaved ? isSideDishSaved(sideDish.id) : false
  const isCocktailSavedFlag = beveragePairing?.cocktail && isCocktailSaved(beveragePairing.cocktail.id)

  const handleToggleMainFavorite = () => {
    if (isMainSaved) {
      removeRecipe(mainDish.id)
    } else {
      saveRecipe(mainDish)
    }
  }

  const handleToggleSideFavorite = () => {
    if (isSideSaved) {
      removeSideDishFromFavorites(sideDish.id)
    } else if (saveSideDish) {
      saveSideDish(sideDish)
    }
  }

  const handleToggleCocktailFavorite = () => {
    if (isCocktailSavedFlag) {
      removeCocktailFromFavorites(beveragePairing.cocktail.id)
    } else {
      saveCocktail(beveragePairing.cocktail)
    }
  }

  const handleAddSideDish = async () => {
    try {
      await addSideDish(dinner.id)
    } catch (error) {
      console.error('Failed to add side dish:', error)
    }
  }

  const handleRemoveSideDish = async () => {
    try {
      await removeSideDish(dinner.id)
    } catch (error) {
      console.error('Failed to remove side dish:', error)
    }
  }

  const handleAddCocktail = async () => {
    try {
      await addCocktail(dinner.id)
    } catch (error) {
      console.error('Failed to add cocktail:', error)
    }
  }

  const handleAddWine = async () => {
    try {
      await addWinePairing(dinner.id)
    } catch (error) {
      console.error('Failed to add wine pairing:', error)
    }
  }

  const handleRemoveCocktail = async () => {
    try {
      await removeCocktail(dinner.id)
    } catch (error) {
      console.error('Failed to remove cocktail:', error)
    }
  }

  const handleRemoveWine = async () => {
    try {
      await removeWinePairing(dinner.id)
    } catch (error) {
      console.error('Failed to remove wine:', error)
    }
  }

  const totalTime = (mainDish?.prepTime || 0) + (mainDish?.cookTime || 0)

  return (
    <>
      <div className="card hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="mb-4 pb-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-primary-600">{dinner.dayOfWeek}</p>
        </div>

        {/* Main Dish Section */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Main</p>
              <h3 className="text-lg font-bold text-gray-800">{mainDish?.name}</h3>
              <p className="text-sm text-gray-500">
                {mainDish?.cuisine} | {totalTime} min | {dinner.servings} servings
              </p>
              {mainDish?.dietaryInfo && mainDish.dietaryInfo.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {mainDish.dietaryInfo.slice(0, 3).map((info, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      {info}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 ml-3">
              <button
                onClick={() => setShowMainDetail(true)}
                className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                View Recipe
              </button>
              <button
                onClick={handleToggleMainFavorite}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isMainSaved
                    ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                }`}
                title={isMainSaved ? 'Remove from favorites' : 'Save to favorites'}
              >
                <StarIcon filled={isMainSaved} />
              </button>
            </div>
          </div>
        </div>

        {/* Side Dish Section */}
        <div className="mb-4">
          {sideDish ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Side</p>
                  <p className="text-sm font-medium text-gray-700">{sideDish.name}</p>
                  <span className="text-xs text-gray-500 capitalize">{sideDish.type}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSideDetail(true)}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    View Recipe
                  </button>
                  <button
                    onClick={handleToggleSideFavorite}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isSideSaved
                        ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                        : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                    }`}
                    title={isSideSaved ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <StarIcon filled={isSideSaved} />
                  </button>
                </div>
              </div>
              {showActions && (
                <button
                  onClick={handleRemoveSideDish}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove side
                </button>
              )}
            </>
          ) : showActions ? (
            <button
              onClick={handleAddSideDish}
              disabled={loading}
              className="w-full py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 border border-dashed border-gray-300 hover:border-primary-300 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Side Dish
            </button>
          ) : (
            <p className="text-sm text-gray-400 italic">No side dish</p>
          )}
        </div>

        {/* Cocktail Section */}
        <div className="mb-4">
          {beveragePairing?.cocktail ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cocktail</p>
                  <p className="text-sm font-medium text-gray-700">{beveragePairing.cocktail.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowBeverageDetail('cocktail')}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    View Recipe
                  </button>
                  <button
                    onClick={handleToggleCocktailFavorite}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isCocktailSavedFlag
                        ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                        : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                    }`}
                    title={isCocktailSavedFlag ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <StarIcon filled={isCocktailSavedFlag} />
                  </button>
                </div>
              </div>
              {showActions && (
                <button
                  onClick={handleRemoveCocktail}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove cocktail
                </button>
              )}
            </>
          ) : showActions ? (
            <button
              onClick={handleAddCocktail}
              disabled={loading}
              className="w-full py-2 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 border border-dashed border-gray-300 hover:border-purple-300 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Cocktail
            </button>
          ) : (
            <p className="text-sm text-gray-400 italic">No cocktail</p>
          )}
        </div>

        {/* Wine Section */}
        <div className="mb-4">
          {beveragePairing?.wine ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Wine</p>
                  <p className="text-sm font-medium text-gray-700">{beveragePairing.wine.type}</p>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => setShowBeverageDetail('wine')}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    View Pairing
                  </button>
                  {/* Spacer to align with other rows that have star buttons */}
                  <div className="w-7" />
                </div>
              </div>
              {showActions && (
                <button
                  onClick={handleRemoveWine}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove wine
                </button>
              )}
            </>
          ) : showActions ? (
            <button
              onClick={handleAddWine}
              disabled={loading}
              className="w-full py-2 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 border border-dashed border-gray-300 hover:border-purple-300 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Wine Pairing
            </button>
          ) : (
            <p className="text-sm text-gray-400 italic">No wine pairing</p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={onRegenerate}
              disabled={loading}
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
          </div>
        )}
      </div>

      {/* Modals */}
      {showMainDetail && mainDish && (
        <RecipeDetail
          recipe={mainDish}
          onClose={() => setShowMainDetail(false)}
        />
      )}

      {showSideDetail && sideDish && (
        <SideDishDetail
          sideDish={sideDish}
          onClose={() => setShowSideDetail(false)}
        />
      )}

      {showBeverageDetail && beveragePairing && (
        <BeverageDetail
          beveragePairing={beveragePairing}
          type={showBeverageDetail}
          onClose={() => setShowBeverageDetail(null)}
        />
      )}
    </>
  )
}

export default MealCard
