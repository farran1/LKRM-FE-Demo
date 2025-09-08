# Netlify Deployment Guide

## Environment Variables Required

Make sure to set these environment variables in your Netlify dashboard:

### Required Variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)
- `NEXT_PUBLIC_APP_URL` - Your app URL (e.g., https://your-app.netlify.app)
- `NEXT_PUBLIC_USE_PROFILES` - Set to "true" if using profiles
- `NODE_ENV` - Set to "production"

## Build Settings

The following settings are configured in `netlify.toml`:

- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 22

## Key Configuration Files

1. **netlify.toml** - Main Netlify configuration
2. **next.config.ts** - Next.js configuration optimized for Netlify
3. **app/error.tsx** - Custom error page
4. **app/not-found.tsx** - Custom 404 page

## Troubleshooting

### Edge Runtime Issues
- All API routes have `export const runtime = 'nodejs'` to avoid Edge Runtime issues with Supabase
- Supabase client is configured to work with Node.js runtime

### Build Issues
- Make sure all environment variables are set
- Check that Node.js version is 22
- Ensure all dependencies are properly installed

### Deployment Steps
1. Connect your GitHub repository to Netlify
2. Set all required environment variables
3. Deploy - Netlify will use the settings from `netlify.toml`

## Performance Optimizations

- Static assets are cached for 1 year
- Images are optimized and cached
- API routes have no-cache headers
- Security headers are configured
