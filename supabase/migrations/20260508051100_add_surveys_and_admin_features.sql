-- Create surveys table
CREATE TABLE IF NOT EXISTS public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create survey_questions table
CREATE TABLE IF NOT EXISTS public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text DEFAULT 'text' CHECK (question_type IN ('text', 'scale', 'multiple_choice')),
  question_order integer,
  is_optional boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  response_data jsonb,
  response_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create survey_scoring_config table
CREATE TABLE IF NOT EXISTS public.survey_scoring_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL UNIQUE REFERENCES public.surveys(id) ON DELETE CASCADE,
  min_score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 100,
  recommendation_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create survey_history table
CREATE TABLE IF NOT EXISTS public.survey_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  total_score integer,
  survey_date timestamp with time zone DEFAULT now(),
  recommendations text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create chatbot_memory table
CREATE TABLE IF NOT EXISTS public.chatbot_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  user_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create admin_insights table
CREATE TABLE IF NOT EXISTS public.admin_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_surveys_admin_id ON public.surveys(admin_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON public.survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_history_user_id ON public.survey_history(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_history_survey_id ON public.survey_history(survey_id);
CREATE INDEX IF NOT EXISTS idx_admin_insights_admin_id ON public.admin_insights(admin_id);

-- Enable RLS on all new tables
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for surveys table
CREATE POLICY "Users can view active surveys" ON public.surveys
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage their surveys" ON public.surveys
  FOR ALL USING (auth.uid() = admin_id OR (SELECT role FROM public."Profiles" WHERE id = auth.uid()) = 'admin');

-- RLS Policies for survey_questions table
CREATE POLICY "Users can view survey questions" ON public.survey_questions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage survey questions" ON public.survey_questions
  FOR ALL USING (
    (SELECT role FROM public."Profiles" WHERE id = auth.uid()) = 'admin' AND
    survey_id IN (SELECT id FROM public.surveys WHERE admin_id = auth.uid() OR (SELECT role FROM public."Profiles" WHERE id = auth.uid()) = 'admin')
  );

-- RLS Policies for survey_responses table
CREATE POLICY "Users see their own responses" ON public.survey_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their responses" ON public.survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses" ON public.survey_responses
  FOR SELECT USING ((SELECT role FROM public."Profiles" WHERE id = auth.uid()) = 'admin');

-- RLS Policies for survey_scoring_config table
CREATE POLICY "Users can view scoring configs" ON public.survey_scoring_config
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage scoring configs" ON public.survey_scoring_config
  FOR ALL USING ((SELECT role FROM public."Profiles" WHERE id = auth.uid()) = 'admin');

-- RLS Policies for survey_history table
CREATE POLICY "Users see their own history" ON public.survey_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their history" ON public.survey_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all history" ON public.survey_history
  FOR SELECT USING ((SELECT role FROM public."Profiles" WHERE id = auth.uid()) = 'admin');

-- RLS Policies for chatbot_memory table
CREATE POLICY "Users see their own memory" ON public.chatbot_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their memory" ON public.chatbot_memory
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for admin_insights table
CREATE POLICY "Users can view published insights" ON public.admin_insights
  FOR SELECT USING (published = true);

CREATE POLICY "Admins can manage insights" ON public.admin_insights
  FOR ALL USING (auth.uid() = admin_id OR (SELECT role FROM public."Profiles" WHERE id = auth.uid()) = 'admin');
