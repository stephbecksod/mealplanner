# Meal Planner App - Project Plan

## Project Overview
Build a browser-based dinner planning app that generates customized weekly dinner plans with smart grocery lists, recipe storage, and beverage pairings. Built on Windows, accessible from any device with a web browser.

## Technology Stack
- **Frontend**: React with React Router for navigation
- **Backend**: Node.js with Express for API routes
- **AI Integration**: Anthropic Claude API for meal/beverage generation
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth (email/password)
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

### Phase 5: Smart Optimization & Polish ✅ COMPLETE
**Goal**: Optimize user experience and prepare for scaling
- ✅ Ingredient overlap optimization across the week
- ✅ Improved UI/UX with loading states (add side dish, cocktail, wine buttons)
- ✅ Error handling and offline support
- ✅ Prepare architecture for future multi-user support (see MULTI_USER_MIGRATION.md)
- ✅ Add confirmation dialogs for destructive actions
- ✅ Ability to add a dinner from favorite recipes
- ✅ Add side dishes and cocktails from favorites to specific days
- ✅ A la carte items (standalone sides/cocktails at end of meal plan)
- ✅ "Included in Week" state for items already in meal plan
- ✅ Day numbering format ("Day 1", "Day 2" instead of weekday names)
- ✅ "Add Meal" button with generate new or add from favorites options
- ✅ Multiple side dishes per meal support
- ✅ Multiple cocktails per meal support

### Phase 6: Multi-User & Cloud Sync ✅ COMPLETE
**Goal**: Enable user accounts and cross-device data synchronization
- ✅ Supabase project setup with PostgreSQL database
- ✅ Database schema with RLS policies (meal_plans, dinners, saved_recipes, saved_cocktails, saved_side_dishes, grocery_lists)
- ✅ User authentication (sign up, sign in, sign out, password reset)
- ✅ Protected routes requiring authentication
- ✅ Data service layer for Supabase operations (supabaseData.js)
- ✅ MealPlanContext updated to fetch/save data from Supabase
- ✅ FavoritesContext updated with optimistic updates and Supabase persistence
- ✅ Automatic localStorage to Supabase migration for existing users
- ✅ DataMigrationModal component for guided migration experience
- ✅ Cross-device data synchronization

### Phase 7: Production Deployment ✅ COMPLETE
**Goal**: Make the app publicly accessible
- ✅ Database migration deployed to Supabase
- ✅ Edge Functions deployed to Supabase (generate-meals, regenerate-meal, add-side-dish, add-beverage, generate-grocery)
- ✅ ANTHROPIC_API_KEY secret configured in Supabase
- ✅ Frontend deployed to Vercel
- ✅ Production URL configured in Supabase Auth settings
- ⏳ Test production deployment end-to-end

## Key Technical Decisions
- **Multi-user with Supabase** - PostgreSQL database with Row Level Security
- **Supabase Auth** for user authentication (email/password)
- **API designed RESTfully** to support cloud deployment
- **Component architecture** allows easy addition of features
- **React Context** for state management (can upgrade to Redux if needed)
- **Data migration** from localStorage to Supabase handled via migration modal
- **Optimistic updates** for favorites (immediate UI feedback, rollback on error)
- **Server-first updates** for meal plans (wait for confirmation on AI-generated data)

## Data Models

### Meal Plan
```javascript
{
  id: string,
  createdAt: timestamp,
  dietaryPreferences: [string],
  cuisinePreferences: [string],
  dinners: [
    {
      id: string,
      dayOfWeek: string,          // "Day 1", "Day 2", etc.
      mainDish: Recipe | null,    // null for a la carte items
      sideDishes: [SideDish],     // Array - supports multiple sides
      servings: number,
      beveragePairing: BeveragePairing | null,
      isAlaCarte: boolean         // true for standalone sides/cocktails
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
  cocktails: [              // Array - supports multiple cocktails
    {
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
    }
  ],
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

## Supabase Database Schema

```sql
-- Core tables (all with Row Level Security)
meal_plans (id, user_id, dietary_preferences, cuisine_preferences, is_active, created_at)
dinners (id, meal_plan_id, day_of_week, servings, is_a_la_carte, main_dish, side_dishes, beverage_pairing)
saved_recipes (id, user_id, recipe_data, created_at)
saved_cocktails (id, user_id, cocktail_data, created_at)
saved_side_dishes (id, user_id, side_dish_data, created_at)
grocery_lists (id, meal_plan_id, items, manual_items, checked_items, include_beverages)
user_preferences (id, user_id, default_servings, default_dietary_preferences, default_cuisine_preferences)
```

### Legacy localStorage Keys (for migration only)
```javascript
{
  'meal-planner:currentMealPlan': MealPlan,
  'meal-planner:savedRecipes': [Recipe],
  'meal-planner:savedSideDishes': [SideDish],
  'meal-planner:savedCocktails': [Cocktail],
  'meal-planner:groceryList': GroceryList,
  'meal-planner:migrated': boolean  // Flag to prevent re-prompting migration
}
```

## Recent Changes (Latest Session)

### Phase 6: Multi-User & Cloud Sync
1. **Supabase Integration**:
   - Set up Supabase project with PostgreSQL database
   - Created database schema with tables for meal_plans, dinners, saved_recipes, saved_cocktails, saved_side_dishes, grocery_lists
   - Implemented Row Level Security (RLS) policies for user data isolation

2. **Authentication**:
   - Added Supabase Auth with email/password sign up/sign in
   - Created Login and Register pages
   - Added ProtectedRoute component for authenticated routes
   - AuthContext manages user session state

3. **Data Layer Migration**:
   - Created supabaseData.js with mealPlanService and favoritesService
   - Updated MealPlanContext to use Supabase instead of localStorage
   - Updated FavoritesContext with optimistic updates and Supabase persistence
   - All CRUD operations now persist to cloud database

4. **Migration Experience**:
   - DataMigrationModal detects existing localStorage data
   - Prompts users to migrate data to their account on first login
   - Shows migration progress and results
   - Option to clear localStorage after successful migration

---

## Previous Sessions

### Completed in This Session:

1. **Confirmation Dialogs**:
   - Created reusable `ConfirmationModal` component
   - Added confirmations for removing side dishes, cocktails, wine from MealCard
   - Replaced browser `confirm()` with modal in Favorites page
   - Consistent red "danger" styling for remove actions

2. **Error Handling & Offline Support**:
   - Created `Toast` component for transient error notifications
   - Added `OfflineBanner` component that detects network status
   - Enhanced API service with error classification (network, timeout, server, validation)
   - Added 60-second timeout for AI operations
   - Toast errors shown for failed operations in MealCard and MealPlan
   - Automatic "Back online" notification when connection restored

3. **Ingredient Overlap Optimization**:
   - Enhanced AI prompt for initial meal generation with explicit ingredient overlap strategy
   - Target 40-60% ingredient overlap across weekly meals
   - Prioritizes sharing proteins, produce, and pantry staples
   - New regenerate meal endpoint considers existing meal ingredients
   - When regenerating a meal, passes existing meals' ingredients to AI for 30-50% overlap

4. **Multi-User Architecture Documentation**:
   - Created MULTI_USER_MIGRATION.md with complete migration guide
   - PostgreSQL database schema for users, meal plans, favorites
   - JWT authentication strategy with refresh tokens
   - List of files to create and modify
   - API endpoints to add
   - Phased implementation plan (6-7 weeks)
   - Security checklist

### Earlier Session (Add to Week & A La Carte):
1. **Meal Plan Page Improvements**:
   - Day labels now show "Day 1", "Day 2" instead of weekday names
   - "Add Meal" button opens modal with two options:
     - Generate New Meal (AI-powered)
     - Add from Favorites (saved recipes)
   - Loading indicators on Add Side Dish, Add Cocktail, Add Wine buttons
   - Visual feedback with spinner and "Generating..." text

2. **Multiple Items Per Meal**:
   - Meals can now have multiple side dishes (array instead of single)
   - Meals can now have multiple cocktails (array instead of single)
   - Each item has individual View/Favorite/Remove buttons
   - Grocery list updated to handle multiple items

3. **Add to Week from Favorites**:
   - "Add to Week" button on all Favorites cards (recipes, sides, cocktails)
   - Recipes add directly as new meal day
   - Side dishes and cocktails show modal to:
     - Select specific day to add to
     - Or add as "A la carte" (standalone item)
   - "Included in Week" state shows for items already in plan
   - Loading spinner when adding items

4. **A La Carte Items**:
   - Standalone side dishes or cocktails without main dish
   - Purple "A la carte" header instead of day number
   - Always appear at end of meal plan
   - Hide irrelevant sections (no cocktail section for side-only, vice versa)
   - Ingredients included in grocery list

5. **Data Migration**:
   - Automatic migration from old format (sideDish → sideDishes array)
   - Automatic migration from old format (cocktail → cocktails array)
   - Backward compatible with existing saved data

6. **Bug Fixes**:
   - Fixed beverage toggle in grocery list (now supports both old and new data formats)

### Phase 5 Complete!
All Phase 5 tasks have been completed. See MULTI_USER_MIGRATION.md for the multi-user architecture documentation.

### Phase 4 Session (Side Dishes & Beverages):
- Side Dish Feature with AI generation
- Beverage Pairing (separate cocktail/wine)
- Meal Card redesign with compact sections
- Grocery List with beverage toggle
- Home Page generation toggles
- Favorites Page with Side Dishes section
- Star toggle for favorites

## Future Enhancements (Post-MVP)
- ✅ User authentication and accounts (Supabase Auth)
- ✅ Cloud synchronization (Supabase PostgreSQL)
- Share meal plans with others
- Integration with grocery delivery services
- Recipe import from URLs
- Custom recipe creation
