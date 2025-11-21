import { createContext, useContext, useState, useEffect } from 'react'
import storage from '../services/storage'
import { mealsAPI, groceryAPI } from '../services/api'

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
    const savedMealPlan = storage.getCurrentMealPlan()
    const savedGroceryList = storage.getGroceryList()

    if (savedMealPlan) {
      setMealPlan(savedMealPlan)
    }
    if (savedGroceryList) {
      setGroceryList(savedGroceryList)
    }
  }, [])

  const generateMealPlan = async ({ numberOfMeals, dietaryPreferences, cuisinePreferences, servings }) => {
    setLoading(true)
    setError(null)

    try {
      const meals = await mealsAPI.generateMeals({
        numberOfMeals,
        dietaryPreferences,
        cuisinePreferences,
        servings,
      })

      const newMealPlan = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        dinners: meals.map((meal, index) => ({
          id: `meal-${Date.now()}-${index}`,
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][index] || `Day ${index + 1}`,
          recipe: meal,
          servings: servings || 4,
          beveragePairing: null,
        })),
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

  const regenerateMeal = async (mealId, { dietaryPreferences, cuisinePreferences, servings }) => {
    setLoading(true)
    setError(null)

    try {
      const newRecipe = await mealsAPI.regenerateMeal({
        mealId,
        dietaryPreferences,
        cuisinePreferences,
        servings,
      })

      const updatedDinners = mealPlan.dinners.map(dinner =>
        dinner.id === mealId
          ? { ...dinner, recipe: newRecipe, beveragePairing: null }
          : dinner
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)
      storage.setCurrentMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      setGroceryList(newGroceryList)
      storage.setGroceryList(newGroceryList)

      return newRecipe
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
      recipe,
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
    const updatedGroceryList = { ...groceryList, items: updatedItems }
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
  }

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>
}
