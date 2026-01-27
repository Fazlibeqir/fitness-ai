# How to Activate Your Supabase Project

If your Supabase project is paused/inactive, here's how to activate it:

## Step 1: Check Project Status

1. Go to [supabase.com](https://supabase.com)
2. Log in to your account
3. Check your project dashboard

You'll see one of these statuses:
- ✅ **Active** - Project is running (green)
- ⏸️ **Paused** - Project is paused (orange/yellow)
- ❌ **Inactive** - Project needs activation

## Step 2: Activate Paused Project

### If Project Shows "Paused":

1. **Click on your project** in the dashboard
2. Look for a **"Restore"** or **"Resume"** button
3. Click it to reactivate your project
4. Wait 1-2 minutes for it to start up

### If No Restore Button:

1. Go to **Project Settings** (gear icon)
2. Look for **"Restore Project"** or **"Resume Project"**
3. Click to activate

## Step 3: Wait for Activation

After clicking restore:
- ⏱️ Wait 1-3 minutes for the project to start
- 🔄 Refresh the dashboard
- ✅ Status should change to "Active"

## Step 4: Verify It's Working

Once active, verify:

1. **Check Project URL:**
   - Go to Settings > API
   - Copy the Project URL
   - It should be: `https://xxxxx.supabase.co`

2. **Test Connection:**
   - The dashboard should load without errors
   - API keys should be visible in Settings > API

3. **Update Your .env:**
   - Make sure your `.env` file has the correct URL
   - Restart your Expo server after updating

## Step 5: Restart Your App

After project is active:

```bash
# Stop your current Expo server (Ctrl+C)
# Then restart
npm start
```

## Common Issues

### "Project Not Found"
- You might be on the wrong account
- Check you're logged into the correct Supabase account
- Verify the project exists in your dashboard

### "Restore Button Not Available"
- Free tier projects can be paused after 7 days of inactivity
- Some projects may need to be recreated
- Check your Supabase plan/limits

### "Still Getting Network Errors"
- Wait a few more minutes after restoring
- Clear Expo cache: `npx expo start -c`
- Double-check your `.env` file has correct URL

## Alternative: Create New Project

If you can't restore the old project:

1. Create a new Supabase project
2. Get the new URL and anon key
3. Update your `.env` file:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://new-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=new-anon-key
   ```
4. Run the database schema again:
   - Go to SQL Editor
   - Run `supabase_schema.sql`
5. Restart Expo server

## Quick Checklist

- [ ] Logged into Supabase dashboard
- [ ] Found your project
- [ ] Clicked "Restore" or "Resume"
- [ ] Waited 1-3 minutes
- [ ] Project status shows "Active"
- [ ] Updated `.env` with correct URL (if changed)
- [ ] Restarted Expo server

## Need Help?

If the project won't activate:
1. Check Supabase status page: [status.supabase.com](https://status.supabase.com)
2. Check your account limits in Settings
3. Consider upgrading if you've hit free tier limits
4. Create a new project if restoration isn't possible
