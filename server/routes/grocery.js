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

    // Add side dish ingredients - support both old (sideDish) and new (sideDishes) formats
    const sideDishes = meal.sideDishes || (meal.sideDish ? [meal.sideDish] : [])
    sideDishes.forEach(sideDish => {
      if (sideDish && sideDish.ingredients) {
        sideDish.ingredients.forEach(ing => addIngredient(ing, meal.id, 'side'))
      }
    })

    // Add cocktail ingredients if requested - support both old (cocktail) and new (cocktails) formats
    if (includeCocktails && meal.beveragePairing) {
      const cocktails = meal.beveragePairing.cocktails ||
        (meal.beveragePairing.cocktail ? [meal.beveragePairing.cocktail] : [])
      cocktails.forEach(cocktail => {
        if (cocktail && cocktail.ingredients) {
          cocktail.ingredients.forEach(ing => addIngredient(ing, meal.id, 'cocktail'))
        }
      })
    }
  })

  return Array.from(ingredientMap.values())
}

// Unicode and text fraction mappings
const FRACTION_MAP = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 0.333, '⅔': 0.667,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 0.167, '⅚': 0.833,
}

// Parse a quantity string and extract the numeric value
const parseQuantity = (qtyStr) => {
  if (!qtyStr) return 0

  let str = qtyStr.toString().toLowerCase().trim()
  let total = 0

  // Replace unicode fractions with decimals
  for (const [frac, val] of Object.entries(FRACTION_MAP)) {
    if (str.includes(frac)) {
      total += val
      str = str.replace(frac, '')
    }
  }

  // Handle text fractions like "1/2", "1/4"
  const textFractionMatch = str.match(/(\d+)\s*\/\s*(\d+)/)
  if (textFractionMatch) {
    const [, num, denom] = textFractionMatch
    total += parseInt(num) / parseInt(denom)
    str = str.replace(textFractionMatch[0], '')
  }

  // Extract leading number (handles "4 cloves", "1 large", etc.)
  const leadingNumMatch = str.match(/^[\s,]*(\d+(?:\.\d+)?)\s*/)
  if (leadingNumMatch) {
    total += parseFloat(leadingNumMatch[1])
    str = str.replace(leadingNumMatch[0], '')
  }

  // Check for additional numbers in the remaining string (less common)
  const additionalNumMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:more|additional)?/)
  if (additionalNumMatch && !str.includes('oz') && !str.includes('lb') && !str.includes('cup') && !str.includes('tbsp') && !str.includes('tsp')) {
    // Only add if it's not a measurement unit amount
  }

  return total || 0
}

// Format a number nicely (e.g., 4.5, 21, 2.25)
const formatQuantity = (num, itemName) => {
  if (num === 0) return ''

  // Round to reasonable precision
  const rounded = Math.round(num * 4) / 4 // Round to nearest 0.25

  // Format nicely
  if (rounded === Math.floor(rounded)) {
    return `${Math.floor(rounded)} ${itemName}`
  }

  // Convert common decimals back to fractions for display
  const whole = Math.floor(rounded)
  const frac = rounded - whole
  let fracStr = ''

  if (Math.abs(frac - 0.25) < 0.01) fracStr = '¼'
  else if (Math.abs(frac - 0.5) < 0.01) fracStr = '½'
  else if (Math.abs(frac - 0.75) < 0.01) fracStr = '¾'
  else if (Math.abs(frac - 0.333) < 0.02) fracStr = '⅓'
  else if (Math.abs(frac - 0.667) < 0.02) fracStr = '⅔'
  else fracStr = frac.toFixed(2).replace('0.', '.')

  if (whole === 0) {
    return `${fracStr} ${itemName}`
  }
  return `${whole}${fracStr} ${itemName}`
}

const combineQuantities = (qty1, qty2) => {
  if (!qty1) return qty2
  if (!qty2) return qty1

  // Parse both quantities to get numeric values
  const num1 = parseQuantity(qty1)
  const num2 = parseQuantity(qty2)

  // If we successfully parsed both, add them
  if (num1 > 0 && num2 > 0) {
    const total = num1 + num2

    // Round to reasonable precision
    const rounded = Math.round(total * 4) / 4

    // Format nicely
    if (rounded === Math.floor(rounded)) {
      return Math.floor(rounded).toString()
    }

    // Convert common decimals back to fractions for display
    const whole = Math.floor(rounded)
    const frac = rounded - whole
    let fracStr = ''

    if (Math.abs(frac - 0.25) < 0.01) fracStr = '¼'
    else if (Math.abs(frac - 0.5) < 0.01) fracStr = '½'
    else if (Math.abs(frac - 0.75) < 0.01) fracStr = '¾'
    else if (Math.abs(frac - 0.333) < 0.02) fracStr = '⅓'
    else if (Math.abs(frac - 0.667) < 0.02) fracStr = '⅔'
    else return rounded.toString()

    if (whole === 0) {
      return fracStr
    }
    return `${whole}${fracStr}`
  }

  // If we parsed one but not the other, return the parsed one with the original
  if (num1 > 0 && num2 === 0) {
    return qty1
  }
  if (num2 > 0 && num1 === 0) {
    return qty2
  }

  // Fallback: concatenate
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
