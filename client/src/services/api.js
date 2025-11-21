import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    throw error
  }
)

export const mealsAPI = {
  generateMeals: async ({ numberOfMeals, dietaryPreferences, cuisinePreferences, servings }) => {
    const response = await api.post('/meals/generate', {
      numberOfMeals,
      dietaryPreferences,
      cuisinePreferences,
      servings,
    })
    return response.data
  },

  regenerateMeal: async ({ mealId, dietaryPreferences, cuisinePreferences, servings }) => {
    const response = await api.post('/meals/regenerate', {
      mealId,
      dietaryPreferences,
      cuisinePreferences,
      servings,
    })
    return response.data
  },
}

export const beveragesAPI = {
  generatePairing: async ({ recipeName, ingredients }) => {
    const response = await api.post('/beverages/pair', {
      recipeName,
      ingredients,
    })
    return response.data
  },
}

export const groceryAPI = {
  generateList: async ({ meals }) => {
    const response = await api.post('/grocery/generate', {
      meals,
    })
    return response.data
  },
}

export default api
