const CATEGORY_KEYWORDS = {
  produce: ['lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'celery', 'cucumber',
            'spinach', 'kale', 'broccoli', 'cauliflower', 'potato', 'apple', 'banana', 'lemon',
            'lime', 'orange', 'avocado', 'mushroom', 'zucchini', 'squash', 'bean', 'peas'],
  dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'parmesan', 'mozzarella',
          'cheddar', 'feta', 'ricotta', 'cottage cheese'],
  protein: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey', 'lamb',
            'tofu', 'tempeh', 'eggs', 'bacon', 'sausage', 'ground beef', 'steak'],
  pantry: ['flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'rice', 'pasta', 'bread',
           'cereal', 'oats', 'honey', 'maple syrup', 'soy sauce', 'worcestershire', 'ketchup',
           'mustard', 'mayonnaise', 'stock', 'broth', 'can', 'canned'],
  spices: ['cumin', 'paprika', 'oregano', 'basil', 'thyme', 'rosemary', 'cinnamon', 'nutmeg',
           'ginger', 'turmeric', 'curry', 'chili powder', 'cayenne', 'coriander', 'parsley',
           'dill', 'sage', 'bay leaf'],
  beverages: ['wine', 'beer', 'vodka', 'rum', 'gin', 'whiskey', 'tequila', 'vermouth', 'juice',
              'soda', 'tonic', 'bitters', 'liqueur'],
}

export const categorizeIngredient = (ingredientName) => {
  const lowerName = ingredientName.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category
    }
  }

  return 'other'
}

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
  const parts = normalized.split(',')
  if (parts.length > 1) {
    const mainPart = parts[0].trim()
    const qualifierPart = parts.slice(1).join(',').trim()

    const hasImportantQualifier = IMPORTANT_QUALIFIERS.some(q =>
      qualifierPart.includes(q)
    )

    const isPrepOnly = PREP_METHODS.some(prep =>
      qualifierPart === prep || qualifierPart.startsWith(prep + ' ') || qualifierPart.endsWith(' ' + prep)
    )

    if (isPrepOnly && !hasImportantQualifier) {
      normalized = mainPart
    } else if (hasImportantQualifier) {
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
    const regex = new RegExp(`\\b${prep}\\b`, 'gi')
    normalized = normalized.replace(regex, '')
  })

  // Clean up extra spaces and punctuation
  normalized = normalized
    .replace(/\s*,\s*,\s*/g, ', ')
    .replace(/,\s*$/g, '')
    .replace(/^\s*,\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized
}

// Get a display name (cleaner version for showing in the list)
const getDisplayName = (name) => {
  let display = normalizeIngredientName(name)
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
  if (parsed1.number > 0 && parsed2.number > 0) {
    const totalNumber = parsed1.number + parsed2.number
    const unit = parsed1.unit || parsed2.unit
    const sizeInfo = parsed1.sizeInfo || parsed2.sizeInfo
    return formatQuantityWithUnit(totalNumber, unit, sizeInfo)
  }

  // Fallback: concatenate (should rarely happen now)
  return `${qty1} + ${qty2}`
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

export const combineIngredients = (meals) => {
  const ingredientMap = new Map()

  meals.forEach(meal => {
    if (!meal.recipe || !meal.recipe.ingredients) return

    meal.recipe.ingredients.forEach(ing => {
      const key = normalizeIngredientName(ing.item)

      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)
        ingredientMap.set(key, {
          ...existing,
          quantity: combineQuantities(existing.quantity, ing.quantity),
          mealIds: [...existing.mealIds, meal.id],
        })
      } else {
        ingredientMap.set(key, {
          id: `item-${Date.now()}-${Math.random()}`,
          item: getDisplayName(ing.item),
          quantity: ing.quantity,
          category: ing.category || categorizeIngredient(ing.item),
          checked: false,
          mealIds: [meal.id],
        })
      }
    })
  })

  return Array.from(ingredientMap.values())
}

export const groupByCategory = (items) => {
  const grouped = items.reduce((acc, item) => {
    const category = item.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {})

  const categoryOrder = ['produce', 'protein', 'dairy', 'pantry', 'spices', 'beverages', 'other']

  return categoryOrder
    .filter(cat => grouped[cat])
    .map(cat => ({
      category: cat,
      items: grouped[cat],
    }))
}
