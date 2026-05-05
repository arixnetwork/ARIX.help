# ARIX.help - AI Platform for Builders

A comprehensive SaaS platform that helps developers, designers, and builders create amazing products with AI-powered assistance, curated resources, and community collaboration.

## Features

### Core Features
- **AI Chat Assistant**: Real-time conversations with Groq AI for coding, design, SEO, and web development questions
- **Resource Library**: Searchable collection of guides, tutorials, and best practices
- **Community Forums**: Connect with other builders, share projects, and get support
- **User Dashboard**: Track your activity, credits usage, and account settings
- **Freemium Model**: Free tier (10 daily queries) and Pro tier (unlimited queries)

### Technical Features
- Modern Next.js 16 app with App Router
- Real-time authentication with Supabase
- PostgreSQL database with Row Level Security
- Streaming AI responses via Groq API
- Responsive dark theme design
- Secure API routes with user validation
- Database triggers for automatic profile creation

## Tech Stack

- **Frontend**: React 19, Next.js 16, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Database**: Supabase PostgreSQL with RLS
- **AI**: Groq API with AI SDK
- **Authentication**: Supabase Auth with email/password
- **Styling**: Tailwind CSS v4 with custom theme
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Supabase project
- Groq API key

### Setup Instructions

1. **Clone and Install**
```bash
git clone <repo-url>
cd arix-help
pnpm install
```

2. **Environment Variables**
Create `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
GROQ_API_KEY=your_groq_key
```

3. **Database Setup**
The database schema is automatically created using Supabase migrations. The following tables are set up:
- `users` - User profiles with subscription tier and credits
- `ai_conversations` - Chat conversation history
- `ai_messages` - Individual messages with token counts
- `resources` - Knowledge base articles and guides
- `forum_posts` - Community discussion threads
- `forum_replies` - Replies to forum posts
- `usage_tracking` - User activity metrics
- `subscription_plans` - Available pricing tiers

4. **Run Development Server**
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── page.tsx                  # Landing page
├── chat/page.tsx            # AI Chat interface
├── resources/page.tsx       # Resource library
├── forum/page.tsx           # Community forums
├── dashboard/page.tsx       # User dashboard
├── auth/
│   ├── login/page.tsx
│   ├── sign-up/page.tsx
│   ├── callback/route.ts
│   └── error/page.tsx
├── api/
│   ├── chat/route.ts        # Chat API endpoint
│   ├── resources/route.ts   # Resources API
│   └── forum/route.ts       # Forums API
└── globals.css              # Global styles with theme
lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── proxy.ts
```

## Features in Detail

### AI Chat
- Real-time streaming responses from Groq
- Credit-based system (10/day for free, unlimited for Pro)
- Persistent conversation history
- Category organization (coding, design, SEO, SaaS, etc.)

### Resource Library
- Full-text search across guides and tutorials
- Category filtering
- View count tracking
- Pagination support

### Community Forums
- Create and participate in discussions
- Category-based organization
- Reply system with nesting support
- Upvote functionality

### User Dashboard
- Activity statistics and metrics
- Subscription management
- Credit tracking
- Quick links to main features

## Authentication Flow

1. User signs up with email/password
2. Supabase creates auth user
3. Trigger automatically creates user profile in `users` table
4. User receives confirmation email
5. After confirmation, user can log in
6. Session persisted via Supabase cookie

## Database Schema Highlights

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Public read access to resources and forum posts
- User-specific write access

### Auto-Profile Creation
Database trigger automatically creates user profile when new user signs up:
- Default free tier subscription
- 10 starting credits
- Generated username if not provided

### Credit System
- Free tier: 10 queries per day
- Pro tier: Unlimited queries
- Tracked via `credits_remaining` in users table
- Daily reset via scheduled job (to be implemented)

## API Endpoints

- `POST /api/chat` - Send message to AI
- `GET /api/resources` - Fetch resources with filtering
- `POST /api/resources` - Create new resource
- `GET /api/forum` - Fetch forum posts
- `POST /api/forum` - Create new forum post

## Deployment

Deploy to Vercel with one click:
```bash
vercel
```

Set environment variables in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

## Next Steps & Improvements

- [ ] Add email verification
- [ ] Implement daily credit reset via cron job
- [ ] Add payment processing (Stripe integration)
- [ ] Build resource/forum detail pages
- [ ] Add image uploads for profiles
- [ ] Implement search analytics
- [ ] Add admin dashboard
- [ ] Create mobile app

## Environment Variables Explained

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key for client-side auth |
| `GROQ_API_KEY` | API key for Groq AI service |

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues or questions:
1. Check the FAQ page
2. Post in community forums
3. Contact support at support@arix.help

## License

MIT License - see LICENSE file for details
