const STORAGE_KEYS = {
  CURRENT_MEAL_PLAN: 'meal-planner:currentMealPlan',
  SAVED_RECIPES: 'meal-planner:savedRecipes',
  SAVED_COCKTAILS: 'meal-planner:savedCocktails',
  USER_PREFERENCES: 'meal-planner:userPreferences',
  GROCERY_LIST: 'meal-planner:groceryList',
}

class StorageService {
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      return false
    }
  }

  getItem(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from localStorage:', error)
      return false
    }
  }

  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }

  getCurrentMealPlan() {
    return this.getItem(STORAGE_KEYS.CURRENT_MEAL_PLAN)
  }

  setCurrentMealPlan(mealPlan) {
    return this.setItem(STORAGE_KEYS.CURRENT_MEAL_PLAN, mealPlan)
  }

  getSavedRecipes() {
    return this.getItem(STORAGE_KEYS.SAVED_RECIPES) || []
  }

  setSavedRecipes(recipes) {
    return this.setItem(STORAGE_KEYS.SAVED_RECIPES, recipes)
  }

  addSavedRecipe(recipe) {
    const recipes = this.getSavedRecipes()
    const updatedRecipes = [...recipes, { ...recipe, savedAt: Date.now() }]
    return this.setSavedRecipes(updatedRecipes)
  }

  removeSavedRecipe(recipeId) {
    const recipes = this.getSavedRecipes()
    const updatedRecipes = recipes.filter(r => r.id !== recipeId)
    return this.setSavedRecipes(updatedRecipes)
  }

  getSavedCocktails() {
    return this.getItem(STORAGE_KEYS.SAVED_COCKTAILS) || []
  }

  setSavedCocktails(cocktails) {
    return this.setItem(STORAGE_KEYS.SAVED_COCKTAILS, cocktails)
  }

  addSavedCocktail(cocktail) {
    const cocktails = this.getSavedCocktails()
    const updatedCocktails = [...cocktails, { ...cocktail, savedAt: Date.now() }]
    return this.setSavedCocktails(updatedCocktails)
  }

  getUserPreferences() {
    return this.getItem(STORAGE_KEYS.USER_PREFERENCES) || {
      defaultServings: 4,
      dietaryRestrictions: [],
      favoriteCuisines: [],
    }
  }

  setUserPreferences(preferences) {
    return this.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences)
  }

  getGroceryList() {
    return this.getItem(STORAGE_KEYS.GROCERY_LIST)
  }

  setGroceryList(groceryList) {
    return this.setItem(STORAGE_KEYS.GROCERY_LIST, groceryList)
  }
}

export default new StorageService()
