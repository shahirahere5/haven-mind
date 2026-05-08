# MindHaven Platform - Deployment Guide

This guide covers deploying the MindHaven psychotherapy platform to Vercel with full database, authentication, and admin functionality.

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub account with the repository connected
- Supabase project set up with the database schema applied

## Step 1: Database Setup

### 1.1 Apply Migrations to Supabase

The new database schema for surveys, admin insights, and chatbot memory is defined in:
```
supabase/migrations/20260508051100_add_surveys_and_admin_features.sql
```

To apply the migration:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire content of the migration file and paste it
5. Click **Run** to apply all changes

This creates the following tables with RLS policies:
- `surveys` - Survey definitions
- `survey_questions` - Survey questions
- `survey_responses` - User survey responses
- `survey_scoring_config` - Scoring rules per survey
- `survey_history` - User survey completion history
- `chatbot_memory` - Conversation history and user context
- `admin_insights` - Articles and insights for users

### 1.2 Verify Profiles Table

The existing `Profiles` table should have a `role` column (either 'user' or 'admin').
If not, add it:

```sql
ALTER TABLE public."Profiles" ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
```

## Step 2: Environment Variables

Set these environment variables in your Vercel project settings (**Settings > Environment Variables**):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

These are already defined in `.env` - Vercel will use them automatically.

## Step 3: Create Admin Users

After deployment, you need to manually set admin roles. In Supabase SQL Editor:

```sql
UPDATE public."Profiles" 
SET role = 'admin' 
WHERE id = 'user-uuid-here';
```

Replace `user-uuid-here` with the actual user UUID from the `auth.users` table.

## Step 4: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Select your GitHub repository
3. Vercel will automatically detect it's a TanStack Start project
4. Keep default settings (Build Command: `npm run build`, Output Directory: `.output`)
5. Add environment variables from Step 2
6. Click **Deploy**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 5: Post-Deployment

### 5.1 Test Core Features

1. **Authentication**: Sign up and log in at `/auth`
2. **User Dashboard**: Access `/dashboard` after logging in
3. **Surveys**: Go to `/dashboard/surveys` to take surveys
4. **Chatbot**: Access `/dashboard/chatbot` for AI companion
5. **Admin Panel**: Go to `/admin` (must have admin role)

### 5.2 Add Admin Role to Your User

In Supabase SQL Editor, update your user profile:

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Set admin role (replace the UUID)
UPDATE public."Profiles" 
SET role = 'admin' 
WHERE id = 'your-user-uuid';
```

### 5.3 Create First Survey

1. Go to `/admin/surveys`
2. Click **New Survey**
3. Add survey title, description, and questions
4. Click **Create Survey**
5. Configure scoring rules in **Surveys > Config**
6. Activate survey by toggling visibility

## Architecture Overview

### User-Facing Features

- **Landing Page** (`/`): Marketing site with therapy journey info
- **Authentication** (`/auth`): Sign up/sign in with Supabase Auth
- **Dashboard** (`/dashboard`): User home with journal, mood, surveys
- **Surveys** (`/dashboard/surveys`): Complete surveys with scoring and history
- **Chatbot** (`/dashboard/chatbot`): AI companion with conversation memory
- **Insights** (`/insights`): Public articles created by admins

### Admin Features

- **Admin Dashboard** (`/admin`): Statistics and overview
- **Survey Management** (`/admin/surveys`): Create, edit, delete surveys
- **Survey Builder** (`/admin/surveys/create`): Dynamic question builder
- **Scoring Config** (`/admin/surveys/{id}/scoring`): Set scoring rules
- **Insights Management** (`/admin/insights`): Create/publish articles

### Backend

- **Supabase**: PostgreSQL database with RLS security
- **Authentication**: Supabase Auth with email
- **API Functions**: Supabase Edge Functions for chat API
- **Real-time**: Optional Supabase Realtime for live features

## Security Checklist

- [ ] Database RLS policies are active on all tables
- [ ] Admin routes check user role in middleware
- [ ] Supabase anon key has restricted permissions
- [ ] HTTPS enforced (Vercel default)
- [ ] Environment variables not committed to git (.env in .gitignore)
- [ ] Regular backups configured in Supabase
- [ ] Sensitive data (conversation history) properly encrypted at rest

## Performance Optimization

### For Faster Load Times

1. Enable CDN caching on Vercel (default)
2. Use Supabase connection pooling
3. Compress images and assets
4. Implement pagination for large datasets

### Monitoring

- Vercel Analytics: Check build times and performance
- Supabase Monitoring: Track database queries and performance
- Error tracking: Set up error logging (optional: Sentry)

## Troubleshooting

### Issue: "RLS policy violation" errors

**Solution**: Verify that:
1. Migrations were applied completely
2. User has correct role in Profiles table
3. Table RLS policies are enabled
4. User is authenticated

### Issue: Admin routes redirect to dashboard

**Solution**: Check that:
1. User profile has `role = 'admin'` in database
2. Role column exists in Profiles table
3. Migrations were fully applied

### Issue: Surveys not appearing for users

**Solution**: Verify that:
1. Surveys have `is_active = true`
2. Questions are created for the survey
3. RLS policy allows public read on survey_questions

### Issue: Chatbot memory not persisting

**Solution**: Check that:
1. chatbot_memory table exists
2. User ID is correctly passed to memory functions
3. Supabase connection is working

## Scaling Recommendations

As your user base grows:

1. **Database**: Upgrade Supabase plan for higher connection limits
2. **Functions**: Consider pre-warming for faster AI responses
3. **Caching**: Implement Redis for session/cache (Upstash)
4. **CDN**: Ensure images are optimized and cached
5. **Monitoring**: Set up comprehensive error tracking

## Maintenance

### Regular Tasks

- **Weekly**: Monitor error logs and user reports
- **Monthly**: Review database performance and queries
- **Quarterly**: Update dependencies and security patches
- **Annually**: Review architecture and scalability needs

### Backup Strategy

- Supabase: Automatic daily backups (set retention period)
- Environment variables: Securely stored in Vercel
- Code: GitHub repository with protected main branch

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **TanStack Start**: https://tanstack.com/start/latest
- **MindHaven Issues**: Check GitHub discussions

## Next Steps

After deployment:

1. Create your first survey
2. Add admin users who can manage surveys
3. Create insights/articles for users
4. Test end-to-end user flow
5. Set up monitoring and alerts
6. Plan ongoing feature development
