# MindHaven - Mental Health & Psychotherapy Platform

A modern, compassionate platform for mental health support featuring AI-powered companionship, therapy journey tracking, and admin tools for managing assessments and resources.

## Features

### User Features

- **Landing Page**: Beautiful marketing site showcasing therapy offerings
- **Secure Authentication**: Email-based authentication with Supabase Auth
- **AI Chatbot Companion**: Conversational AI that remembers user context and history
- **Self-Reflection Surveys**: Complete assessments with scoring and recommendations
- **Survey History**: Track your mental health journey over time
- **Journal & Mood Tracking**: Daily reflection and mood logging
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### Admin Features

- **Admin Dashboard**: Overview of platform statistics and user activity
- **Survey Management**: Create, edit, and configure surveys
- **Dynamic Question Builder**: Add questions with different types (text, scale, multiple choice)
- **Scoring Configuration**: Set custom scoring rules and recommendations
- **Insights Management**: Create and publish educational articles for users
- **Role-Based Access Control**: Secure admin routes with role verification

### Technical Highlights

- **AI Chatbot Memory**: Stores conversation history and user context for personalized interactions
- **Row-Level Security**: All database tables protected with RLS policies
- **Real-Time Updates**: Optional Supabase Realtime integration for live features
- **Responsive UI**: Mobile-first design with Tailwind CSS
- **Type-Safe**: Full TypeScript for reliability and developer experience

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### Local Development

```bash
# Clone the repository
git clone <your-repo>
cd mindhavenplatform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Apply database migrations
# 1. Go to Supabase dashboard
# 2. Copy the migration from: supabase/migrations/20260508051100_add_surveys_and_admin_features.sql
# 3. Paste and run in SQL Editor

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## Project Structure

```
├── src/
│   ├── routes/               # Page components & routes
│   │   ├── index.tsx        # Landing page
│   │   ├── auth.tsx         # Authentication page
│   │   ├── dashboard.tsx    # Dashboard layout
│   │   ├── dashboard/*.tsx  # Dashboard pages
│   │   ├── admin/           # Admin routes
│   │   └── admin/**/*.tsx   # Admin pages
│   ├── components/           # Reusable components
│   │   ├── ui/              # Base UI components
│   │   ├── admin/           # Admin-specific components
│   │   └── ScorePopup.tsx   # Survey score modal
│   ├── lib/                  # Utilities & helpers
│   │   ├── auth.tsx         # Auth context
│   │   └── chatbotMemory.ts # Memory management
│   ├── integrations/
│   │   └── supabase/        # Supabase setup
│   └── styles.css           # Global styles
├── supabase/
│   └── migrations/          # Database migrations
├── .env.local               # Local env variables
├── package.json             # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
└── DEPLOYMENT.md           # Deployment guide
```

## Core Pages

### Public Routes

- `/` - Landing page with therapy info
- `/auth` - Sign up / Sign in

### User Routes (Protected)

- `/dashboard` - User home
- `/dashboard/surveys` - Complete surveys, view history
- `/dashboard/chatbot` - AI companion chat
- `/dashboard/journal` - Journal entries
- `/dashboard/mood` - Mood tracking

### Admin Routes (Role-Protected)

- `/admin` - Dashboard overview
- `/admin/surveys` - Survey management
- `/admin/surveys/create` - Create new survey
- `/admin/surveys/{id}/edit` - Edit survey
- `/admin/surveys/{id}/scoring` - Configure scoring
- `/admin/insights` - Manage articles
- `/admin/insights/create` - Create new insight
- `/admin/insights/{id}/edit` - Edit insight

## Database Schema

### Key Tables

**surveys**
- id: UUID (primary)
- admin_id: UUID (foreign key to Profiles)
- title: text
- description: text
- is_active: boolean
- created_at, updated_at: timestamps

**survey_questions**
- id: UUID
- survey_id: UUID (foreign key)
- question_text: text
- question_type: enum ('text', 'scale', 'multiple_choice')
- is_optional: boolean
- question_order: integer

**survey_responses**
- id: UUID
- user_id: UUID (foreign key to Profiles)
- survey_id: UUID (foreign key)
- response_data: JSONB (stores answers)
- response_date: timestamp

**survey_history**
- id: UUID
- user_id: UUID (foreign key)
- survey_id: UUID (foreign key)
- total_score: integer
- recommendations: text
- survey_date: timestamp

**chatbot_memory**
- id: UUID
- user_id: UUID (unique, foreign key)
- conversation_history: JSONB (array of messages)
- user_context: JSONB (profile, survey history, preferences)
- created_at, updated_at: timestamps

**admin_insights**
- id: UUID
- admin_id: UUID (foreign key)
- title: text
- content: text
- category: text
- published: boolean
- created_at, updated_at: timestamps

## Authentication & Authorization

### Supabase Auth

- Email/password authentication
- Session management with secure cookies
- Auth context provider for React components

### Role-Based Access Control

Users have a `role` in the `Profiles` table:
- `'user'` - Default role for all users
- `'admin'` - Required to access admin panel

All admin routes check user role before rendering.

## AI Chatbot Memory System

The chatbot stores:

1. **Conversation History**: All user/assistant messages with timestamps
2. **User Context**:
   - Profile summary (name, age)
   - Completed surveys (score, date, recommendations)
   - Key discussion topics
   - User preferences

The system uses this context to:
- Reference past conversations naturally
- Provide personalized, contextual support
- Offer recommendations based on survey results
- Remember user preferences and concerns

### Chatbot Memory API

```typescript
import { 
  getChatbotMemory,
  updateChatbotMemory,
  loadUserContext,
  buildSystemPrompt 
} from '@/lib/chatbotMemory'

// Fetch user's conversation history and context
const memory = await getChatbotMemory(userId)

// Load and build AI system prompt with user context
const userContext = await loadUserContext(userId)
const systemPrompt = buildSystemPrompt(userContext)

// Save conversation to memory
await updateChatbotMemory(userId, {
  role: 'assistant',
  content: 'Your message...',
  timestamp: new Date().toISOString()
})

// Clear memory (privacy)
await clearChatbotMemory(userId)
```

## Survey System

### Creating a Survey

1. Go to `/admin/surveys` (must be admin)
2. Click **New Survey**
3. Add title, description
4. Add questions (text, scale 1-5, multiple choice)
5. Mark questions as optional if needed
6. Click **Create Survey**
7. Configure scoring in **Config** tab

### Taking a Survey

1. Go to `/dashboard/surveys`
2. Click survey to open
3. Answer all required questions
4. Click **Submit**
5. View score popup with recommendations
6. See survey in history

### Survey Scoring

- Score is sum of scale responses (0-100 range)
- Recommendations are configured by admin
- All users see same recommendation (basic scoring)
- History tracks all completions with scores

## Development

### Stack

- **Framework**: TanStack Start (React meta-framework)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui + custom Radix UI
- **Forms**: React Hook Form
- **Language**: TypeScript
- **Runtime**: Vite + Node.js

### Key Dependencies

```json
{
  "@tanstack/react-router": "Latest",
  "@tanstack/react-start": "Latest",
  "@supabase/supabase-js": "^2.105.1",
  "react": "^19.2.0",
  "tailwindcss": "^4.2.1",
  "sonner": "^2.0.7",
  "zod": "^3.24.2"
}
```

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

## API Endpoints

### Chat API

Endpoint: `/functions/v1/chat` (Supabase Edge Function)

```bash
POST /functions/v1/chat
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY>

{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "Hello" }
  ]
}
```

Returns: Server-sent event stream with AI response

### RLS Protected Endpoints

All Supabase table queries are protected by RLS:
- Users can only see their own data
- Admins can see specific admin data
- Survey questions are public (read-only)
- Active surveys are visible to all users

## Security

### RLS Policies

- **survey_responses**: Users see only their responses
- **survey_history**: Users see only their history
- **chatbot_memory**: Users see only their memory
- **admin_insights**: Only published insights are visible
- **surveys**: Only active surveys visible to users
- **survey_questions**: Public read access

### Best Practices

1. Never commit environment variables
2. Use RLS for all data access control
3. Validate all user input
4. Use prepared statements (Supabase handles this)
5. Regular security audits
6. Monitor admin actions

## Performance Optimization

- Server-side rendering where possible
- Image optimization with Vercel Image Optimization
- Database query optimization with indexes
- Conversation pruning (keep last 50 messages)
- Pagination for large datasets
- CDN caching for static assets

## Monitoring & Logging

### Vercel Analytics

- Deployment logs
- Build times
- Runtime errors
- API response times

### Supabase Monitoring

- Database queries and performance
- RLS policy violations
- Connection pooling status
- Backup status

## Contribution Guidelines

1. Create feature branch from `main`
2. Make changes and test locally
3. Run linter: `npm run lint`
4. Commit with clear messages
5. Create pull request with description
6. Code review before merge to main

## Licensing

This project is proprietary software. All rights reserved.

## Support

For issues and questions:
1. Check GitHub Discussions
2. Review DEPLOYMENT.md for common issues
3. Contact support team

## Roadmap

- [ ] Advanced survey scoring with multiple ranges
- [ ] Therapist matching algorithm
- [ ] Video call integration
- [ ] Mobile app (React Native)
- [ ] Insurance integration
- [ ] Appointment scheduling
- [ ] Integration with EHR systems
- [ ] Peer support community

---

Built with care for mental health. Made with Next.js, Supabase, and Tailwind CSS.
