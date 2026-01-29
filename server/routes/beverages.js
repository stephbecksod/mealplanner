const express = require('express')
const router = express.Router()
const claudeService = require('../services/claudeService')

router.post('/pair', async (req, res) => {
  try {
    const { recipeName, ingredients } = req.body

    if (!recipeName || !ingredients) {
      return res.status(400).json({
        error: 'Recipe name and ingredients are required',
      })
    }

    const pairing = await claudeService.generateBeveragePairing({
      recipeName,
      ingredients,
    })

    res.json(pairing)
  } catch (error) {
    console.error('Error generating beverage pairing:', error)
    res.status(500).json({
      error: 'Failed to generate beverage pairing',
      message: error.message,
    })
  }
})

router.post('/regenerate-cocktail', async (req, res) => {
  try {
    const { recipeName, ingredients } = req.body

    if (!recipeName || !ingredients) {
      return res.status(400).json({
        error: 'Recipe name and ingredients are required',
      })
    }

    const pairing = await claudeService.generateBeveragePairing({
      recipeName,
      ingredients,
    })

    // Return just the cocktail part
    res.json({ cocktail: pairing.cocktail })
  } catch (error) {
    console.error('Error regenerating cocktail:', error)
    res.status(500).json({
      error: 'Failed to regenerate cocktail',
      message: error.message,
    })
  }
})

router.post('/regenerate-wine', async (req, res) => {
  try {
    const { recipeName, ingredients } = req.body

    if (!recipeName || !ingredients) {
      return res.status(400).json({
        error: 'Recipe name and ingredients are required',
      })
    }

    const pairing = await claudeService.generateBeveragePairing({
      recipeName,
      ingredients,
    })

    // Return just the wine part
    res.json({ wine: pairing.wine })
  } catch (error) {
    console.error('Error regenerating wine pairing:', error)
    res.status(500).json({
      error: 'Failed to regenerate wine pairing',
      message: error.message,
    })
  }
})

module.exports = router
