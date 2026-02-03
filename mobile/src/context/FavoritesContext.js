import { createContext, useContext, useState, useEffect } from 'react'
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
  const { user } = useAuth()
  const [savedRecipes, setSavedRecipes] = useState([])
  const [savedCocktails, setSavedCocktails] = useState([])
  const [savedSideDishes, setSavedSideDishes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setSavedRecipes([])
      setSavedCocktails([])
      setSavedSideDishes([])
      setLoading(false)
    }
  }, [user])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const [recipes, cocktails, sides] = await Promise.all([
        favoritesService.getSavedRecipes(),
        favoritesService.getSavedCocktails(),
        favoritesService.getSavedSideDishes(),
      ])
      setSavedRecipes(recipes || [])
      setSavedCocktails(cocktails || [])
      setSavedSideDishes(sides || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const isRecipeSaved = (recipe) => {
    if (!recipe) return false
    return savedRecipes.some(r => r.name === recipe.name)
  }

  const isCocktailSaved = (cocktail) => {
    if (!cocktail) return false
    return savedCocktails.some(c => c.name === cocktail.name)
  }

  const isSideDishSaved = (sideDish) => {
    if (!sideDish) return false
    return savedSideDishes.some(s => s.name === sideDish.name)
  }

  const toggleRecipe = async (recipe) => {
    if (isRecipeSaved(recipe)) {
      // Remove
      const saved = savedRecipes.find(r => r.name === recipe.name)
      if (saved) {
        setSavedRecipes(prev => prev.filter(r => r.name !== recipe.name))
        try {
          await favoritesService.removeRecipe(saved.id)
        } catch (error) {
          setSavedRecipes(prev => [...prev, saved])
          throw error
        }
      }
    } else {
      // Add
      const tempId = `temp-${Date.now()}`
      const newRecipe = { ...recipe, id: tempId }
      setSavedRecipes(prev => [...prev, newRecipe])
      try {
        const savedRecipe = await favoritesService.saveRecipe(recipe)
        setSavedRecipes(prev => prev.map(r => r.id === tempId ? savedRecipe : r))
      } catch (error) {
        setSavedRecipes(prev => prev.filter(r => r.id !== tempId))
        throw error
      }
    }
  }

  const toggleCocktail = async (cocktail) => {
    if (isCocktailSaved(cocktail)) {
      const saved = savedCocktails.find(c => c.name === cocktail.name)
      if (saved) {
        setSavedCocktails(prev => prev.filter(c => c.name !== cocktail.name))
        try {
          await favoritesService.removeCocktail(saved.id)
        } catch (error) {
          setSavedCocktails(prev => [...prev, saved])
          throw error
        }
      }
    } else {
      const tempId = `temp-${Date.now()}`
      const newCocktail = { ...cocktail, id: tempId }
      setSavedCocktails(prev => [...prev, newCocktail])
      try {
        const savedCocktail = await favoritesService.saveCocktail(cocktail)
        setSavedCocktails(prev => prev.map(c => c.id === tempId ? savedCocktail : c))
      } catch (error) {
        setSavedCocktails(prev => prev.filter(c => c.id !== tempId))
        throw error
      }
    }
  }

  const toggleSideDish = async (sideDish) => {
    if (isSideDishSaved(sideDish)) {
      const saved = savedSideDishes.find(s => s.name === sideDish.name)
      if (saved) {
        setSavedSideDishes(prev => prev.filter(s => s.name !== sideDish.name))
        try {
          await favoritesService.removeSideDish(saved.id)
        } catch (error) {
          setSavedSideDishes(prev => [...prev, saved])
          throw error
        }
      }
    } else {
      const tempId = `temp-${Date.now()}`
      const newSideDish = { ...sideDish, id: tempId }
      setSavedSideDishes(prev => [...prev, newSideDish])
      try {
        const savedSideDish = await favoritesService.saveSideDish(sideDish)
        setSavedSideDishes(prev => prev.map(s => s.id === tempId ? savedSideDish : s))
      } catch (error) {
        setSavedSideDishes(prev => prev.filter(s => s.id !== tempId))
        throw error
      }
    }
  }

  const value = {
    savedRecipes,
    savedCocktails,
    savedSideDishes,
    loading,
    isRecipeSaved,
    isCocktailSaved,
    isSideDishSaved,
    toggleRecipe,
    toggleCocktail,
    toggleSideDish,
    refreshFavorites: loadFavorites,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}
