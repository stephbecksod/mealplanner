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

  useEffect(() => {
    const recipes = storage.getSavedRecipes()
    const cocktails = storage.getSavedCocktails()

    setSavedRecipes(recipes)
    setSavedCocktails(cocktails)
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

  const value = {
    savedRecipes,
    savedCocktails,
    saveRecipe,
    removeRecipe,
    saveCocktail,
    removeCocktail,
    isRecipeSaved,
    isCocktailSaved,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
