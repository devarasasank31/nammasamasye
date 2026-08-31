# Deployment

## Free-First Deployment Options

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Option 2: Cloudflare Pages

```bash
# Build
npm run build

# Deploy via Cloudflare dashboard or Wrangler
npx wrangler pages deploy .next
```

## Supabase Setup

1. Create project at https://supabase.com
2. Go to SQL Editor
3. Run `src/database/schema.sql`
4. Copy URL and keys to environment variables
5. (Optional) Run `npx tsx src/database/seed.ts` for demo data

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Post-Deployment

1. Verify anonymous session creation
2. Test incident creation flow
3. Test admin dashboard access
4. Verify community analytics
5. Test all four languages

## Custom Domain

Configure custom domain in your hosting provider's dashboard.
Update `NEXT_PUBLIC_APP_URL` accordingly.
