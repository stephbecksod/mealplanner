# Meal Planner - Development Guide

## Project Overview
A browser-based dinner planning application that helps users create weekly meal plans with AI-generated recipes, smart grocery lists, and beverage pairings. The app is designed for ease of use while providing powerful customization options for dietary preferences, serving sizes, and cuisine types.

**Purpose**: Simplify weekly meal planning by generating diverse dinner ideas with overlapping ingredients, reducing grocery shopping complexity while maintaining variety.

## Technical Architecture Decisions

### Technology Stack
- **Frontend**: React 18 with Vite
  - *Why*: Fast development experience, modern build tooling, efficient HMR
  - *Why React*: Component reusability, large ecosystem, familiar to most developers

- **Backend**: Node.js with Express
  - *Why*: JavaScript full-stack for consistency, simple API layer

- **AI Integration**: Anthropic Claude API
  - *Why*: Superior reasoning for recipe generation, natural language understanding

- **Database**: Supabase (PostgreSQL)
  - *Why*: Managed PostgreSQL with built-in auth, real-time, and Row Level Security
  - Enables cross-device sync and multi-user support

- **Authentication**: Supabase Auth
  - *Why*: Integrated with database, handles sessions, supports multiple providers

- **Styling**: Tailwind CSS
  - *Why*: Rapid UI development, consistent design system, small production bundle

### Architecture Patterns
- **State Management**: React Context API
  - AuthContext for user session
  - MealPlanContext for current meal plan (fetches from Supabase)
  - FavoritesContext for saved items (optimistic updates)

- **API Design**: RESTful endpoints
  - Clear separation of concerns
  - Easy to understand and extend

- **Data Persistence Strategy**:
  - All data stored in Supabase PostgreSQL
  - Row Level Security ensures users only access their own data
  - Contexts fetch data on user login, save on changes
  - Legacy localStorage migration for existing users

## File Structure

```
meal-planner/
├── client/                           # React frontend (port 3000)
│   ├── public/                       # Static assets
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── MealCard.jsx          # Display individual meal
│   │   │   ├── GroceryList.jsx       # Interactive grocery checklist
│   │   │   ├── RecipeDetail.jsx      # Full recipe view
│   │   │   ├── BeveragePairing.jsx   # Cocktail/wine display
│   │   │   ├── Navigation.jsx        # App navigation bar
│   │   │   ├── ProtectedRoute.jsx    # Auth-required route wrapper
│   │   │   ├── DataMigrationModal.jsx # localStorage to Supabase migration
│   │   │   └── OfflineBanner.jsx     # Network status indicator
│   │   ├── pages/                    # Main application views
│   │   │   ├── Home.jsx              # Landing/meal plan generator
│   │   │   ├── MealPlan.jsx          # Current week's meals
│   │   │   ├── Favorites.jsx         # Saved recipes
│   │   │   ├── Login.jsx             # User login
│   │   │   └── Register.jsx          # User registration
│   │   ├── services/                 # External interactions
│   │   │   ├── api.js                # Backend API client (axios)
│   │   │   ├── supabase.js           # Supabase client initialization
│   │   │   ├── supabaseData.js       # Supabase data services
│   │   │   └── storage.js            # localStorage wrapper (legacy/migration)
│   │   ├── context/                  # React Context providers
│   │   │   ├── AuthContext.jsx       # User authentication state
│   │   │   ├── MealPlanContext.jsx   # Current meal plan state
│   │   │   └── FavoritesContext.jsx  # Saved recipes state
│   │   ├── utils/                    # Helper functions
│   │   │   ├── groceryUtils.js       # Combine/categorize ingredients
│   │   │   └── dateUtils.js          # Week formatting
│   │   ├── App.jsx                   # Root component with routing
│   │   ├── main.jsx                  # React DOM entry point
│   │   └── index.css                 # Global styles + Tailwind
│   ├── index.html                    # HTML entry point
│   ├── vite.config.js                # Vite configuration
│   ├── tailwind.config.js            # Tailwind customization
│   ├── postcss.config.js             # PostCSS for Tailwind
│   └── package.json
│
├── server/                           # Node.js backend (port 5000)
│   ├── routes/                       # API route handlers
│   │   ├── meals.js                  # Meal generation endpoints
│   │   ├── beverages.js              # Beverage pairing endpoints
│   │   └── grocery.js                # Grocery list generation
│   ├── services/                     # Business logic
│   │   ├── claudeService.js          # Claude API integration
│   │   └── promptService.js          # AI prompt templates
│   ├── utils/                        # Helper functions
│   │   └── validators.js             # Input validation
│   ├── server.js                     # Express app entry point
│   ├── .env.example                  # Environment variables template
│   └── package.json
│
├── supabase/                         # Database configuration
│   └── migrations/                   # SQL migration files
│       └── 001_initial_schema.sql    # Tables, RLS policies, triggers
│
├── .gitignore                        # Git ignore rules
├── PROJECT_PLAN.md                   # Detailed feature roadmap
├── CLAUDE.md                         # This file
└── README.md                         # User-facing documentation
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Anthropic API key ([get one here](https://console.anthropic.com/))
- Supabase project ([create one here](https://supabase.com/))

### Initial Setup

1. **Clone/navigate to the project**
   ```bash
   cd "meal planner"
   ```

2. **Install dependencies for all packages**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd server
   copy .env.example .env
   ```

   Edit `server/.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up Supabase**

   Create a `.env` file in the `client/` directory:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Run the database migration in Supabase SQL Editor:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Run in Supabase Dashboard > SQL Editor

5. **Start development servers**
   ```bash
   cd ..
   npm run dev
   ```

   This runs both:
   - React dev server on `http://localhost:3000`
   - Express API server on `http://localhost:5000`

5. **Access the app**
   Open `http://localhost:3000` in your browser

### Alternative: Run Servers Separately

If you prefer to run servers in separate terminals:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

## Development Workflow

### Adding New Features

1. **Plan the feature**
   - Review PROJECT_PLAN.md for feature specifications
   - Identify which phase the feature belongs to
   - Sketch out component/API changes needed

2. **Backend first (if API needed)**
   - Add route in `server/routes/`
   - Implement business logic in `server/services/`
   - Test endpoint with Postman/curl

3. **Frontend implementation**
   - Create/update components in `client/src/components/`
   - Add page if needed in `client/src/pages/`
   - Update context if state changes needed
   - Add API call in `client/src/services/api.js`

4. **Styling**
   - Use Tailwind utility classes
   - Follow existing color scheme (primary green)
   - Ensure responsive design (mobile-first)

5. **Testing**
   - Test all user flows manually
   - Check Supabase data persistence (Dashboard > Table Editor)
   - Verify error handling
   - Test cross-device sync by logging in on different browsers

### Code Style Guidelines

- **React Components**: Functional components with hooks
- **Naming**:
  - Components: PascalCase (MealCard.jsx)
  - Functions: camelCase (generateMealPlan)
  - Constants: UPPER_SNAKE_CASE (API_BASE_URL)
- **File organization**: One component per file
- **Comments**: Add JSDoc for complex functions
- **Error handling**: Always include try-catch for API calls

### Data Storage

All data is stored in Supabase PostgreSQL with Row Level Security:

| Table | Description |
|-------|-------------|
| `meal_plans` | User's meal plans with preferences |
| `dinners` | Individual meals within a plan |
| `saved_recipes` | Favorited main dish recipes |
| `saved_cocktails` | Favorited cocktail recipes |
| `saved_side_dishes` | Favorited side dish recipes |
| `grocery_lists` | Shopping lists linked to meal plans |
| `user_preferences` | User default settings |

**Data Services** (in `supabaseData.js`):
- `mealPlanService` - CRUD for meal plans and dinners
- `favoritesService` - CRUD for saved recipes/cocktails/sides
- `migrationService` - localStorage to Supabase migration

### Legacy localStorage Keys (migration only)

These keys are only used for migrating existing users:
```javascript
'meal-planner:currentMealPlan'    // Migrated to meal_plans + dinners
'meal-planner:savedRecipes'        // Migrated to saved_recipes
'meal-planner:savedCocktails'      // Migrated to saved_cocktails
'meal-planner:savedSideDishes'     // Migrated to saved_side_dishes
'meal-planner:groceryList'         // Migrated to grocery_lists
'meal-planner:migrated'            // Flag to skip migration prompt
```

## Git Commit Guidelines

### Authorship
- **All commits should be authored by Steph**
- Configure git if needed:
  ```bash
  git config user.name "Steph"
  git config user.email "your-email@example.com"
  ```

### Commit Message Format
- **DO**: Write clear, professional messages describing the actual changes
- **DO**: Use conventional commit format when appropriate:
  - `feat: Add meal regeneration functionality`
  - `fix: Resolve grocery list quantity calculation bug`
  - `refactor: Simplify Claude API service`
  - `style: Update Tailwind theme colors`
  - `docs: Update setup instructions in README`

### What NOT to Include
- ❌ No references to AI assistance
- ❌ No mentions of "Claude Code" or "AI-generated"
- ❌ No co-authored-by AI tags
- ❌ No generated with links

### Good Commit Message Examples
```
feat: Add dietary preference filtering to meal generation
fix: Correct serving size calculations in grocery list
refactor: Extract grocery categorization into utility function
style: Improve meal card responsive layout
docs: Add API endpoint documentation
```

### Commit Workflow
```bash
# Stage changes
git add .

# Commit with clear message
git commit -m "feat: Add beverage pairing display component"

# Push to remote
git push origin main
```

## API Endpoints Reference

### Meal Generation
```
POST /api/meals/generate
Body: {
  numberOfMeals: 3,
  dietaryPreferences: ['vegetarian'],
  cuisinePreferences: ['italian', 'mexican'],
  servings: 4
}
Returns: Array<Recipe>
```

### Beverage Pairing
```
POST /api/beverages/pair
Body: {
  recipeName: string,
  ingredients: string[]
}
Returns: BeveragePairing
```

### Grocery List
```
POST /api/grocery/generate
Body: {
  meals: Array<Meal>
}
Returns: CategorizedGroceryList
```

## Common Tasks

### Adding a New Dietary Preference
1. Add to UI in meal generation form
2. Update Claude prompt in `server/services/promptService.js`
3. Test generation with new preference

### Adding a New Grocery Category
1. Update categorization logic in `client/src/utils/groceryUtils.js`
2. Update display in `GroceryList.jsx`

### Modifying AI Prompts
- All prompts are in `server/services/promptService.js`
- Test changes thoroughly as they affect all generated content
- Consider token limits and response times

## Debugging Tips

### Frontend Issues
- Check browser console for errors
- Verify API calls in Network tab
- Check React DevTools for state issues
- Inspect localStorage in Application tab

### Backend Issues
- Check server console for errors
- Verify Claude API key is set correctly
- Check API response formats match expected schema
- Monitor Claude API usage in Anthropic console

### Supabase Issues
- Check Supabase Dashboard > Logs for API errors
- Verify RLS policies in Dashboard > Authentication > Policies
- Check user session: `supabase.auth.getSession()`
- View data in Dashboard > Table Editor
- Test RLS by running queries in SQL Editor with `set role authenticated`

### localStorage Issues (Migration)
- Migration not triggering? Check `meal-planner:migrated` flag
- Clear all localStorage: `localStorage.clear()`
- Check Application > Local Storage in DevTools

## Performance Considerations

- Claude API calls can take 5-15 seconds
- Show loading states for all API calls
- Consider caching frequently used data
- Batch grocery list updates when adding/removing meals

## Multi-User Architecture (Completed)

The app now supports multiple users with Supabase:

- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth (email/password)
- **Data Isolation**: RLS policies ensure users only see their own data
- **Cross-Device Sync**: Data persists in cloud, accessible from any device

### Deployment Options

**Frontend** (static hosting):
- Vercel, Netlify, or Cloudflare Pages
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars

**Backend** (Node.js hosting):
- Railway, Render, Heroku, or AWS
- Set `ANTHROPIC_API_KEY` env var

**Database**:
- Already hosted on Supabase (managed PostgreSQL)
