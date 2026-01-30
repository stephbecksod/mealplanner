import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { favoritesService } from '../services/supabaseData'

const FavoritesContext = createContext()

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

export const FavoritesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [savedRecipes, setSavedRecipes] = useState([])
  const [savedCocktails, setSavedCocktails] = useState([])
  const [savedSideDishes, setSavedSideDishes] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch favorites from Supabase when user changes
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedRecipes([])
      setSavedCocktails([])
      setSavedSideDishes([])
      setDataLoading(false)
      return
    }

    setDataLoading(true)
    setError(null)

    try {
      const [recipes, cocktails, sideDishes] = await Promise.all([
        favoritesService.getSavedRecipes(),
        favoritesService.getSavedCocktails(),
        favoritesService.getSavedSideDishes(),
      ])

      setSavedRecipes(recipes)
      setSavedCocktails(cocktails)
      setSavedSideDishes(sideDishes)
    } catch (err) {
      console.error('Error fetching favorites:', err)
      setError(err.message)
    } finally {
      setDataLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites, user?.id])

  // Save recipe with optimistic update
  const saveRecipe = async (recipe) => {
    const recipeWithId = {
      ...recipe,
      id: recipe.id || `recipe-${Date.now()}`,
    }

    // Check if already saved (by name to handle different IDs)
    const isAlreadySaved = savedRecipes.some(r => r.name === recipeWithId.name)
    if (isAlreadySaved) {
      return false
    }

    // Optimistic update
    const optimisticRecipe = { ...recipeWithId, savedAt: Date.now() }
    setSavedRecipes(prev => [optimisticRecipe, ...prev])

    try {
      const savedRecipe = await favoritesService.saveRecipe(recipeWithId)
      if (!savedRecipe) {
        // Recipe was a duplicate
        setSavedRecipes(prev => prev.filter(r => r.id !== optimisticRecipe.id))
        return false
      }
      // Replace optimistic entry with actual DB entry
      setSavedRecipes(prev => prev.map(r =>
        r.id === optimisticRecipe.id ? savedRecipe : r
      ))
      return true
    } catch (err) {
      // Rollback optimistic update
      console.error('Error saving recipe:', err)
      setSavedRecipes(prev => prev.filter(r => r.id !== optimisticRecipe.id))
      return false
    }
  }

  // Remove recipe with optimistic update
  const removeRecipe = async (recipeId) => {
    const recipeToRemove = savedRecipes.find(r => r.id === recipeId)
    if (!recipeToRemove) return

    // Optimistic update
    setSavedRecipes(prev => prev.filter(r => r.id !== recipeId))

    try {
      await favoritesService.removeRecipe(recipeId)
    } catch (err) {
      // Rollback optimistic update
      console.error('Error removing recipe:', err)
      setSavedRecipes(prev => [...prev, recipeToRemove])
    }
  }

  // Save cocktail with optimistic update
  const saveCocktail = async (cocktail) => {
    const cocktailWithId = {
      ...cocktail,
      id: cocktail.id || `cocktail-${Date.now()}`,
    }

    const isAlreadySaved = savedCocktails.some(c => c.name === cocktailWithId.name)
    if (isAlreadySaved) {
      return false
    }

    // Optimistic update
    const optimisticCocktail = { ...cocktailWithId, savedAt: Date.now() }
    setSavedCocktails(prev => [optimisticCocktail, ...prev])

    try {
      const savedCocktail = await favoritesService.saveCocktail(cocktailWithId)
      if (!savedCocktail) {
        setSavedCocktails(prev => prev.filter(c => c.id !== optimisticCocktail.id))
        return false
      }
      setSavedCocktails(prev => prev.map(c =>
        c.id === optimisticCocktail.id ? savedCocktail : c
      ))
      return true
    } catch (err) {
      console.error('Error saving cocktail:', err)
      setSavedCocktails(prev => prev.filter(c => c.id !== optimisticCocktail.id))
      return false
    }
  }

  // Remove cocktail with optimistic update
  const removeCocktail = async (cocktailId) => {
    const cocktailToRemove = savedCocktails.find(c => c.id === cocktailId)
    if (!cocktailToRemove) return

    setSavedCocktails(prev => prev.filter(c => c.id !== cocktailId))

    try {
      await favoritesService.removeCocktail(cocktailId)
    } catch (err) {
      console.error('Error removing cocktail:', err)
      setSavedCocktails(prev => [...prev, cocktailToRemove])
    }
  }

  // Save side dish with optimistic update
  const saveSideDish = async (sideDish) => {
    const sideDishWithId = {
      ...sideDish,
      id: sideDish.id || `side-${Date.now()}`,
    }

    const isAlreadySaved = savedSideDishes.some(s => s.name === sideDishWithId.name)
    if (isAlreadySaved) {
      return false
    }

    // Optimistic update
    const optimisticSideDish = { ...sideDishWithId, savedAt: Date.now() }
    setSavedSideDishes(prev => [optimisticSideDish, ...prev])

    try {
      const saved = await favoritesService.saveSideDish(sideDishWithId)
      if (!saved) {
        setSavedSideDishes(prev => prev.filter(s => s.id !== optimisticSideDish.id))
        return false
      }
      setSavedSideDishes(prev => prev.map(s =>
        s.id === optimisticSideDish.id ? saved : s
      ))
      return true
    } catch (err) {
      console.error('Error saving side dish:', err)
      setSavedSideDishes(prev => prev.filter(s => s.id !== optimisticSideDish.id))
      return false
    }
  }

  // Remove side dish with optimistic update
  const removeSideDish = async (sideDishId) => {
    const sideDishToRemove = savedSideDishes.find(s => s.id === sideDishId)
    if (!sideDishToRemove) return

    setSavedSideDishes(prev => prev.filter(s => s.id !== sideDishId))

    try {
      await favoritesService.removeSideDish(sideDishId)
    } catch (err) {
      console.error('Error removing side dish:', err)
      setSavedSideDishes(prev => [...prev, sideDishToRemove])
    }
  }

  const isRecipeSaved = (recipeId) => {
    return savedRecipes.some(r => r.id === recipeId)
  }

  const isCocktailSaved = (cocktailId) => {
    return savedCocktails.some(c => c.id === cocktailId)
  }

  const isSideDishSaved = (sideDishId) => {
    return savedSideDishes.some(s => s.id === sideDishId)
  }

  // Check by name for items that may have different IDs
  const isRecipeSavedByName = (recipeName) => {
    return savedRecipes.some(r => r.name === recipeName)
  }

  const isCocktailSavedByName = (cocktailName) => {
    return savedCocktails.some(c => c.name === cocktailName)
  }

  const isSideDishSavedByName = (sideDishName) => {
    return savedSideDishes.some(s => s.name === sideDishName)
  }

  const value = {
    savedRecipes,
    savedCocktails,
    savedSideDishes,
    dataLoading,
    error,
    saveRecipe,
    removeRecipe,
    saveCocktail,
    removeCocktail,
    saveSideDish,
    removeSideDish,
    isRecipeSaved,
    isCocktailSaved,
    isSideDishSaved,
    isRecipeSavedByName,
    isCocktailSavedByName,
    isSideDishSavedByName,
    refreshFavorites: fetchFavorites,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
