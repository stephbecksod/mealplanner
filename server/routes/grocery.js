const express = require('express')
const router = express.Router()

const combineIngredients = (meals, includeCocktails = false) => {
  const ingredientMap = new Map()

  const addIngredient = (ing, mealId, source = 'main') => {
    const key = ing.item.toLowerCase()

    if (ingredientMap.has(key)) {
      const existing = ingredientMap.get(key)
      ingredientMap.set(key, {
        ...existing,
        quantity: combineQuantities(existing.quantity, ing.quantity),
        mealIds: existing.mealIds.includes(mealId) ? existing.mealIds : [...existing.mealIds, mealId],
        sources: existing.sources.includes(source) ? existing.sources : [...existing.sources, source],
      })
    } else {
      ingredientMap.set(key, {
        id: `item-${Date.now()}-${Math.random()}`,
        item: ing.item,
        quantity: ing.quantity,
        category: ing.category || 'other',
        checked: false,
        mealIds: [mealId],
        sources: [source],
      })
    }
  }

  meals.forEach(meal => {
    // Handle both old (recipe) and new (mainDish) data formats
    const mainDish = meal.mainDish || meal.recipe

    // Add main dish ingredients
    if (mainDish && mainDish.ingredients) {
      mainDish.ingredients.forEach(ing => addIngredient(ing, meal.id, 'main'))
    }

    // Add side dish ingredients
    if (meal.sideDish && meal.sideDish.ingredients) {
      meal.sideDish.ingredients.forEach(ing => addIngredient(ing, meal.id, 'side'))
    }

    // Add cocktail ingredients if requested
    if (includeCocktails && meal.beveragePairing && meal.beveragePairing.cocktail && meal.beveragePairing.cocktail.ingredients) {
      meal.beveragePairing.cocktail.ingredients.forEach(ing => addIngredient(ing, meal.id, 'cocktail'))
    }
  })

  return Array.from(ingredientMap.values())
}

const combineQuantities = (qty1, qty2) => {
  if (!qty1) return qty2
  if (!qty2) return qty1

  const num1 = parseFloat(qty1)
  const num2 = parseFloat(qty2)

  if (!isNaN(num1) && !isNaN(num2)) {
    const unit = qty1.replace(num1.toString(), '').trim()
    return `${num1 + num2} ${unit}`.trim()
  }

  return `${qty1}, ${qty2}`
}

router.post('/generate', async (req, res) => {
  try {
    const { meals, includeCocktails } = req.body

    if (!meals || !Array.isArray(meals)) {
      return res.status(400).json({
        error: 'Meals array is required',
      })
    }

    const items = combineIngredients(meals, includeCocktails || false)

    const groceryList = {
      mealPlanId: meals[0]?.id || 'unknown',
      items,
      manualItems: [],
      createdAt: Date.now(),
    }

    res.json(groceryList)
  } catch (error) {
    console.error('Error generating grocery list:', error)
    res.status(500).json({
      error: 'Failed to generate grocery list',
      message: error.message,
    })
  }
})

module.exports = router
