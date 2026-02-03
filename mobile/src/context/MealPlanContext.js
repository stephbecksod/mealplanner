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

  const addMeal = async (recipe, servings) => {
    const regularMeals = (mealPlan?.dinners || []).filter(d => !d.isAlaCarte)
    const alaCarte = (mealPlan?.dinners || []).filter(d => d.isAlaCarte)

    const newDinnerData = {
      dayOfWeek: `Day ${regularMeals.length + 1}`,
      mainDish: recipe,
      sideDishes: [],
      servings: servings || 4,
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

  const value = {
    mealPlan,
    groceryList,
    loading,
    dataLoading,
    error,
    generateMealPlan,
    regenerateMeal,
    addMeal,
    removeMeal,
    clearMealPlan,
    updateGroceryItem,
    refreshMealPlan: fetchMealPlan,
  }

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>
}
