# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization (or create one)
4. Fill in:
   - **Project name**: `meal-planner`
   - **Database password**: Generate a strong password and save it!
   - **Region**: Choose closest to you (e.g., `East US` for US East Coast)
5. Click "Create new project"
6. Wait 2-3 minutes for the project to be ready

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings > API**
2. Note down these values (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: Keep this secret! Used for Edge Functions only

## Step 3: Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned" (this is normal for schema creation)

## Step 4: Enable Email Authentication

1. Go to **Authentication > Providers**
2. Email should already be enabled by default
3. Optional: Configure additional providers (Google, GitHub, etc.)

## Step 5: Configure Email Templates (Optional)

1. Go to **Authentication > Email Templates**
2. Customize the confirmation and magic link emails if desired

## Step 6: Set Up Edge Functions

### Install Supabase CLI

```bash
# Windows (PowerShell)
scoop install supabase

# Or using npm
npm install -g supabase
```

### Login and Link Project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

The project ref is in your Supabase URL: `https://[project-ref].supabase.co`

### Deploy Edge Functions

```bash
# Navigate to the supabase folder
cd supabase

# Deploy all functions
supabase functions deploy generate-meals --no-verify-jwt
supabase functions deploy regenerate-meal --no-verify-jwt
supabase functions deploy add-side-dish --no-verify-jwt
supabase functions deploy add-beverage --no-verify-jwt
supabase functions deploy generate-grocery --no-verify-jwt
```

### Set Environment Variables for Edge Functions

```bash
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Step 7: Test Your Setup

1. Go to **Authentication > Users** and click "Add user"
2. Create a test user with email/password
3. Go to **Table Editor** and verify the `user_preferences` table has a row for the new user
4. Test an Edge Function:

```bash
curl -X POST 'https://[project-ref].supabase.co/functions/v1/generate-meals' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"numberOfMeals": 1, "servings": 4}'
```

## Environment Variables for the App

Create a `.env` file in your app's root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Tables Reference

| Table | Purpose |
|-------|---------|
| `meal_plans` | Stores meal plan configurations |
| `dinners` | Individual meals within a plan |
| `saved_recipes` | User's favorite recipes |
| `saved_cocktails` | User's favorite cocktails |
| `saved_side_dishes` | User's favorite side dishes |
| `grocery_lists` | Generated grocery lists |
| `user_preferences` | User settings (auto-created on signup) |

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- The `service_role` key bypasses RLS - never expose it in client code
- Edge Functions use the `service_role` internally but verify JWT from clients

## Troubleshooting

### "permission denied" errors
- Make sure RLS policies were created (run the SQL again)
- Check that the user is authenticated

### Edge Function timeouts
- Claude API calls can take 10-30 seconds
- Edge Functions have a 60-second timeout by default

### Users can see each other's data
- RLS policies are not enabled - run the migration SQL again
