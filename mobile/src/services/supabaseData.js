import { supabase } from './supabase'

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
        proteinPreferences: mealPlan.protein_preferences || [],
        prioritizeOverlap: mealPlan.prioritize_overlap !== false,
        dinners: mealPlan.dinners.map(d => ({
          id: d.id,
          dayOfWeek: d.day_of_week,
          mainDish: d.main_dish,
          sideDishes: d.side_dishes || [],
          servings: d.servings,
          beveragePairing: d.beverage_pairing,
          isAlaCarte: d.is_ala_carte,
        })),
      },
      groceryList: groceryList ? {
        items: groceryList.items || [],
        categories: groceryList.categories || {},
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
        dietary_preferences: mealPlan.dietaryPreferences,
        cuisine_preferences: mealPlan.cuisinePreferences,
        protein_preferences: mealPlan.proteinPreferences,
        prioritize_overlap: mealPlan.prioritizeOverlap,
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
      is_ala_carte: d.isAlaCarte || false,
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
          items: groceryList.items,
          categories: groceryList.categories,
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
        is_ala_carte: dinner.isAlaCarte || false,
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
    const { error } = await supabase
      .from('grocery_lists')
      .upsert({
        meal_plan_id: mealPlanId,
        items: groceryList.items,
        categories: groceryList.categories,
        manual_items: groceryList.manualItems || [],
      }, {
        onConflict: 'meal_plan_id',
      })

    if (error) throw error
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
    return data.map(r => ({ ...r.recipe, id: r.id, savedAt: r.created_at }))
  },

  async saveRecipe(recipe) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: user.id,
        recipe: recipe,
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
    return data.map(c => ({ ...c.cocktail, id: c.id, savedAt: c.created_at }))
  },

  async saveCocktail(cocktail) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_cocktails')
      .insert({
        user_id: user.id,
        cocktail: cocktail,
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
    return data.map(s => ({ ...s.side_dish, id: s.id, savedAt: s.created_at }))
  },

  async saveSideDish(sideDish) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_side_dishes')
      .insert({
        user_id: user.id,
        side_dish: sideDish,
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
