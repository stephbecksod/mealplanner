// Convert Cooking Method Edge Function
// Converts a recipe from one cooking method to another

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { generateCompletion, parseJsonFromResponse } from '../_shared/claude.ts'

interface Ingredient {
  item: string
  quantity: string
  category: string
}

interface Recipe {
  name: string
  cuisine: string
  dietaryInfo?: string[]
  servings: number
  prepTime: number
  cookTime: number
  ingredients: Ingredient[]
  instructions: string[]
  equipment?: string[]
}

interface ConvertMethodRequest {
  recipe: Recipe
  targetEquipment: string
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

function buildConvertMethodPrompt(recipe: Recipe, targetEquipment: string): string {
  const equipmentLabel = EQUIPMENT_LABELS[targetEquipment] || targetEquipment

  return `Convert this recipe to use ${equipmentLabel} as the primary cooking method.

ORIGINAL RECIPE:
Name: ${recipe.name}
Cuisine: ${recipe.cuisine}
Servings: ${recipe.servings}
Prep Time: ${recipe.prepTime} minutes
Cook Time: ${recipe.cookTime} minutes

Current Equipment: ${recipe.equipment?.map(e => EQUIPMENT_LABELS[e] || e).join(', ') || 'Not specified'}

Ingredients:
${recipe.ingredients.map(i => `- ${i.quantity} ${i.item}`).join('\n')}

Instructions:
${recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}

CONVERSION REQUIREMENTS:
1. Adapt the recipe to primarily use ${equipmentLabel}
2. Adjust cooking times and temperatures as needed for ${equipmentLabel}
3. Modify instructions to work with ${equipmentLabel}
4. Keep the same ingredients if possible (minor adjustments allowed if needed)
5. Maintain the same flavor profile and cuisine style
6. Update the equipment array to reflect the new cooking method

Provide the converted recipe in this exact JSON format:
{
  "recipe": {
    "name": "${recipe.name}",
    "cuisine": "${recipe.cuisine}",
    "dietaryInfo": ${JSON.stringify(recipe.dietaryInfo || [])},
    "servings": ${recipe.servings},
    "prepTime": prep time in minutes,
    "cookTime": cook time in minutes (adjusted for ${equipmentLabel}),
    "equipment": ["${targetEquipment}"],
    "ingredients": [
      {
        "item": "ingredient name",
        "quantity": "amount with unit",
        "category": "produce|protein|dairy|pantry|spices|other"
      }
    ],
    "instructions": [
      "step 1 (adapted for ${equipmentLabel})",
      "step 2",
      etc.
    ],
    "alternativeMethods": []
  }
}

IMPORTANT: The alternativeMethods array should be empty since we just converted to this method.`
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipe, targetEquipment }: ConvertMethodRequest = await req.json()

    if (!recipe || !targetEquipment) {
      return new Response(
        JSON.stringify({ error: 'recipe and targetEquipment are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build prompt and call Claude
    const prompt = buildConvertMethodPrompt(recipe, targetEquipment)
    const response = await generateCompletion(prompt)
    const parsed = parseJsonFromResponse(response)

    if (!parsed.recipe) {
      throw new Error('Invalid recipe format in response')
    }

    // Preserve the original recipe ID if it exists
    const convertedRecipe = {
      ...parsed.recipe,
      id: recipe.id || `recipe-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    }

    return new Response(
      JSON.stringify({ recipe: convertedRecipe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error converting cooking method:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to convert cooking method' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
