# Plan Tab - What Should Show & Fixes

## What the Plan Tab Should Display

When you complete onboarding and go to the Plan tab, you should see:

### 1. **Daily Nutrition Plan**
- Calories per day (e.g., 2000 kcal)
- Protein (grams)
- Carbs (grams)
- Fat (grams)

### 2. **Training Schedule**
- List of all training days (Monday, Tuesday, etc.)
- Each day shows:
  - Day name and focus (e.g., "Monday — Upper Body")
  - List of exercises with:
    - Exercise name
    - Sets × Reps
    - Rest time
  - "Start [Day] Session" button

### 3. **Action Buttons**
- View Calendar & Export
- Weekly Review
- Monthly Review

## The Problem (FIXED)

### Issue 1: Date Mismatch
**Problem:**
- Onboarding saved plan with **today's date** (e.g., if you completed on Tuesday, it saved Tuesday's date)
- Plan tab looked for **Sunday's date** (start of week)
- These didn't match → "No plan found"

**Fix:**
- Updated onboarding to calculate and save the **week start (Sunday)** date
- Updated plan tab to also look for the most recent plan if current week's plan doesn't exist

### Issue 2: No Fallback
**Problem:**
- If no plan found for current week, it just showed "No plan found"
- Even if you had a plan from last week

**Fix:**
- Plan tab now checks for current week's plan first
- If not found, it gets the most recent plan
- Added refresh button to manually reload

## Notification Warning Explanation

The warning you see:
```
WARN  expo-notifications: Android Push notifications...
```

**This is NOT an error!** It's just a warning that:
- ✅ Your scheduled notifications (weekly/monthly reviews, session reminders) **WILL WORK** in Expo Go
- ❌ Only remote push notifications (from a server) don't work in Expo Go
- ✅ Everything will work perfectly in a production build

**You can safely ignore this warning!**

## How to Test

1. **Complete onboarding** - Fill out all steps
2. **Go to Plan tab** - You should see:
   - Your nutrition plan
   - Your weekly training schedule
   - All training days with exercises
3. **If you see "No plan found":**
   - Click "Refresh" button
   - Or go back and complete onboarding again
   - Check that the plan was saved in Supabase

## Troubleshooting

### Still seeing "No plan found"?

1. **Check Supabase:**
   - Go to Supabase Dashboard → Table Editor → `training_plans`
   - Check if a row exists with your `user_id`
   - Check the `week_start` date

2. **Try refreshing:**
   - Pull down on the Plan tab to refresh
   - Or click the "Refresh" button

3. **Re-run onboarding:**
   - Go to Profile → Edit Profile
   - This will regenerate your plan

## What's Fixed

✅ Onboarding now saves plan with correct week_start (Sunday)
✅ Plan tab looks for current week's plan
✅ Plan tab falls back to most recent plan if current week not found
✅ Added pull-to-refresh functionality
✅ Added manual refresh button
✅ Better error handling

The plan should now load correctly after completing onboarding!
