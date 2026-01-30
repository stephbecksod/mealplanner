// Add Beverage Edge Function
// Generates cocktail and/or wine pairing for a recipe

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { generateCompletion, parseJsonFromResponse } from '../_shared/claude.ts'

interface AddBeverageRequest {
  recipeName: string
  ingredients: string[]
  type?: 'cocktail' | 'wine' | 'both'
}

function buildBeveragePrompt({
  recipeName,
  ingredients,
  type = 'both',
}: AddBeverageRequest): string {
  const ingredientList = ingredients.slice(0, 10).join(', ')

  if (type === 'cocktail') {
    return `Generate a cocktail pairing for this dinner recipe:

Recipe Name: ${recipeName}
Key Ingredients: ${ingredientList}

Provide the cocktail in this exact JSON format:
{
  "cocktail": {
    "name": "Cocktail Name",
    "ingredients": [
      {
        "item": "ingredient name",
        "quantity": "amount with unit"
      }
    ],
    "instructions": [
      "step 1",
      "step 2"
    ],
    "flavorProfile": "Explanation of why this cocktail pairs well with the meal (2-3 sentences)"
  }
}

Make the cocktail creative and complementary to the flavors in the dish.`
  }

  if (type === 'wine') {
    return `Generate a wine pairing for this dinner recipe:

Recipe Name: ${recipeName}
Key Ingredients: ${ingredientList}

Provide the wine pairing in this exact JSON format:
{
  "wine": {
    "type": "Wine variety/type",
    "description": "Brief description of the wine",
    "flavorProfile": "Explanation of why this wine pairs well with the meal (2-3 sentences)"
  }
}

The wine suggestion should be specific and well-matched to the dish.`
  }

  // type === 'both'
  return `Generate a beverage pairing for this dinner recipe:

Recipe Name: ${recipeName}
Key Ingredients: ${ingredientList}

Provide both a cocktail recipe and a wine pairing in this exact JSON format:
{
  "cocktail": {
    "name": "Cocktail Name",
    "ingredients": [
      {
        "item": "ingredient name",
        "quantity": "amount with unit"
      }
    ],
    "instructions": [
      "step 1",
      "step 2"
    ],
    "flavorProfile": "Explanation of why this cocktail pairs well with the meal (2-3 sentences)"
  },
  "wine": {
    "type": "Wine variety/type",
    "description": "Brief description of the wine",
    "flavorProfile": "Explanation of why this wine pairs well with the meal (2-3 sentences)"
  }
}

Make the cocktail creative and complementary to the flavors in the dish. The wine suggestion should be specific and well-matched.`
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      recipeName,
      ingredients,
      type = 'both',
    }: AddBeverageRequest = await req.json()

    if (!recipeName) {
      return new Response(
        JSON.stringify({ error: 'recipeName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!ingredients || !Array.isArray(ingredients)) {
      return new Response(
        JSON.stringify({ error: 'ingredients array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build prompt and call Claude
    const prompt = buildBeveragePrompt({
      recipeName,
      ingredients,
      type,
    })

    const response = await generateCompletion(prompt)
    const parsed = parseJsonFromResponse(response)

    const result: any = {}

    if (parsed.cocktail) {
      result.cocktail = {
        ...parsed.cocktail,
        id: `cocktail-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      }
    }

    if (parsed.wine) {
      result.wine = {
        ...parsed.wine,
        id: `wine-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error adding beverage:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate beverage pairing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
