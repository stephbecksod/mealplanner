import { createContext, useContext, useState, useEffect } from 'react'
import storage from '../services/storage'

const FavoritesContext = createContext()

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

export const FavoritesProvider = ({ children }) => {
  const [savedRecipes, setSavedRecipes] = useState([])
  const [savedCocktails, setSavedCocktails] = useState([])
  const [savedSideDishes, setSavedSideDishes] = useState([])

  useEffect(() => {
    const recipes = storage.getSavedRecipes()
    const cocktails = storage.getSavedCocktails()
    const sideDishes = storage.getSavedSideDishes()

    setSavedRecipes(recipes)
    setSavedCocktails(cocktails)
    setSavedSideDishes(sideDishes)
  }, [])

  const saveRecipe = (recipe) => {
    const recipeWithId = {
      ...recipe,
      id: recipe.id || `recipe-${Date.now()}`,
    }

    const isAlreadySaved = savedRecipes.some(r => r.id === recipeWithId.id || r.name === recipeWithId.name)

    if (isAlreadySaved) {
      return false
    }

    storage.addSavedRecipe(recipeWithId)
    setSavedRecipes(storage.getSavedRecipes())
    return true
  }

  const removeRecipe = (recipeId) => {
    storage.removeSavedRecipe(recipeId)
    setSavedRecipes(storage.getSavedRecipes())
  }

  const saveCocktail = (cocktail) => {
    const cocktailWithId = {
      ...cocktail,
      id: cocktail.id || `cocktail-${Date.now()}`,
    }

    const isAlreadySaved = savedCocktails.some(c => c.id === cocktailWithId.id || c.name === cocktailWithId.name)

    if (isAlreadySaved) {
      return false
    }

    storage.addSavedCocktail(cocktailWithId)
    setSavedCocktails(storage.getSavedCocktails())
    return true
  }

  const removeCocktail = (cocktailId) => {
    const cocktails = savedCocktails.filter(c => c.id !== cocktailId)
    storage.setSavedCocktails(cocktails)
    setSavedCocktails(cocktails)
  }

  const isRecipeSaved = (recipeId) => {
    return savedRecipes.some(r => r.id === recipeId)
  }

  const isCocktailSaved = (cocktailId) => {
    return savedCocktails.some(c => c.id === cocktailId)
  }

  const saveSideDish = (sideDish) => {
    const sideDishWithId = {
      ...sideDish,
      id: sideDish.id || `side-${Date.now()}`,
    }

    const isAlreadySaved = savedSideDishes.some(s => s.id === sideDishWithId.id || s.name === sideDishWithId.name)

    if (isAlreadySaved) {
      return false
    }

    storage.addSavedSideDish(sideDishWithId)
    setSavedSideDishes(storage.getSavedSideDishes())
    return true
  }

  const removeSideDish = (sideDishId) => {
    storage.removeSavedSideDish(sideDishId)
    setSavedSideDishes(storage.getSavedSideDishes())
  }

  const isSideDishSaved = (sideDishId) => {
    return savedSideDishes.some(s => s.id === sideDishId)
  }

  const value = {
    savedRecipes,
    savedCocktails,
    savedSideDishes,
    saveRecipe,
    removeRecipe,
    saveCocktail,
    removeCocktail,
    saveSideDish,
    removeSideDish,
    isRecipeSaved,
    isCocktailSaved,
    isSideDishSaved,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
