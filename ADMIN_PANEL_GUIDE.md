# ARIX.help - Complete Admin Panel System

## Overview

Your admin panel is now fully functional with complete role-based access control, user management, AI model configuration, website settings, pricing management, and analytics dashboard.

---

## What's Been Built

### Database Layer (7 new tables)
- `admin_roles` - Define admin roles (Superadmin, Admin, Moderator)
- `admin_users` - Track which users have admin access
- `website_settings` - Global website configuration
- `ai_model_configs` - AI model management
- `pricing_tiers` - Subscription plans
- `admin_logs` - Audit trail for all admin actions
- Full Row Level Security (RLS) policies on all tables

### API Endpoints (6 endpoints)
- POST `/api/admin/auth/check-role` - Verify admin access
- GET/PUT `/api/admin/users` - User management
- GET/POST/PUT `/api/admin/models` - AI model configuration
- GET/PUT `/api/admin/settings` - Website settings
- GET/POST/PUT `/api/admin/pricing` - Pricing management
- GET `/api/admin/analytics` - Analytics data

### Admin Pages (6 pages)
- `/admin` - Dashboard with stats
- `/admin/users` - User management and credits
- `/admin/models` - AI model configuration
- `/admin/settings` - Website settings editor
- `/admin/pricing` - Pricing tier management
- `/admin/analytics` - Analytics dashboard

### Components
- `AdminLayout` - Main layout with sidebar
- `AdminSidebar` - Role-based navigation
- `AdminNav` - Header with search
- `RoleGuard` - Route protection

---

## Setup Instructions

### Step 1: Run Database Schema (REQUIRED)
1. Go to Supabase SQL Editor
2. Copy entire contents of: `lib/db/schema.sql`
3. Paste into SQL editor
4. Click "RUN"

This creates all admin tables and RLS policies.

### Step 2: Promote First User to Superadmin

Run this SQL in Supabase:

```sql
-- First, get a user ID from your users table
SELECT id, email FROM public.users LIMIT 1;

-- Copy the user ID and run:
INSERT INTO public.admin_users (user_id, role_id, assigned_by, assigned_at)
SELECT 
  'YOUR_USER_ID_HERE',
  id,
  'YOUR_USER_ID_HERE',
  NOW()
FROM public.admin_roles 
WHERE name = 'superadmin'
ON CONFLICT DO NOTHING;
```

### Step 3: Access Admin Panel
1. Go to http://localhost:3000/admin
2. Login with your superadmin account
3. You're in! Start managing

---

## Role-Based Access Control

### Superadmin
- Full access to everything
- Can manage other admin users
- Can add/remove AI models
- Can edit website settings
- Can manage pricing
- Can view analytics and logs

### Admin
- Manage users and subscriptions
- Configure existing AI models
- Edit website settings
- Manage pricing tiers
- View analytics
- Cannot manage other admins

### Moderator
- View-only access
- Can see users and analytics
- Cannot make any changes
- Good for monitoring and support staff

---

## How to Use Each Module

### User Management (`/admin/users`)
- View all users with their subscription tier and credits
- Search for users by email
- Edit user credits
- Upgrade users to Pro tier
- All changes are logged

```bash
Admin can:
- View all users
- Edit credits
- Manage subscription tiers
```

### AI Model Settings (`/admin/models`)
- View all configured AI models
- Add new models (requires Superadmin)
- Toggle models on/off
- Set model priority
- Manage API keys (hashed for security)

Add a new model:
1. Click "Add Model"
2. Enter model name, provider, API key
3. Save
4. Model is immediately available

Supported providers:
- Groq
- OpenAI
- Anthropic
- Google
- Grok
- DeepInfra

### Website Settings (`/admin/settings`)
Configure site properties:
- **Website**: Site name, description, contact email
- **Social Links**: Twitter, GitHub, LinkedIn, Discord URLs
- **Features**: Enable/disable registration, analytics, maintenance mode

All settings are live immediately after save.

### Pricing & Plans (`/admin/pricing`)
- View all subscription tiers
- Create new plans
- Edit existing plans
- Set default plan
- Define features per tier

Create a plan:
1. Click "New Plan"
2. Enter plan name, price, monthly credits
3. Add features (comma-separated)
4. Save

### Analytics Dashboard (`/admin/analytics`)
Real-time statistics:
- Total users count
- Pro vs Free user breakdown
- Total tokens used
- User growth trends
- Token usage trends
- Recent activity log

Data refreshes every 30 seconds automatically.

---

## File Structure

```
app/admin/
├── page.tsx                    # Dashboard
├── users/page.tsx             # User management
├── models/page.tsx            # AI models
├── settings/page.tsx          # Website settings
├── pricing/page.tsx           # Pricing tiers
└── analytics/page.tsx         # Analytics

components/admin/
├── AdminLayout.tsx            # Main layout
├── AdminSidebar.tsx           # Navigation
├── AdminNav.tsx               # Header
└── RoleGuard.tsx              # Route protection

lib/admin/
├── roles.ts                   # Role definitions
├── auth.ts                    # Admin auth helpers
└── db/admin-queries.ts        # Database operations

app/api/admin/
├── auth/check-role/route.ts   # Role verification
├── users/route.ts             # User endpoints
├── models/route.ts            # Model endpoints
├── settings/route.ts          # Settings endpoints
├── pricing/route.ts           # Pricing endpoints
└── analytics/route.ts         # Analytics endpoints
```

---

## Security Features

### Row Level Security (RLS)
- Users can only see their own data
- Admins can only see what their role permits
- Database enforces all security rules

### Admin Action Logging
Every admin action is logged with:
- Who performed the action
- What action was taken
- What resource was affected
- When it happened
- Success/failure status

View logs: Check `public.admin_logs` table

### Permission Checking
- All endpoints verify user role
- Permission checking happens before any data access
- Unauthorized access returns 403 error

### API Key Security
- API keys are hashed before storage
- Only hash is stored in database
- Masked in admin UI (shows only first 8 chars)

---

## API Endpoint Reference

### Check Admin Role
```bash
POST /api/admin/auth/check-role

Response:
{
  "isAdmin": true,
  "role": "superadmin",
  "userId": "...",
  "email": "admin@example.com"
}
```

### List Users
```bash
GET /api/admin/users?search=email&limit=50&offset=0

Response:
{
  "users": [...],
  "total": 100
}
```

### Update User
```bash
PUT /api/admin/users

Body:
{
  "userId": "...",
  "credits": 50,
  "subscription_tier": "pro"
}
```

### List AI Models
```bash
GET /api/admin/models

Response:
[
  {
    "id": "...",
    "model_name": "GPT-4",
    "provider": "openai",
    "enabled": true,
    "priority": 1
  }
]
```

### Add AI Model
```bash
POST /api/admin/models

Body:
{
  "modelName": "GPT-4",
  "provider": "openai",
  "apiKey": "sk-...",
  "parameters": {}
}
```

### Get Website Settings
```bash
GET /api/admin/settings

Response:
{
  "site_name": "ARIX.help",
  "site_description": "...",
  "contact_email": "..."
}
```

### Update Setting
```bash
PUT /api/admin/settings

Body:
{
  "key": "site_name",
  "value": "New Site Name"
}
```

### List Pricing Tiers
```bash
GET /api/admin/pricing

Response:
[
  {
    "id": "...",
    "tier_name": "Pro",
    "price_monthly": 9.99,
    "monthly_credits": 1000,
    "features": ["Feature 1", "Feature 2"]
  }
]
```

### Get Analytics
```bash
GET /api/admin/analytics

Response:
{
  "total_users": 150,
  "pro_users": 30,
  "free_users": 120,
  "total_tokens_used": 50000
}
```

---

## Common Tasks

### Promote a User to Admin
```sql
INSERT INTO public.admin_users (user_id, role_id, assigned_by)
SELECT 
  'USER_ID',
  id,
  'YOUR_USER_ID'
FROM public.admin_roles 
WHERE name = 'admin'
ON CONFLICT DO NOTHING;
```

### Add a New Pricing Tier
1. Go to `/admin/pricing`
2. Click "New Plan"
3. Fill in details
4. Click "Create Plan"

### Disable an AI Model
1. Go to `/admin/models`
2. Find the model
3. Click "Disable"

### Update Website Settings
1. Go to `/admin/settings`
2. Fill in your settings
3. Click "Save Settings"

### View Admin Activity Logs
```sql
SELECT * FROM public.admin_logs
ORDER BY created_at DESC
LIMIT 100;
```

---

## Troubleshooting

### Can't access admin panel
- Verify you're logged in
- Check if your user is in `admin_users` table
- Verify role is assigned correctly

### "Insufficient permissions" error
- Check your role in `admin_users` table
- Verify action is allowed for your role
- Superadmin can do everything

### Models not showing
- Verify models are in `ai_model_configs` table
- Check if `enabled = true`
- Refresh the page

### Settings changes not saving
- Check browser console for errors
- Verify you have `settings:edit` permission
- Check network tab for failed requests

### Database schema not created
- Run `lib/db/schema.sql` in Supabase SQL Editor
- Verify all tables were created
- Check for any error messages

---

## Best Practices

1. **Backup before major changes**
   - Export your database regularly
   - Test changes in development first

2. **Use appropriate roles**
   - Give moderators view-only access
   - Give admins edit access
   - Reserve superadmin for few people

3. **Monitor admin logs**
   - Review `admin_logs` table regularly
   - Look for unusual activity
   - Audit sensitive changes

4. **Rotate API keys**
   - Update AI model API keys regularly
   - Remove disabled models completely
   - Never commit keys to git

5. **Test changes**
   - Create test users before deploying
   - Test each admin feature
   - Verify RLS policies work

---

## Advanced Configuration

### Custom Roles
To create a custom role, add to `admin_roles` table:

```sql
INSERT INTO public.admin_roles (name, description, permissions)
VALUES (
  'custom_role',
  'Description',
  '["users:view","models:view"]'::jsonb
);
```

### Audit Specific Users
```sql
SELECT * FROM public.admin_logs
WHERE resource_id = 'USER_ID'
ORDER BY created_at DESC;
```

### Export Analytics Data
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as new_users,
  SUM(tokens_used) as tokens_used
FROM public.usage_tracking
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Next Steps

1. Run database schema
2. Promote first user to superadmin
3. Access admin panel at `/admin`
4. Configure AI models
5. Set up pricing tiers
6. Customize website settings
7. Monitor analytics

---

## Support

Everything is production-ready. All admin actions are:
- Logged for audit
- Protected by RLS
- Validated on both client and server
- Rate limited for security

Admin panel is fully functional and ready to manage your site!
