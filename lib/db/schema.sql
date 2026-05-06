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

================================================================================
-- ADMIN PANEL TABLES
================================================================================

-- Admin Roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('superadmin', 'admin', 'moderator')),
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users table (tracks which users have admin access)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Website Settings table
CREATE TABLE IF NOT EXISTS public.website_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.users(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Model Configs table
CREATE TABLE IF NOT EXISTS public.ai_model_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('groq', 'openai', 'anthropic', 'google', 'grok', 'deepinfra')),
  api_key_hash TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  rate_limit INTEGER DEFAULT 100,
  cost_per_1k_tokens DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Pricing Tiers table
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2),
  monthly_credits INTEGER NOT NULL,
  yearly_credits INTEGER,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Admin Logs table (audit trail)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin tables
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON public.admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_website_settings_key ON public.website_settings(key);
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_enabled ON public.ai_model_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_priority ON public.ai_model_configs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_active ON public.pricing_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON public.admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource_type ON public.admin_logs(resource_type, resource_id);

-- Enable Row Level Security (RLS) for admin tables
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_roles (read-only for admins)
CREATE POLICY "Admin roles readable by admins" ON public.admin_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for admin_users (only superadmin can manage)
CREATE POLICY "Admin users readable by admins" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
      AND ar.name = 'superadmin'
    )
  );

CREATE POLICY "Admin users insertable by superadmin" ON public.admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
      AND ar.name = 'superadmin'
    )
  );

-- RLS Policies for website_settings (admins can read, superadmin/admin can update)
CREATE POLICY "Website settings readable by all" ON public.website_settings
  FOR SELECT USING (true);

CREATE POLICY "Website settings updatable by admins" ON public.website_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
      AND ar.name IN ('superadmin', 'admin')
    )
  );

-- RLS Policies for ai_model_configs (admins can read, superadmin/admin can modify)
CREATE POLICY "AI model configs readable by admins" ON public.ai_model_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "AI model configs updatable by admins" ON public.ai_model_configs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
      AND ar.name IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "AI model configs insertable by superadmin" ON public.ai_model_configs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
      AND ar.name = 'superadmin'
    )
  );

-- RLS Policies for pricing_tiers (admins can read, admins can modify)
CREATE POLICY "Pricing tiers readable by admins" ON public.pricing_tiers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Pricing tiers updatable by admins" ON public.pricing_tiers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
      AND ar.name IN ('superadmin', 'admin')
    )
  );

-- RLS Policies for admin_logs (admins can read their own logs)
CREATE POLICY "Admin logs readable by admins" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin logs insertable by admins" ON public.admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Create function to auto-update admin timestamps
CREATE OR REPLACE FUNCTION public.update_admin_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for admin timestamps
DROP TRIGGER IF EXISTS trigger_update_admin_roles ON public.admin_roles;
CREATE TRIGGER trigger_update_admin_roles
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_timestamps();

DROP TRIGGER IF EXISTS trigger_update_ai_model_configs ON public.ai_model_configs;
CREATE TRIGGER trigger_update_ai_model_configs
  BEFORE UPDATE ON public.ai_model_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_timestamps();

DROP TRIGGER IF EXISTS trigger_update_pricing_tiers ON public.pricing_tiers;
CREATE TRIGGER trigger_update_pricing_tiers
  BEFORE UPDATE ON public.pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_timestamps();

-- Insert default admin roles
INSERT INTO public.admin_roles (name, description, permissions)
VALUES 
  ('superadmin', 'Full system access', '["users:view","users:edit","users:delete","models:view","models:edit","models:add","models:delete","settings:edit","pricing:manage","analytics:view","admin:manage","logs:view"]'::jsonb),
  ('admin', 'Manage users, models, settings', '["users:view","users:edit","models:view","models:edit","settings:edit","pricing:manage","analytics:view","logs:view"]'::jsonb),
  ('moderator', 'View and limited user management', '["users:view","models:view","analytics:view","logs:view"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

================================================================================
-- ADVANCED CHAT FEATURES TABLES
================================================================================

-- Chat User Preferences (theme, model defaults, etc.)
CREATE TABLE IF NOT EXISTS public.chat_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  default_model TEXT,
  temperature DECIMAL(3, 2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2048,
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  message_density TEXT DEFAULT 'comfortable' CHECK (message_density IN ('compact', 'comfortable', 'spacious')),
  show_token_count BOOLEAN DEFAULT true,
  auto_save_drafts BOOLEAN DEFAULT true,
  enable_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Metadata (tags, starred, pinned)
CREATE TABLE IF NOT EXISTS public.conversation_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  model_used TEXT,
  temperature_used DECIMAL(3, 2),
  total_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Reactions (emoji reactions on messages)
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.ai_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Conversation Search Index
CREATE TABLE IF NOT EXISTS public.conversation_search (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  search_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared Conversations
CREATE TABLE IF NOT EXISTS public.shared_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  share_type TEXT NOT NULL DEFAULT 'link' CHECK (share_type IN ('link', 'email')),
  expire_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for chat features
CREATE INDEX IF NOT EXISTS idx_chat_preferences_user_id ON public.chat_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metadata_user_id ON public.conversation_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metadata_is_favorite ON public.conversation_metadata(is_favorite);
CREATE INDEX IF NOT EXISTS idx_conversation_metadata_is_pinned ON public.conversation_metadata(is_pinned);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_search_user_id ON public.conversation_search(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_search_text ON public.conversation_search USING GIN(to_tsvector('english', search_text));
CREATE INDEX IF NOT EXISTS idx_shared_conversations_share_token ON public.shared_conversations(share_token);

-- Enable RLS for chat feature tables
ALTER TABLE public.chat_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_search ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_preferences
CREATE POLICY "Users can view own preferences" ON public.chat_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.chat_preferences
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.chat_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for conversation_metadata
CREATE POLICY "Users can view own metadata" ON public.conversation_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own metadata" ON public.conversation_metadata
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own metadata" ON public.conversation_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions" ON public.message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_messages m
      WHERE m.id = message_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions" ON public.message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for conversation_search
CREATE POLICY "Users can search own conversations" ON public.conversation_search
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search" ON public.conversation_search
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for shared_conversations
CREATE POLICY "Users can view own shares" ON public.shared_conversations
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own shares" ON public.shared_conversations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Create triggers for timestamps
DROP TRIGGER IF EXISTS trigger_update_chat_preferences ON public.chat_preferences;
CREATE TRIGGER trigger_update_chat_preferences
  BEFORE UPDATE ON public.chat_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversations_updated_at();

DROP TRIGGER IF EXISTS trigger_update_conversation_metadata ON public.conversation_metadata;
CREATE TRIGGER trigger_update_conversation_metadata
  BEFORE UPDATE ON public.conversation_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversations_updated_at();
