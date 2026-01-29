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
│   │   │   ├── MealCard.jsx          # Display individual meal with all components
│   │   │   ├── GroceryList.jsx       # Interactive grocery checklist
│   │   │   ├── RecipeDetail.jsx      # Full recipe modal
│   │   │   ├── SideDishDetail.jsx    # Side dish recipe modal
│   │   │   ├── BeverageDetail.jsx    # Cocktail/wine detail modal
│   │   │   └── Navigation.jsx        # App navigation bar
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
- Toggle to include beverage ingredients (cocktail ingredients + wine)

### 3. Recipe Details
- Display full ingredients list with quantities
- Step-by-step cooking instructions
- Prep time and cook time estimates

### 4. Save & Memory System
- Save individual favorite recipes, side dishes, and cocktails
- Search and browse saved recipes and dinner plans
- There is a favorites tab or page in the application that users can navigate to in order to find saved meals
- The saved meals are persistent over time, you can navigate away from saved meals and go back to saved meals and they can still be there
- Toggle favorite on/off directly from meal cards

### 5. Beverage Pairing Feature
- For each dinner, offer to generate cocktail recipe and/or wine pairing separately
- Show flavor profile explanation for why they complement the dinner
- Toggle to include beverage ingredients in grocery list
- Wine section in grocery list with checkboxes
- The cocktail recipes can also be saved
- The meal recipe and cocktail recipe show up together on a "meal"

### 6. Side Dish Feature
- Generate complementary side dishes for each main dish
- AI analyzes main dish to suggest appropriate side type (vegetable, starch, salad)
- Side dishes can be added/removed individually per meal
- Side dish recipes can be saved to favorites

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

### Phase 2: Customization & Flexibility ✅ COMPLETE
**Goal**: Allow users to customize their meal plans
- ✅ Dietary preferences selection UI
- ✅ Cuisine preferences for the week
- ✅ Adjustable serving sizes per dinner
- ✅ Regenerate individual meals with confirmation
- ✅ Add/delete meals from week (updates shopping list)
- ✅ Include side dishes toggle on Home page
- ✅ Include cocktails toggle on Home page
- ✅ Include wine pairing toggle on Home page

### Phase 3: Favorites & Organization ✅ COMPLETE
**Goal**: Enable saving and reusing favorite recipes
- ✅ Save favorite recipes with toggle (star) functionality
- ✅ Favorites page with search/browse
- ✅ Categorized grocery list (produce, dairy, proteins, etc.)
- ✅ Interactive checklist with click-to-check
- ✅ Save favorite side dishes
- ✅ Save favorite cocktails
- ✅ Side Dishes section on Favorites page

### Phase 4: Side Dishes & Beverage Pairing ✅ COMPLETE
**Goal**: Add side dishes, cocktail and wine pairing functionality
- ✅ Side dish generation per dinner (AI-powered complementary suggestions)
- ✅ Add/remove side dishes individually per meal
- ✅ Side dish detail modal with full recipe
- ✅ Cocktail recipe generation per dinner
- ✅ Wine pairing suggestions per dinner
- ✅ Separate "Add Cocktail" and "Add Wine Pairing" buttons
- ✅ Remove cocktail/wine individually
- ✅ Flavor profile explanations
- ✅ Beverage ingredients toggle in grocery list
- ✅ Wine section in grocery list with checkboxes
- ✅ Display meal + side + cocktail + wine together on card
- ✅ Redesigned meal cards with compact sections

### Phase 5: Smart Optimization & Polish
**Goal**: Optimize user experience and prepare for scaling
- [ ] Ingredient overlap optimization across the week
- [ ] Improved UI/UX with loading states
- [ ] Error handling and offline support
- [ ] Prepare architecture for future multi-user support
- [ ] Add confirmation dialogs for destructive actions
- [ ] Ability to add a dinner from favorite recipes

## Key Technical Decisions
- **Single-user mode initially**, but data structure designed for future user accounts
- **localStorage keys structured** to easily migrate to database
- **API designed RESTfully** to support future cloud deployment
- **Component architecture** allows easy addition of features
- **React Context** for state management (can upgrade to Redux if needed)
- **Data migration** handled automatically for old meal plan formats

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
      mainDish: Recipe,        // Renamed from 'recipe'
      sideDish: SideDish | null,
      servings: number,
      beveragePairing: BeveragePairing | null
    }
  ]
}
```

### Recipe (Main Dish)
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

### Side Dish
```javascript
{
  id: string,
  name: string,
  type: string (vegetable, starch, salad),
  ingredients: [
    {
      item: string,
      quantity: string,
      category: string
    }
  ],
  instructions: [string],
  prepTime: number (minutes),
  cookTime: number (minutes),
  dietaryInfo: [string],
  complementReason: string  // Why this pairs well with main dish
}
```

### Beverage Pairing
```javascript
{
  cocktail: {
    id: string,
    name: string,
    ingredients: [
      {
        item: string,
        quantity: string
      }
    ],
    instructions: [string],
    flavorProfile: string
  } | null,
  wine: {
    type: string,
    description: string,
    flavorProfile: string
  } | null
}
```

### Grocery List
```javascript
{
  mealPlanId: string,
  items: [
    {
      id: string,
      item: string,
      quantity: string,
      category: string,
      checked: boolean,
      mealIds: [string] // which meals need this ingredient
    }
  ],
  manualItems: [
    {
      id: string,
      item: string,
      checked: boolean
    }
  ]
}
```

## API Endpoints

### Meal Generation
- `POST /api/meals/generate` - Generate meal plan
  - Body: { numberOfMeals, dietaryPreferences, cuisinePreferences, servings, includeSides, includeCocktails, includeWine }
  - Returns: Array of generated recipes with optional sides/beverages

- `POST /api/meals/regenerate` - Regenerate a single meal
  - Body: { mealId, dietaryPreferences, cuisinePreferences, servings }
  - Returns: New recipe

- `POST /api/meals/add-side` - Add side dish to existing meal
  - Body: { mainDish, dietaryPreferences, servings }
  - Returns: Generated side dish

- `POST /api/meals/regenerate-side` - Regenerate side dish
  - Body: { mainDish, dietaryPreferences, servings }
  - Returns: New side dish

### Beverage Pairing
- `POST /api/beverages/pair` - Generate beverage pairing for a meal
  - Body: { recipeId, recipeName, ingredients, includeCocktail, includeWine }
  - Returns: BeveragePairing

- `POST /api/beverages/regenerate-cocktail` - Regenerate just the cocktail
  - Body: { recipeName, ingredients }
  - Returns: New cocktail

- `POST /api/beverages/regenerate-wine` - Regenerate just the wine pairing
  - Body: { recipeName, ingredients }
  - Returns: New wine pairing

### Grocery List
- `POST /api/grocery/generate` - Generate grocery list from meals
  - Body: { meals, includeCocktails }
  - Returns: Categorized grocery list (includes mainDish, sideDish, and optionally cocktail ingredients)

## localStorage Structure

```javascript
{
  'meal-planner:currentMealPlan': MealPlan,
  'meal-planner:savedRecipes': [Recipe],
  'meal-planner:savedSideDishes': [SideDish],
  'meal-planner:savedCocktails': [Cocktail],
  'meal-planner:groceryList': GroceryList,
  'meal-planner:userPreferences': {
    defaultServings: number,
    dietaryRestrictions: [string],
    favoriteCuisines: [string]
  }
}
```

## Recent Changes (Latest Session)

### Completed in This Session:
1. **Side Dish Feature** - Full implementation including:
   - Backend generation with Claude API
   - Add/remove side dishes per meal
   - SideDishDetail modal component
   - Save to favorites functionality

2. **Beverage Pairing Separation** - Split into independent features:
   - Separate "Add Cocktail" and "Add Wine Pairing" buttons
   - Individual remove options for each
   - BeverageDetail modal for viewing details

3. **Meal Card Redesign** - New compact layout with sections:
   - Main dish with View Recipe + favorite star
   - Side dish with View Recipe + favorite star
   - Cocktail with View Recipe + favorite star
   - Wine with View Pairing (aligned with other buttons)

4. **Grocery List Updates**:
   - "Include beverage ingredients" toggle
   - Wines section with checkboxes
   - Handles mainDish, sideDish, and cocktail ingredients

5. **Home Page Toggles**:
   - Include Side Dishes (green toggle)
   - Include Cocktails (green toggle)
   - Include Wine Pairing (green toggle)

6. **Favorites Page Updates**:
   - Added Side Dishes section
   - Redesigned Cocktails to match Recipe card style

7. **Toggle Favorites** - Click star to save, click again to remove

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
