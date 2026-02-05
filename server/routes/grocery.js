const express = require('express')
const router = express.Router()

// ============================================================================
// INGREDIENT NORMALIZATION
// ============================================================================

// Preparation methods to remove (these don't affect what you buy)
const PREP_METHODS = [
  'cubed', 'diced', 'sliced', 'minced', 'chopped', 'julienned', 'shredded',
  'grated', 'crushed', 'mashed', 'pureed', 'ground', 'torn', 'cut',
  'thinly sliced', 'roughly chopped', 'finely chopped', 'finely diced',
  'finely minced', 'coarsely chopped', 'halved', 'quartered', 'trimmed',
  'peeled', 'seeded', 'deveined', 'cleaned', 'washed', 'dried', 'patted dry',
  'at room temperature', 'room temperature', 'softened', 'melted', 'cooled',
  'warmed', 'chilled', 'frozen', 'thawed', 'divided', 'separated',
  'beaten', 'whisked', 'sifted', 'toasted', 'roasted', 'grilled', 'sauteed',
  'packed', 'loosely packed', 'firmly packed', 'lightly packed',
]

// Important qualifiers to KEEP (these affect what you buy)
const IMPORTANT_QUALIFIERS = [
  'boneless', 'skinless', 'bone-in', 'skin-on', 'bone in', 'skin on',
  'whole', 'ground', 'fresh', 'dried', 'canned', 'frozen',
  'full-fat', 'low-fat', 'fat-free', 'reduced-fat', 'skim', 'whole milk',
  'unsalted', 'salted', 'sweet', 'unsweetened', 'sweetened',
  'extra-virgin', 'virgin', 'light', 'dark', 'white', 'brown', 'black',
  'raw', 'cooked', 'smoked', 'cured',
  'large', 'medium', 'small', 'baby', 'mini', 'jumbo',
  'ripe', 'unripe', 'green', 'yellow', 'red',
  'italian', 'chinese', 'thai', 'japanese', 'mexican', 'indian',
  'flat-leaf', 'curly',
]

// Normalize an ingredient name for grouping
const normalizeIngredientName = (name) => {
  let normalized = name.toLowerCase().trim()

  // Remove content in parentheses that's prep-related
  normalized = normalized.replace(/\s*\([^)]*(?:optional|to taste|for garnish|for serving)[^)]*\)/gi, '')

  // Remove trailing prep instructions after comma
  // But be careful not to remove important qualifiers
  const parts = normalized.split(',')
  if (parts.length > 1) {
    const mainPart = parts[0].trim()
    const qualifierPart = parts.slice(1).join(',').trim()

    // Check if the qualifier part contains important qualifiers
    const hasImportantQualifier = IMPORTANT_QUALIFIERS.some(q =>
      qualifierPart.includes(q)
    )

    // Check if it's just prep instructions
    const isPrepOnly = PREP_METHODS.some(prep =>
      qualifierPart === prep || qualifierPart.startsWith(prep + ' ') || qualifierPart.endsWith(' ' + prep)
    )

    if (isPrepOnly && !hasImportantQualifier) {
      normalized = mainPart
    } else if (hasImportantQualifier) {
      // Keep the important qualifier but remove prep methods from it
      let cleanQualifier = qualifierPart
      PREP_METHODS.forEach(prep => {
        cleanQualifier = cleanQualifier.replace(new RegExp(`\\b${prep}\\b`, 'gi'), '')
      })
      cleanQualifier = cleanQualifier.replace(/\s+/g, ' ').trim()
      if (cleanQualifier) {
        normalized = `${mainPart}, ${cleanQualifier}`
      } else {
        normalized = mainPart
      }
    }
  }

  // Remove standalone prep methods
  PREP_METHODS.forEach(prep => {
    // Only remove if it's a standalone word, not part of another word
    const regex = new RegExp(`\\b${prep}\\b`, 'gi')
    normalized = normalized.replace(regex, '')
  })

  // Clean up extra spaces and punctuation
  normalized = normalized
    .replace(/\s*,\s*,\s*/g, ', ')  // Remove double commas
    .replace(/,\s*$/g, '')           // Remove trailing comma
    .replace(/^\s*,\s*/g, '')        // Remove leading comma
    .replace(/\s+/g, ' ')            // Collapse multiple spaces
    .trim()

  return normalized
}

// Get a display name (cleaner version for showing in the list)
const getDisplayName = (name) => {
  let display = normalizeIngredientName(name)
  // Capitalize first letter
  return display.charAt(0).toUpperCase() + display.slice(1)
}

// ============================================================================
// QUANTITY PARSING AND COMBINING
// ============================================================================

// Unicode and text fraction mappings
const FRACTION_MAP = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 0.333, '⅔': 0.667,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 0.167, '⅚': 0.833,
}

// Unit normalization (convert to standard form)
const UNIT_ALIASES = {
  'teaspoon': 'tsp', 'teaspoons': 'tsp', 'tsps': 'tsp',
  'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tbsps': 'tbsp',
  'ounce': 'oz', 'ounces': 'oz', 'ozs': 'oz',
  'pound': 'lb', 'pounds': 'lb', 'lbs': 'lb',
  'cup': 'cup', 'cups': 'cup',
  'pint': 'pint', 'pints': 'pint',
  'quart': 'quart', 'quarts': 'quart',
  'gallon': 'gallon', 'gallons': 'gallon',
  'liter': 'liter', 'liters': 'liter', 'litre': 'liter', 'litres': 'liter',
  'milliliter': 'ml', 'milliliters': 'ml', 'mls': 'ml',
  'gram': 'g', 'grams': 'g',
  'kilogram': 'kg', 'kilograms': 'kg', 'kgs': 'kg',
  'clove': 'clove', 'cloves': 'clove',
  'can': 'can', 'cans': 'can',
  'jar': 'jar', 'jars': 'jar',
  'bottle': 'bottle', 'bottles': 'bottle',
  'package': 'package', 'packages': 'package', 'pkg': 'package', 'pkgs': 'package',
  'bunch': 'bunch', 'bunches': 'bunch',
  'head': 'head', 'heads': 'head',
  'stalk': 'stalk', 'stalks': 'stalk',
  'sprig': 'sprig', 'sprigs': 'sprig',
  'slice': 'slice', 'slices': 'slice',
  'piece': 'piece', 'pieces': 'piece',
  'stick': 'stick', 'sticks': 'stick',
  'strip': 'strip', 'strips': 'strip',
  'fillet': 'fillet', 'fillets': 'fillet',
  'breast': 'breast', 'breasts': 'breast',
  'thigh': 'thigh', 'thighs': 'thigh',
  'leg': 'leg', 'legs': 'leg',
  'wing': 'wing', 'wings': 'wing',
  'lime': 'lime', 'limes': 'lime',
  'lemon': 'lemon', 'lemons': 'lemon',
  'orange': 'orange', 'oranges': 'orange',
  'onion': 'onion', 'onions': 'onion',
  'tomato': 'tomato', 'tomatoes': 'tomato',
  'potato': 'potato', 'potatoes': 'potato',
  'carrot': 'carrot', 'carrots': 'carrot',
  'egg': 'egg', 'eggs': 'egg',
  'clove': 'clove', 'cloves': 'clove',
}

// Parse a quantity string and extract number, unit, and size info
const parseQuantityWithUnit = (qtyStr) => {
  if (!qtyStr) return { number: 0, unit: '', sizeInfo: '' }

  let str = qtyStr.toString().trim()
  let number = 0
  let unit = ''
  let sizeInfo = ''

  // Extract size info in parentheses like "(14 oz each)" or "(14 oz)"
  const sizeMatch = str.match(/\(([^)]+)\)/)
  if (sizeMatch) {
    sizeInfo = sizeMatch[1].trim()
    str = str.replace(sizeMatch[0], '').trim()
  }

  // Replace unicode fractions
  for (const [frac, val] of Object.entries(FRACTION_MAP)) {
    if (str.includes(frac)) {
      number += val
      str = str.replace(frac, '').trim()
    }
  }

  // Handle text fractions like "1/2", "1/4"
  const textFractionMatch = str.match(/(\d+)\s*\/\s*(\d+)/)
  if (textFractionMatch) {
    const [fullMatch, num, denom] = textFractionMatch
    number += parseInt(num) / parseInt(denom)
    str = str.replace(fullMatch, '').trim()
  }

  // Extract leading number
  const leadingNumMatch = str.match(/^(\d+(?:\.\d+)?)\s*/)
  if (leadingNumMatch) {
    number += parseFloat(leadingNumMatch[1])
    str = str.replace(leadingNumMatch[0], '').trim()
  }

  // What's left should be the unit
  str = str.toLowerCase().replace(/^[-,.\s]+/, '').replace(/[-,.\s]+$/, '')

  // Normalize the unit
  if (str && UNIT_ALIASES[str]) {
    unit = UNIT_ALIASES[str]
  } else if (str) {
    // Check if it starts with a known unit
    for (const [alias, normalized] of Object.entries(UNIT_ALIASES)) {
      if (str.startsWith(alias)) {
        unit = normalized
        break
      }
    }
    if (!unit) {
      unit = str
    }
  }

  return { number, unit, sizeInfo }
}

// Format a number nicely with optional unit
const formatNumber = (num) => {
  if (num === 0) return '0'

  // Round to reasonable precision (nearest 0.25 for most, 0.125 for small amounts)
  const rounded = num < 1 ? Math.round(num * 8) / 8 : Math.round(num * 4) / 4

  if (rounded === Math.floor(rounded)) {
    return Math.floor(rounded).toString()
  }

  const whole = Math.floor(rounded)
  const frac = rounded - whole
  let fracStr = ''

  if (Math.abs(frac - 0.125) < 0.01) fracStr = '⅛'
  else if (Math.abs(frac - 0.25) < 0.01) fracStr = '¼'
  else if (Math.abs(frac - 0.333) < 0.02) fracStr = '⅓'
  else if (Math.abs(frac - 0.375) < 0.01) fracStr = '⅜'
  else if (Math.abs(frac - 0.5) < 0.01) fracStr = '½'
  else if (Math.abs(frac - 0.625) < 0.01) fracStr = '⅝'
  else if (Math.abs(frac - 0.667) < 0.02) fracStr = '⅔'
  else if (Math.abs(frac - 0.75) < 0.01) fracStr = '¾'
  else if (Math.abs(frac - 0.875) < 0.01) fracStr = '⅞'
  else return rounded.toFixed(2).replace(/\.?0+$/, '')

  if (whole === 0) {
    return fracStr
  }
  return `${whole}${fracStr}`
}

// Format quantity with unit
const formatQuantityWithUnit = (number, unit, sizeInfo) => {
  const numStr = formatNumber(number)

  if (!unit) return numStr

  // Pluralize unit if needed
  let displayUnit = unit
  if (number > 1) {
    // Simple pluralization for common units
    const plurals = {
      'lime': 'limes', 'lemon': 'lemons', 'orange': 'oranges',
      'onion': 'onions', 'tomato': 'tomatoes', 'potato': 'potatoes',
      'carrot': 'carrots', 'egg': 'eggs', 'clove': 'cloves',
      'can': 'cans', 'jar': 'jars', 'bottle': 'bottles',
      'bunch': 'bunches', 'head': 'heads', 'stalk': 'stalks',
      'sprig': 'sprigs', 'slice': 'slices', 'piece': 'pieces',
      'breast': 'breasts', 'thigh': 'thighs', 'fillet': 'fillets',
      'package': 'packages', 'stick': 'sticks', 'strip': 'strips',
    }
    displayUnit = plurals[unit] || unit
  }

  let result = `${numStr} ${displayUnit}`

  // Add size info back
  if (sizeInfo) {
    result += ` (${sizeInfo})`
  }

  return result
}

// Combine two quantities intelligently
const combineQuantities = (qty1, qty2) => {
  if (!qty1) return qty2
  if (!qty2) return qty1

  const parsed1 = parseQuantityWithUnit(qty1)
  const parsed2 = parseQuantityWithUnit(qty2)

  // If both have the same unit (or no unit), combine
  if (parsed1.unit === parsed2.unit || !parsed1.unit || !parsed2.unit) {
    const totalNumber = parsed1.number + parsed2.number
    const unit = parsed1.unit || parsed2.unit
    const sizeInfo = parsed1.sizeInfo || parsed2.sizeInfo

    if (totalNumber > 0) {
      return formatQuantityWithUnit(totalNumber, unit, sizeInfo)
    }
  }

  // If units don't match but we got numbers, try to combine anyway
  // (e.g., "1.5 lbs" + "1 lb" where one didn't parse the unit correctly)
  if (parsed1.number > 0 && parsed2.number > 0) {
    const totalNumber = parsed1.number + parsed2.number
    // Use whichever unit we found
    const unit = parsed1.unit || parsed2.unit
    const sizeInfo = parsed1.sizeInfo || parsed2.sizeInfo
    return formatQuantityWithUnit(totalNumber, unit, sizeInfo)
  }

  // Fallback: concatenate (should rarely happen now)
  return `${qty1} + ${qty2}`
}

// ============================================================================
// MAIN INGREDIENT COMBINING LOGIC
// ============================================================================

const combineIngredients = (meals, includeCocktails = false) => {
  const ingredientMap = new Map()

  const addIngredient = (ing, mealId, source = 'main') => {
    // Normalize the ingredient name for grouping
    const key = normalizeIngredientName(ing.item)

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
        item: getDisplayName(ing.item),  // Clean display name
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
