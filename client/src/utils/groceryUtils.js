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

export const combineIngredients = (meals) => {
  const ingredientMap = new Map()

  meals.forEach(meal => {
    if (!meal.recipe || !meal.recipe.ingredients) return

    meal.recipe.ingredients.forEach(ing => {
      const key = ing.item.toLowerCase()

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
          item: ing.item,
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
