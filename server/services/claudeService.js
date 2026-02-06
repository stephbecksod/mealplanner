const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

class ClaudeService {
  async generateCompletion(prompt, systemPrompt = '') {
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      return message.content[0].text
    } catch (error) {
      console.error('Claude API Error:', error)
      throw new Error('Failed to generate response from Claude API')
    }
  }

  async generateRecipes({ numberOfMeals, dietaryPreferences, cuisinePreferences, proteinPreferences, servings, includeSides = false, prioritizeOverlap = true, cookingEquipment = null }) {
    const prompt = this.buildRecipePrompt({
      numberOfMeals,
      dietaryPreferences,
      cuisinePreferences,
      proteinPreferences,
      servings,
      includeSides,
      prioritizeOverlap,
      cookingEquipment,
    })

    const response = await this.generateCompletion(prompt)
    return this.parseRecipesResponse(response, includeSides)
  }

  async regenerateRecipe({ dietaryPreferences, cuisinePreferences, proteinPreferences, servings, includeSides = false, existingMeals = [], prioritizeOverlap = true, cookingEquipment = null }) {
    const prompt = this.buildRegeneratePrompt({
      dietaryPreferences,
      cuisinePreferences,
      proteinPreferences,
      servings,
      includeSides,
      existingMeals,
      prioritizeOverlap,
      cookingEquipment,
    })

    const response = await this.generateCompletion(prompt)
    const recipes = this.parseRecipesResponse(response, includeSides)
    return recipes[0]
  }

  async generateSideDish({ mainDish, dietaryPreferences, servings }) {
    const prompt = this.buildSideDishPrompt({ mainDish, dietaryPreferences, servings })
    const response = await this.generateCompletion(prompt)
    return this.parseSideDishResponse(response)
  }

  async regenerateSideDish({ mainDish, dietaryPreferences, servings }) {
    return this.generateSideDish({ mainDish, dietaryPreferences, servings })
  }

  async generateBeveragePairing({ recipeName, ingredients }) {
    const prompt = this.buildBeveragePrompt({ recipeName, ingredients })
    const response = await this.generateCompletion(prompt)
    return this.parseBeverageResponse(response)
  }

  buildRecipePrompt({ numberOfMeals, dietaryPreferences, cuisinePreferences, proteinPreferences, servings, includeSides = false, prioritizeOverlap = true, cookingEquipment = null }) {
    let prompt = `Generate ${numberOfMeals} dinner recipe${numberOfMeals > 1 ? 's' : ''} with the following requirements:\n\n`

    if (dietaryPreferences && dietaryPreferences.length > 0) {
      prompt += `Dietary Preferences: ${dietaryPreferences.join(', ')}\n`
    }

    if (cuisinePreferences && cuisinePreferences.length > 0) {
      prompt += `Cuisine Preferences: ${cuisinePreferences.join(', ')}\n`
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

    // Add cooking equipment constraints
    if (cookingEquipment && cookingEquipment.length > 0) {
      const equipmentLabels = {
        oven: 'Oven',
        stovetop: 'Stovetop',
        grill: 'Grill',
        air_fryer: 'Air Fryer',
        instant_pot: 'Instant Pot/Pressure Cooker',
        slow_cooker: 'Slow Cooker',
        sous_vide: 'Sous Vide',
        smoker: 'Smoker',
        dutch_oven: 'Dutch Oven',
        wok: 'Wok',
      }
      const availableEquipment = cookingEquipment.map(e => equipmentLabels[e] || e).join(', ')
      prompt += `COOKING EQUIPMENT CONSTRAINTS:
- Available equipment: ${availableEquipment}
- ONLY generate recipes that can be made with this equipment
- Do NOT suggest recipes requiring equipment not listed above
- Include the primary equipment needed in each recipe's "equipment" field
- For each recipe, also suggest "alternativeMethods" if the recipe could be adapted to other equipment the user has\n\n`
    }

    if (prioritizeOverlap && numberOfMeals > 1) {
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
      "equipment": ["oven", "stovetop", etc.],
      "alternativeMethods": [
        {
          "equipment": "air_fryer",
          "label": "Make in Air Fryer"
        }
      ],
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
        "equipment": ["stovetop"],
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
}

Note on equipment and alternativeMethods:
- "equipment" should list the primary equipment needed (e.g., ["oven"] or ["stovetop", "oven"])
- "alternativeMethods" should ONLY include methods for equipment the user has available
- Each alternativeMethod needs "equipment" (the equipment ID) and "label" (display text like "Make in Air Fryer")`
    } else {
      prompt += `For each recipe, provide the information in this exact JSON format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "cuisine": "cuisine type",
      "dietaryInfo": ["vegetarian", "gluten-free", etc.],
      "equipment": ["oven", "stovetop", etc.],
      "alternativeMethods": [
        {
          "equipment": "air_fryer",
          "label": "Make in Air Fryer"
        }
      ],
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
}

Note on equipment and alternativeMethods:
- "equipment" should list the primary equipment needed (e.g., ["oven"] or ["stovetop", "oven"])
- "alternativeMethods" should ONLY include methods for equipment the user has available
- Each alternativeMethod needs "equipment" (the equipment ID) and "label" (display text like "Make in Air Fryer")`
    }

    prompt += `\n\nGenerate creative, delicious recipes that are practical to make at home. Ensure ingredients have proper quantities and units.`

    return prompt
  }

  buildRegeneratePrompt({ dietaryPreferences, cuisinePreferences, proteinPreferences, servings, includeSides, existingMeals, prioritizeOverlap = true, cookingEquipment = null }) {
    let prompt = `Generate 1 new dinner recipe with the following requirements:\n\n`

    if (dietaryPreferences && dietaryPreferences.length > 0) {
      prompt += `Dietary Preferences: ${dietaryPreferences.join(', ')}\n`
    }

    if (cuisinePreferences && cuisinePreferences.length > 0) {
      prompt += `Cuisine Preferences: ${cuisinePreferences.join(', ')}\n`
    }

    if (proteinPreferences && proteinPreferences.length > 0) {
      prompt += `Protein Preferences: ${proteinPreferences.join(', ')}\n`
      prompt += `Use ONE of these proteins as the main protein source for this meal. Only combine multiple proteins if it genuinely makes sense for the dish (e.g., surf and turf).\n\n`
    }

    prompt += `Servings: ${servings || 4} people\n\n`

    // Add cooking equipment constraints
    if (cookingEquipment && cookingEquipment.length > 0) {
      const equipmentLabels = {
        oven: 'Oven',
        stovetop: 'Stovetop',
        grill: 'Grill',
        air_fryer: 'Air Fryer',
        instant_pot: 'Instant Pot/Pressure Cooker',
        slow_cooker: 'Slow Cooker',
        sous_vide: 'Sous Vide',
        smoker: 'Smoker',
        dutch_oven: 'Dutch Oven',
        wok: 'Wok',
      }
      const availableEquipment = cookingEquipment.map(e => equipmentLabels[e] || e).join(', ')
      prompt += `COOKING EQUIPMENT CONSTRAINTS:
- Available equipment: ${availableEquipment}
- ONLY generate recipes that can be made with this equipment
- Do NOT suggest recipes requiring equipment not listed above
- Include the primary equipment needed in the recipe's "equipment" field
- Suggest "alternativeMethods" if the recipe could be adapted to other equipment the user has\n\n`
    }

    // Add existing meals context for ingredient overlap
    if (prioritizeOverlap && existingMeals && existingMeals.length > 0) {
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
      "equipment": ["oven", "stovetop", etc.],
      "alternativeMethods": [
        {
          "equipment": "air_fryer",
          "label": "Make in Air Fryer"
        }
      ],
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
        "equipment": ["stovetop"],
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
      "equipment": ["oven", "stovetop", etc.],
      "alternativeMethods": [
        {
          "equipment": "air_fryer",
          "label": "Make in Air Fryer"
        }
      ],
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

    prompt += `\n\nGenerate a creative, delicious recipe that is practical to make at home. Ensure ingredients have proper quantities and units.`

    return prompt
  }

  buildSideDishPrompt({ mainDish, dietaryPreferences, servings }) {
    let prompt = `Generate a complementary side dish for this main course:\n\n`
    prompt += `Main Dish: ${mainDish.name}\n`
    prompt += `Cuisine: ${mainDish.cuisine}\n`
    prompt += `Key Ingredients: ${mainDish.ingredients.slice(0, 5).map(i => i.item).join(', ')}\n`
    prompt += `Servings: ${servings || 4}\n\n`

    if (dietaryPreferences && dietaryPreferences.length > 0) {
      prompt += `Dietary Preferences: ${dietaryPreferences.join(', ')}\n\n`
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

  buildBeveragePrompt({ recipeName, ingredients }) {
    const ingredientList = ingredients.slice(0, 10).join(', ')

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

  parseRecipesResponse(response, includeSides = false) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
        throw new Error('Invalid recipe format')
      }

      return parsed.recipes.map(recipe => {
        const result = {
          ...recipe,
          id: `recipe-${Date.now()}-${Math.random()}`,
        }

        // If side dish was included, add ID to it
        if (includeSides && recipe.sideDish) {
          result.sideDish = {
            ...recipe.sideDish,
            id: `side-${Date.now()}-${Math.random()}`,
          }
        }

        return result
      })
    } catch (error) {
      console.error('Failed to parse recipes:', error)
      console.error('Response was:', response)
      throw new Error('Failed to parse recipe data from AI response')
    }
  }

  parseSideDishResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      if (!parsed.sideDish) {
        throw new Error('Invalid side dish format')
      }

      return {
        ...parsed.sideDish,
        id: `side-${Date.now()}-${Math.random()}`,
      }
    } catch (error) {
      console.error('Failed to parse side dish:', error)
      console.error('Response was:', response)
      throw new Error('Failed to parse side dish data from AI response')
    }
  }

  parseBeverageResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      if (!parsed.cocktail || !parsed.wine) {
        throw new Error('Invalid beverage pairing format')
      }

      return {
        cocktail: {
          ...parsed.cocktail,
          id: `cocktail-${Date.now()}`,
        },
        wine: parsed.wine,
      }
    } catch (error) {
      console.error('Failed to parse beverage pairing:', error)
      console.error('Response was:', response)
      throw new Error('Failed to parse beverage pairing data from AI response')
    }
  }

  async convertCookingMethod({ recipe, targetEquipment }) {
    const prompt = this.buildConvertMethodPrompt({ recipe, targetEquipment })
    const response = await this.generateCompletion(prompt)
    return this.parseConvertedRecipeResponse(response)
  }

  buildConvertMethodPrompt({ recipe, targetEquipment }) {
    const equipmentLabels = {
      oven: 'Oven',
      stovetop: 'Stovetop',
      grill: 'Grill',
      air_fryer: 'Air Fryer',
      instant_pot: 'Instant Pot/Pressure Cooker',
      slow_cooker: 'Slow Cooker',
      sous_vide: 'Sous Vide',
      smoker: 'Smoker',
      dutch_oven: 'Dutch Oven',
      wok: 'Wok',
    }

    const targetLabel = equipmentLabels[targetEquipment] || targetEquipment

    return `Convert this recipe to use ${targetLabel} instead of its current cooking method.

ORIGINAL RECIPE:
Name: ${recipe.name}
Current Equipment: ${(recipe.equipment || []).join(', ')}
Prep Time: ${recipe.prepTime} minutes
Cook Time: ${recipe.cookTime} minutes

Ingredients:
${recipe.ingredients.map(i => `- ${i.quantity} ${i.item}`).join('\n')}

Instructions:
${recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Convert this recipe to use ${targetLabel}. Adjust cooking times and temperatures as needed. Keep the same ingredients unless a substitution is absolutely necessary for the new cooking method.

Provide the converted recipe in this exact JSON format:
{
  "recipe": {
    "name": "${recipe.name}",
    "cuisine": "${recipe.cuisine}",
    "dietaryInfo": ${JSON.stringify(recipe.dietaryInfo || [])},
    "equipment": ["${targetEquipment}"],
    "servings": ${recipe.servings},
    "prepTime": adjusted prep time in minutes,
    "cookTime": adjusted cook time in minutes,
    "ingredients": [
      {
        "item": "ingredient name",
        "quantity": "amount with unit",
        "category": "produce|protein|dairy|pantry|spices|other"
      }
    ],
    "instructions": [
      "step 1 with ${targetLabel}-specific instructions",
      "step 2",
      etc.
    ]
  }
}

Make sure the instructions are specific to using ${targetLabel} with appropriate temperatures and timing.`
  }

  parseConvertedRecipeResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      if (!parsed.recipe) {
        throw new Error('Invalid converted recipe format')
      }

      return {
        ...parsed.recipe,
        id: `recipe-${Date.now()}-${Math.random()}`,
        alternativeMethods: [], // Clear alternatives after conversion
      }
    } catch (error) {
      console.error('Failed to parse converted recipe:', error)
      console.error('Response was:', response)
      throw new Error('Failed to parse converted recipe data from AI response')
    }
  }
}

module.exports = new ClaudeService()
