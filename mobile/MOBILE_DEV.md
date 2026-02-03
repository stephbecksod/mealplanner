# Mobile App Development Guide

## Overview
React Native mobile app using Expo (SDK 54) located in the `mobile/` directory.

## Starting the Development Server

### Quick Start (Tunnel Mode - Recommended for Physical Devices)
```bash
cd mobile
npx expo start --tunnel --port 19000
```

### Getting the Expo Go URL

**Important**: The newer Expo CLI doesn't display a web-based QR code page. The QR code only shows in the terminal, which may not render properly in all environments.

#### Method 1: Extract URL from Metro Server
After starting with `--tunnel`, query the Metro server to get the tunnel hostname:
```bash
curl -s http://localhost:19000 | grep -o '"hostUri":"[^"]*"'
```
This returns something like: `"hostUri":"uybyjrg-anonymous-19000.exp.direct"`

The full Expo URL is: `exp://[hostUri-value]`
Example: `exp://uybyjrg-anonymous-19000.exp.direct`

#### Method 2: Generate QR Code Manually
Once you have the tunnel URL, generate a scannable QR code:
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=exp://YOUR-TUNNEL-URL
```
Example:
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=exp://uybyjrg-anonymous-19000.exp.direct
```

#### Method 3: Enter URL Manually in Expo Go
1. Open Expo Go app on your phone
2. Tap "Enter URL manually"
3. Enter: `exp://[your-tunnel-hostname]`

### URL Format Reference

| Mode | URL Format | Example |
|------|------------|---------|
| Tunnel | `exp://[random]-[project]-[port].exp.direct` | `exp://uybyjrg-anonymous-19000.exp.direct` |
| LAN | `exp://[local-ip]:[port]` | `exp://192.168.4.101:19000` |
| Localhost | `exp://localhost:[port]` | `exp://localhost:19000` |

**Note**: LAN mode (`exp://192.168.x.x:port`) often doesn't work due to firewall/network issues. Tunnel mode is more reliable for physical device testing.

## Common Issues

### Port Already in Use
If you see "Port X is being used by another process", either:
1. Use a different port: `npx expo start --tunnel --port 19000`
2. Kill existing processes: Check `netstat -ano | findstr ":808"` to find PIDs

### QR Code Not Scanning
- The terminal QR code may not render correctly in some environments
- Use the manual QR code generation method above
- Or enter the URL manually in Expo Go

### Tunnel Not Connecting
- Ensure you have internet connectivity
- Try restarting with `npx expo start --tunnel --clear`
- The tunnel service (exp.direct) occasionally has issues; wait and retry

## Project Configuration

Key files:
- `app.json` - Expo configuration (slug: `nom-nom-plan`, projectId configured)
- `.env` - Supabase credentials (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)
- `app/` - File-based routing (Expo Router)

## Environment Variables

Required in `mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features

The mobile app has feature parity with the web app:

### Meal Plan Screen
- View all meals in the weekly plan
- **View Recipe**: Tap any meal to see full recipe details in a modal
- **Favorite**: Star button to save recipes, cocktails, and side dishes
- **Add Side Dish**: Generate AI side dish for any meal
- **Add Cocktail**: Generate AI cocktail pairing
- **Add Wine Pairing**: Generate AI wine recommendation
- **Remove Items**: Remove individual sides, cocktails, or wine from meals
- **Regenerate Meal**: Get a new AI-generated meal
- **Add Another Meal**: Add a new meal to the plan (day picker)

### Favorites Screen
- Three tabs: Recipes, Cocktails, Sides
- **View Details**: Tap any item to see full details in a modal
- **Add to Plan**: Add saved recipes directly to your meal plan
- **Remove**: Remove items from favorites

### Detail Modals
- **RecipeDetailModal**: Full recipe with ingredients, instructions, dietary info
- **SideDishDetailModal**: Side dish details with pairing reason
- **BeverageDetailModal**: Cocktail recipe or wine description with pairing notes

## Building for Production

See Expo documentation for EAS Build:
```bash
npx eas build --platform ios
npx eas build --platform android
```
