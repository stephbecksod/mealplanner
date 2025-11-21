# Meal Planner App - Project Plan

## Project Overview
Build a browser-based dinner planning app that generates customized weekly dinner plans with smart grocery lists, recipe storage, and beverage pairings. Built on Windows, accessible from any device with a web browser.

## Technology Stack
- **Frontend**: React with React Router for navigation
- **Backend**: Node.js with Express for API routes
- **AI Integration**: Anthropic Claude API for meal/beverage generation
- **Storage**: Browser localStorage (designed to easily migrate to database later)
- **Styling**: Tailwind CSS for responsive design

## Project Structure
```
meal-planner/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Main views (Home, Favorites, MealPlan)
│   │   ├── services/          # API client, localStorage wrapper
│   │   ├── context/           # React Context for state management
│   │   ├── utils/             # Helper functions
│   │   └── App.jsx
│   └── package.json
├── server/                    # Node.js backend
│   ├── routes/                # API endpoints
│   ├── services/              # Claude API integration
│   ├── utils/                 # Helper functions
│   └── server.js
└── package.json
```

## Core Features

### 1. Dinner Plan Generation
- Allow users to select 1-5 dinners per week
- Incorporate dietary preferences (vegetarian, vegan, gluten-free, dairy-free, low-carb, etc.)
- Generate dinner suggestions using user preferences
- Default serving size: 4 people (adjustable per dinner)
- Enable cuisine preference selection for the week
- Allow to regenerate a single meal once initial set is generated if the user doesn't like the meal for that week
- Allow to add a meal or delete a meal from the week - as meals are added or deleted this impacts the shopping list accordingly
- Goal should be that the meals are diverse but use a lot of overlapping ingredients throughout the week to simplify grocery shopping
- Ability to add a dinner from the favorite recipes saved
- Meals are persistent in the app until all regenerated. There is a confirmation step prior to regenerating all meals or a single meal that confirms that the meals should be regenerated

### 2. Smart Grocery List
- Auto-generate from selected dinners with quantities adjusted for serving sizes
- Interactive checklist format with click-to-check functionality
- Allow manual addition of extra items
- Group items by category (produce, dairy, proteins, pantry, etc.)

### 3. Recipe Details
- Display full ingredients list with quantities
- Step-by-step cooking instructions
- Prep time and cook time estimates

### 4. Save & Memory System
- Save individual favorite recipes
- Search and browse saved recipes and dinner plans
- There is a favorites tab or page in the application that users can navigate to in order to find saved meals
- The saved meals are persistent over time, you can navigate away from saved meals and go back to saved meals and they can still be there

### 5. Beverage Pairing Feature
- For each dinner, offer to generate cocktail recipe and wine pairing
- Show flavor profile explanation for why they complement the dinner
- Ask user confirmation before adding ingredients to grocery list
- The cocktail recipes can also be saved
- The meal recipe and cocktail recipe show up together on a "meal"

## Phased Implementation

### Phase 1: Core Meal Planning (MVP) ✅ COMPLETE
**Goal**: Get basic meal planning working end-to-end
- ✅ Set up React + Node.js project structure
- ✅ Implement basic meal plan generator (1-5 dinners)
- ✅ Claude API integration for recipe generation
- ✅ Display recipes with ingredients, instructions, times
- ✅ Basic grocery list auto-generation
- ✅ localStorage persistence for current meal plan
- ✅ Save favorite recipes
- ✅ Favorites page with search
- ✅ Add/remove meals from plan
- ✅ Regenerate individual meals
- ✅ Interactive grocery checklist

**Status**: Code complete, ready for testing. See CHECKPOINT.md for details.

### Phase 2: Customization & Flexibility
**Goal**: Allow users to customize their meal plans
- Dietary preferences selection UI
- Cuisine preferences for the week
- Adjustable serving sizes per dinner
- Regenerate individual meals with confirmation
- Add/delete meals from week (updates shopping list)

### Phase 3: Favorites & Organization
**Goal**: Enable saving and reusing favorite recipes
- Save favorite recipes
- Favorites page with search/browse
- Add favorites to weekly plan
- Categorized grocery list (produce, dairy, proteins, etc.)
- Interactive checklist with click-to-check

### Phase 4: Beverage Pairing
**Goal**: Add cocktail and wine pairing functionality
- Cocktail recipe generation per dinner
- Wine pairing suggestions
- Flavor profile explanations
- Optional ingredient addition to grocery list
- Save favorite cocktails
- Display meal + cocktail together

### Phase 5: Smart Optimization & Polish
**Goal**: Optimize user experience and prepare for scaling
- Ingredient overlap optimization across the week
- Improved UI/UX with loading states
- Error handling and offline support
- Prepare architecture for future multi-user support

## Key Technical Decisions
- **Single-user mode initially**, but data structure designed for future user accounts
- **localStorage keys structured** to easily migrate to database
- **API designed RESTfully** to support future cloud deployment
- **Component architecture** allows easy addition of features
- **React Context** for state management (can upgrade to Redux if needed)

## Data Models

### Meal Plan
```javascript
{
  id: string,
  createdAt: timestamp,
  dinners: [
    {
      id: string,
      dayOfWeek: string,
      recipe: Recipe,
      servings: number,
      beveragePairing: BeveragePairing | null
    }
  ]
}
```

### Recipe
```javascript
{
  id: string,
  name: string,
  ingredients: [
    {
      item: string,
      quantity: string,
      category: string (produce, dairy, protein, pantry, etc.)
    }
  ],
  instructions: [string],
  prepTime: number (minutes),
  cookTime: number (minutes),
  servings: number (default),
  cuisine: string,
  dietaryInfo: [string]
}
```

### Beverage Pairing
```javascript
{
  cocktail: {
    name: string,
    ingredients: [
      {
        item: string,
        quantity: string
      }
    ],
    instructions: [string],
    flavorProfile: string
  },
  wine: {
    type: string,
    description: string,
    flavorProfile: string
  }
}
```

### Grocery List
```javascript
{
  mealPlanId: string,
  items: [
    {
      item: string,
      quantity: string,
      category: string,
      checked: boolean,
      mealIds: [string] // which meals need this ingredient
    }
  ],
  manualItems: [
    {
      item: string,
      checked: boolean
    }
  ]
}
```

## API Endpoints

### Meal Generation
- `POST /api/meals/generate` - Generate meal plan
  - Body: { numberOfMeals, dietaryPreferences, cuisinePreferences, servings }
  - Returns: Array of generated recipes

- `POST /api/meals/regenerate` - Regenerate a single meal
  - Body: { mealId, dietaryPreferences, cuisinePreferences, servings }
  - Returns: New recipe

### Beverage Pairing
- `POST /api/beverages/pair` - Generate beverage pairing for a meal
  - Body: { recipeId, recipeName, ingredients }
  - Returns: BeveragePairing

### Grocery List
- `POST /api/grocery/generate` - Generate grocery list from meals
  - Body: { meals }
  - Returns: Categorized grocery list

## localStorage Structure

```javascript
{
  'currentMealPlan': MealPlan,
  'savedRecipes': [Recipe],
  'savedCocktails': [Cocktail],
  'userPreferences': {
    defaultServings: number,
    dietaryRestrictions: [string],
    favoriteCuisines: [string]
  }
}
```

## Future Enhancements (Post-MVP)
- User authentication and accounts
- Cloud synchronization
- Meal planning calendar view
- Nutritional information display
- Cooking mode with step-by-step timers
- Share meal plans with others
- Integration with grocery delivery services
- Recipe import from URLs
- Custom recipe creation
