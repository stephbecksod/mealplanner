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

module.exports = router
