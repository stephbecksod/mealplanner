// Regenerate Meal Edge Function
// Generates a single new meal with ingredient overlap optimization

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { generateCompletion, parseJsonFromResponse } from '../_shared/claude.ts'

interface ExistingMeal {
  name: string
  ingredients?: string[]
}

interface RegenerateMealRequest {
  dietaryPreferences?: string[]
  cuisinePreferences?: string[]
  proteinPreferences?: string[]
  servings?: number
  includeSides?: boolean
  existingMeals?: ExistingMeal[]
  prioritizeOverlap?: boolean
  cookingEquipment?: string[]
}

const EQUIPMENT_LABELS: Record<string, string> = {
  oven: 'Oven',
  stovetop: 'Stovetop',
  grill: 'Grill',
  air_fryer: 'Air Fryer',
  instant_pot: 'Instant Pot',
  slow_cooker: 'Slow Cooker',
  sous_vide: 'Sous Vide',
  smoker: 'Smoker',
  dutch_oven: 'Dutch Oven',
  wok: 'Wok',
}

function buildRegeneratePrompt({
  dietaryPreferences,
  cuisinePreferences,
  proteinPreferences,
  servings,
  includeSides,
  existingMeals,
  prioritizeOverlap,
  cookingEquipment,
}: RegenerateMealRequest): string {
  let prompt = `Generate 1 new dinner recipe with the following requirements:\n\n`

  if (dietaryPreferences && dietaryPreferences.length > 0) {
    prompt += `Dietary Preferences: ${dietaryPreferences.join(', ')}\n`
  }

  if (cuisinePreferences && cuisinePreferences.length > 0) {
    prompt += `Cuisine Preferences: ${cuisinePreferences.join(', ')}\n`
  }

  // Add cooking equipment constraints
  if (cookingEquipment && cookingEquipment.length > 0) {
    const equipmentLabels = cookingEquipment.map(e => EQUIPMENT_LABELS[e] || e)
    prompt += `Available Cooking Equipment: ${equipmentLabels.join(', ')}\n`
    prompt += `IMPORTANT - Equipment Constraints:
- ONLY generate recipes that can be made using the equipment listed above
- Include an "equipment" field listing which equipment is required
- If this recipe can be adapted to use different equipment the user has, include "alternativeMethods" array
- Each alternative method should have "equipment" (the equipment key like "air_fryer"), "label" (display text like "Air Fryer"), and "notes" (1-2 sentences explaining what to do differently, e.g. "Preheat air fryer to 400°F and cook for 20 minutes, flipping halfway, instead of 40 minutes in the oven.")\n\n`
  }

  if (proteinPreferences && proteinPreferences.length > 0) {
    prompt += `Protein Preferences: ${proteinPreferences.join(', ')}\n`
    prompt += `Use ONE of these proteins as the main protein source for this meal. Only combine multiple proteins if it genuinely makes sense for the dish (e.g., surf and turf).\n\n`
  }

  prompt += `Servings: ${servings || 4} people\n\n`

  // Add existing meals context for ingredient overlap
  if (prioritizeOverlap !== false && existingMeals && existingMeals.length > 0) {
    prompt += `IMPORTANT - Ingredient Overlap Optimization:
This recipe will be part of a weekly meal plan. Here are the other meals already in the plan:

`
    existingMeals.forEach((meal, i) => {
      prompt += `Meal ${i + 1}: ${meal.name}\n`
      if (meal.ingredients && meal.ingredients.length > 0) {
        prompt += `  Key ingredients: ${meal.ingredients.slice(0, 8).join(', ')}\n`
      }
    })

    prompt += `
Please design a NEW recipe that:
- Is distinct and different from the existing meals
- Reuses some ingredients from the meals above when practical (aim for 30-50% overlap)
- Prioritizes sharing pantry staples, proteins, and fresh produce
- Still creates an interesting, flavorful dish\n\n`
  }

  // Add equipment fields to JSON format if cooking equipment is specified
  const equipmentFields = cookingEquipment && cookingEquipment.length > 0 ? `
      "equipment": ["oven", "stovetop", etc. - list required equipment],
      "alternativeMethods": [
        {
          "equipment": "air_fryer",
          "label": "Air Fryer",
          "notes": "1-2 sentences on what to change (temps, times, technique)"
        }
      ],` : ''

  if (includeSides) {
    prompt += `Include a complementary side dish. The side dish should:
- Balance the meal (if main is heavy, use a light vegetable/salad; if main lacks carbs, suggest pasta/rice/potatoes)
- Match the cuisine style of the main dish
- Be practical to prepare alongside the main dish\n\n`

    prompt += `Provide the recipe in this exact JSON format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "cuisine": "cuisine type",
      "dietaryInfo": ["vegetarian", "gluten-free", etc.],
      "servings": ${servings || 4},
      "prepTime": prep time in minutes,
      "cookTime": cook time in minutes,${equipmentFields}
      "ingredients": [
        {
          "item": "ingredient name",
          "quantity": "amount with unit",
          "category": "produce|protein|dairy|pantry|spices|other"
        }
      ],
      "instructions": [
        "step 1",
        "step 2",
        etc.
      ],
      "sideDish": {
        "name": "Side Dish Name",
        "type": "vegetable|starch|salad",
        "prepTime": prep time in minutes,
        "cookTime": cook time in minutes,
        "ingredients": [
          {
            "item": "ingredient name",
            "quantity": "amount with unit",
            "category": "produce|protein|dairy|pantry|spices|other"
          }
        ],
        "instructions": [
          "step 1",
          "step 2",
          etc.
        ],
        "dietaryInfo": ["vegetarian", "gluten-free", etc.],
        "complementReason": "Brief explanation of why this side pairs well with the main dish"
      }
    }
  ]
}`
  } else {
    prompt += `Provide the recipe in this exact JSON format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "cuisine": "cuisine type",
      "dietaryInfo": ["vegetarian", "gluten-free", etc.],
      "servings": ${servings || 4},
      "prepTime": prep time in minutes,
      "cookTime": cook time in minutes,${equipmentFields}
      "ingredients": [
        {
          "item": "ingredient name",
          "quantity": "amount with unit",
          "category": "produce|protein|dairy|pantry|spices|other"
        }
      ],
      "instructions": [
        "step 1",
        "step 2",
        etc.
      ]
    }
  ]
}`
  }

  prompt += `\n\nGenerate a creative, delicious recipe that is practical to make at home. Ensure ingredients have proper quantities and units.`

  return prompt
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      dietaryPreferences = [],
      cuisinePreferences = [],
      proteinPreferences = [],
      servings = 4,
      includeSides = false,
      existingMeals = [],
      prioritizeOverlap = true,
      cookingEquipment = [],
    }: RegenerateMealRequest = await req.json()

    // Build prompt and call Claude
    const prompt = buildRegeneratePrompt({
      dietaryPreferences,
      cuisinePreferences,
      proteinPreferences,
      servings,
      includeSides,
      existingMeals,
      prioritizeOverlap,
      cookingEquipment,
    })

    const response = await generateCompletion(prompt)
    const parsed = parseJsonFromResponse(response)

    if (!parsed.recipes || !Array.isArray(parsed.recipes) || parsed.recipes.length === 0) {
      throw new Error('Invalid recipe format')
    }

    // Get the first (and only) recipe
    const recipe = parsed.recipes[0]
    const result = {
      ...recipe,
      id: `recipe-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    }

    if (includeSides && recipe.sideDish) {
      result.sideDish = {
        ...recipe.sideDish,
        id: `side-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      }
    }

    return new Response(
      JSON.stringify({ recipe: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error regenerating meal:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to regenerate meal' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
