// Generate Meals Edge Function
// Generates 1-5 meal recipes with optional side dishes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { generateCompletion, parseJsonFromResponse } from '../_shared/claude.ts'

interface GenerateMealsRequest {
  numberOfMeals: number
  dietaryPreferences?: string[]
  cuisinePreferences?: string[]
  servings?: number
  includeSides?: boolean
}

function buildRecipePrompt({
  numberOfMeals,
  dietaryPreferences,
  cuisinePreferences,
  servings,
  includeSides,
}: GenerateMealsRequest): string {
  let prompt = `Generate ${numberOfMeals} dinner recipe${numberOfMeals > 1 ? 's' : ''} with the following requirements:\n\n`

  if (dietaryPreferences && dietaryPreferences.length > 0) {
    prompt += `Dietary Preferences: ${dietaryPreferences.join(', ')}\n`
  }

  if (cuisinePreferences && cuisinePreferences.length > 0) {
    prompt += `Cuisine Preferences: ${cuisinePreferences.join(', ')}\n`
  }

  prompt += `Servings: ${servings || 4} people\n\n`

  if (numberOfMeals > 1) {
    prompt += `IMPORTANT - Ingredient Overlap Strategy:
- Design recipes that share common ingredients to minimize grocery shopping complexity
- Aim for 40-60% ingredient overlap across the week's meals
- Prioritize sharing versatile proteins (e.g., chicken across multiple dishes prepared differently)
- Reuse pantry staples (onions, garlic, olive oil, common spices)
- Share produce items that can be used in multiple ways (e.g., bell peppers in stir-fry and fajitas)
- Each recipe should still be distinct and flavorful despite shared ingredients

Example strategy: If one meal uses chicken breasts, another could use chicken thighs. If one uses fresh herbs, find ways to use them in other meals too.\n\n`
  }

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
      servings = 4,
      includeSides = false,
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
      servings,
      includeSides,
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
