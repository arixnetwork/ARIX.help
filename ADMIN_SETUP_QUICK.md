# Admin Panel - Quick Setup (5 minutes)

## What You Get

A complete admin panel to manage:
- Users and subscriptions
- AI model configuration
- Website settings
- Pricing plans
- Analytics and reporting
- Role-based access control

---

## 3-Step Setup

### Step 1: Create Database Tables (1 min)

1. Open Supabase dashboard
2. Go to "SQL Editor"
3. Create new query
4. Copy ALL of: `lib/db/schema.sql`
5. Paste into editor
6. Click "RUN"

Done! Tables created.

### Step 2: Promote Your User (1 min)

Run this SQL in Supabase SQL Editor:

```sql
-- Get your user ID
SELECT id, email FROM public.users WHERE email = 'your@email.com' LIMIT 1;

-- Copy the ID and run (replace YOUR_USER_ID):
INSERT INTO public.admin_users (user_id, role_id, assigned_by)
SELECT 
  'YOUR_USER_ID',
  id,
  'YOUR_USER_ID'
FROM public.admin_roles 
WHERE name = 'superadmin'
ON CONFLICT DO NOTHING;
```

### Step 3: Access Admin Panel (1 min)

1. Go to http://localhost:3000/admin
2. Login with your account
3. You're in! Start managing

---

## What You Can Do Now

### Admin Dashboard
- View total users
- See Pro vs Free users
- Track token usage
- Quick access to all features

### User Management
- Search users by email
- View subscription status
- Edit user credits
- Upgrade users to Pro

### AI Models
- Add new AI models
- Enable/disable models
- Set model priority
- Manage API keys

### Website Settings
- Update site name & description
- Add contact information
- Configure social links
- Enable/disable features

### Pricing Plans
- Create subscription tiers
- Set prices and features
- Define monthly credits
- Manage pricing

### Analytics
- Real-time user stats
- Token usage tracking
- Growth metrics
- Activity logs

---

## Access Levels

**Superadmin** (you)
- Full access to everything
- Can promote other admins

**Admin**
- Manage users, models, settings, pricing
- View analytics
- Cannot manage admins

**Moderator**
- View-only access
- Monitor activity
- Cannot make changes

---

## File Locations

Code organized as:
```
app/admin/
  - Dashboard
  - User management
  - Model configuration
  - Settings
  - Pricing
  - Analytics

components/admin/
  - Layout & navigation
  - Role guards

lib/admin/
  - Role definitions
  - Auth helpers

app/api/admin/
  - All admin endpoints
```

---

## Common Tasks

### Add a new AI model
1. Go to `/admin/models`
2. Click "Add Model"
3. Enter name, provider, API key
4. Click "Add Model"

### Create a new pricing tier
1. Go to `/admin/pricing`
2. Click "New Plan"
3. Enter plan details
4. Click "Create Plan"

### Update website settings
1. Go to `/admin/settings`
2. Fill in your information
3. Click "Save Settings"

### Give someone admin access
Run SQL:
```sql
INSERT INTO public.admin_users (user_id, role_id, assigned_by)
VALUES ('USER_ID', (SELECT id FROM public.admin_roles WHERE name = 'admin'), 'YOUR_ID');
```

---

## Verify It Works

After setup, test:
1. Go to `/admin` → Should load dashboard
2. Click "Users" → Should show user list
3. Click "Models" → Should show models
4. Click "Settings" → Should show settings form
5. Check each page loads without errors

All good? You're ready to manage!

---

## Security

All admin actions:
- Require login
- Check permissions
- Are logged for audit
- Protected by database RLS policies
- API keys are encrypted

---

## Next Steps

1. Configure your AI models
2. Set up pricing tiers
3. Customize website settings
4. Promote team members as admins/moderators
5. Monitor analytics

---

## Need Help?

See `ADMIN_PANEL_GUIDE.md` for:
- Detailed documentation
- API reference
- Troubleshooting
- Advanced configuration
