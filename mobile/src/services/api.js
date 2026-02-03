import { supabase } from './supabase'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`

// Custom error class for better error handling
export class APIError extends Error {
  constructor(message, type, originalError = null) {
    super(message)
    this.name = 'APIError'
    this.type = type
    this.originalError = originalError
  }
}

// Helper to get auth headers with JWT token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : '',
  }
}

// Generic fetch wrapper with error handling
const fetchWithAuth = async (endpoint, options = {}) => {
  const headers = await getAuthHeaders()
  const timeout = options.timeout || 60000

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const serverMessage = errorData.error || errorData.message

      if (response.status === 401) {
        throw new APIError('Please sign in to continue.', 'auth', null)
      }

      if (response.status >= 500) {
        throw new APIError(serverMessage || 'Server error. Please try again later.', 'server', null)
      }

      if (response.status === 400) {
        throw new APIError(serverMessage || 'Invalid request. Please check your input.', 'validation', null)
      }

      throw new APIError(serverMessage || 'Something went wrong. Please try again.', 'unknown', null)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof APIError) {
      throw error
    }

    if (error.name === 'AbortError') {
      throw new APIError('Request timed out. The AI is taking longer than expected.', 'timeout', error)
    }

    throw new APIError('Unable to connect to the server. Please try again.', 'network', error)
  }
}

export const mealsAPI = {
  generateMeals: async ({ numberOfMeals, dietaryPreferences, cuisinePreferences, proteinPreferences, servings, includeSides, prioritizeOverlap }) => {
    const response = await fetchWithAuth('/generate-meals', {
      method: 'POST',
      body: JSON.stringify({
        numberOfMeals,
        dietaryPreferences,
        cuisinePreferences,
        proteinPreferences,
        servings,
        includeSides,
        prioritizeOverlap,
      }),
    })
    return response.recipes
  },

  regenerateMeal: async ({ mealId, dietaryPreferences, cuisinePreferences, proteinPreferences, servings, includeSides, existingMeals, prioritizeOverlap }) => {
    const response = await fetchWithAuth('/regenerate-meal', {
      method: 'POST',
      body: JSON.stringify({
        mealId,
        dietaryPreferences,
        cuisinePreferences,
        proteinPreferences,
        servings,
        includeSides,
        existingMeals,
        prioritizeOverlap,
      }),
    })
    return response.recipe
  },

  addSideDish: async ({ mainDish, dietaryPreferences, servings, existingSideDishes }) => {
    const response = await fetchWithAuth('/add-side-dish', {
      method: 'POST',
      body: JSON.stringify({
        mainDish,
        dietaryPreferences,
        servings,
        existingSideDishes,
      }),
    })
    return response.sideDish
  },
}

export const beveragesAPI = {
  generatePairing: async ({ recipeName, ingredients }) => {
    return fetchWithAuth('/add-beverage', {
      method: 'POST',
      body: JSON.stringify({
        recipeName,
        ingredients,
        type: 'both',
      }),
    })
  },

  regenerateCocktail: async ({ recipeName, ingredients }) => {
    return fetchWithAuth('/add-beverage', {
      method: 'POST',
      body: JSON.stringify({
        recipeName,
        ingredients,
        type: 'cocktail',
      }),
    })
  },

  regenerateWine: async ({ recipeName, ingredients }) => {
    return fetchWithAuth('/add-beverage', {
      method: 'POST',
      body: JSON.stringify({
        recipeName,
        ingredients,
        type: 'wine',
      }),
    })
  },
}

export const groceryAPI = {
  generateList: async ({ meals, includeCocktails = false }) => {
    const response = await fetchWithAuth('/generate-grocery', {
      method: 'POST',
      body: JSON.stringify({
        meals,
        includeCocktails,
      }),
    })
    const groceryList = response.groceryList
    const items = []
    for (const category of Object.keys(groceryList)) {
      for (const item of groceryList[category]) {
        items.push({ ...item, checked: false })
      }
    }
    return { items, categories: groceryList, manualItems: [] }
  },
}

export default {
  mealsAPI,
  beveragesAPI,
  groceryAPI,
}
