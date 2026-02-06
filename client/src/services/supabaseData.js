import { supabase } from './supabase'

// ============================================
// DATA TRANSFORMATION HELPERS
// ============================================

/**
 * Transform app meal plan format to database format
 */
export const transformMealPlanToDB = (appFormat, userId) => {
  const mealPlan = {
    user_id: userId,
    dietary_preferences: appFormat.dietaryPreferences || [],
    cuisine_preferences: appFormat.cuisinePreferences || [],
    is_active: true,
  }

  const dinners = (appFormat.dinners || []).map(dinner => ({
    day_of_week: dinner.dayOfWeek || null,
    servings: dinner.servings || 4,
    is_a_la_carte: dinner.isAlaCarte || false,
    main_dish: dinner.mainDish || null,
    side_dishes: dinner.sideDishes || [],
    beverage_pairing: dinner.beveragePairing || null,
  }))

  return { mealPlan, dinners }
}

/**
 * Transform database meal plan format to app format
 */
export const transformMealPlanFromDB = (dbMealPlan, dbDinners, dbGroceryList) => {
  if (!dbMealPlan) return null

  const dinners = (dbDinners || []).map(dinner => ({
    id: dinner.id,
    dayOfWeek: dinner.day_of_week,
    servings: dinner.servings,
    isAlaCarte: dinner.is_a_la_carte,
    mainDish: dinner.main_dish,
    sideDishes: dinner.side_dishes || [],
    beveragePairing: dinner.beverage_pairing,
  }))

  const mealPlan = {
    id: dbMealPlan.id,
    createdAt: new Date(dbMealPlan.created_at).getTime(),
    dietaryPreferences: dbMealPlan.dietary_preferences || [],
    cuisinePreferences: dbMealPlan.cuisine_preferences || [],
    dinners,
  }

  const groceryList = dbGroceryList ? {
    items: dbGroceryList.items || [],
    manualItems: dbGroceryList.manual_items || [],
    checkedItems: dbGroceryList.checked_items || [],
    includeBeverages: dbGroceryList.include_beverages || false,
  } : null

  return { mealPlan, groceryList }
}

/**
 * Transform saved recipe from DB format to app format
 */
const transformRecipeFromDB = (dbRecipe) => ({
  id: dbRecipe.id,
  ...dbRecipe.recipe_data,
  savedAt: new Date(dbRecipe.created_at).getTime(),
})

/**
 * Transform saved cocktail from DB format to app format
 */
const transformCocktailFromDB = (dbCocktail) => ({
  id: dbCocktail.id,
  ...dbCocktail.cocktail_data,
  savedAt: new Date(dbCocktail.created_at).getTime(),
})

/**
 * Transform saved side dish from DB format to app format
 */
const transformSideDishFromDB = (dbSideDish) => ({
  id: dbSideDish.id,
  ...dbSideDish.side_dish_data,
  savedAt: new Date(dbSideDish.created_at).getTime(),
})

// ============================================
// MEAL PLAN SERVICE
// ============================================

export const mealPlanService = {
  /**
   * Fetch the active meal plan with dinners and grocery list
   */
  async getActiveMealPlan() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get active meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (mealPlanError && mealPlanError.code !== 'PGRST116') {
      throw mealPlanError
    }

    if (!mealPlan) return null

    // Get dinners for this meal plan
    const { data: dinners, error: dinnersError } = await supabase
      .from('dinners')
      .select('*')
      .eq('meal_plan_id', mealPlan.id)
      .order('created_at', { ascending: true })

    if (dinnersError) throw dinnersError

    // Get grocery list for this meal plan
    const { data: groceryList, error: groceryError } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('meal_plan_id', mealPlan.id)
      .single()

    if (groceryError && groceryError.code !== 'PGRST116') {
      throw groceryError
    }

    return transformMealPlanFromDB(mealPlan, dinners, groceryList)
  },

  /**
   * Create a new meal plan, deactivating any existing active plans
   */
  async createMealPlan(mealPlanData, groceryListData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { mealPlan, dinners } = transformMealPlanToDB(mealPlanData, user.id)

    // Deactivate existing active meal plans
    await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Create new meal plan
    const { data: newMealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert(mealPlan)
      .select()
      .single()

    if (mealPlanError) throw mealPlanError

    // Create dinners
    const dinnersWithMealPlanId = dinners.map(dinner => ({
      ...dinner,
      meal_plan_id: newMealPlan.id,
    }))

    const { data: newDinners, error: dinnersError } = await supabase
      .from('dinners')
      .insert(dinnersWithMealPlanId)
      .select()

    if (dinnersError) throw dinnersError

    // Create grocery list
    const { data: newGroceryList, error: groceryError } = await supabase
      .from('grocery_lists')
      .insert({
        meal_plan_id: newMealPlan.id,
        items: groceryListData?.items || [],
        manual_items: groceryListData?.manualItems || [],
        checked_items: [],
        include_beverages: groceryListData?.includeBeverages || false,
      })
      .select()
      .single()

    if (groceryError) throw groceryError

    return transformMealPlanFromDB(newMealPlan, newDinners, newGroceryList)
  },

  /**
   * Update a single dinner
   */
  async updateDinner(dinnerId, updates) {
    const dbUpdates = {}
    if (updates.dayOfWeek !== undefined) dbUpdates.day_of_week = updates.dayOfWeek
    if (updates.servings !== undefined) dbUpdates.servings = updates.servings
    if (updates.isAlaCarte !== undefined) dbUpdates.is_a_la_carte = updates.isAlaCarte
    if (updates.mainDish !== undefined) dbUpdates.main_dish = updates.mainDish
    if (updates.sideDishes !== undefined) dbUpdates.side_dishes = updates.sideDishes
    if (updates.beveragePairing !== undefined) dbUpdates.beverage_pairing = updates.beveragePairing

    const { data, error } = await supabase
      .from('dinners')
      .update(dbUpdates)
      .eq('id', dinnerId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      dayOfWeek: data.day_of_week,
      servings: data.servings,
      isAlaCarte: data.is_a_la_carte,
      mainDish: data.main_dish,
      sideDishes: data.side_dishes || [],
      beveragePairing: data.beverage_pairing,
    }
  },

  /**
   * Add a new dinner to an existing meal plan
   */
  async addDinner(mealPlanId, dinnerData) {
    const { data, error } = await supabase
      .from('dinners')
      .insert({
        meal_plan_id: mealPlanId,
        day_of_week: dinnerData.dayOfWeek || null,
        servings: dinnerData.servings || 4,
        is_a_la_carte: dinnerData.isAlaCarte || false,
        main_dish: dinnerData.mainDish || null,
        side_dishes: dinnerData.sideDishes || [],
        beverage_pairing: dinnerData.beveragePairing || null,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      dayOfWeek: data.day_of_week,
      servings: data.servings,
      isAlaCarte: data.is_a_la_carte,
      mainDish: data.main_dish,
      sideDishes: data.side_dishes || [],
      beveragePairing: data.beverage_pairing,
    }
  },

  /**
   * Remove a dinner from the plan
   */
  async removeDinner(dinnerId) {
    const { error } = await supabase
      .from('dinners')
      .delete()
      .eq('id', dinnerId)

    if (error) throw error
  },

  /**
   * Update the grocery list for a meal plan
   */
  async updateGroceryList(mealPlanId, updates) {
    const dbUpdates = {}
    if (updates.items !== undefined) dbUpdates.items = updates.items
    if (updates.manualItems !== undefined) dbUpdates.manual_items = updates.manualItems
    if (updates.checkedItems !== undefined) dbUpdates.checked_items = updates.checkedItems
    if (updates.includeBeverages !== undefined) dbUpdates.include_beverages = updates.includeBeverages

    const { data, error } = await supabase
      .from('grocery_lists')
      .update(dbUpdates)
      .eq('meal_plan_id', mealPlanId)
      .select()
      .single()

    if (error) throw error

    return {
      items: data.items || [],
      manualItems: data.manual_items || [],
      checkedItems: data.checked_items || [],
      includeBeverages: data.include_beverages || false,
    }
  },

  /**
   * Create or replace the grocery list for a meal plan
   */
  async upsertGroceryList(mealPlanId, groceryListData) {
    // First try to get existing grocery list
    const { data: existing } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('meal_plan_id', mealPlanId)
      .single()

    if (existing) {
      return this.updateGroceryList(mealPlanId, groceryListData)
    }

    // Create new grocery list
    const { data, error } = await supabase
      .from('grocery_lists')
      .insert({
        meal_plan_id: mealPlanId,
        items: groceryListData.items || [],
        manual_items: groceryListData.manualItems || [],
        checked_items: groceryListData.checkedItems || [],
        include_beverages: groceryListData.includeBeverages || false,
      })
      .select()
      .single()

    if (error) throw error

    return {
      items: data.items || [],
      manualItems: data.manual_items || [],
      checkedItems: data.checked_items || [],
      includeBeverages: data.include_beverages || false,
    }
  },

  /**
   * Delete meal plan and all related data (cascade)
   */
  async clearMealPlan(mealPlanId) {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId)

    if (error) throw error
  },
}

// ============================================
// FAVORITES SERVICE
// ============================================

export const favoritesService = {
  /**
   * Get all saved recipes for the current user
   */
  async getSavedRecipes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(transformRecipeFromDB)
  },

  /**
   * Save a recipe
   */
  async saveRecipe(recipe) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Remove id and savedAt if present (we'll use DB-generated values)
    const { id, savedAt, ...recipeData } = recipe

    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: user.id,
        recipe_data: recipeData,
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation (recipe already saved)
      if (error.code === '23505') {
        return null
      }
      throw error
    }

    return transformRecipeFromDB(data)
  },

  /**
   * Remove a saved recipe
   */
  async removeRecipe(recipeId) {
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', recipeId)

    if (error) throw error
  },

  /**
   * Get all saved cocktails for the current user
   */
  async getSavedCocktails() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('saved_cocktails')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(transformCocktailFromDB)
  },

  /**
   * Save a cocktail
   */
  async saveCocktail(cocktail) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Remove id and savedAt if present
    const { id, savedAt, ...cocktailData } = cocktail

    const { data, error } = await supabase
      .from('saved_cocktails')
      .insert({
        user_id: user.id,
        cocktail_data: cocktailData,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return null
      }
      throw error
    }

    return transformCocktailFromDB(data)
  },

  /**
   * Remove a saved cocktail
   */
  async removeCocktail(cocktailId) {
    const { error } = await supabase
      .from('saved_cocktails')
      .delete()
      .eq('id', cocktailId)

    if (error) throw error
  },

  /**
   * Get all saved side dishes for the current user
   */
  async getSavedSideDishes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('saved_side_dishes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(transformSideDishFromDB)
  },

  /**
   * Save a side dish
   */
  async saveSideDish(sideDish) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Remove id and savedAt if present
    const { id, savedAt, ...sideDishData } = sideDish

    const { data, error } = await supabase
      .from('saved_side_dishes')
      .insert({
        user_id: user.id,
        side_dish_data: sideDishData,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return null
      }
      throw error
    }

    return transformSideDishFromDB(data)
  },

  /**
   * Remove a saved side dish
   */
  async removeSideDish(sideDishId) {
    const { error } = await supabase
      .from('saved_side_dishes')
      .delete()
      .eq('id', sideDishId)

    if (error) throw error
  },
}

// ============================================
// USER PREFERENCES SERVICE
// ============================================

// Default equipment (oven and stovetop are pre-checked)
const DEFAULT_COOKING_EQUIPMENT = ['oven', 'stovetop']

// All available equipment options
export const COOKING_EQUIPMENT_OPTIONS = [
  { id: 'oven', label: 'Oven', default: true },
  { id: 'stovetop', label: 'Stovetop', default: true },
  { id: 'grill', label: 'Grill (outdoor)', default: false },
  { id: 'air_fryer', label: 'Air Fryer', default: false },
  { id: 'instant_pot', label: 'Instant Pot / Pressure Cooker', default: false },
  { id: 'slow_cooker', label: 'Slow Cooker', default: false },
  { id: 'sous_vide', label: 'Sous Vide', default: false },
  { id: 'smoker', label: 'Smoker', default: false },
  { id: 'dutch_oven', label: 'Dutch Oven', default: false },
  { id: 'wok', label: 'Wok', default: false },
]

export const userPreferencesService = {
  /**
   * Get user preferences
   */
  async getUserPreferences() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Return with defaults if no preferences exist
    if (!data) {
      return {
        default_servings: 4,
        default_dietary_preferences: [],
        default_cuisine_preferences: [],
        cooking_equipment: DEFAULT_COOKING_EQUIPMENT,
      }
    }

    return {
      ...data,
      cooking_equipment: data.cooking_equipment || DEFAULT_COOKING_EQUIPMENT,
    }
  },

  /**
   * Get just the cooking equipment
   */
  async getCookingEquipment() {
    const prefs = await this.getUserPreferences()
    return prefs?.cooking_equipment || DEFAULT_COOKING_EQUIPMENT
  },

  /**
   * Update cooking equipment
   */
  async updateCookingEquipment(equipment) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Try to update existing preferences
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ cooking_equipment: equipment })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data.cooking_equipment
    }

    // Create new preferences if none exist
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        cooking_equipment: equipment,
      })
      .select()
      .single()

    if (error) throw error
    return data.cooking_equipment
  },

  /**
   * Update all user preferences
   */
  async updateUserPreferences(updates) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const dbUpdates = {}
    if (updates.defaultServings !== undefined) dbUpdates.default_servings = updates.defaultServings
    if (updates.defaultDietaryPreferences !== undefined) dbUpdates.default_dietary_preferences = updates.defaultDietaryPreferences
    if (updates.defaultCuisinePreferences !== undefined) dbUpdates.default_cuisine_preferences = updates.defaultCuisinePreferences
    if (updates.cookingEquipment !== undefined) dbUpdates.cooking_equipment = updates.cookingEquipment

    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    }

    // Create new preferences if none exist
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        ...dbUpdates,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// ============================================
// MIGRATION SERVICE
// ============================================

const STORAGE_KEYS = {
  CURRENT_MEAL_PLAN: 'meal-planner:currentMealPlan',
  SAVED_RECIPES: 'meal-planner:savedRecipes',
  SAVED_COCKTAILS: 'meal-planner:savedCocktails',
  SAVED_SIDE_DISHES: 'meal-planner:savedSideDishes',
  GROCERY_LIST: 'meal-planner:groceryList',
  MIGRATED: 'meal-planner:migrated',
}

export const migrationService = {
  /**
   * Check if there's localStorage data to migrate
   */
  hasLocalData() {
    try {
      const mealPlan = localStorage.getItem(STORAGE_KEYS.CURRENT_MEAL_PLAN)
      const recipes = localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES)
      const cocktails = localStorage.getItem(STORAGE_KEYS.SAVED_COCKTAILS)
      const sideDishes = localStorage.getItem(STORAGE_KEYS.SAVED_SIDE_DISHES)

      return !!(mealPlan || recipes || cocktails || sideDishes)
    } catch {
      return false
    }
  },

  /**
   * Check if migration has already been completed
   */
  hasMigrated() {
    try {
      return localStorage.getItem(STORAGE_KEYS.MIGRATED) === 'true'
    } catch {
      return false
    }
  },

  /**
   * Mark migration as complete
   */
  markMigrated() {
    try {
      localStorage.setItem(STORAGE_KEYS.MIGRATED, 'true')
    } catch {
      // Ignore localStorage errors
    }
  },

  /**
   * Migrate all localStorage data to Supabase
   */
  async migrateFromLocalStorage(onProgress) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const results = {
      mealPlan: false,
      recipes: 0,
      cocktails: 0,
      sideDishes: 0,
    }

    try {
      // Migrate meal plan
      onProgress?.('Migrating meal plan...')
      const mealPlanJson = localStorage.getItem(STORAGE_KEYS.CURRENT_MEAL_PLAN)
      const groceryListJson = localStorage.getItem(STORAGE_KEYS.GROCERY_LIST)

      if (mealPlanJson) {
        const mealPlan = JSON.parse(mealPlanJson)
        const groceryList = groceryListJson ? JSON.parse(groceryListJson) : null

        await mealPlanService.createMealPlan(mealPlan, groceryList)
        results.mealPlan = true
      }

      // Migrate saved recipes
      onProgress?.('Migrating saved recipes...')
      const recipesJson = localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES)
      if (recipesJson) {
        const recipes = JSON.parse(recipesJson)
        for (const recipe of recipes) {
          try {
            await favoritesService.saveRecipe(recipe)
            results.recipes++
          } catch {
            // Skip duplicates or errors
          }
        }
      }

      // Migrate saved cocktails
      onProgress?.('Migrating saved cocktails...')
      const cocktailsJson = localStorage.getItem(STORAGE_KEYS.SAVED_COCKTAILS)
      if (cocktailsJson) {
        const cocktails = JSON.parse(cocktailsJson)
        for (const cocktail of cocktails) {
          try {
            await favoritesService.saveCocktail(cocktail)
            results.cocktails++
          } catch {
            // Skip duplicates or errors
          }
        }
      }

      // Migrate saved side dishes
      onProgress?.('Migrating saved side dishes...')
      const sideDishesJson = localStorage.getItem(STORAGE_KEYS.SAVED_SIDE_DISHES)
      if (sideDishesJson) {
        const sideDishes = JSON.parse(sideDishesJson)
        for (const sideDish of sideDishes) {
          try {
            await favoritesService.saveSideDish(sideDish)
            results.sideDishes++
          } catch {
            // Skip duplicates or errors
          }
        }
      }

      // Mark migration as complete
      this.markMigrated()

      return results
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  },

  /**
   * Clear localStorage data after successful migration
   */
  clearLocalStorage() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_MEAL_PLAN)
      localStorage.removeItem(STORAGE_KEYS.SAVED_RECIPES)
      localStorage.removeItem(STORAGE_KEYS.SAVED_COCKTAILS)
      localStorage.removeItem(STORAGE_KEYS.SAVED_SIDE_DISHES)
      localStorage.removeItem(STORAGE_KEYS.GROCERY_LIST)
    } catch {
      // Ignore localStorage errors
    }
  },
}
