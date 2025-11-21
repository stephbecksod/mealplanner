# Quick Start Guide

**Phase 1 MVP is CODE COMPLETE!** Follow these steps to get the app running.

## Prerequisites
- Node.js 18+ installed
- Anthropic API key ([get one here](https://console.anthropic.com/))

## Setup (5 minutes)

### 1. Install Dependencies
```bash
# Install all packages at once
npm run install-all

# OR install individually:
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Configure API Key
```bash
cd server
copy .env.example .env
```

Edit `server/.env` and add your API key:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
PORT=5000
NODE_ENV=development
```

### 3. Start the App
```bash
# From project root
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 4. Open Browser
Navigate to **http://localhost:3000**

---

## First Test Run

1. On home page, select **3 dinners**
2. Choose serving size: **4**
3. Select dietary preferences (optional)
4. Select cuisines (optional)
5. Click **Generate Meal Plan**
6. Wait 10-20 seconds for AI to generate recipes
7. View your meal plan on "This Week" page
8. Check the grocery list on the right
9. Try clicking "View Recipe" on a meal
10. Try saving a recipe to favorites (star icon)

---

## Troubleshooting

### Server won't start
- Check if port 5000 is already in use
- Verify API key is correct in server/.env
- Check server console for errors

### Frontend won't load
- Check if port 3000 is already in use
- Verify backend is running on port 5000
- Clear browser cache

### Recipes not generating
- Check API key has credits at console.anthropic.com
- Check server console for API errors
- Verify internet connection
- Try with fewer meals (1 instead of 5)

---

## What's Implemented

✅ Generate 1-5 dinners with dietary/cuisine preferences
✅ Auto-generated categorized grocery lists
✅ Save favorite recipes
✅ Search favorites
✅ Add favorites to meal plan
✅ Regenerate individual meals
✅ Remove meals from plan
✅ Interactive grocery checklist
✅ All data persists in browser (localStorage)

## What's Next (Future Phases)

🔲 Beverage pairings (cocktails + wine)
🔲 Ingredient overlap optimization
🔲 Enhanced serving size adjustments
🔲 Multi-user support with database

---

## File Reference

- **CHECKPOINT.md** - Complete implementation status and resuming guide
- **PROJECT_PLAN.md** - Full feature roadmap with all phases
- **CLAUDE.md** - Development guide and architecture
- **README.md** - User documentation

---

## Need Help?

1. Read CHECKPOINT.md for detailed status
2. Check CLAUDE.md troubleshooting section
3. Review browser console for errors
4. Review server console for API issues
5. Clear localStorage: Open browser console and run `localStorage.clear()`

---

**You're ready to go! The app is fully coded and waiting to be tested.** 🚀
