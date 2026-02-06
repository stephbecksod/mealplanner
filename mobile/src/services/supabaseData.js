import { supabase } from './supabase'

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

  async getCookingEquipment() {
    const prefs = await this.getUserPreferences()
    return prefs?.cooking_equipment || DEFAULT_COOKING_EQUIPMENT
  },

  async updateCookingEquipment(equipment) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

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
}

export const mealPlanService = {
  async getActiveMealPlan() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .select('*, dinners(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !mealPlan) return null

    // Get grocery list
    const { data: groceryList } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('meal_plan_id', mealPlan.id)
      .single()

    return {
      mealPlan: {
        id: mealPlan.id,
        createdAt: mealPlan.created_at,
        dietaryPreferences: mealPlan.dietary_preferences || [],
        cuisinePreferences: mealPlan.cuisine_preferences || [],
        proteinPreferences: [], // Not stored in DB
        prioritizeOverlap: true, // Not stored in DB, default to true
        dinners: mealPlan.dinners.map(d => ({
          id: d.id,
          dayOfWeek: d.day_of_week,
          mainDish: d.main_dish,
          sideDishes: d.side_dishes || [],
          servings: d.servings,
          beveragePairing: d.beverage_pairing,
          isAlaCarte: d.is_a_la_carte,
        })),
      },
      groceryList: groceryList ? {
        items: groceryList.items || [],
        manualItems: groceryList.manual_items || [],
      } : null,
    }
  },

  async createMealPlan(mealPlan, groceryList) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Deactivate existing meal plans
    await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // Create new meal plan
    const { data: newPlan, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        dietary_preferences: mealPlan.dietaryPreferences || [],
        cuisine_preferences: mealPlan.cuisinePreferences || [],
        is_active: true,
      })
      .select()
      .single()

    if (planError) throw planError

    // Create dinners
    const dinnersToInsert = mealPlan.dinners.map(d => ({
      meal_plan_id: newPlan.id,
      day_of_week: d.dayOfWeek,
      main_dish: d.mainDish,
      side_dishes: d.sideDishes,
      servings: d.servings,
      beverage_pairing: d.beveragePairing,
      is_a_la_carte: d.isAlaCarte || false,
    }))

    const { data: dinners, error: dinnersError } = await supabase
      .from('dinners')
      .insert(dinnersToInsert)
      .select()

    if (dinnersError) throw dinnersError

    // Create grocery list
    if (groceryList) {
      await supabase
        .from('grocery_lists')
        .insert({
          meal_plan_id: newPlan.id,
          items: groceryList.items || [],
          manual_items: groceryList.manualItems || [],
        })
    }

    return {
      mealPlan: {
        ...mealPlan,
        id: newPlan.id,
        dinners: dinners.map((d, i) => ({
          ...mealPlan.dinners[i],
          id: d.id,
        })),
      },
      groceryList,
    }
  },

  async updateDinner(dinnerId, updates) {
    const updateData = {}
    if (updates.mainDish !== undefined) updateData.main_dish = updates.mainDish
    if (updates.sideDishes !== undefined) updateData.side_dishes = updates.sideDishes
    if (updates.beveragePairing !== undefined) updateData.beverage_pairing = updates.beveragePairing
    if (updates.servings !== undefined) updateData.servings = updates.servings

    const { error } = await supabase
      .from('dinners')
      .update(updateData)
      .eq('id', dinnerId)

    if (error) throw error
  },

  async addDinner(mealPlanId, dinner) {
    const { data, error } = await supabase
      .from('dinners')
      .insert({
        meal_plan_id: mealPlanId,
        day_of_week: dinner.dayOfWeek,
        main_dish: dinner.mainDish,
        side_dishes: dinner.sideDishes || [],
        servings: dinner.servings,
        beverage_pairing: dinner.beveragePairing,
        is_a_la_carte: dinner.isAlaCarte || false,
      })
      .select()
      .single()

    if (error) throw error

    return {
      ...dinner,
      id: data.id,
    }
  },

  async removeDinner(dinnerId) {
    const { error } = await supabase
      .from('dinners')
      .delete()
      .eq('id', dinnerId)

    if (error) throw error
  },

  async upsertGroceryList(mealPlanId, groceryList) {
    // First check if a grocery list exists for this meal plan
    const { data: existing } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('meal_plan_id', mealPlanId)
      .single()

    if (existing) {
      // Update existing grocery list
      const { error } = await supabase
        .from('grocery_lists')
        .update({
          items: groceryList.items || [],
          manual_items: groceryList.manualItems || [],
        })
        .eq('meal_plan_id', mealPlanId)

      if (error) throw error
    } else {
      // Insert new grocery list
      const { error } = await supabase
        .from('grocery_lists')
        .insert({
          meal_plan_id: mealPlanId,
          items: groceryList.items || [],
          manual_items: groceryList.manualItems || [],
        })

      if (error) throw error
    }
  },

  async updateGroceryList(mealPlanId, updates) {
    const { error } = await supabase
      .from('grocery_lists')
      .update(updates)
      .eq('meal_plan_id', mealPlanId)

    if (error) throw error
  },

  async clearMealPlan(mealPlanId) {
    await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('id', mealPlanId)
  },
}

export const favoritesService = {
  async getSavedRecipes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(r => ({ ...r.recipe_data, id: r.id, savedAt: r.created_at }))
  },

  async saveRecipe(recipe) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: user.id,
        recipe_data: recipe,
      })
      .select()
      .single()

    if (error) throw error
    return { ...recipe, id: data.id, savedAt: data.created_at }
  },

  async removeRecipe(recipeId) {
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', recipeId)

    if (error) throw error
  },

  async getSavedCocktails() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('saved_cocktails')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(c => ({ ...c.cocktail_data, id: c.id, savedAt: c.created_at }))
  },

  async saveCocktail(cocktail) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_cocktails')
      .insert({
        user_id: user.id,
        cocktail_data: cocktail,
      })
      .select()
      .single()

    if (error) throw error
    return { ...cocktail, id: data.id, savedAt: data.created_at }
  },

  async removeCocktail(cocktailId) {
    const { error } = await supabase
      .from('saved_cocktails')
      .delete()
      .eq('id', cocktailId)

    if (error) throw error
  },

  async getSavedSideDishes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('saved_side_dishes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(s => ({ ...s.side_dish_data, id: s.id, savedAt: s.created_at }))
  },

  async saveSideDish(sideDish) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_side_dishes')
      .insert({
        user_id: user.id,
        side_dish_data: sideDish,
      })
      .select()
      .single()

    if (error) throw error
    return { ...sideDish, id: data.id, savedAt: data.created_at }
  },

  async removeSideDish(sideDishId) {
    const { error } = await supabase
      .from('saved_side_dishes')
      .delete()
      .eq('id', sideDishId)

    if (error) throw error
  },
}
