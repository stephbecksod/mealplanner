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

- **Storage**: Browser localStorage
  - *Why*: Simple single-user implementation, no backend database needed initially
  - *Future*: Architecture designed to easily migrate to PostgreSQL/MongoDB for multi-user

- **Styling**: Tailwind CSS
  - *Why*: Rapid UI development, consistent design system, small production bundle

### Architecture Patterns
- **State Management**: React Context API
  - Sufficient for single-user app, avoids Redux complexity
  - Can upgrade to Redux Toolkit if state becomes complex

- **API Design**: RESTful endpoints
  - Clear separation of concerns
  - Easy to understand and extend

- **Data Persistence Strategy**:
  - localStorage keys namespaced for future multi-user support
  - Data models designed to match potential database schemas
  - Migration path documented for scaling

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
│   │   │   └── Navigation.jsx        # App navigation bar
│   │   ├── pages/                    # Main application views
│   │   │   ├── Home.jsx              # Landing/meal plan generator
│   │   │   ├── MealPlan.jsx          # Current week's meals
│   │   │   └── Favorites.jsx         # Saved recipes
│   │   ├── services/                 # External interactions
│   │   │   ├── api.js                # Backend API client (axios)
│   │   │   └── storage.js            # localStorage wrapper
│   │   ├── context/                  # React Context providers
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
├── .gitignore                        # Git ignore rules
├── PROJECT_PLAN.md                   # Detailed feature roadmap
├── CLAUDE.md                         # This file
└── README.md                         # User-facing documentation
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Anthropic API key ([get one here](https://console.anthropic.com/))

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

4. **Start development servers**
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
   - Check localStorage persistence
   - Verify error handling

### Code Style Guidelines

- **React Components**: Functional components with hooks
- **Naming**:
  - Components: PascalCase (MealCard.jsx)
  - Functions: camelCase (generateMealPlan)
  - Constants: UPPER_SNAKE_CASE (API_BASE_URL)
- **File organization**: One component per file
- **Comments**: Add JSDoc for complex functions
- **Error handling**: Always include try-catch for API calls

### localStorage Keys

Current schema:
```javascript
'meal-planner:currentMealPlan'    // Active meal plan
'meal-planner:savedRecipes'        // Favorite recipes array
'meal-planner:savedCocktails'      // Favorite cocktails array
'meal-planner:userPreferences'     // User settings
'meal-planner:groceryList'         // Current grocery list
```

**Important**: Always use the `storage.js` service to interact with localStorage to ensure consistency and easy future migration.

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

### localStorage Issues
- Clear localStorage if schema changes:
  ```javascript
  localStorage.clear()
  ```
- Use `storage.js` service for all access
- Check Application > Local Storage in DevTools

## Performance Considerations

- Claude API calls can take 5-15 seconds
- Show loading states for all API calls
- Consider caching frequently used data
- Batch grocery list updates when adding/removing meals

## Future Migration Path

When scaling to multi-user:
1. Replace localStorage with database (PostgreSQL recommended)
2. Add authentication (JWT or session-based)
3. Update API to include user context
4. Add user registration/login pages
5. Deploy backend to cloud (Heroku, Railway, or AWS)
6. Deploy frontend to Vercel/Netlify

Data models are already designed with this in mind - each record can easily add a `userId` field.
