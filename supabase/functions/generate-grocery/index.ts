// Generate Grocery List Edge Function
// Creates a categorized grocery list from meals

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface Ingredient {
  item: string
  quantity: string
  category: string
}

interface SideDish {
  name: string
  ingredients: Ingredient[]
}

interface Cocktail {
  name: string
  ingredients: Array<{ item: string; quantity: string }>
}

interface BeveragePairing {
  cocktail?: Cocktail
  cocktails?: Cocktail[]
  wine?: {
    type: string
    description: string
  }
}

interface Meal {
  mainDish: {
    name: string
    ingredients: Ingredient[]
  }
  sideDishes?: SideDish[]
  beveragePairing?: BeveragePairing
  // Legacy format support
  cocktails?: Cocktail[]
}

interface GenerateGroceryRequest {
  meals: Meal[]
  includeBeverages?: boolean
  includeCocktails?: boolean
}

interface GroceryItem {
  id: string
  item: string
  quantity: string
  category: string
  sources: string[]
}

interface CategorizedGroceryList {
  [category: string]: GroceryItem[]
}

// Normalize ingredient names for comparison
function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    // Remove common variations
    .replace(/fresh\s+/g, '')
    .replace(/dried\s+/g, '')
    .replace(/ground\s+/g, '')
    .replace(/chopped\s+/g, '')
    .replace(/minced\s+/g, '')
    .replace(/sliced\s+/g, '')
}

// Try to combine quantities (simple cases)
function combineQuantities(q1: string, q2: string): string {
  // If they're the same, just return one
  if (q1.toLowerCase() === q2.toLowerCase()) return q1

  // Try to parse simple numeric quantities with same units
  const regex = /^([\d./]+)\s*(.*)$/
  const m1 = q1.match(regex)
  const m2 = q2.match(regex)

  if (m1 && m2) {
    const unit1 = m1[2].toLowerCase().trim()
    const unit2 = m2[2].toLowerCase().trim()

    if (unit1 === unit2) {
      // Parse fractions
      const parseNum = (s: string): number => {
        if (s.includes('/')) {
          const [num, denom] = s.split('/')
          return parseFloat(num) / parseFloat(denom)
        }
        return parseFloat(s)
      }

      const num1 = parseNum(m1[1])
      const num2 = parseNum(m2[1])

      if (!isNaN(num1) && !isNaN(num2)) {
        const total = num1 + num2
        // Format nicely
        const formatted = total % 1 === 0 ? total.toString() : total.toFixed(1)
        return `${formatted} ${m1[2]}`.trim()
      }
    }
  }

  // Can't combine, just list both
  return `${q1} + ${q2}`
}

function generateGroceryList(meals: Meal[], includeBeverages: boolean): CategorizedGroceryList {
  const ingredientMap = new Map<string, GroceryItem>()

  // Process all meals
  for (const meal of meals) {
    // Process main dish
    if (meal.mainDish?.ingredients) {
      for (const ing of meal.mainDish.ingredients) {
        const normalized = normalizeIngredient(ing.item)
        const existing = ingredientMap.get(normalized)

        if (existing) {
          existing.quantity = combineQuantities(existing.quantity, ing.quantity)
          if (!existing.sources.includes(meal.mainDish.name)) {
            existing.sources.push(meal.mainDish.name)
          }
        } else {
          ingredientMap.set(normalized, {
            id: `grocery-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            item: ing.item,
            quantity: ing.quantity,
            category: ing.category || 'other',
            sources: [meal.mainDish.name],
          })
        }
      }
    }

    // Process side dishes
    if (meal.sideDishes) {
      for (const side of meal.sideDishes) {
        if (side.ingredients) {
          for (const ing of side.ingredients) {
            const normalized = normalizeIngredient(ing.item)
            const existing = ingredientMap.get(normalized)

            if (existing) {
              existing.quantity = combineQuantities(existing.quantity, ing.quantity)
              if (!existing.sources.includes(side.name)) {
                existing.sources.push(side.name)
              }
            } else {
              ingredientMap.set(normalized, {
                id: `grocery-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                item: ing.item,
                quantity: ing.quantity,
                category: ing.category || 'other',
                sources: [side.name],
              })
            }
          }
        }
      }
    }

    // Process cocktails if requested
    if (includeBeverages) {
      // Get cocktails from beveragePairing (current format) or meal.cocktails (legacy)
      const cocktails: Cocktail[] = []

      if (meal.beveragePairing) {
        // Support both single cocktail and array of cocktails
        if (meal.beveragePairing.cocktail) {
          cocktails.push(meal.beveragePairing.cocktail)
        }
        if (meal.beveragePairing.cocktails) {
          cocktails.push(...meal.beveragePairing.cocktails)
        }
      }

      // Legacy format support
      if (meal.cocktails) {
        cocktails.push(...meal.cocktails)
      }

      for (const cocktail of cocktails) {
        if (cocktail.ingredients) {
          for (const ing of cocktail.ingredients) {
            const normalized = normalizeIngredient(ing.item)
            const existing = ingredientMap.get(normalized)

            if (existing) {
              existing.quantity = combineQuantities(existing.quantity, ing.quantity)
              if (!existing.sources.includes(cocktail.name)) {
                existing.sources.push(cocktail.name)
              }
            } else {
              ingredientMap.set(normalized, {
                id: `grocery-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                item: ing.item,
                quantity: ing.quantity,
                category: 'beverages',
                sources: [cocktail.name],
              })
            }
          }
        }
      }
    }
  }

  // Group by category
  const categorized: CategorizedGroceryList = {}
  const categoryOrder = ['produce', 'protein', 'dairy', 'pantry', 'spices', 'beverages', 'other']

  for (const cat of categoryOrder) {
    categorized[cat] = []
  }

  for (const item of ingredientMap.values()) {
    const cat = item.category.toLowerCase()
    if (!categorized[cat]) {
      categorized[cat] = []
    }
    categorized[cat].push(item)
  }

  // Sort items within each category
  for (const cat of Object.keys(categorized)) {
    categorized[cat].sort((a, b) => a.item.localeCompare(b.item))
  }

  // Remove empty categories
  for (const cat of Object.keys(categorized)) {
    if (categorized[cat].length === 0) {
      delete categorized[cat]
    }
  }

  return categorized
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      meals = [],
      includeBeverages = false,
      includeCocktails = false,
    }: GenerateGroceryRequest = await req.json()

    // Support both parameter names
    const shouldIncludeBeverages = includeBeverages || includeCocktails

    if (!Array.isArray(meals)) {
      return new Response(
        JSON.stringify({ error: 'meals must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const groceryList = generateGroceryList(meals, shouldIncludeBeverages)

    return new Response(
      JSON.stringify({ groceryList }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating grocery list:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate grocery list' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
