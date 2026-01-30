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

  async generateRecipes({ numberOfMeals, dietaryPreferences, cuisinePreferences, servings, includeSides = false }) {
    const prompt = this.buildRecipePrompt({
      numberOfMeals,
      dietaryPreferences,
      cuisinePreferences,
      servings,
      includeSides,
    })

    const response = await this.generateCompletion(prompt)
    return this.parseRecipesResponse(response, includeSides)
  }

  async regenerateRecipe({ dietaryPreferences, cuisinePreferences, servings, includeSides = false, existingMeals = [] }) {
    const prompt = this.buildRegeneratePrompt({
      dietaryPreferences,
      cuisinePreferences,
      servings,
      includeSides,
      existingMeals,
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

  buildRecipePrompt({ numberOfMeals, dietaryPreferences, cuisinePreferences, servings, includeSides = false }) {
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

  buildRegeneratePrompt({ dietaryPreferences, cuisinePreferences, servings, includeSides, existingMeals }) {
    let prompt = `Generate 1 new dinner recipe with the following requirements:\n\n`

    if (dietaryPreferences && dietaryPreferences.length > 0) {
      prompt += `Dietary Preferences: ${dietaryPreferences.join(', ')}\n`
    }

    if (cuisinePreferences && cuisinePreferences.length > 0) {
      prompt += `Cuisine Preferences: ${cuisinePreferences.join(', ')}\n`
    }

    prompt += `Servings: ${servings || 4} people\n\n`

    // Add existing meals context for ingredient overlap
    if (existingMeals && existingMeals.length > 0) {
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
      prompt += `Provide the recipe in this exact JSON format:
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
}

module.exports = new ClaudeService()
