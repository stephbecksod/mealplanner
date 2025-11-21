const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

class ClaudeService {
  async generateCompletion(prompt, systemPrompt = '') {
    try {
      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
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

  async generateRecipes({ numberOfMeals, dietaryPreferences, cuisinePreferences, servings }) {
    const prompt = this.buildRecipePrompt({
      numberOfMeals,
      dietaryPreferences,
      cuisinePreferences,
      servings,
    })

    const response = await this.generateCompletion(prompt)
    return this.parseRecipesResponse(response)
  }

  async regenerateRecipe({ dietaryPreferences, cuisinePreferences, servings }) {
    const prompt = this.buildRecipePrompt({
      numberOfMeals: 1,
      dietaryPreferences,
      cuisinePreferences,
      servings,
    })

    const response = await this.generateCompletion(prompt)
    const recipes = this.parseRecipesResponse(response)
    return recipes[0]
  }

  async generateBeveragePairing({ recipeName, ingredients }) {
    const prompt = this.buildBeveragePrompt({ recipeName, ingredients })
    const response = await this.generateCompletion(prompt)
    return this.parseBeverageResponse(response)
  }

  buildRecipePrompt({ numberOfMeals, dietaryPreferences, cuisinePreferences, servings }) {
    let prompt = `Generate ${numberOfMeals} dinner recipe${numberOfMeals > 1 ? 's' : ''} with the following requirements:\n\n`

    if (dietaryPreferences && dietaryPreferences.length > 0) {
      prompt += `Dietary Preferences: ${dietaryPreferences.join(', ')}\n`
    }

    if (cuisinePreferences && cuisinePreferences.length > 0) {
      prompt += `Cuisine Preferences: ${cuisinePreferences.join(', ')}\n`
    }

    prompt += `Servings: ${servings || 4} people\n\n`

    if (numberOfMeals > 1) {
      prompt += `Important: Make the recipes diverse but use overlapping ingredients where possible to simplify grocery shopping.\n\n`
    }

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
}

Generate creative, delicious recipes that are practical to make at home. Ensure ingredients have proper quantities and units.`

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

  parseRecipesResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
        throw new Error('Invalid recipe format')
      }

      return parsed.recipes.map(recipe => ({
        ...recipe,
        id: `recipe-${Date.now()}-${Math.random()}`,
      }))
    } catch (error) {
      console.error('Failed to parse recipes:', error)
      console.error('Response was:', response)
      throw new Error('Failed to parse recipe data from AI response')
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
