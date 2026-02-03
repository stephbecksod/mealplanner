# Meal Planner App - Project Plan

## Project Overview
Build a dinner planning app (web + mobile) that generates customized weekly dinner plans with smart grocery lists, recipe storage, and beverage pairings. Available as a web app (nomnomplan.com) and native mobile apps for iOS and Android. All platforms share the same Supabase backend for seamless cross-device sync.

## Technology Stack
- **Frontend (Web)**: React with React Router for navigation
- **Frontend (Mobile)**: React Native with Expo (iOS & Android)
- **Backend**: Node.js with Express for API routes (local dev)
- **Backend (Production)**: Supabase Edge Functions (Deno)
- **AI Integration**: Anthropic Claude API for meal/beverage generation
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth (email/password)
- **Styling (Web)**: Tailwind CSS for responsive design
- **Styling (Mobile)**: React Native StyleSheet

## Project Structure
```
meal-planner/
├── client/                    # React web frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── MealCard.jsx          # Display individual meal with all components
│   │   │   ├── GroceryList.jsx       # Interactive grocery checklist
│   │   │   ├── RecipeDetail.jsx      # Full recipe modal
│   │   │   ├── SideDishDetail.jsx    # Side dish recipe modal
│   │   │   ├── BeverageDetail.jsx    # Cocktail/wine detail modal
│   │   │   ├── CustomMealForm.jsx    # Manual recipe entry form
│   │   │   └── Navigation.jsx        # App navigation bar
│   │   ├── pages/             # Main views (Home, Favorites, MealPlan)
│   │   ├── services/          # API client, Supabase client
│   │   ├── context/           # React Context for state management
│   │   ├── utils/             # Helper functions
│   │   └── App.jsx
│   └── package.json
├── mobile/                    # React Native mobile app (Expo)
│   ├── src/
│   │   ├── screens/           # Mobile screens (Login, Home, MealPlan, etc.)
│   │   ├── context/           # Auth and MealPlan contexts
│   │   └── services/          # Supabase client, API client
│   ├── App.js                 # Navigation setup
│   ├── app.json               # Expo configuration
│   └── package.json
├── server/                    # Node.js backend (local development)
│   ├── routes/                # API endpoints
│   ├── services/              # Claude API integration
│   ├── utils/                 # Helper functions
│   └── server.js
├── supabase/                  # Supabase configuration
│   ├── functions/             # Edge Functions (production backend)
│   └── migrations/            # Database migrations
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
- ✅ Production testing complete (auth, meal generation, favorites)
- ✅ Bug fix: Favorites toggle now works (name-based matching instead of ID)
- ✅ Bug fix: Navigation responsive design with icons and settings dropdown
- ✅ Custom domain purchased (nomnomplan.com)
- ✅ Domain added to Vercel
- ✅ DNS records configured in Squarespace
- ✅ DNS propagation complete

### Phase 8: Advanced Generation Features ✅ COMPLETE
**Goal**: Add more control over meal generation
- ✅ Protein Selection - Select specific proteins (Chicken, Beef, Pork, Fish/Seafood, Tofu/Tempeh, Lamb, Turkey, Shrimp)
- ✅ Smart protein distribution (if 3 proteins selected for 3 meals, each used exactly once)
- ✅ Protein preferences passed to regenerate-meal for consistency
- ✅ Ingredient Overlap Toggle - On/off control for prioritizing overlapping ingredients
- ✅ Custom Add Meal - Manually add a custom recipe via form (CustomMealForm.jsx)
- ✅ Custom meal form includes: name, cuisine, servings, prep/cook time, ingredients list, instructions
- ✅ Edge Functions updated with new parameters
- ✅ Node.js backend updated for local development

### Phase 9: Mobile App (React Native / Expo) 🔄 IN PROGRESS
**Goal**: Create native iOS and Android apps sharing the same Supabase backend

**Completed:**
- ✅ Expo project initialized in `mobile/` directory
- ✅ Project linked to Expo account (owner: stephsod3, slug: nom-nom-plan)
- ✅ React Navigation setup (native-stack + bottom-tabs)
- ✅ Supabase client with expo-secure-store for token storage
- ✅ AuthContext for mobile authentication
- ✅ MealPlanContext mirroring web app logic
- ✅ FavoritesContext for saved recipes/cocktails/sides
- ✅ All screens created and working:
  - LoginScreen - email/password authentication
  - HomeScreen - meal generation with all options (dietary, cuisine, protein, toggles)
  - MealPlanScreen - view/regenerate/remove meals
  - GroceryScreen - categorized shopping checklist
  - FavoritesScreen - tabs for recipes, cocktails, and side dishes
  - ProfileScreen - user info and sign out
- ✅ 5-tab navigation: Generate, This Week, Grocery, Favorites, Profile
- ✅ Fixed render errors (Expo Go cache issue - clear cache to resolve)
- ✅ Fixed `gap` CSS property issues (replaced with margin-based spacing)
- ✅ Fixed react-native-screens version compatibility

**Remaining:**
- ⏳ Test meal plan generation end-to-end
- ⏳ Add favorite toggle (star icon) on MealPlanScreen meal cards
- ⏳ Add CustomMealForm for mobile
- ⏳ Add "Add to Week" from Favorites
- ⏳ Build production APK/IPA for app stores

**Mobile App Structure**:
```
mobile/
├── App.js                    # Navigation setup with 5 tabs
├── app.json                  # Expo config
├── .env                      # Supabase credentials (not committed)
└── src/
    ├── context/
    │   ├── AuthContext.js
    │   ├── MealPlanContext.js
    │   └── FavoritesContext.js
    ├── services/
    │   ├── supabase.js       # SecureStore adapter
    │   ├── api.js            # Edge Function client
    │   └── supabaseData.js   # Database operations
    └── screens/
        ├── LoginScreen.js
        ├── HomeScreen.js
        ├── MealPlanScreen.js
        ├── GroceryScreen.js
        ├── FavoritesScreen.js
        └── ProfileScreen.js
```

**How to Run Mobile App**:
1. Navigate to mobile directory: `cd mobile`
2. Start Expo with tunnel: `npx expo start --tunnel`
3. Scan QR code with Expo Go app (or use generated URL)
4. If you get render errors, clear Expo Go cache: Settings > Apps > Expo Go > Clear Cache
6. Build and submit to app stores

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

### Phase 9: Mobile App Development - FUNCTIONAL
1. **React Native / Expo Setup**:
   - Initialized Expo project in `mobile/` directory
   - Linked to Expo account (stephsod3/nom-nom-plan)
   - Installed dependencies: React Navigation, Supabase, SecureStore

2. **Mobile Services**:
   - Created supabase.js with SecureStore adapter for secure token storage
   - Created api.js mirroring web app's API client
   - Created supabaseData.js for database operations

3. **Mobile Screens (All Working)**:
   - LoginScreen with email/password authentication
   - HomeScreen with full meal generation options (dietary, cuisine, protein, toggles)
   - MealPlanScreen displaying weekly meals with regenerate/remove
   - GroceryScreen with categorized shopping list
   - FavoritesScreen with tabs for recipes, cocktails, and side dishes
   - ProfileScreen with sign out

4. **Issues Resolved**:
   - Fixed "tried to register two views with the same name RNCSafeAreaProvider" - cleared Expo Go cache
   - Fixed "expected dynamic type 'boolean'" error - removed `gap` CSS properties
   - Fixed react-native-screens version mismatch - downgraded to ~4.16.0

5. **Mobile App Status**:
   - ✅ App runs in Expo Go
   - ✅ Authentication works (login/logout)
   - ✅ All 5 tabs display correctly
   - ✅ Favorites tab added with FavoritesContext
   - ⏳ Need to test meal generation and full workflow

### Phase 8: Advanced Generation Features (Complete)
1. **Protein Selection**:
   - Added PROTEIN_OPTIONS array to Home.jsx
   - Multi-select UI for choosing proteins
   - Smart distribution: matching proteins to meals uses each exactly once
   - Updated Edge Functions and Node.js backend with protein prompts

2. **Custom Add Meal**:
   - Created CustomMealForm.jsx component
   - Form with recipe name, cuisine, servings, prep/cook time, ingredients, instructions
   - Integrated into MealPlan.jsx "Add Meal" modal
   - Uses existing addMeal() function

3. **Ingredient Overlap Toggle**:
   - Added toggle to Home.jsx (default ON)
   - Conditionally includes overlap instructions in AI prompts
   - Updated all backend endpoints

---

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

### Completed
- ✅ User authentication and accounts (Supabase Auth)
- ✅ Cloud synchronization (Supabase PostgreSQL)
- ✅ Protein Selection - Select specific proteins for the week (Phase 8)
- ✅ Custom Add Meal - Manually add custom recipes (Phase 8)
- ✅ Ingredient Overlap Control - Toggle to enable/disable overlap optimization (Phase 8)
- 🔄 Mobile App - Native iOS/Android apps (Phase 9 - In Progress)

### Recipe Customization & AI Chat
- **Ingredient Swap** - Swap out ingredients in a recipe (e.g., make this with beef instead of chicken) or remove an ingredient entirely
- **Recipe Chat** - Chat with AI to update a recipe (e.g., "Can you make this recipe dairy free?" or "Make it spicier")

### Generation Preferences
- **Pantry Inventory** - Add ingredients you already have at home so recipe generation prioritizes using what you have

### Recipe Import
- **Import from URL** - Load recipes from online sources by pasting a URL (extract recipe data from popular recipe sites)
- **Import from Image** - Upload a photo of a cookbook page or screenshot to import a recipe (OCR + AI parsing)

### Sharing & Social
- Share meal plans with others
- Collaborative meal planning for households

### Integrations
- Integration with grocery delivery services (Instacart, Amazon Fresh, etc.)
- Calendar integration for meal scheduling
