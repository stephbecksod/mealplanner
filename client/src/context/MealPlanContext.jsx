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

  // Fetch meal plan from Supabase when user changes
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

  const generateMealPlan = async ({ numberOfMeals, dietaryPreferences, cuisinePreferences, proteinPreferences, servings, includeSides = false, includeCocktails = false, includeWine = false, prioritizeOverlap = true }) => {
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

      // Update state with DB-returned data (includes proper IDs)
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
      const hasSides = meal?.sideDishes?.length > 0 || meal?.sideDish

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

      // Update dinner in Supabase
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

    // Add dinner to Supabase
    const newDinner = await mealPlanService.addDinner(mealPlan.id, newDinnerData)

    const updatedDinners = [...regularMeals, newDinner, ...alaCarte]
    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }

    setMealPlan(updatedMealPlan)

    const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
    await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
    setGroceryList(newGroceryList)
  }

  const generateNewMeal = async (servings = 4) => {
    setLoading(true)
    setError(null)

    try {
      const meals = await mealsAPI.generateMeals({
        numberOfMeals: 1,
        dietaryPreferences: mealPlan?.dietaryPreferences || [],
        cuisinePreferences: mealPlan?.cuisinePreferences || [],
        proteinPreferences: mealPlan?.proteinPreferences || [],
        servings,
        includeSides: false,
        prioritizeOverlap: mealPlan?.prioritizeOverlap !== false,
      })

      const meal = meals[0]
      const { sideDish, ...mainDish } = meal

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

      // Add dinner to Supabase
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

  const collectExistingSideDishes = () => {
    if (!mealPlan?.dinners) return []
    const sideNames = []
    for (const dinner of mealPlan.dinners) {
      const sides = dinner.sideDishes || (dinner.sideDish ? [dinner.sideDish] : [])
      for (const side of sides) {
        if (side.name) sideNames.push(side.name)
      }
    }
    return sideNames
  }

  const addSideDish = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const existingSideDishes = collectExistingSideDishes()

      const sideDish = await mealsAPI.addSideDish({
        mainDish: dinner.mainDish,
        dietaryPreferences: mealPlan.dietaryPreferences || [],
        servings: dinner.servings,
        existingSideDishes,
      })

      const currentSides = dinner.sideDishes || (dinner.sideDish ? [dinner.sideDish] : [])
      const updatedSideDishes = [...currentSides, sideDish]

      // Update in Supabase
      await mealPlanService.updateDinner(mealId, { sideDishes: updatedSideDishes })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, sideDishes: updatedSideDishes } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)

      return sideDish
    } catch (err) {
      setError(err.message || 'Failed to add side dish')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addSideDishToMeal = async (mealId, sideDish) => {
    const dinner = mealPlan.dinners.find(d => d.id === mealId)
    if (!dinner) throw new Error('Meal not found')

    const currentSides = dinner.sideDishes || (dinner.sideDish ? [dinner.sideDish] : [])
    const updatedSideDishes = [...currentSides, { ...sideDish, id: `${sideDish.id}-${Date.now()}` }]

    // Update in Supabase
    await mealPlanService.updateDinner(mealId, { sideDishes: updatedSideDishes })

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, sideDishes: updatedSideDishes } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)

    const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
    await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
    setGroceryList(newGroceryList)
  }

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

    // Add dinner to Supabase
    const newAlaCarte = await mealPlanService.addDinner(mealPlan.id, newAlaCarteData)

    const updatedDinners = [...regularMeals, ...alaCarte, newAlaCarte]
    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }

    setMealPlan(updatedMealPlan)

    const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
    await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
    setGroceryList(newGroceryList)
  }

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

    // Add dinner to Supabase
    const newAlaCarte = await mealPlanService.addDinner(mealPlan.id, newAlaCarteData)

    const updatedDinners = [...regularMeals, ...alaCarte, newAlaCarte]
    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }

    setMealPlan(updatedMealPlan)

    const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
    await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
    setGroceryList(newGroceryList)
  }

  const removeSideDish = async (mealId, sideDishId = null) => {
    const dinner = mealPlan.dinners.find(d => d.id === mealId)
    if (!dinner) return

    let updatedSideDishes
    if (sideDishId) {
      const currentSides = dinner.sideDishes || (dinner.sideDish ? [dinner.sideDish] : [])
      updatedSideDishes = currentSides.filter(s => s.id !== sideDishId)
    } else {
      updatedSideDishes = []
    }

    // Update in Supabase
    await mealPlanService.updateDinner(mealId, { sideDishes: updatedSideDishes })

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, sideDishes: updatedSideDishes } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)

    const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
    await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
    setGroceryList(newGroceryList)
  }

  const regenerateSideDish = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const existingSideDishes = collectExistingSideDishes().filter(name => {
        const currentSides = dinner.sideDishes || (dinner.sideDish ? [dinner.sideDish] : [])
        return !currentSides.some(s => s.name === name)
      })

      const sideDish = await mealsAPI.regenerateSideDish({
        mainDish: dinner.mainDish,
        dietaryPreferences: mealPlan.dietaryPreferences || [],
        servings: dinner.servings,
        existingSideDishes,
      })

      // Update in Supabase
      await mealPlanService.updateDinner(mealId, { sideDishes: [sideDish] })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, sideDishes: [sideDish] } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)

      return sideDish
    } catch (err) {
      setError(err.message || 'Failed to regenerate side dish')
      throw err
    } finally {
      setLoading(false)
    }
  }

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

      // Update in Supabase
      await mealPlanService.updateDinner(mealId, { beveragePairing })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)

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

      const currentCocktails = dinner.beveragePairing?.cocktails ||
        (dinner.beveragePairing?.cocktail ? [dinner.beveragePairing.cocktail] : [])

      const updatedBeveragePairing = {
        ...dinner.beveragePairing,
        cocktails: [...currentCocktails, result.cocktail],
        cocktail: null,
      }

      // Update in Supabase
      await mealPlanService.updateDinner(mealId, { beveragePairing: updatedBeveragePairing })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)

      return result.cocktail
    } catch (err) {
      setError(err.message || 'Failed to add cocktail')
      throw err
    } finally {
      setLoading(false)
    }
  }

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

    // Update in Supabase
    await mealPlanService.updateDinner(mealId, { beveragePairing: updatedBeveragePairing })

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)

    const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
    await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
    setGroceryList(newGroceryList)
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

      // Update in Supabase
      await mealPlanService.updateDinner(mealId, { beveragePairing: updatedBeveragePairing })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)

      return result.wine
    } catch (err) {
      setError(err.message || 'Failed to add wine pairing')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeBeveragePairing = async (mealId) => {
    // Update in Supabase
    await mealPlanService.updateDinner(mealId, { beveragePairing: null })

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, beveragePairing: null } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)
  }

  const removeCocktail = async (mealId, cocktailId = null) => {
    const dinner = mealPlan.dinners.find(d => d.id === mealId)
    if (!dinner) return

    let updatedCocktails
    const currentCocktails = dinner.beveragePairing?.cocktails ||
      (dinner.beveragePairing?.cocktail ? [dinner.beveragePairing.cocktail] : [])

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
    const finalBeveragePairing = (hasCocktails || hasWine) ? updatedBeveragePairing : null

    // Update in Supabase
    await mealPlanService.updateDinner(mealId, { beveragePairing: finalBeveragePairing })

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, beveragePairing: finalBeveragePairing } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)

    const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
    await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
    setGroceryList(newGroceryList)
  }

  const removeWinePairing = async (mealId) => {
    const dinner = mealPlan.dinners.find(d => d.id === mealId)
    if (!dinner) return

    const updatedBeveragePairing = dinner.beveragePairing
      ? { ...dinner.beveragePairing, wine: null }
      : null

    const finalBeveragePairing = updatedBeveragePairing?.cocktail ? updatedBeveragePairing : null

    // Update in Supabase
    await mealPlanService.updateDinner(mealId, { beveragePairing: finalBeveragePairing })

    const updatedDinners = mealPlan.dinners.map(d =>
      d.id === mealId ? { ...d, beveragePairing: finalBeveragePairing } : d
    )

    const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
    setMealPlan(updatedMealPlan)
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

      // Update in Supabase
      await mealPlanService.updateDinner(mealId, { beveragePairing: updatedBeveragePairing })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)

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

      // Update in Supabase
      await mealPlanService.updateDinner(mealId, { beveragePairing: updatedBeveragePairing })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId ? { ...d, beveragePairing: updatedBeveragePairing } : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)

      return result.wine
    } catch (err) {
      setError(err.message || 'Failed to regenerate wine pairing')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const regenerateAllComponents = async (mealId) => {
    setLoading(true)
    setError(null)

    try {
      const dinner = mealPlan.dinners.find(d => d.id === mealId)
      if (!dinner) throw new Error('Meal not found')

      const hasSide = !!dinner.sideDish
      const newRecipe = await mealsAPI.regenerateMeal({
        mealId,
        dietaryPreferences: mealPlan.dietaryPreferences || [],
        cuisinePreferences: mealPlan.cuisinePreferences || [],
        servings: dinner.servings,
        includeSides: hasSide,
      })

      const { sideDish, ...mainDish } = newRecipe

      let beveragePairing = null
      if (dinner.beveragePairing) {
        beveragePairing = await beveragesAPI.generatePairing({
          recipeName: mainDish.name,
          ingredients: mainDish.ingredients.map(i => i.item),
        })
      }

      // Update in Supabase
      await mealPlanService.updateDinner(mealId, {
        mainDish,
        sideDishes: sideDish ? [sideDish] : [],
        beveragePairing,
      })

      const updatedDinners = mealPlan.dinners.map(d =>
        d.id === mealId
          ? { ...d, mainDish, sideDishes: sideDish ? [sideDish] : [], beveragePairing }
          : d
      )

      const updatedMealPlan = { ...mealPlan, dinners: updatedDinners }
      setMealPlan(updatedMealPlan)

      const newGroceryList = await groceryAPI.generateList({ meals: updatedDinners })
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
      setGroceryList(newGroceryList)

      return { mainDish, sideDish: sideDish || null, beveragePairing }
    } catch (err) {
      setError(err.message || 'Failed to regenerate all components')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeMeal = async (mealId) => {
    // Remove from Supabase
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

    // Build checked_items array for Supabase
    const allItems = [...updatedItems, ...updatedManualItems]
    const checkedItems = allItems.filter(i => i.checked).map(i => i.id)

    const updatedGroceryList = { ...groceryList, items: updatedItems, manualItems: updatedManualItems }
    setGroceryList(updatedGroceryList)

    // Update in Supabase
    if (mealPlan?.id) {
      await mealPlanService.updateGroceryList(mealPlan.id, {
        items: updatedItems,
        manualItems: updatedManualItems,
        checkedItems,
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
    const updatedManualItems = [...(groceryList.manualItems || []), newItem]
    const updatedGroceryList = { ...groceryList, manualItems: updatedManualItems }
    setGroceryList(updatedGroceryList)

    // Update in Supabase
    if (mealPlan?.id) {
      await mealPlanService.updateGroceryList(mealPlan.id, {
        manualItems: updatedManualItems,
      })
    }
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

    newGroceryList.items = newGroceryList.items.map(item => ({
      ...item,
      checked: existingCheckedIds.has(item.item.toLowerCase()),
    }))
    newGroceryList.manualItems = existingManualItems

    setGroceryList(newGroceryList)

    // Update in Supabase
    if (mealPlan?.id) {
      await mealPlanService.upsertGroceryList(mealPlan.id, newGroceryList)
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
    // Side dish methods
    addSideDish,
    addSideDishToMeal,
    addAlaCarteSideDish,
    removeSideDish,
    regenerateSideDish,
    // Beverage methods
    addBeveragePairing,
    addCocktail,
    addCocktailToMeal,
    addAlaCarteCocktail,
    addWinePairing,
    removeBeveragePairing,
    removeCocktail,
    removeWinePairing,
    regenerateCocktail,
    regenerateWine,
    regenerateAllComponents,
    // Grocery methods
    refreshGroceryList,
    // Refresh method
    refreshMealPlan: fetchMealPlan,
  }

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>
}
