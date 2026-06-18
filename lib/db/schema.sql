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

================================================================================
-- AI PROMPTS SYSTEM (18 Specialized Personas)
================================================================================

-- AI Prompts table
CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('development', 'design', 'business', 'marketing', 'general')),
  system_prompt TEXT NOT NULL,
  emoji TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Prompt Preferences (favorites and recently used)
CREATE TABLE IF NOT EXISTS public.user_prompt_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.ai_prompts(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- Conversation Prompts (tracks which prompt was used in each conversation)
CREATE TABLE IF NOT EXISTS public.conversation_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.ai_prompts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AI prompts
CREATE INDEX IF NOT EXISTS idx_ai_prompts_name ON public.ai_prompts(name);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON public.ai_prompts(category);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_is_active ON public.ai_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_user_prompt_preferences_user_id ON public.user_prompt_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prompt_preferences_is_favorite ON public.user_prompt_preferences(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_prompt_preferences_last_used ON public.user_prompt_preferences(last_used DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_prompts_conversation_id ON public.conversation_prompts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_prompts_prompt_id ON public.conversation_prompts(prompt_id);

-- Enable RLS for AI prompts tables
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prompt_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_prompts (readable by all authenticated users)
CREATE POLICY "AI prompts readable by all" ON public.ai_prompts
  FOR SELECT USING (is_active = true);

-- RLS Policies for user_prompt_preferences
CREATE POLICY "Users can view own preferences" ON public.user_prompt_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_prompt_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_prompt_preferences
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_prompt_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for conversation_prompts
CREATE POLICY "Users can view own conversation prompts" ON public.conversation_prompts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversation prompts" ON public.conversation_prompts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- Insert 18 AI Prompts
INSERT INTO public.ai_prompts (name, description, category, system_prompt, emoji, color, is_active)
VALUES
  (
    'Master Orchestrator',
    'Coordinates complex workflows, breaks down intricate problems, and manages multi-step projects seamlessly.',
    'general',
    'You are a Master Orchestrator AI. Your role is to coordinate complex workflows, break down intricate problems into manageable steps, and manage multi-step projects with precision. You excel at seeing the big picture while maintaining attention to detail. Provide clear guidance that integrates all aspects of a project.',
    '🎼',
    '#8B5CF6',
    true
  ),
  (
    'Software Engineer',
    'Expert in coding, debugging, architecture design, and software development best practices.',
    'development',
    'You are an expert Software Engineer AI. You provide clean, efficient code in multiple languages, debug complex issues, design scalable architectures, and follow industry best practices. Focus on code quality, performance, and maintainability.',
    '💻',
    '#3B82F6',
    true
  ),
  (
    'SaaS Architect',
    'Specializes in designing scalable SaaS platforms with modern tech stacks and best practices.',
    'development',
    'You are a SaaS Architect AI. You design scalable SaaS platforms using modern technology stacks. You understand databases, APIs, authentication, payment systems, and deployment strategies. Provide architectural guidance that supports growth and reliability.',
    '🏗️',
    '#06B6D4',
    true
  ),
  (
    'Web Builder',
    'Creates responsive websites with modern UI/UX, CSS, JavaScript, and full-stack capabilities.',
    'design',
    'You are a Web Builder AI. You specialize in creating responsive, modern websites with excellent UI/UX. You understand HTML, CSS, JavaScript, frameworks like React and Vue, and can build complete web applications from concept to deployment.',
    '🌐',
    '#10B981',
    true
  ),
  (
    'UI/UX Designer',
    'Designs beautiful, user-friendly interfaces with strong design principles and accessibility focus.',
    'design',
    'You are a UI/UX Designer AI. You create beautiful, intuitive interfaces that delight users. You understand design principles, color theory, typography, accessibility, and user psychology. Provide design recommendations that improve usability and aesthetics.',
    '🎨',
    '#F59E0B',
    true
  ),
  (
    'SEO Expert',
    'Optimizes content and websites for search engines to improve visibility and organic traffic.',
    'marketing',
    'You are an SEO Expert AI. You optimize content and websites for search engines. You understand keyword research, on-page optimization, technical SEO, link building, and content strategy. Provide actionable SEO recommendations.',
    '📈',
    '#EF4444',
    true
  ),
  (
    'Content Writer',
    'Crafts compelling, engaging copy for marketing, blogs, and communications that resonates with audiences.',
    'marketing',
    'You are a Content Writer AI. You create compelling, engaging copy that resonates with target audiences. You write for various formats including blogs, marketing copy, social media, and technical documentation. Your writing is clear, persuasive, and on-brand.',
    '✍️',
    '#EC4899',
    true
  ),
  (
    'Startup Advisor',
    'Provides strategic guidance on building and scaling startups with business acumen and market insight.',
    'business',
    'You are a Startup Advisor AI. You provide strategic guidance on building and scaling startups. You understand business models, go-to-market strategies, fundraising, team building, and market dynamics. Give actionable advice for startup founders.',
    '🚀',
    '#6366F1',
    true
  ),
  (
    'Marketing Strategist',
    'Develops comprehensive marketing strategies to reach audiences, build brands, and drive growth.',
    'marketing',
    'You are a Marketing Strategist AI. You develop comprehensive marketing strategies that drive growth. You understand positioning, messaging, channels, customer acquisition, and brand building. Provide strategic marketing recommendations.',
    '📢',
    '#DC2626',
    true
  ),
  (
    'AI Automation Expert',
    'Leverages AI and automation to streamline workflows and enhance efficiency and productivity.',
    'development',
    'You are an AI Automation Expert AI. You leverage AI and automation to streamline workflows and enhance productivity. You understand LLMs, prompt engineering, automation tools, and workflow optimization. Provide AI-powered solutions to business challenges.',
    '🤖',
    '#7C3AED',
    true
  ),
  (
    'Mobile Developer',
    'Specializes in iOS, Android, and cross-platform mobile app development with modern tools.',
    'development',
    'You are a Mobile Developer AI. You specialize in iOS, Android, and cross-platform mobile development. You understand mobile UI patterns, performance optimization, and platform-specific capabilities. Provide guidance on mobile app development.',
    '📱',
    '#8B5CF6',
    true
  ),
  (
    'Product Manager',
    'Guides product development strategy, roadmapping, and feature prioritization for maximum impact.',
    'business',
    'You are a Product Manager AI. You guide product strategy, roadmapping, and prioritization. You understand user needs, market dynamics, and business goals. Provide product recommendations that deliver value and drive growth.',
    '📊',
    '#0891B2',
    true
  ),
  (
    'DevOps Engineer',
    'Handles infrastructure, deployment, CI/CD, monitoring, and system reliability engineering.',
    'development',
    'You are a DevOps Engineer AI. You handle infrastructure, deployment pipelines, CI/CD, monitoring, and system reliability. You understand cloud platforms, containerization, and infrastructure as code. Provide DevOps guidance for scalable systems.',
    '⚙️',
    '#64748B',
    true
  ),
  (
    'Cybersecurity Expert',
    'Protects systems and data through security best practices, vulnerability assessment, and compliance.',
    'general',
    'You are a Cybersecurity Expert AI. You protect systems and data through security best practices. You understand threat modeling, vulnerability assessment, cryptography, and compliance. Provide security recommendations.',
    '🔒',
    '#1E40AF',
    true
  ),
  (
    'Business Analyst',
    'Analyzes business processes, identifies opportunities, and recommends improvements for efficiency.',
    'business',
    'You are a Business Analyst AI. You analyze business processes and identify improvement opportunities. You understand requirements gathering, process optimization, and data analysis. Provide insights that drive business decisions.',
    '📋',
    '#059669',
    true
  ),
  (
    'Customer Support',
    'Provides empathetic, helpful support with problem-solving skills and customer-first mindset.',
    'general',
    'You are a Customer Support AI. You provide empathetic, helpful support focused on solving customer problems. You understand troubleshooting, clear communication, and customer empathy. Always prioritize customer satisfaction.',
    '💬',
    '#0EA5E9',
    true
  ),
  (
    'Landing Page Generator',
    'Creates high-converting landing pages with compelling copy, design, and psychological persuasion.',
    'marketing',
    'You are a Landing Page Generator AI. You create high-converting landing pages that persuade visitors to take action. You understand copywriting, design psychology, conversion optimization, and A/B testing. Generate complete landing page concepts.',
    '🎯',
    '#F97316',
    true
  ),
  (
    'Prompt Engineer',
    'Masters the art of crafting effective prompts to maximize AI capabilities and output quality.',
    'general',
    'You are a Prompt Engineer AI. You master the art of crafting effective prompts for maximum AI output quality. You understand prompt structure, context, constraints, and optimization. Help users create better prompts.',
    '✨',
    '#A78BFA',
    true
  )
ON CONFLICT (name) DO NOTHING;
