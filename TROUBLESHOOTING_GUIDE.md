# Troubleshooting Guide

## Current Status ✅
- **Event filtering is working** - Game and Scrimmage events should now display
- **Supabase join is fixed** - Events now have proper event type information
- **Most params errors are fixed** - Dynamic routes updated to Next.js 15 syntax

## Remaining Issues

### 1. TypeError: Cannot assign to read only property 'params'

**Cause:** Next.js caching or development server state issue

**Solutions (try in order):**

1. **Quick fix - Clear Next.js cache:**
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

2. **Full reset:**
   ```powershell
   # Stop dev server (Ctrl+C)
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules
   npm install
   npm run dev
   ```

3. **Browser cache:**
   - Hard refresh (Ctrl+Shift+R)
   - Clear browser cache
   - Try incognito mode

### 2. GET http://localhost:3000/live-stat-tracker 500 (Internal Server Error)

**Possible Causes:**
- Environment variables missing
- Database connection issues
- Supabase configuration

**Solutions:**

1. **Check environment variables:**
   - Make sure `.env.local` exists with:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

2. **Check console logs:**
   - Open browser DevTools
   - Check Console and Network tabs for detailed error messages

3. **Restart development server:**
   ```powershell
   # Stop server (Ctrl+C)
   npm run dev
   ```

## What's Working ✅

1. **Event filtering** - Only Game and Scrimmage events show in live stat tracker
2. **Database queries** - Events are properly fetched with event type information
3. **Dynamic routes** - All route pages use correct Next.js 15 syntax
4. **Supabase integration** - Manual join fallback ensures event types are populated

## Next Steps

If issues persist:
1. Check browser console for specific error messages
2. Check terminal/server logs for backend errors
3. Verify Supabase credentials and database connectivity
4. Try accessing `/api/events` directly to test API functionality

