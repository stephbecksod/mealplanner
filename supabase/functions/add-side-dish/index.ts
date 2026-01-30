// Add Side Dish Edge Function
// Generates a complementary side dish for a main dish

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { generateCompletion, parseJsonFromResponse } from '../_shared/claude.ts'

interface MainDish {
  name: string
  cuisine: string
  ingredients: Array<{ item: string; quantity: string; category: string }>
}

interface AddSideDishRequest {
  mainDish: MainDish
  dietaryPreferences?: string[]
  servings?: number
  existingSideDishes?: string[]
}

function buildSideDishPrompt({
  mainDish,
  dietaryPreferences,
  servings,
  existingSideDishes,
}: AddSideDishRequest): string {
  let prompt = `Generate a complementary side dish for this main course:\n\n`
  prompt += `Main Dish: ${mainDish.name}\n`
  prompt += `Cuisine: ${mainDish.cuisine}\n`
  prompt += `Key Ingredients: ${mainDish.ingredients.slice(0, 5).map(i => i.item).join(', ')}\n`
  prompt += `Servings: ${servings || 4}\n\n`

  if (dietaryPreferences && dietaryPreferences.length > 0) {
    prompt += `Dietary Preferences: ${dietaryPreferences.join(', ')}\n\n`
  }

  if (existingSideDishes && existingSideDishes.length > 0) {
    prompt += `IMPORTANT: The following side dishes are already in the meal plan. You MUST generate a DIFFERENT side dish that is NOT on this list:\n`
    existingSideDishes.forEach(name => {
      prompt += `- ${name}\n`
    })
    prompt += `\n`
  }

  prompt += `The side dish should:
- Balance the meal (if main is heavy/rich, suggest a light vegetable or salad; if main lacks carbs, suggest pasta/rice/potatoes)
- Complement the cuisine style
- Be practical to prepare alongside the main dish

Provide the side dish in this exact JSON format:
{
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
}`

  return prompt
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      mainDish,
      dietaryPreferences = [],
      servings = 4,
      existingSideDishes = [],
    }: AddSideDishRequest = await req.json()

    if (!mainDish || !mainDish.name) {
      return new Response(
        JSON.stringify({ error: 'mainDish is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build prompt and call Claude
    const prompt = buildSideDishPrompt({
      mainDish,
      dietaryPreferences,
      servings,
      existingSideDishes,
    })

    const response = await generateCompletion(prompt)
    const parsed = parseJsonFromResponse(response)

    if (!parsed.sideDish) {
      throw new Error('Invalid side dish format')
    }

    const sideDish = {
      ...parsed.sideDish,
      id: `side-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    }

    return new Response(
      JSON.stringify({ sideDish }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error adding side dish:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate side dish' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
