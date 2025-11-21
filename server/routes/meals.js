const express = require('express')
const router = express.Router()
const claudeService = require('../services/claudeService')

router.post('/generate', async (req, res) => {
  try {
    const { numberOfMeals, dietaryPreferences, cuisinePreferences, servings } = req.body

    if (!numberOfMeals || numberOfMeals < 1 || numberOfMeals > 5) {
      return res.status(400).json({
        error: 'Invalid number of meals. Must be between 1 and 5.',
      })
    }

    const recipes = await claudeService.generateRecipes({
      numberOfMeals,
      dietaryPreferences: dietaryPreferences || [],
      cuisinePreferences: cuisinePreferences || [],
      servings: servings || 4,
    })

    res.json(recipes)
  } catch (error) {
    console.error('Error generating meals:', error)
    res.status(500).json({
      error: 'Failed to generate meals',
      message: error.message,
    })
  }
})

router.post('/regenerate', async (req, res) => {
  try {
    const { dietaryPreferences, cuisinePreferences, servings } = req.body

    const recipe = await claudeService.regenerateRecipe({
      dietaryPreferences: dietaryPreferences || [],
      cuisinePreferences: cuisinePreferences || [],
      servings: servings || 4,
    })

    res.json(recipe)
  } catch (error) {
    console.error('Error regenerating meal:', error)
    res.status(500).json({
      error: 'Failed to regenerate meal',
      message: error.message,
    })
  }
})

module.exports = router
