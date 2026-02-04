import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { mealPlanService } from '../services/supabaseData'
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
  const { user, isAuthenticated } = useAuth()
  const [mealPlan, setMealPlan] = useState(null)
  const [groceryList, setGroceryList] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMealPlan = useCallback(async () => {
    if (!isAuthenticated) {
      setMealPlan(null)
      setGroceryList(null)
      setDataLoading(false)
      return
    }

    setDataLoading(true)
    setError(null)

    try {
      const data = await mealPlanService.getActiveMealPlan()
      if (data) {
        setMealPlan(data.mealPlan)
        setGroceryList(data.groceryList)
      } else {
        setMealPlan(null)
        setGroceryList(null)
      }
    } catch (err) {
      console.error('Error fetching meal plan:', err)
      setError(err.message)
    } finally {
      setDataLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchMealPlan()
  }, [fetchMealPlan, user?.id])

  const generateMealPlan = async ({
    numberOfMeals,
    dietaryPreferences,
    cuisinePreferences,
    proteinPreferences,
    servings,
    includeSides = false,
    includeCocktails = false,
    includeWine = false,
    prioritizeOverlap = true,
  }) => {
    setLoading(true)
    setError(null)

    try {
      const meals = await mealsAPI.generateMeals({
        numberOfMeals,
        dietaryPreferences,
        cuisinePreferences,
        proteinPreferences,
        servings,
        includeSides,
        prioritizeOverlap,
      })

      const dinners = meals.map((meal, index) => {
        const { sideDish, ...mainDish } = meal
        return {
          id: `meal-${Date.now()}-${index}`,
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][index] || `Day ${index + 1}`,
          mainDish,
          sideDishes: sideDish ? [sideDish] : [],
          servings: servings || 4,
          beveragePairing: null,
          isAlaCarte: false,
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
        proteinPreferences: proteinPreferences || [],
        prioritizeOverlap: prioritizeOverlap !== false,
        dinners,
      }

      const newGroceryList = await groceryAPI.generateList({ meals: newMealPlan.dinners })

      // Save to Supabase
      const saved = await mealPlanService.createMealPlan(newMealPlan, newGroceryList)

      setMealPlan(saved.mealPlan)
      setGroceryList(saved.groceryList)

      return saved.mealPlan
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
      const hasSides = meal?.sideDishes?.length > 0

      const existingMeals = mealPlan.dinners
        .filter(d => d.id !== mealId && d.mainDish)
        .map(d => ({
          name: d.mainDish.name,
          ingredients: d.mainDish.ingredients?.map(i => i.item) || [],
        }))

      const newRecipe = await mealsAPI.regenerateMeal({
        mealId,
        dietaryPreferences,
        cuisinePreferences,
        proteinPreferences: mealPlan.proteinPreferences || [],
        servings,
        includeSides: includeSides || hasSides,
        existingMeals,
        prioritizeOverlap: mealPlan.prioritizeOverlap !== false,
      })

      const { sideDish, ...mainDish } = newRecipe

      await mealPlanService.updateDinner(mealId, {
        mainDish,
        sideDishes: sideDish ? [sideDish] : [],
        beveragePairing: null,
      })

      const updatedDinners = mealPlan.dinners.map(dinner =>
        dinner.id === mealId
          ? { ...dinner, mainDish, sideDishes: sideDish ? [sideDish] : [], beveragePairing: null }
          : dinner
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)

      return mainDish
    } catch (err) {
      setError(err.message || 'Failed to regenerate meal')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addMeal = async (dinnerOrRecipe, servings) => {
    setLoading(true)
    setError(null)

    try {
      const regularMeals = (mealPlan?.dinners || []).filter(d => !d.isAlaCarte)
      const alaCarte = (mealPlan?.dinners || []).filter(d => d.isAlaCarte)

      // Support both full dinner object and (recipe, servings) signature
      let newDinnerData
      if (dinnerOrRecipe.mainDish !== undefined) {
        // Full dinner object passed
        newDinnerData = {
          dayOfWeek: dinnerOrRecipe.dayOfWeek || `Day ${regularMeals.length + 1}`,
          mainDish: dinnerOrRecipe.mainDish,
          sideDishes: dinnerOrRecipe.sideDishes || [],
          servings: dinnerOrRecipe.servings || 4,
          beveragePairing: dinnerOrRecipe.beveragePairing || null,
          isAlaCarte: dinnerOrRecipe.isAlaCarte || false,
        }
      } else {
        // Recipe object passed (legacy signature)
        newDinnerData = {
          dayOfWeek: `Day ${regularMeals.length + 1}`,
          mainDish: dinnerOrRecipe,
          sideDishes: [],
          servings: servings || 4,
          beveragePairing: null,
          isAlaCarte: false,
        }
      }

      const newDinner = await mealPlanService.addDinner(mealPlan.id, newDinnerData)

      const updatedDinners = [...regularMeals, newDinner, ...alaCarte]
      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }

      setMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)
    } catch (err) {
      setError(err.message || 'Failed to add meal')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const generateNewMeal = async (servings = 4) => {
    setLoading(true)
    setError(null)

    try {
      const existingMeals = (mealPlan?.dinners || [])
        .filter(d => d.mainDish)
        .map(d => ({
          name: d.mainDish.name,
          ingredients: d.mainDish.ingredients?.map(i => i.item) || [],
        }))

      const newRecipe = await mealsAPI.regenerateMeal({
        dietaryPreferences: mealPlan?.dietaryPreferences || [],
        cuisinePreferences: mealPlan?.cuisinePreferences || [],
        proteinPreferences: mealPlan?.proteinPreferences || [],
        servings,
        includeSides: true,
        existingMeals,
        prioritizeOverlap: mealPlan?.prioritizeOverlap !== false,
      })

      const { sideDish, ...mainDish } = newRecipe

      const regularMeals = (mealPlan?.dinners || []).filter(d => !d.isAlaCarte)
      const alaCarte = (mealPlan?.dinners || []).filter(d => d.isAlaCarte)

      const newDinnerData = {
        dayOfWeek: `Day ${regularMeals.length + 1}`,
        mainDish,
        sideDishes: sideDish ? [sideDish] : [],
        servings,
        beveragePairing: null,
        isAlaCarte: false,
      }

      const newDinner = await mealPlanService.addDinner(mealPlan.id, newDinnerData)

      const updatedDinners = [...regularMeals, newDinner, ...alaCarte]
      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }

      setMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)

      return newDinner
    } catch (err) {
      setError(err.message || 'Failed to generate new meal')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeMeal = async (mealId) => {
    await mealPlanService.removeDinner(mealId)

    const updatedDinners = mealPlan.dinners.filter(dinner => dinner.id !== mealId)
    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }

    setMealPlan(updatedMealPlan)

    if (updatedDinners.length > 0) {
      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)
    } else {
      setGroceryList(null)
    }
  }

  const clearMealPlan = async () => {
    if (mealPlan?.id) {
      await mealPlanService.clearMealPlan(mealPlan.id)
    }
    setMealPlan(null)
    setGroceryList(null)
  }

  const addSideDish = async (dinnerId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === dinnerId)
      if (!dinner || !dinner.mainDish) {
        throw new Error('Dinner not found or has no main dish')
      }

      const existingSideDishes = (dinner.sideDishes || []).map(s => s.name)
      const sideDish = await mealsAPI.addSideDish({
        mainDish: dinner.mainDish,
        dietaryPreferences: mealPlan.dietaryPreferences || [],
        servings: dinner.servings || 4,
        existingSideDishes,
      })

      const updatedSideDishes = [...(dinner.sideDishes || []), { ...sideDish, id: `side-${Date.now()}` }]

      await mealPlanService.updateDinner(dinnerId, { sideDishes: updatedSideDishes })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === dinnerId ? { ...d, sideDishes: updatedSideDishes } : d
      )
      setMealPlan({ ...mealPlan, dinners: updatedDinners })

      // Update grocery list (non-blocking - don't fail if this errors)
      try {
        const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
        await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
        setGroceryList(newGroceryList)
      } catch (groceryErr) {
        console.warn('Failed to update grocery list:', groceryErr)
      }

      return sideDish
    } catch (err) {
      setError(err.message || 'Failed to add side dish')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeSideDish = async (dinnerId, sideDishId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === dinnerId)
      if (!dinner) throw new Error('Dinner not found')

      const updatedSideDishes = (dinner.sideDishes || []).filter(s => s.id !== sideDishId)

      await mealPlanService.updateDinner(dinnerId, { sideDishes: updatedSideDishes })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === dinnerId ? { ...d, sideDishes: updatedSideDishes } : d
      )
      setMealPlan({ ...mealPlan, dinners: updatedDinners })

      // Update grocery list (non-blocking)
      try {
        const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
        await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
        setGroceryList(newGroceryList)
      } catch (groceryErr) {
        console.warn('Failed to update grocery list:', groceryErr)
      }
    } catch (err) {
      setError(err.message || 'Failed to remove side dish')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addCocktail = async (dinnerId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === dinnerId)
      if (!dinner || !dinner.mainDish) {
        throw new Error('Dinner not found or has no main dish')
      }

      const result = await beveragesAPI.regenerateCocktail({
        recipeName: dinner.mainDish.name,
        ingredients: dinner.mainDish.ingredients?.map(i => i.item) || [],
      })

      // Get existing cocktails array (support both single cocktail and cocktails array)
      const currentCocktails = dinner.beveragePairing?.cocktails ||
        (dinner.beveragePairing?.cocktail ? [dinner.beveragePairing.cocktail] : [])

      const updatedBeveragePairing = {
        ...dinner.beveragePairing,
        cocktails: [...currentCocktails, { ...result.cocktail, id: `cocktail-${Date.now()}` }],
        cocktail: null, // Migrate away from single cocktail format
      }

      await mealPlanService.updateDinner(dinnerId, { beveragePairing: updatedBeveragePairing })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === dinnerId ? { ...d, beveragePairing: updatedBeveragePairing } : d
      )
      setMealPlan({ ...mealPlan, dinners: updatedDinners })

      return result.cocktail
    } catch (err) {
      setError(err.message || 'Failed to add cocktail')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeCocktail = async (dinnerId, cocktailId = null) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === dinnerId)
      if (!dinner) throw new Error('Dinner not found')

      // Get current cocktails (support both formats)
      const currentCocktails = dinner.beveragePairing?.cocktails ||
        (dinner.beveragePairing?.cocktail ? [dinner.beveragePairing.cocktail] : [])

      let updatedCocktails
      if (cocktailId) {
        updatedCocktails = currentCocktails.filter(c => c.id !== cocktailId)
      } else {
        updatedCocktails = []
      }

      const updatedBeveragePairing = dinner.beveragePairing
        ? { ...dinner.beveragePairing, cocktails: updatedCocktails, cocktail: null }
        : null

      const hasCocktails = updatedCocktails.length > 0
      const hasWine = updatedBeveragePairing?.wine
      const finalPairing = (hasCocktails || hasWine) ? updatedBeveragePairing : null

      await mealPlanService.updateDinner(dinnerId, { beveragePairing: finalPairing })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === dinnerId ? { ...d, beveragePairing: finalPairing } : d
      )
      setMealPlan({ ...mealPlan, dinners: updatedDinners })
    } catch (err) {
      setError(err.message || 'Failed to remove cocktail')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addWinePairing = async (dinnerId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === dinnerId)
      if (!dinner || !dinner.mainDish) {
        throw new Error('Dinner not found or has no main dish')
      }

      const result = await beveragesAPI.regenerateWine({
        recipeName: dinner.mainDish.name,
        ingredients: dinner.mainDish.ingredients?.map(i => i.item) || [],
      })

      const existingPairing = dinner.beveragePairing || {}
      const updatedPairing = { ...existingPairing, wine: result.wine }

      await mealPlanService.updateDinner(dinnerId, { beveragePairing: updatedPairing })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === dinnerId ? { ...d, beveragePairing: updatedPairing } : d
      )
      setMealPlan({ ...mealPlan, dinners: updatedDinners })

      return result.wine
    } catch (err) {
      setError(err.message || 'Failed to add wine pairing')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeWinePairing = async (dinnerId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === dinnerId)
      if (!dinner) throw new Error('Dinner not found')

      const existingPairing = dinner.beveragePairing || {}
      const { wine, ...updatedPairing } = existingPairing
      const finalPairing = Object.keys(updatedPairing).length > 0 ? updatedPairing : null

      await mealPlanService.updateDinner(dinnerId, { beveragePairing: finalPairing })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === dinnerId ? { ...d, beveragePairing: finalPairing } : d
      )
      setMealPlan({ ...mealPlan, dinners: updatedDinners })
    } catch (err) {
      setError(err.message || 'Failed to remove wine pairing')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Add an existing side dish from favorites to a specific meal
  const addSideDishToMeal = async (mealId, sideDish) => {
    const dinner = mealPlan.dinners.find(d => d.id === mealId)
    if (!dinner) throw new Error('Meal not found')

    const currentSides = dinner.sideDishes || []
    const updatedSideDishes = [...currentSides, { ...sideDish, id: `${sideDish.id}-${Date.now()}` }]

    await mealPlanService.updateDinner(mealId, { sideDishes: updatedSideDishes })

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, sideDishes: updatedSideDishes } : d
    )
    setMealPlan({ ...mealPlan, dinners: updatedDinners })

    // Update grocery list (non-blocking)
    try {
      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)
    } catch (groceryErr) {
      console.warn('Failed to update grocery list:', groceryErr)
    }
  }

  // Add a side dish as a standalone a la carte item
  const addAlaCarteSideDish = async (sideDish) => {
    const regularMeals = (mealPlan?.dinners || []).filter(d => !d.isAlaCarte)
    const alaCarte = (mealPlan?.dinners || []).filter(d => d.isAlaCarte)

    const newAlaCarteData = {
      mainDish: null,
      sideDishes: [{ ...sideDish, id: `${sideDish.id}-${Date.now()}` }],
      servings: 4,
      beveragePairing: null,
      isAlaCarte: true,
    }

    const newAlaCarte = await mealPlanService.addDinner(mealPlan.id, newAlaCarteData)
    const updatedDinners = [...regularMeals, ...alaCarte, newAlaCarte]
    setMealPlan({ ...mealPlan, dinners: updatedDinners })

    // Update grocery list (non-blocking)
    try {
      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)
    } catch (groceryErr) {
      console.warn('Failed to update grocery list:', groceryErr)
    }
  }

  // Add an existing cocktail from favorites to a specific meal
  const addCocktailToMeal = async (mealId, cocktail) => {
    const dinner = mealPlan.dinners.find(d => d.id === mealId)
    if (!dinner) throw new Error('Meal not found')

    const currentCocktails = dinner.beveragePairing?.cocktails ||
      (dinner.beveragePairing?.cocktail ? [dinner.beveragePairing.cocktail] : [])

    const updatedBeveragePairing = {
      ...dinner.beveragePairing,
      cocktails: [...currentCocktails, { ...cocktail, id: `${cocktail.id}-${Date.now()}` }],
      cocktail: null,
    }

    await mealPlanService.updateDinner(mealId, { beveragePairing: updatedBeveragePairing })

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
    )
    setMealPlan({ ...mealPlan, dinners: updatedDinners })
  }

  // Add a cocktail as a standalone a la carte item
  const addAlaCarteCocktail = async (cocktail) => {
    const regularMeals = (mealPlan?.dinners || []).filter(d => !d.isAlaCarte)
    const alaCarte = (mealPlan?.dinners || []).filter(d => d.isAlaCarte)

    const newAlaCarteData = {
      mainDish: null,
      sideDishes: [],
      servings: 4,
      beveragePairing: {
        cocktails: [{ ...cocktail, id: `${cocktail.id}-${Date.now()}` }],
        wine: null,
      },
      isAlaCarte: true,
    }

    const newAlaCarte = await mealPlanService.addDinner(mealPlan.id, newAlaCarteData)
    const updatedDinners = [...regularMeals, ...alaCarte, newAlaCarte]
    setMealPlan({ ...mealPlan, dinners: updatedDinners })
  }

  const updateGroceryItem = async (itemId, checked) => {
    const updatedItems = groceryList.items.map(item =>
      item.id === itemId ? { ...item, checked } : item
    )
    const updatedManualItems = (groceryList.manualItems || []).map(item =>
      item.id === itemId ? { ...item, checked } : item
    )

    const updatedGroceryList = { ...groceryList, items: updatedItems, manualItems: updatedManualItems }
    setGroceryList(updatedGroceryList)

    if (mealPlan?.id) {
      await mealPlanService.updateGroceryList(mealPlan.id, {
        items: updatedItems,
        manual_items: updatedManualItems,
      })
    }
  }

  const addManualGroceryItem = async (itemName, category = null) => {
    const newItem = {
      id: `manual-${Date.now()}`,
      item: itemName,
      category: category || 'other',
      checked: false,
    }
    const updatedManualItems = [...(groceryList?.manualItems || []), newItem]
    const updatedGroceryList = { ...groceryList, manualItems: updatedManualItems }
    setGroceryList(updatedGroceryList)

    if (mealPlan?.id) {
      await mealPlanService.updateGroceryList(mealPlan.id, {
        manual_items: updatedManualItems,
      })
    }
  }

  const refreshGroceryList = async (includeBeverages = false) => {
    if (!mealPlan?.dinners || mealPlan.dinners.length === 0) return

    try {
      const newGroceryList = await groceryAPI.generateList({
        meals: mealPlan.dinners,
        includeCocktails: includeBeverages,
      })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)
    } catch (err) {
      console.warn('Failed to refresh grocery list:', err)
    }
  }

  const value = {
    mealPlan,
    groceryList,
    loading,
    dataLoading,
    error,
    generateMealPlan,
    regenerateMeal,
    addMeal,
    generateNewMeal,
    removeMeal,
    clearMealPlan,
    updateGroceryItem,
    addManualGroceryItem,
    refreshMealPlan: fetchMealPlan,
    refreshGroceryList,
    addSideDish,
    addSideDishToMeal,
    addAlaCarteSideDish,
    removeSideDish,
    addCocktail,
    addCocktailToMeal,
    addAlaCarteCocktail,
    removeCocktail,
    addWinePairing,
    removeWinePairing,
  }

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>
}
