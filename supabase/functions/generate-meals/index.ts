// Generate Meals Edge Function
// Generates 1-5 meal recipes with optional side dishes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { generateCompletion, parseJsonFromResponse } from '../_shared/claude.ts'

interface GenerateMealsRequest {
  numberOfMeals: number
  dietaryPreferences?: string[]
  cuisinePreferences?: string[]
  proteinPreferences?: string[]
  servings?: number
  includeSides?: boolean
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

function buildRecipePrompt({
  numberOfMeals,
  dietaryPreferences,
  cuisinePreferences,
  proteinPreferences,
  servings,
  includeSides,
  prioritizeOverlap,
  cookingEquipment,
}: GenerateMealsRequest): string {
  let prompt = `Generate ${numberOfMeals} dinner recipe${numberOfMeals > 1 ? 's' : ''} with the following requirements:\n\n`

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
- Include an "equipment" field in each recipe listing which equipment is required
- If a recipe can be adapted to use different equipment the user has, include "alternativeMethods" array
- Each alternative method should have "equipment" (the equipment key like "air_fryer"), "label" (display text like "Air Fryer"), and "notes" (1-2 sentences explaining what to do differently, e.g. "Preheat air fryer to 400°F and cook for 20 minutes, flipping halfway, instead of 40 minutes in the oven.")\n\n`
  }

  if (proteinPreferences && proteinPreferences.length > 0) {
    prompt += `Protein Preferences: ${proteinPreferences.join(', ')}\n`
    prompt += `IMPORTANT - Protein Distribution Rules:
- Each meal should feature ONE of the selected proteins as its main protein
- If the number of proteins matches the number of meals, use each protein exactly once
- If more proteins are selected than meals, choose the best subset (one protein per meal)
- If fewer proteins are selected than meals, you may repeat proteins across meals
- Only combine multiple proteins in a single dish if it genuinely makes sense (e.g., surf and turf, paella) - do NOT force combinations just to use more proteins\n\n`
  }

  prompt += `Servings: ${servings || 4} people\n\n`

  if (prioritizeOverlap !== false && numberOfMeals > 1) {
    prompt += `IMPORTANT - Ingredient Overlap Strategy:
- Design recipes that share common ingredients to minimize grocery shopping complexity
- Aim for 40-60% ingredient overlap across the week's meals
- Prioritize sharing versatile proteins (e.g., chicken across multiple dishes prepared differently)
- Reuse pantry staples (onions, garlic, olive oil, common spices)
- Share produce items that can be used in multiple ways (e.g., bell peppers in stir-fry and fajitas)
- Each recipe should still be distinct and flavorful despite shared ingredients

Example strategy: If one meal uses chicken breasts, another could use chicken thighs. If one uses fresh herbs, find ways to use them in other meals too.\n\n`
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
    prompt += `For each recipe, include a complementary side dish. The side dish should:
- Balance the meal (if main is heavy, use a light vegetable/salad; if main lacks carbs, suggest pasta/rice/potatoes)
- Match the cuisine style of the main dish
- Be practical to prepare alongside the main dish\n\n`

    prompt += `For each recipe, provide the information in this exact JSON format:
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
    prompt += `For each recipe, provide the information in this exact JSON format:
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

  prompt += `\n\nGenerate creative, delicious recipes that are practical to make at home. Ensure ingredients have proper quantities and units.`

  return prompt
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      numberOfMeals = 3,
      dietaryPreferences = [],
      cuisinePreferences = [],
      proteinPreferences = [],
      servings = 4,
      includeSides = false,
      prioritizeOverlap = true,
      cookingEquipment = [],
    }: GenerateMealsRequest = await req.json()

    // Validate input
    if (numberOfMeals < 1 || numberOfMeals > 5) {
      return new Response(
        JSON.stringify({ error: 'numberOfMeals must be between 1 and 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build prompt and call Claude
    const prompt = buildRecipePrompt({
      numberOfMeals,
      dietaryPreferences,
      cuisinePreferences,
      proteinPreferences,
      servings,
      includeSides,
      prioritizeOverlap,
      cookingEquipment,
    })

    const response = await generateCompletion(prompt)
    const parsed = parseJsonFromResponse(response)

    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      throw new Error('Invalid recipe format')
    }

    // Add IDs to recipes and side dishes
    const recipes = parsed.recipes.map((recipe: any) => {
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

      return result
    })

    return new Response(
      JSON.stringify({ recipes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating meals:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate meals' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
