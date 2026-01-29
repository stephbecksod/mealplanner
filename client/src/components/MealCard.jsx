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

const MealCard = ({ dinner, dayNumber, onRegenerate, onRemove, showActions = true }) => {
  const [showMainDetail, setShowMainDetail] = useState(false)
  const [showSideDetail, setShowSideDetail] = useState(null) // stores sideDish object
  const [showBeverageDetail, setShowBeverageDetail] = useState(null) // 'wine' or cocktail object
  const [loadingAction, setLoadingAction] = useState(null) // 'sideDish', 'cocktail', 'wine'

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
  const isAlaCarte = dinner.isAlaCarte

  // Support both old (sideDish) and new (sideDishes) format
  const sideDishes = dinner.sideDishes || (dinner.sideDish ? [dinner.sideDish] : [])

  // Support both old (cocktail) and new (cocktails) format
  const beveragePairing = dinner.beveragePairing
  const cocktails = beveragePairing?.cocktails ||
    (beveragePairing?.cocktail ? [beveragePairing.cocktail] : [])
  const wine = beveragePairing?.wine

  // For a la carte items, determine what sections to show
  const hasSideDishes = sideDishes.length > 0
  const hasCocktails = cocktails.length > 0
  const showSideSection = !isAlaCarte || hasSideDishes || mainDish
  const showCocktailSection = !isAlaCarte || hasCocktails || mainDish

  const isMainSaved = mainDish && isRecipeSaved(mainDish.id)

  const handleToggleMainFavorite = () => {
    if (isMainSaved) {
      removeRecipe(mainDish.id)
    } else {
      saveRecipe(mainDish)
    }
  }

  const handleToggleSideFavorite = (sideDish) => {
    const isSaved = isSideDishSaved ? isSideDishSaved(sideDish.id) : false
    if (isSaved) {
      removeSideDishFromFavorites(sideDish.id)
    } else if (saveSideDish) {
      saveSideDish(sideDish)
    }
  }

  const handleToggleCocktailFavorite = (cocktail) => {
    const isSaved = isCocktailSaved(cocktail.id)
    if (isSaved) {
      removeCocktailFromFavorites(cocktail.id)
    } else {
      saveCocktail(cocktail)
    }
  }

  const handleAddSideDish = async () => {
    setLoadingAction('sideDish')
    try {
      await addSideDish(dinner.id)
    } catch (error) {
      console.error('Failed to add side dish:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRemoveSideDish = async (sideDishId) => {
    try {
      await removeSideDish(dinner.id, sideDishId)
    } catch (error) {
      console.error('Failed to remove side dish:', error)
    }
  }

  const handleAddCocktail = async () => {
    setLoadingAction('cocktail')
    try {
      await addCocktail(dinner.id)
    } catch (error) {
      console.error('Failed to add cocktail:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleAddWine = async () => {
    setLoadingAction('wine')
    try {
      await addWinePairing(dinner.id)
    } catch (error) {
      console.error('Failed to add wine pairing:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRemoveCocktail = async (cocktailId) => {
    try {
      await removeCocktail(dinner.id, cocktailId)
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
          {isAlaCarte ? (
            <p className="text-sm font-semibold text-purple-600">A la carte</p>
          ) : (
            <p className="text-sm font-semibold text-primary-600">Day {dayNumber}</p>
          )}
        </div>

        {/* Main Dish Section - only show if there's a main dish */}
        {mainDish && (
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Main</p>
                <h3 className="text-lg font-bold text-gray-800">{mainDish.name}</h3>
                <p className="text-sm text-gray-500">
                  {mainDish.cuisine} | {totalTime} min | {dinner.servings} servings
                </p>
                {mainDish.dietaryInfo && mainDish.dietaryInfo.length > 0 && (
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
        )}

        {/* Side Dishes Section - hide for a la carte cocktail-only items */}
        {showSideSection && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {sideDishes.length > 1 ? 'Sides' : 'Side'}
          </p>

          {sideDishes.length > 0 ? (
            <div className="space-y-2">
              {sideDishes.map((sideDish, idx) => {
                const isSaved = isSideDishSaved ? isSideDishSaved(sideDish.id) : false
                return (
                  <div key={sideDish.id || idx} className="flex items-center justify-between py-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{sideDish.name}</p>
                      <span className="text-xs text-gray-500 capitalize">{sideDish.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowSideDetail(sideDish)}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        View Recipe
                      </button>
                      <button
                        onClick={() => handleToggleSideFavorite(sideDish)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSaved
                            ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                        }`}
                        title={isSaved ? 'Remove from favorites' : 'Save to favorites'}
                      >
                        <StarIcon filled={isSaved} />
                      </button>
                      {showActions && (
                        <button
                          onClick={() => handleRemoveSideDish(sideDish.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove side dish"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !showActions ? (
            <p className="text-sm text-gray-400 italic">No side dish</p>
          ) : null}

          {/* Add Side Dish button - only show if we have a main dish */}
          {showActions && mainDish && (
            <button
              onClick={handleAddSideDish}
              disabled={loading || loadingAction === 'sideDish'}
              className={`w-full py-2 mt-2 text-sm font-medium border border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                loadingAction === 'sideDish'
                  ? 'text-primary-600 bg-primary-50 border-primary-300 cursor-wait'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50 border-gray-300 hover:border-primary-300'
              }`}
            >
              {loadingAction === 'sideDish' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Side Dish...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Side Dish
                </>
              )}
            </button>
          )}
        </div>
        )}

        {/* Cocktails Section - hide for a la carte side-dish-only items */}
        {showCocktailSection && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {cocktails.length > 1 ? 'Cocktails' : 'Cocktail'}
          </p>

          {cocktails.length > 0 ? (
            <div className="space-y-2">
              {cocktails.map((cocktail, idx) => {
                const isSaved = isCocktailSaved(cocktail.id)
                return (
                  <div key={cocktail.id || idx} className="flex items-center justify-between py-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{cocktail.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowBeverageDetail(cocktail)}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        View Recipe
                      </button>
                      <button
                        onClick={() => handleToggleCocktailFavorite(cocktail)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSaved
                            ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                        }`}
                        title={isSaved ? 'Remove from favorites' : 'Save to favorites'}
                      >
                        <StarIcon filled={isSaved} />
                      </button>
                      {showActions && (
                        <button
                          onClick={() => handleRemoveCocktail(cocktail.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove cocktail"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !showActions ? (
            <p className="text-sm text-gray-400 italic">No cocktail</p>
          ) : null}

          {/* Add Cocktail button - only show if we have a main dish */}
          {showActions && mainDish && (
            <button
              onClick={handleAddCocktail}
              disabled={loading || loadingAction === 'cocktail'}
              className={`w-full py-2 mt-2 text-sm font-medium border border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                loadingAction === 'cocktail'
                  ? 'text-purple-600 bg-purple-50 border-purple-300 cursor-wait'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 border-gray-300 hover:border-purple-300'
              }`}
            >
              {loadingAction === 'cocktail' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Cocktail...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Cocktail
                </>
              )}
            </button>
          )}
        </div>
        )}

        {/* Wine Section - only show if we have a main dish */}
        {mainDish && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Wine</p>
            {wine ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{wine.type}</p>
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
                    {showActions && (
                      <button
                        onClick={handleRemoveWine}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove wine"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : showActions ? (
              <button
                onClick={handleAddWine}
                disabled={loading || loadingAction === 'wine'}
                className={`w-full py-2 text-sm font-medium border border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  loadingAction === 'wine'
                    ? 'text-purple-600 bg-purple-50 border-purple-300 cursor-wait'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 border-gray-300 hover:border-purple-300'
                }`}
              >
                {loadingAction === 'wine' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Wine Pairing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Wine Pairing
                  </>
                )}
              </button>
            ) : (
              <p className="text-sm text-gray-400 italic">No wine pairing</p>
            )}
          </div>
        )}

        {/* Actions - only show for meals with main dish */}
        {showActions && mainDish && (
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

        {/* Actions for a la carte items (no main dish) */}
        {showActions && !mainDish && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={onRemove}
              className="flex-1 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition-colors"
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

      {showSideDetail && (
        <SideDishDetail
          sideDish={showSideDetail}
          onClose={() => setShowSideDetail(null)}
        />
      )}

      {showBeverageDetail && showBeverageDetail !== 'wine' && (
        <BeverageDetail
          beveragePairing={{ cocktail: showBeverageDetail }}
          type="cocktail"
          onClose={() => setShowBeverageDetail(null)}
        />
      )}

      {showBeverageDetail === 'wine' && beveragePairing && (
        <BeverageDetail
          beveragePairing={beveragePairing}
          type="wine"
          onClose={() => setShowBeverageDetail(null)}
        />
      )}
    </>
  )
}

export default MealCard
