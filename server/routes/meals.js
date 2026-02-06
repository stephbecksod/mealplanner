const express = require('express')
const router = express.Router()
const claudeService = require('../services/claudeService')

router.post('/generate', async (req, res) => {
  try {
    const { numberOfMeals, dietaryPreferences, cuisinePreferences, proteinPreferences, servings, includeSides, prioritizeOverlap, cookingEquipment } = req.body

    if (!numberOfMeals || numberOfMeals < 1 || numberOfMeals > 5) {
      return res.status(400).json({
        error: 'Invalid number of meals. Must be between 1 and 5.',
      })
    }

    const recipes = await claudeService.generateRecipes({
      numberOfMeals,
      dietaryPreferences: dietaryPreferences || [],
      cuisinePreferences: cuisinePreferences || [],
      proteinPreferences: proteinPreferences || [],
      servings: servings || 4,
      includeSides: includeSides || false,
      prioritizeOverlap: prioritizeOverlap !== false,
      cookingEquipment: cookingEquipment || null,
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
    const { dietaryPreferences, cuisinePreferences, proteinPreferences, servings, includeSides, existingMeals, prioritizeOverlap, cookingEquipment } = req.body

    const recipe = await claudeService.regenerateRecipe({
      dietaryPreferences: dietaryPreferences || [],
      cuisinePreferences: cuisinePreferences || [],
      proteinPreferences: proteinPreferences || [],
      servings: servings || 4,
      includeSides: includeSides || false,
      existingMeals: existingMeals || [],
      prioritizeOverlap: prioritizeOverlap !== false,
      cookingEquipment: cookingEquipment || null,
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

router.post('/add-side', async (req, res) => {
  try {
    const { mainDish, dietaryPreferences, servings } = req.body

    if (!mainDish || !mainDish.name || !mainDish.ingredients) {
      return res.status(400).json({
        error: 'Main dish with name and ingredients is required',
      })
    }

    const sideDish = await claudeService.generateSideDish({
      mainDish,
      dietaryPreferences: dietaryPreferences || [],
      servings: servings || 4,
    })

    res.json(sideDish)
  } catch (error) {
    console.error('Error adding side dish:', error)
    res.status(500).json({
      error: 'Failed to add side dish',
      message: error.message,
    })
  }
})

router.post('/regenerate-side', async (req, res) => {
  try {
    const { mainDish, dietaryPreferences, servings } = req.body

    if (!mainDish || !mainDish.name || !mainDish.ingredients) {
      return res.status(400).json({
        error: 'Main dish with name and ingredients is required',
      })
    }

    const sideDish = await claudeService.regenerateSideDish({
      mainDish,
      dietaryPreferences: dietaryPreferences || [],
      servings: servings || 4,
    })

    res.json(sideDish)
  } catch (error) {
    console.error('Error regenerating side dish:', error)
    res.status(500).json({
      error: 'Failed to regenerate side dish',
      message: error.message,
    })
  }
})

router.post('/convert-method', async (req, res) => {
  try {
    const { recipe, targetEquipment } = req.body

    if (!recipe || !recipe.name || !recipe.ingredients) {
      return res.status(400).json({
        error: 'Recipe with name and ingredients is required',
      })
    }

    if (!targetEquipment) {
      return res.status(400).json({
        error: 'Target equipment is required',
      })
    }

    const convertedRecipe = await claudeService.convertCookingMethod({
      recipe,
      targetEquipment,
    })

    res.json(convertedRecipe)
  } catch (error) {
    console.error('Error converting cooking method:', error)
    res.status(500).json({
      error: 'Failed to convert cooking method',
      message: error.message,
    })
  }
})

module.exports = router
