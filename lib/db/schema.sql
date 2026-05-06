-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  credits_remaining INTEGER NOT NULL DEFAULT 10,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  tokens_used_today INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'code', 'design', 'seo', 'saas', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'ai_query',
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON public.ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON public.usage_tracking(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for ai_conversations table
CREATE POLICY "Users can view own conversations" ON public.ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.ai_conversations
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_messages table
CREATE POLICY "Users can view own messages" ON public.ai_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.ai_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for usage_tracking table
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to auto-update users.updated_at
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users.updated_at
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_users_updated_at();

-- Create function to auto-update conversations.updated_at
CREATE OR REPLACE FUNCTION public.update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversations.updated_at
DROP TRIGGER IF EXISTS trigger_update_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversations_updated_at();
