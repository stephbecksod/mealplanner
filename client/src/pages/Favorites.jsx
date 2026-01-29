import { useState } from 'react'
import { useFavorites } from '../context/FavoritesContext'
import { useMealPlan } from '../context/MealPlanContext'
import RecipeDetail from '../components/RecipeDetail'
import SideDishDetail from '../components/SideDishDetail'
import BeverageDetail from '../components/BeverageDetail'

const Favorites = () => {
  const { savedRecipes, savedCocktails, savedSideDishes, removeRecipe, removeCocktail, removeSideDish } = useFavorites()
  const { mealPlan, addMeal, addSideDishToMeal, addCocktailToMeal, addAlaCarteSideDish, addAlaCarteCocktail } = useMealPlan()

  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [selectedSideDish, setSelectedSideDish] = useState(null)
  const [selectedCocktail, setSelectedCocktail] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state for adding to week
  const [addToWeekModal, setAddToWeekModal] = useState(null) // { type: 'sideDish' | 'cocktail', item: object }

  // Loading and recently added states
  const [addingItemId, setAddingItemId] = useState(null)
  const [recentlyAddedIds, setRecentlyAddedIds] = useState(new Set())

  const filteredRecipes = savedRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCocktails = savedCocktails.filter(cocktail =>
    cocktail.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSideDishes = (savedSideDishes || []).filter(sideDish =>
    sideDish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sideDish.type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get non-a-la-carte meals for the day selection
  const regularMeals = (mealPlan?.dinners || []).filter(d => !d.isAlaCarte)

  // Check if items are already in the meal plan
  const isRecipeInMealPlan = (recipeId) => {
    if (!mealPlan?.dinners) return false
    return mealPlan.dinners.some(d => d.mainDish?.id === recipeId)
  }

  const isSideDishInMealPlan = (sideDishId) => {
    if (!mealPlan?.dinners) return false
    return mealPlan.dinners.some(d => {
      const sides = d.sideDishes || (d.sideDish ? [d.sideDish] : [])
      return sides.some(s => s.id === sideDishId || s.id?.startsWith(sideDishId))
    })
  }

  const isCocktailInMealPlan = (cocktailId) => {
    if (!mealPlan?.dinners) return false
    return mealPlan.dinners.some(d => {
      const cocktails = d.beveragePairing?.cocktails ||
        (d.beveragePairing?.cocktail ? [d.beveragePairing.cocktail] : [])
      return cocktails.some(c => c.id === cocktailId || c.id?.startsWith(cocktailId))
    })
  }

  const handleAddRecipeToWeek = async (recipe) => {
    setAddingItemId(recipe.id)
    try {
      await addMeal(recipe, 4)
      setRecentlyAddedIds(prev => new Set([...prev, recipe.id]))
    } finally {
      setAddingItemId(null)
    }
  }

  const handleAddSideDishToDay = async (mealId) => {
    if (!addToWeekModal || addToWeekModal.type !== 'sideDish') return
    const itemId = addToWeekModal.item.id
    setAddingItemId(itemId)
    try {
      await addSideDishToMeal(mealId, addToWeekModal.item)
      setRecentlyAddedIds(prev => new Set([...prev, itemId]))
    } finally {
      setAddingItemId(null)
      setAddToWeekModal(null)
    }
  }

  const handleAddSideDishAlaCarte = async () => {
    if (!addToWeekModal || addToWeekModal.type !== 'sideDish') return
    const itemId = addToWeekModal.item.id
    setAddingItemId(itemId)
    try {
      await addAlaCarteSideDish(addToWeekModal.item)
      setRecentlyAddedIds(prev => new Set([...prev, itemId]))
    } finally {
      setAddingItemId(null)
      setAddToWeekModal(null)
    }
  }

  const handleAddCocktailToDay = async (mealId) => {
    if (!addToWeekModal || addToWeekModal.type !== 'cocktail') return
    const itemId = addToWeekModal.item.id
    setAddingItemId(itemId)
    try {
      await addCocktailToMeal(mealId, addToWeekModal.item)
      setRecentlyAddedIds(prev => new Set([...prev, itemId]))
    } finally {
      setAddingItemId(null)
      setAddToWeekModal(null)
    }
  }

  const handleAddCocktailAlaCarte = async () => {
    if (!addToWeekModal || addToWeekModal.type !== 'cocktail') return
    const itemId = addToWeekModal.item.id
    setAddingItemId(itemId)
    try {
      await addAlaCarteCocktail(addToWeekModal.item)
      setRecentlyAddedIds(prev => new Set([...prev, itemId]))
    } finally {
      setAddingItemId(null)
      setAddToWeekModal(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Saved Favorites</h1>

      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search favorites..."
          className="input-field max-w-md"
        />
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Recipes ({filteredRecipes.length})
          </h2>
          {filteredRecipes.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? 'No recipes match your search' : 'No saved recipes yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => (
                <div key={recipe.id} className="card">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {recipe.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {recipe.cuisine}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {recipe.prepTime + recipe.cookTime} min total
                  </p>
                  {recipe.dietaryInfo && recipe.dietaryInfo.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {recipe.dietaryInfo.slice(0, 3).map((info, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {info}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedRecipe(recipe)}
                      className="flex-1 btn-outline text-sm"
                    >
                      View
                    </button>
                    {(() => {
                      const isIncluded = isRecipeInMealPlan(recipe.id) || recentlyAddedIds.has(recipe.id)
                      const isLoading = addingItemId === recipe.id
                      if (isLoading) {
                        return (
                          <button
                            disabled
                            className="flex-1 bg-primary-100 text-primary-600 text-sm py-2 px-4 rounded-lg font-semibold cursor-wait flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Adding...
                          </button>
                        )
                      }
                      if (isIncluded) {
                        return (
                          <button
                            disabled
                            className="flex-1 bg-primary-50 text-primary-400 text-sm py-2 px-4 rounded-lg font-semibold cursor-default"
                          >
                            Included in Week
                          </button>
                        )
                      }
                      return (
                        <button
                          onClick={() => handleAddRecipeToWeek(recipe)}
                          className="flex-1 btn-primary text-sm"
                        >
                          Add to Week
                        </button>
                      )
                    })()}
                    <button
                      onClick={() => {
                        if (confirm('Remove this recipe from favorites?')) {
                          removeRecipe(recipe.id)
                        }
                      }}
                      className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Side Dishes ({filteredSideDishes.length})
          </h2>
          {filteredSideDishes.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? 'No side dishes match your search' : 'No saved side dishes yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSideDishes.map((sideDish) => (
                <div key={sideDish.id} className="card">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {sideDish.name}
                  </h3>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize mb-2">
                    {sideDish.type}
                  </span>
                  <p className="text-sm text-gray-500 mb-4">
                    {(sideDish.prepTime || 0) + (sideDish.cookTime || 0)} min total
                  </p>
                  {sideDish.dietaryInfo && sideDish.dietaryInfo.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {sideDish.dietaryInfo.slice(0, 3).map((info, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {info}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSideDish(sideDish)}
                      className="flex-1 btn-outline text-sm"
                    >
                      View
                    </button>
                    {(() => {
                      const isIncluded = isSideDishInMealPlan(sideDish.id) || recentlyAddedIds.has(sideDish.id)
                      const isLoading = addingItemId === sideDish.id
                      if (isLoading) {
                        return (
                          <button
                            disabled
                            className="flex-1 bg-primary-100 text-primary-600 text-sm py-2 px-4 rounded-lg font-semibold cursor-wait flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Adding...
                          </button>
                        )
                      }
                      if (isIncluded) {
                        return (
                          <button
                            disabled
                            className="flex-1 bg-primary-50 text-primary-400 text-sm py-2 px-4 rounded-lg font-semibold cursor-default"
                          >
                            Included in Week
                          </button>
                        )
                      }
                      return (
                        <button
                          onClick={() => setAddToWeekModal({ type: 'sideDish', item: sideDish })}
                          className="flex-1 btn-primary text-sm"
                        >
                          Add to Week
                        </button>
                      )
                    })()}
                    <button
                      onClick={() => {
                        if (confirm('Remove this side dish from favorites?')) {
                          removeSideDish(sideDish.id)
                        }
                      }}
                      className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Cocktails ({filteredCocktails.length})
          </h2>
          {filteredCocktails.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? 'No cocktails match your search' : 'No saved cocktails yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCocktails.map((cocktail) => (
                <div key={cocktail.id} className="card">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {cocktail.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {cocktail.ingredients.map(ing => ing.item).join(', ')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCocktail(cocktail)}
                      className="flex-1 btn-outline text-sm"
                    >
                      View
                    </button>
                    {(() => {
                      const isIncluded = isCocktailInMealPlan(cocktail.id) || recentlyAddedIds.has(cocktail.id)
                      const isLoading = addingItemId === cocktail.id
                      if (isLoading) {
                        return (
                          <button
                            disabled
                            className="flex-1 bg-primary-100 text-primary-600 text-sm py-2 px-4 rounded-lg font-semibold cursor-wait flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Adding...
                          </button>
                        )
                      }
                      if (isIncluded) {
                        return (
                          <button
                            disabled
                            className="flex-1 bg-primary-50 text-primary-400 text-sm py-2 px-4 rounded-lg font-semibold cursor-default"
                          >
                            Included in Week
                          </button>
                        )
                      }
                      return (
                        <button
                          onClick={() => setAddToWeekModal({ type: 'cocktail', item: cocktail })}
                          className="flex-1 btn-primary text-sm"
                        >
                          Add to Week
                        </button>
                      )
                    })()}
                    <button
                      onClick={() => {
                        if (confirm('Remove this cocktail from favorites?')) {
                          removeCocktail(cocktail.id)
                        }
                      }}
                      className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {selectedSideDish && (
        <SideDishDetail
          sideDish={selectedSideDish}
          onClose={() => setSelectedSideDish(null)}
        />
      )}

      {selectedCocktail && (
        <BeverageDetail
          beveragePairing={{ cocktail: selectedCocktail }}
          type="cocktail"
          onClose={() => setSelectedCocktail(null)}
        />
      )}

      {/* Add to Week Modal for Side Dishes and Cocktails */}
      {addToWeekModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Add {addToWeekModal.type === 'sideDish' ? 'Side Dish' : 'Cocktail'} to Week
              </h3>
              <button
                onClick={() => setAddToWeekModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Adding: <span className="font-semibold">{addToWeekModal.item.name}</span>
            </p>

            {regularMeals.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-3">Select a day to add to:</p>
                <div className="space-y-2 mb-4">
                  {regularMeals.map((meal, index) => {
                    const mainDishName = meal.mainDish?.name || 'No main dish'
                    return (
                      <button
                        key={meal.id}
                        onClick={() => {
                          if (addToWeekModal.type === 'sideDish') {
                            handleAddSideDishToDay(meal.id)
                          } else {
                            handleAddCocktailToDay(meal.id)
                          }
                        }}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <span className="font-semibold text-primary-600">Day {index + 1}</span>
                        <span className="text-gray-500 ml-2">- {mainDishName}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 mb-4">
                No meal plan yet. You can add this as a la carte.
              </p>
            )}

            <button
              onClick={() => {
                if (addToWeekModal.type === 'sideDish') {
                  handleAddSideDishAlaCarte()
                } else {
                  handleAddCocktailAlaCarte()
                }
              }}
              className="w-full p-3 text-center border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <span className="font-semibold text-purple-600">Add a la carte</span>
              <p className="text-sm text-gray-500 mt-1">
                Add as a standalone item at the end of your meal plan
              </p>
            </button>

            <button
              onClick={() => setAddToWeekModal(null)}
              className="w-full mt-4 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Favorites
