-- Add cooking equipment preferences to user_preferences table
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql

-- Add cooking_equipment column with default values (oven and stovetop checked)
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS cooking_equipment TEXT[] DEFAULT '{"oven", "stovetop"}';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_cooking_equipment
ON user_preferences USING GIN(cooking_equipment);

-- Comment explaining the valid equipment values
COMMENT ON COLUMN user_preferences.cooking_equipment IS
'Available equipment: oven, stovetop, grill, air_fryer, instant_pot, slow_cooker, sous_vide, smoker, dutch_oven, wok';
