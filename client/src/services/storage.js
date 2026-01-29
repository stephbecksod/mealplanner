const STORAGE_KEYS = {
  CURRENT_MEAL_PLAN: 'meal-planner:currentMealPlan',
  SAVED_RECIPES: 'meal-planner:savedRecipes',
  SAVED_COCKTAILS: 'meal-planner:savedCocktails',
  SAVED_SIDE_DISHES: 'meal-planner:savedSideDishes',
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

  removeSavedCocktail(cocktailId) {
    const cocktails = this.getSavedCocktails()
    const updatedCocktails = cocktails.filter(c => c.id !== cocktailId)
    return this.setSavedCocktails(updatedCocktails)
  }

  getSavedSideDishes() {
    return this.getItem(STORAGE_KEYS.SAVED_SIDE_DISHES) || []
  }

  setSavedSideDishes(sideDishes) {
    return this.setItem(STORAGE_KEYS.SAVED_SIDE_DISHES, sideDishes)
  }

  addSavedSideDish(sideDish) {
    const sideDishes = this.getSavedSideDishes()
    const updatedSideDishes = [...sideDishes, { ...sideDish, savedAt: Date.now() }]
    return this.setSavedSideDishes(updatedSideDishes)
  }

  removeSavedSideDish(sideDishId) {
    const sideDishes = this.getSavedSideDishes()
    const updatedSideDishes = sideDishes.filter(s => s.id !== sideDishId)
    return this.setSavedSideDishes(updatedSideDishes)
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

  // Migration function to convert old meal plan format to new format
  migrateMealPlan(mealPlan) {
    if (!mealPlan || !mealPlan.dinners) return mealPlan

    const needsMigration = mealPlan.dinners.some(dinner =>
      (dinner.recipe && !dinner.mainDish) ||
      (dinner.sideDish && !dinner.sideDishes) ||
      (dinner.beveragePairing?.cocktail && !dinner.beveragePairing?.cocktails)
    )

    if (!needsMigration) return mealPlan

    const migratedDinners = mealPlan.dinners.map(dinner => {
      let migrated = { ...dinner }

      // Migrate recipe -> mainDish
      if (dinner.recipe && !dinner.mainDish) {
        const { recipe, ...rest } = migrated
        migrated = { ...rest, mainDish: recipe }
      }

      // Migrate sideDish -> sideDishes (array)
      if (dinner.sideDish && !dinner.sideDishes) {
        migrated.sideDishes = [dinner.sideDish]
      } else if (!dinner.sideDishes) {
        migrated.sideDishes = []
      }

      // Migrate beveragePairing.cocktail -> beveragePairing.cocktails (array)
      if (dinner.beveragePairing?.cocktail && !dinner.beveragePairing?.cocktails) {
        migrated.beveragePairing = {
          ...dinner.beveragePairing,
          cocktails: [dinner.beveragePairing.cocktail],
          cocktail: null,
        }
      } else if (dinner.beveragePairing && !dinner.beveragePairing.cocktails) {
        migrated.beveragePairing = {
          ...dinner.beveragePairing,
          cocktails: [],
        }
      }

      // Ensure isAlaCarte flag exists
      if (migrated.isAlaCarte === undefined) {
        migrated.isAlaCarte = false
      }

      return migrated
    })

    return {
      ...mealPlan,
      dinners: migratedDinners,
    }
  }
}

export default new StorageService()
