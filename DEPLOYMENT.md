# Arix Platform - Deployment Guide

## Quick Start Deployment

### Prerequisites
- Node.js 18+ installed
- Vercel account created
- GitHub repository connected
- Supabase project set up
- Stripe account (optional, for payments)

### 1-Click Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy the project
vercel
```

## Environment Variables Setup

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Stripe (optional)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI APIs (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

### Setting Variables in Vercel

```bash
# Via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
# ... repeat for all variables

# Or via Dashboard
# 1. Go to vercel.com → Your Project
# 2. Settings → Environment Variables
# 3. Add each variable with scope (Production/Preview/Development)
```

## Database Setup

### 1. Create Supabase Project

```bash
# Go to supabase.com and create project
# Note your project URL and service key
```

### 2. Run Initial Schema

```bash
# Create a SQL file with the schema
# Run in Supabase SQL Editor:

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tables as per ARIX_PLATFORM_STATUS.md schema
-- Run the full schema from the provided SQL
```

### 3. Enable Row-Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables

-- Create RLS policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Add more policies as needed
```

### 4. Setup Authentication

```bash
# In Supabase Dashboard:
# 1. Go to Authentication → Providers
# 2. Enable Email
# 3. Configure email templates if needed
# 4. Set redirect URLs:
#    - http://localhost:3000 (development)
#    - https://your-domain.com (production)
```

## Vercel Deployment Configuration

### 1. Create vercel.json

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "nodeVersion": "18.x"
}
```

### 2. Configure Build Settings

In Vercel Dashboard → Project Settings → Build & Development Settings:
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 3. Configure Environment Variables

Add all variables listed above in:
Vercel Dashboard → Settings → Environment Variables

Set scope:
- `Production`: For live site
- `Preview`: For branch previews
- `Development`: For local development (optional)

## Deployment Workflow

### Development
```bash
npm run dev
# Visit http://localhost:3000
```

### Staging (Preview)
```bash
# Push to any branch except main
git push origin feature-branch
# Vercel automatically creates preview deployment
# Preview URL appears in GitHub PR checks
```

### Production
```bash
# Merge to main/master branch
git merge feature-branch
git push origin main
# Vercel automatically deploys to production
```

### Manual Deployment
```bash
vercel --prod
```

## Custom Domain Setup

### Add Domain to Vercel

1. Go to Vercel Dashboard → Your Project
2. Settings → Domains
3. Enter your domain name
4. Choose verification method:
   - Nameserver (recommended)
   - CNAME record

### Redirect URLs Update

After connecting domain, update in Supabase:

```
Authentication → URL Configuration:
- Site URL: https://your-domain.com
- Redirect URLs:
  - https://your-domain.com
  - https://your-domain.com/auth/callback
```

## Database Backup & Recovery

### Automatic Backups

Supabase provides daily backups by default. To verify:

```bash
# Login to Supabase Dashboard
# Database → Backups
# View available backup points
```

### Manual Backup

```bash
# Export database
pg_dump postgresql://user:password@db.url/postgres > backup.sql

# Restore from backup
psql postgresql://user:password@db.url/postgres < backup.sql
```

### Point-in-Time Recovery

In Supabase Dashboard:
1. Database → Backups
2. Select backup point
3. Click "Restore to new project"

## Monitoring & Analytics

### Setup Application Monitoring

```bash
# Install monitoring tools
npm install @vercel/analytics

# In layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Configure Logging

```bash
# Vercel provides logs at:
# Vercel Dashboard → Your Project → Deployments → [Deployment] → Logs

# View locally
vercel logs
```

### Error Tracking (Optional)

```bash
npm install @sentry/nextjs

# Configure in next.config.js
const withSentryConfig = require("@sentry/nextjs/config");

module.exports = withSentryConfig(
  nextConfig,
  {
    org: "your-org",
    project: "arix-platform",
  }
);
```

## Performance Optimization

### Image Optimization

Images are automatically optimized by Next.js:
- Served in modern formats (WebP, AVIF)
- Lazy loaded by default
- Responsive sizing

### Caching Strategy

Headers in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, s-maxage=3600"
        }
      ]
    }
  ]
}
```

### Enable Compression

Vercel automatically enables:
- Gzip compression
- Brotli compression for modern browsers
- Asset optimization

## Continuous Integration

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Rollback Instructions

If deployment has critical issues:

```bash
# View deployment history
vercel list

# Rollback to previous version
vercel rollback

# Or manually deploy previous commit
git checkout <previous-commit-hash>
npm run build
vercel --prod
```

## Cost Estimation

### Monthly Costs (Approximate)

| Service | Usage | Cost |
|---------|-------|------|
| Vercel | 100k requests/month | ~$20 |
| Supabase | 100GB storage | ~$50 |
| Stripe | 100 transactions | ~2.9% + $0.30 |
| OpenAI API | 1M tokens | ~$0.002 per 1K tokens |
| **Total** | | ~$75-150/month |

### Cost Optimization Tips

1. Use Vercel free tier initially (up to 100GB bandwidth)
2. Start with Supabase free tier (1GB storage, 2GB bandwidth)
3. Batch AI API calls to reduce token usage
4. Cache responses where possible
5. Optimize database queries

## Troubleshooting Deployments

### Issue: Build fails
```bash
# Check build logs
vercel logs --tail

# Verify environment variables
vercel env list

# Clear cache and rebuild
vercel --force
```

### Issue: 500 errors in production
```bash
# Check server logs
vercel logs [deployment-id]

# Verify environment variables are set
# Check database connectivity
# Review recent changes
```

### Issue: Database connection timeout
```bash
# Verify Supabase URL and keys are correct
# Check network access list in Supabase
# Ensure service role key is used for server operations
```

## Security Checklist

- [ ] All environment variables set in Vercel
- [ ] Database backup verified
- [ ] SSL certificate enabled (automatic)
- [ ] Rate limiting configured
- [ ] CORS headers configured
- [ ] XSS protection enabled
- [ ] CSRF protection implemented
- [ ] Regular security updates scheduled
- [ ] Audit logs enabled
- [ ] Secrets rotation scheduled

## Post-Deployment Monitoring

### Daily Checks
- [ ] No error alerts
- [ ] Response time normal
- [ ] Database connections healthy
- [ ] API usage within limits

### Weekly Checks
- [ ] Review analytics
- [ ] Check cost trends
- [ ] Update dependencies if needed
- [ ] Backup verification

### Monthly Checks
- [ ] Performance review
- [ ] Security audit
- [ ] Update release notes
- [ ] Plan feature releases
