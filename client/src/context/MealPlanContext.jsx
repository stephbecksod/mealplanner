import { createContext, useContext, useState, useEffect } from 'react'
import storage from '../services/storage'
import { mealsAPI, groceryAPI, beveragesAPI } from '../services/api'

const MealPlanContext = createContext()

export const useMealPlan = () => {
  const context = useContext(MealPlanContext)
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider')
  }
  return context
}

export const MealPlanProvider = ({ children }) => {
  const [mealPlan, setMealPlan] = useState(null)
  const [groceryList, setGroceryList] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let savedMealPlan = storage.getCurrentMealPlan()
    const savedGroceryList = storage.getGroceryList()

    // Migrate old meal plan format if needed
    if (savedMealPlan) {
      savedMealPlan = storage.migrateMealPlan(savedMealPlan)
      storage.setCurrentMealPlan(savedMealPlan)
      setMealPlan(savedMealPlan)
    }
    if (savedGroceryList) {
      setGroceryList(savedGroceryList)
    }
  }, [])

  const generateMealPlan = async ({ numberOfMeals, dietaryPreferences, cuisinePreferences, servings, includeSides = false, includeCocktails = false, includeWine = false }) => {
    setLoading(true)
    setError(null)

    try {
      const meals = await mealsAPI.generateMeals({
        numberOfMeals,
        dietaryPreferences,
        cuisinePreferences,
        servings,
        includeSides,
      })

      const dinners = meals.map((meal, index) => {
        // Extract sideDish from recipe if it was included
        const { sideDish, ...mainDish } = meal
        return {
          id: `meal-${Date.now()}-${index}`,
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][index] || `Day ${index + 1}`,
          mainDish,
          sideDish: sideDish || null,
          servings: servings || 4,
          beveragePairing: null,
        }
      })

      // Generate beverage pairings if requested
      if (includeCocktails || includeWine) {
        for (let i = 0; i < dinners.length; i++) {
          const dinner = dinners[i]
          const beveragePairing = {}

          if (includeCocktails) {
            const cocktailResult = await beveragesAPI.regenerateCocktail({
              recipeName: dinner.mainDish.name,
              ingredients: dinner.mainDish.ingredients.map(ing => ing.item),
            })
            beveragePairing.cocktail = cocktailResult.cocktail
          }

          if (includeWine) {
            const wineResult = await beveragesAPI.regenerateWine({
              recipeName: dinner.mainDish.name,
              ingredients: dinner.mainDish.ingredients.map(ing => ing.item),
            })
            beveragePairing.wine = wineResult.wine
          }

          dinners[i].beveragePairing = Object.keys(beveragePairing).length > 0 ? beveragePairing : null
        }
      }

      const newMealPlan = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        dietaryPreferences: dietaryPreferences || [],
        cuisinePreferences: cuisinePreferences || [],
        dinners,
      }

      setMealPlan(newMealPlan)
      storage.setCurrentMealPlan(newMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: newMealPlan.dinners })
      setGroceryList(newGroceryList)
      storage.setGroceryList(newGroceryList)

      return newMealPlan
    } catch (err) {
      setError(err.message || 'Failed to generate meal plan')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const regenerateMeal = async (mealId, { dietaryPreferences, cuisinePreferences, servings, includeSides = false }) => {
    setLoading(true)
    setError(null)

    try {
      const meal = mealPlan.dinners.find(d => d.id === mealId)
      const newRecipe = await mealsAPI.regenerateMeal({
        mealId,
        dietaryPreferences,
        cuisinePreferences,
        servings,
        includeSides: includeSides || !!meal?.sideDish, // Keep side if it existed
      })

      // Extract sideDish from recipe if it was included
      const { sideDish, ...mainDish } = newRecipe

      const updatedDinners = mealPlan.dinners.map(dinner =>
        dinner.id === mealId
          ? { ...dinner, mainDish, sideDish: sideDish || null, beveragePairing: null }
          : dinner
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      setGroceryList(newGroceryList)
      storage.setGroceryList(newGroceryList)

      return mainDish
    } catch (err) {
      setError(err.message || 'Failed to regenerate meal')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addMeal = async (recipe, servings) => {
    const newDinner = {
      id: `meal-${Date.now()}`,
      dayOfWeek: `Day ${mealPlan.dinners.length + 1}`,
      mainDish: recipe,
      sideDish: null,
      servings: servings || 4,
      beveragePairing: null,
    }

    const updatedDinners = [...mealPlan.dinners, newDinner]
    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }

    setMealPlan(updatedMealPlan)
    storage.setCurrentMealPlan(updatedMealPlan)

    const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
    setGroceryList(newGroceryList)
    storage.setGroceryList(newGroceryList)
  }

  // Side dish methods
  const addSideDish = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const sideDish = await mealsAPI.addSideDish({
        mainDish: dinner.mainDish,
        dietaryPreferences: mealPlan.dietaryPreferences || [],
        servings: dinner.servings,
      })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, sideDish } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      setGroceryList(newGroceryList)
      storage.setGroceryList(newGroceryList)

      return sideDish
    } catch (err) {
      setError(err.message || 'Failed to add side dish')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeSideDish = async (mealId) => {
    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, sideDish: null } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)
    storage.setCurrentMealPlan(updatedMealPlan)

    const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
    setGroceryList(newGroceryList)
    storage.setGroceryList(newGroceryList)
  }

  const regenerateSideDish = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const sideDish = await mealsAPI.regenerateSideDish({
        mainDish: dinner.mainDish,
        dietaryPreferences: mealPlan.dietaryPreferences || [],
        servings: dinner.servings,
      })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, sideDish } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      setGroceryList(newGroceryList)
      storage.setGroceryList(newGroceryList)

      return sideDish
    } catch (err) {
      setError(err.message || 'Failed to regenerate side dish')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Beverage pairing methods
  const addBeveragePairing = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const beveragePairing = await beveragesAPI.generatePairing({
        recipeName: dinner.mainDish.name,
        ingredients: dinner.mainDish.ingredients.map(i => i.item),
      })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      return beveragePairing
    } catch (err) {
      setError(err.message || 'Failed to add beverage pairing')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addCocktail = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const result = await beveragesAPI.regenerateCocktail({
        recipeName: dinner.mainDish.name,
        ingredients: dinner.mainDish.ingredients.map(i => i.item),
      })

      const updatedBeveragePairing = {
        ...dinner.beveragePairing,
        cocktail: result.cocktail,
      }

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      return result.cocktail
    } catch (err) {
      setError(err.message || 'Failed to add cocktail')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addWinePairing = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const result = await beveragesAPI.regenerateWine({
        recipeName: dinner.mainDish.name,
        ingredients: dinner.mainDish.ingredients.map(i => i.item),
      })

      const updatedBeveragePairing = {
        ...dinner.beveragePairing,
        wine: result.wine,
      }

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      return result.wine
    } catch (err) {
      setError(err.message || 'Failed to add wine pairing')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeBeveragePairing = (mealId) => {
    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, beveragePairing: null } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)
    storage.setCurrentMealPlan(updatedMealPlan)
  }

  const removeCocktail = (mealId) => {
    const dinner = mealPlan.dinners.find(d => d.id === mealId)
    if (!dinner) return

    const updatedBeveragePairing = dinner.beveragePairing
      ? { ...dinner.beveragePairing, cocktail: null }
      : null

    // If both are null, remove the entire beveragePairing
    const finalBeveragePairing = updatedBeveragePairing?.wine ? updatedBeveragePairing : null

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, beveragePairing: finalBeveragePairing } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)
    storage.setCurrentMealPlan(updatedMealPlan)
  }

  const removeWinePairing = (mealId) => {
    const dinner = mealPlan.dinners.find(d => d.id === mealId)
    if (!dinner) return

    const updatedBeveragePairing = dinner.beveragePairing
      ? { ...dinner.beveragePairing, wine: null }
      : null

    // If both are null, remove the entire beveragePairing
    const finalBeveragePairing = updatedBeveragePairing?.cocktail ? updatedBeveragePairing : null

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, beveragePairing: finalBeveragePairing } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)
    storage.setCurrentMealPlan(updatedMealPlan)
  }

  const regenerateCocktail = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const result = await beveragesAPI.regenerateCocktail({
        recipeName: dinner.mainDish.name,
        ingredients: dinner.mainDish.ingredients.map(i => i.item),
      })

      const updatedBeveragePairing = {
        ...dinner.beveragePairing,
        cocktail: result.cocktail,
      }

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      return result.cocktail
    } catch (err) {
      setError(err.message || 'Failed to regenerate cocktail')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const regenerateWine = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const result = await beveragesAPI.regenerateWine({
        recipeName: dinner.mainDish.name,
        ingredients: dinner.mainDish.ingredients.map(i => i.item),
      })

      const updatedBeveragePairing = {
        ...dinner.beveragePairing,
        wine: result.wine,
      }

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      return result.wine
    } catch (err) {
      setError(err.message || 'Failed to regenerate wine pairing')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Regenerate all components
  const regenerateAllComponents = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      // Regenerate main dish with side dish if it existed
      const hasSide = !!dinner.sideDish
      const newRecipe = await mealsAPI.regenerateMeal({
        mealId,
        dietaryPreferences: mealPlan.dietaryPreferences || [],
        cuisinePreferences: mealPlan.cuisinePreferences || [],
        servings: dinner.servings,
        includeSides: hasSide,
      })

      const { sideDish, ...mainDish } = newRecipe

      // Regenerate beverages if they existed
      let beveragePairing = null
      if (dinner.beveragePairing) {
        beveragePairing = await beveragesAPI.generatePairing({
          recipeName: mainDish.name,
          ingredients: mainDish.ingredients.map(i => i.item),
        })
      }

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId
          ? { ...d, mainDish, sideDish: sideDish || null, beveragePairing }
          : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      setGroceryList(newGroceryList)
      storage.setGroceryList(newGroceryList)

      return { mainDish, sideDish: sideDish || null, beveragePairing }
    } catch (err) {
      setError(err.message || 'Failed to regenerate all components')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeMeal = async (mealId) => {
    const updatedDinners = mealPlan.dinners.filter(dinner => dinner.id !== mealId)
    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }

    setMealPlan(updatedMealPlan)
    storage.setCurrentMealPlan(updatedMealPlan)

    if (updatedDinners.length > 0) {
      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      setGroceryList(newGroceryList)
      storage.setGroceryList(newGroceryList)
    } else {
      setGroceryList(null)
      storage.removeItem('meal-planner:groceryList')
    }
  }

  const clearMealPlan = () => {
    setMealPlan(null)
    setGroceryList(null)
    storage.removeItem('meal-planner:currentMealPlan')
    storage.removeItem('meal-planner:groceryList')
  }

  const updateGroceryItem = (itemId, checked) => {
    const updatedItems = groceryList.items.map(item =>
      item.id === itemId ? { ...item, checked } : item
    )
    const updatedManualItems = (groceryList.manualItems || []).map(item =>
      item.id === itemId ? { ...item, checked } : item
    )
    const updatedGroceryList = { ...groceryList, items: updatedItems, manualItems: updatedManualItems }
    setGroceryList(updatedGroceryList)
    storage.setGroceryList(updatedGroceryList)
  }

  const addManualGroceryItem = (itemName) => {
    const newItem = {
      id: `manual-${Date.now()}`,
      item: itemName,
      checked: false,
    }
    const updatedManualItems = [...(groceryList.manualItems || []), newItem]
    const updatedGroceryList = { ...groceryList, manualItems: updatedManualItems }
    setGroceryList(updatedGroceryList)
    storage.setGroceryList(updatedGroceryList)
  }

  const refreshGroceryList = async (includeCocktails = false) => {
    if (!mealPlan || !mealPlan.dinners) return

    const newGroceryList = await groceryAPI.generateList({
      meals: mealPlan.dinners,
      includeCocktails,
    })
    // Preserve manual items and checked state
    const existingManualItems = groceryList?.manualItems || []
    const existingCheckedIds = new Set([
      ...(groceryList?.items || []).filter(i => i.checked).map(i => i.item.toLowerCase()),
      ...(groceryList?.manualItems || []).filter(i => i.checked).map(i => i.item.toLowerCase()),
    ])

    // Restore checked state for items that still exist
    newGroceryList.items = newGroceryList.items.map(item => ({
      ...item,
      checked: existingCheckedIds.has(item.item.toLowerCase()),
    }))
    newGroceryList.manualItems = existingManualItems

    setGroceryList(newGroceryList)
    storage.setGroceryList(newGroceryList)
  }

  const value = {
    mealPlan,
    groceryList,
    loading,
    error,
    generateMealPlan,
    regenerateMeal,
    addMeal,
    removeMeal,
    clearMealPlan,
    updateGroceryItem,
    addManualGroceryItem,
    // Side dish methods
    addSideDish,
    removeSideDish,
    regenerateSideDish,
    // Beverage methods
    addBeveragePairing,
    addCocktail,
    addWinePairing,
    removeBeveragePairing,
    removeCocktail,
    removeWinePairing,
    regenerateCocktail,
    regenerateWine,
    regenerateAllComponents,
    // Grocery methods
    refreshGroceryList,
  }

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>
}
