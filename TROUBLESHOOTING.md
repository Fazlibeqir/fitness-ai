# Troubleshooting Guide

## Network Request Failed Error

If you see `[TypeError: Network request failed]`, follow these steps:

### 1. Check Environment Variables

Make sure your `.env` file exists and contains valid values:

```bash
# Check if .env exists
ls -la .env

# View contents (don't share these publicly!)
cat .env
```

Your `.env` should have:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_OPENROUTER_API_KEY=your-openrouter-key-here
```

### 2. Verify Supabase URL Format

- ✅ Correct: `https://xxxxx.supabase.co`
- ❌ Wrong: `http://xxxxx.supabase.co` (missing 's')
- ❌ Wrong: `xxxxx.supabase.co` (missing https://)

### 3. Restart Expo Server

After changing `.env` file, you MUST restart the server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm start
```

Or clear cache and restart:
```bash
npx expo start -c
```

### 4. Check Supabase Project Status

1. Go to [supabase.com](https://supabase.com)
2. Check if your project is active
3. Verify your project URL matches what's in `.env`

### 5. Test Network Connection

The error might be due to:
- No internet connection
- Firewall blocking requests
- VPN issues
- Supabase project paused (free tier)

### 6. Check Console Logs

Look for error messages in the terminal that might indicate:
- "Missing Supabase environment variables" → Fix `.env` file
- "Network request failed" → Check internet/Supabase status
- CORS errors → Check Supabase project settings

### 7. Verify Database Setup

Make sure you've run the SQL schema:
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase_schema.sql`
3. Verify tables were created

### 8. Test Supabase Connection

You can test if Supabase is accessible by checking:
- Supabase Dashboard loads in browser
- Project status shows "Active"
- API keys are correct in Settings > API

## Common Solutions

### Solution 1: Recreate .env File
```bash
# Remove old .env
rm .env

# Copy example
cp .env.example .env

# Edit with your actual keys
nano .env  # or use your editor
```

### Solution 2: Clear Expo Cache
```bash
npx expo start -c
```

### Solution 3: Reinstall Dependencies
```bash
rm -rf node_modules
npm install
npm start
```

### Solution 4: Check Platform-Specific Issues

**iOS Simulator:**
- Make sure you're on the same network
- Try `npm run ios` instead of scanning QR

**Android Emulator:**
- Check emulator network settings
- Try `npm run android`

**Web Browser:**
- Check browser console for CORS errors
- Try `npm run web`

## Still Having Issues?

1. Check the exact error message in terminal
2. Verify all environment variables are set
3. Ensure Supabase project is active
4. Try accessing Supabase Dashboard in browser
5. Check if other apps can make network requests

## Quick Debug Checklist

- [ ] `.env` file exists
- [ ] Environment variables are set correctly
- [ ] Supabase URL starts with `https://`
- [ ] Expo server restarted after `.env` changes
- [ ] Internet connection is working
- [ ] Supabase project is active
- [ ] Database schema is set up
- [ ] No typos in environment variable names
