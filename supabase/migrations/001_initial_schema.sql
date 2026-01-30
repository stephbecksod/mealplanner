-- Meal Planner Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MEAL PLANS TABLE
-- Stores the overall meal plan configuration
-- ============================================
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dietary_preferences TEXT[] DEFAULT '{}',
  cuisine_preferences TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_active ON meal_plans(user_id, is_active) WHERE is_active = true;

-- ============================================
-- DINNERS TABLE
-- Stores individual meals within a meal plan
-- ============================================
CREATE TABLE dinners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week TEXT,
  servings INTEGER DEFAULT 4,
  is_a_la_carte BOOLEAN DEFAULT false,
  main_dish JSONB,
  side_dishes JSONB DEFAULT '[]',
  beverage_pairing JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dinners_meal_plan_id ON dinners(meal_plan_id);

-- ============================================
-- SAVED RECIPES (Favorites)
-- ============================================
CREATE TABLE saved_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE UNIQUE INDEX idx_saved_recipes_unique_name ON saved_recipes(user_id, (recipe_data->>'name'));

-- ============================================
-- SAVED COCKTAILS (Favorites)
-- ============================================
CREATE TABLE saved_cocktails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cocktail_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_cocktails_user_id ON saved_cocktails(user_id);
CREATE UNIQUE INDEX idx_saved_cocktails_unique_name ON saved_cocktails(user_id, (cocktail_data->>'name'));

-- ============================================
-- SAVED SIDE DISHES (Favorites)
-- ============================================
CREATE TABLE saved_side_dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  side_dish_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_side_dishes_user_id ON saved_side_dishes(user_id);
CREATE UNIQUE INDEX idx_saved_side_dishes_unique_name ON saved_side_dishes(user_id, (side_dish_data->>'name'));

-- ============================================
-- GROCERY LISTS
-- ============================================
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]',
  manual_items JSONB DEFAULT '[]',
  checked_items TEXT[] DEFAULT '{}',
  include_beverages BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grocery_lists_meal_plan_id ON grocery_lists(meal_plan_id);

-- ============================================
-- USER PREFERENCES
-- ============================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_servings INTEGER DEFAULT 4,
  default_dietary_preferences TEXT[] DEFAULT '{}',
  default_cuisine_preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinners ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cocktails ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_side_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Meal Plans policies
CREATE POLICY "Users can view own meal plans" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plans" ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plans" ON meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Dinners policies
CREATE POLICY "Users can view own dinners" ON dinners
  FOR SELECT USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own dinners" ON dinners
  FOR INSERT WITH CHECK (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own dinners" ON dinners
  FOR UPDATE USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own dinners" ON dinners
  FOR DELETE USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

-- Saved Recipes policies
CREATE POLICY "Users can view own saved recipes" ON saved_recipes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved recipes" ON saved_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved recipes" ON saved_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Saved Cocktails policies
CREATE POLICY "Users can view own saved cocktails" ON saved_cocktails
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved cocktails" ON saved_cocktails
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved cocktails" ON saved_cocktails
  FOR DELETE USING (auth.uid() = user_id);

-- Saved Side Dishes policies
CREATE POLICY "Users can view own saved side dishes" ON saved_side_dishes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved side dishes" ON saved_side_dishes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved side dishes" ON saved_side_dishes
  FOR DELETE USING (auth.uid() = user_id);

-- Grocery Lists policies
CREATE POLICY "Users can view own grocery lists" ON grocery_lists
  FOR SELECT USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own grocery lists" ON grocery_lists
  FOR INSERT WITH CHECK (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own grocery lists" ON grocery_lists
  FOR UPDATE USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own grocery lists" ON grocery_lists
  FOR DELETE USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

-- User Preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grocery_lists_updated_at
  BEFORE UPDATE ON grocery_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user preferences on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
