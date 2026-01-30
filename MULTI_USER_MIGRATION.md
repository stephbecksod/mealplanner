# Multi-User Migration Guide

This document outlines the architecture changes needed to add user authentication and multi-user support to the Meal Planner application.

## Current Architecture

The app currently uses browser localStorage for all data persistence:
- `meal-planner:currentMealPlan` - Active meal plan
- `meal-planner:savedRecipes` - Favorite recipes
- `meal-planner:savedCocktails` - Favorite cocktails
- `meal-planner:savedSideDishes` - Favorite side dishes
- `meal-planner:groceryList` - Current grocery list
- `meal-planner:userPreferences` - User settings

## Database Schema

### Recommended: PostgreSQL

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meal Plans (one active per user, can have history)
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dietary_preferences TEXT[],
  cuisine_preferences TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dinners (belongs to meal plan)
CREATE TABLE dinners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week VARCHAR(50),
  servings INTEGER DEFAULT 4,
  is_a_la_carte BOOLEAN DEFAULT false,
  main_dish JSONB,
  side_dishes JSONB DEFAULT '[]',
  beverage_pairing JSONB
);

-- Saved Favorites (per user)
CREATE TABLE saved_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_data JSONB NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saved_cocktails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cocktail_data JSONB NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saved_side_dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  side_dish_data JSONB NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grocery Lists
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  manual_items JSONB DEFAULT '[]'
);
```

## Authentication Strategy

### JWT + Refresh Token Pattern

**Dependencies:**
```json
{
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "pg": "^8.x"
}
```

**Token Configuration:**
- Access Token: 15 minutes expiry
- Refresh Token: 7 days expiry
- Store refresh token in httpOnly cookie

**Auth Middleware:**
```javascript
// server/middleware/auth.js
const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { verifyToken }
```

## Files to Create

### Server
| File | Purpose |
|------|---------|
| `server/routes/auth.js` | Register, login, logout, refresh token |
| `server/routes/favorites.js` | CRUD for saved recipes/cocktails/sides |
| `server/middleware/auth.js` | JWT verification |
| `server/services/authService.js` | Password hashing, token generation |
| `server/services/databaseService.js` | PostgreSQL connection pool |

### Client
| File | Purpose |
|------|---------|
| `client/src/context/AuthContext.jsx` | Auth state management |
| `client/src/pages/Login.jsx` | Login form |
| `client/src/pages/Register.jsx` | Registration form |
| `client/src/pages/Profile.jsx` | User profile/settings |
| `client/src/components/ProtectedRoute.jsx` | Auth guard for routes |

## Files to Modify

### Server
- `server/server.js` - Add auth routes, middleware
- `server/routes/meals.js` - Add userId scoping
- `server/routes/beverages.js` - Add userId scoping
- `server/routes/grocery.js` - Link to meal_plan_id

### Client
- `client/src/App.jsx` - Add auth routes, ProtectedRoute wrapper
- `client/src/services/api.js` - Add JWT interceptors, auth endpoints
- `client/src/context/MealPlanContext.jsx` - Fetch from API
- `client/src/context/FavoritesContext.jsx` - Fetch from API
- `client/src/components/Navigation.jsx` - Add user menu

## API Endpoints to Add

### Authentication
```
POST   /api/auth/register     - Create account
POST   /api/auth/login        - Get tokens
POST   /api/auth/refresh      - Refresh access token
POST   /api/auth/logout       - Invalidate tokens
GET    /api/auth/me           - Get current user
```

### User Data
```
GET    /api/favorites/recipes      - List saved recipes
POST   /api/favorites/recipes      - Save recipe
DELETE /api/favorites/recipes/:id  - Remove recipe

GET    /api/favorites/cocktails    - List saved cocktails
POST   /api/favorites/cocktails    - Save cocktail
DELETE /api/favorites/cocktails/:id - Remove cocktail

GET    /api/favorites/side-dishes  - List saved sides
POST   /api/favorites/side-dishes  - Save side dish
DELETE /api/favorites/side-dishes/:id - Remove side dish
```

## Environment Variables

Add to `server/.env`:
```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/meal_planner

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=900
REFRESH_TOKEN_EXPIRY=604800

# Security
CORS_ORIGIN=http://localhost:3000
```

## Migration Strategy

### Phase 1: Backend (Week 1-2)
1. Set up PostgreSQL
2. Create auth service and endpoints
3. Add auth middleware
4. Update existing routes to scope by userId

### Phase 2: Frontend Auth (Week 3-4)
1. Create AuthContext
2. Build Login/Register pages
3. Implement ProtectedRoute
4. Update Navigation

### Phase 3: Data Migration (Week 5-6)
1. Update contexts to use API
2. Refactor storage.js
3. Add data sync mechanisms

### Phase 4: Testing (Week 7)
1. Multi-user testing
2. Security audit
3. Performance testing

## Data Migration for Existing Users

When a user first logs in after the migration:
1. Check if they have localStorage data
2. Prompt to import existing data to their account
3. Migrate meal plans, favorites to database
4. Clear localStorage after successful migration

## Security Checklist

- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] JWT secret is strong (32+ characters)
- [ ] Access tokens are short-lived (15 min)
- [ ] Refresh tokens use httpOnly cookies
- [ ] All API routes verify token
- [ ] CORS configured for specific origins
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
