import { useState } from 'react'
import { useFavorites } from '../context/FavoritesContext'
import RecipeDetail from '../components/RecipeDetail'
import SideDishDetail from '../components/SideDishDetail'
import BeverageDetail from '../components/BeverageDetail'

const Favorites = () => {
  const { savedRecipes, savedCocktails, savedSideDishes, removeRecipe, removeCocktail, removeSideDish } = useFavorites()
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [selectedSideDish, setSelectedSideDish] = useState(null)
  const [selectedCocktail, setSelectedCocktail] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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
                      className="flex-1 btn-primary text-sm"
                    >
                      View
                    </button>
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
                      className="flex-1 btn-primary text-sm"
                    >
                      View
                    </button>
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
                      className="flex-1 btn-primary text-sm"
                    >
                      View
                    </button>
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
    </div>
  )
}

export default Favorites
