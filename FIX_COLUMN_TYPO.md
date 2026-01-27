# Fix Column Typo Error

## Error Message
```
Could not find the 'average_seleep_hours' column of 'profiles' in the schema cache
```

## Problem
The database column might have been created with a typo (`average_seleep_hours` instead of `average_sleep_hours`), or Supabase's schema cache is outdated.

## Solution

### Option 1: Run the Fix SQL (Recommended)

1. Go to **Supabase Dashboard → SQL Editor**
2. Open `fix_column_typo.sql` file
3. Copy and paste the entire contents
4. Click **Run**
5. This will:
   - Check if the typo column exists and rename it
   - Ensure the correct column exists
   - Show you what was fixed

### Option 2: Manual Fix in Supabase

1. Go to **Supabase Dashboard → Table Editor**
2. Click on **profiles** table
3. Check if you see `average_seleep_hours` (with double 'e')
4. If it exists:
   - Click on the column
   - Rename it to `average_sleep_hours`
5. If `average_sleep_hours` doesn't exist:
   - Click "Add Column"
   - Name: `average_sleep_hours`
   - Type: `numeric`
   - Default: `7`
   - Required: Yes

### Option 3: Clear Schema Cache

Sometimes Supabase caches the schema. Try:

1. **Refresh the Supabase Dashboard**
2. **Wait a few minutes** for cache to clear
3. **Restart your Expo app**

### Option 4: Recreate the Column

If the above doesn't work, run this SQL:

```sql
-- Drop the typo column if it exists
ALTER TABLE profiles DROP COLUMN IF EXISTS average_seleep_hours;

-- Ensure correct column exists with proper type
ALTER TABLE profiles 
DROP COLUMN IF EXISTS average_sleep_hours;

ALTER TABLE profiles 
ADD COLUMN average_sleep_hours NUMERIC NOT NULL DEFAULT 7;
```

## Verify the Fix

After running the fix, verify:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%sleep%';
```

You should see:
- `average_sleep_hours` (correct spelling)
- Type: `numeric`
- Nullable: `NO`

## After Fixing

1. **Restart your Expo server:**
   ```bash
   # Stop (Ctrl+C)
   npm start
   ```

2. **Clear app cache** (if on device):
   - Close and reopen Expo Go
   - Or reload the app (shake device → Reload)

3. **Test the app** - the error should be gone!

## Prevention

The `supabase_schema.sql` file has the correct spelling. Always use that file when setting up the database to avoid typos.
