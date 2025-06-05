-- Migration: Create ideas and related tables
-- Timestamp: {{ YYYYMMDDHHMMSS }} (Placeholder for actual timestamp)

-- Ensure the public.update_updated_at_column function exists (created in previous migration)

-- 1. Create public.ideas table
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 250),
    description TEXT NOT NULL CHECK (char_length(description) >= 10),
    submitter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL, -- Or CASCADE if ideas should be deleted with user
    organisation_id UUID, -- For future multi-tenancy
    status TEXT NOT NULL DEFAULT 'Draft', -- Corresponds to IdeaStatusEnum
    clarity_score REAL CHECK (clarity_score IS NULL OR (clarity_score >= 0 AND clarity_score <= 1)),
    value_score REAL CHECK (value_score IS NULL OR (value_score >= 0 AND value_score <= 100)),
    readiness_score REAL CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 1)), -- Placeholder
    effort_selection TEXT, -- Corresponds to EffortLevelKeyEnum
    roi_index REAL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
    -- category_suggestion_loading BOOLEAN, -- UI state, likely not stored in DB
    -- category_suggestion_error TEXT -- UI state, likely not stored in DB
);

COMMENT ON TABLE public.ideas IS 'Stores core information about submitted ideas.';
COMMENT ON COLUMN public.ideas.status IS 'Current lifecycle status of the idea, e.g., Draft, Submitted, Under Screening.';

-- Trigger for updated_at on ideas table
CREATE TRIGGER handle_ideas_updated_at
    BEFORE UPDATE ON public.ideas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create public.idea_tags table
CREATE TABLE IF NOT EXISTS public.idea_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- Corresponds to IdeaCategoryEnum
    source TEXT NOT NULL, -- e.g., "user_manual", "ai_suggested"
    confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_idea_tags_idea_id ON public.idea_tags(idea_id);
COMMENT ON TABLE public.idea_tags IS 'Stores category tags associated with an idea.';

-- 3. Create public.questions table (if storing predefined questions)
-- This table is optional if questions are dynamically generated or sourced from elsewhere.
-- The domain model `Question` has `id: str`. If these are predefined, this table makes sense.
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY, -- e.g., "Q1_PROBLEM", "THEME_A_Q2"
    stage INTEGER, -- 1, 2, 3 from types.ts
    text TEXT NOT NULL,
    category TEXT, -- Corresponds to IdeaCategoryEnum, for category-specific questions
    theme TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.questions IS 'Stores predefined questions for the idea questionnaire.';

-- Trigger for updated_at on questions table
CREATE TRIGGER handle_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create public.idea_answers table
CREATE TABLE IF NOT EXISTS public.idea_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL, -- References public.questions(id) if that table exists and is used
    text TEXT NOT NULL,
    answered_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL -- User who provided the answer
);
CREATE INDEX IF NOT EXISTS idx_idea_answers_idea_id ON public.idea_answers(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_answers_question_id ON public.idea_answers(question_id);
COMMENT ON TABLE public.idea_answers IS 'Stores user answers to questionnaire questions for an idea.';

-- 5. Create public.idea_chat_messages table
CREATE TABLE IF NOT EXISTS public.idea_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Domain model uses str(uuid.uuid4())
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- "user" or "ai", corresponds to SenderTypeEnum
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    for_question_id TEXT, -- References public.questions(id) if applicable
    is_clarification BOOLEAN,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- If sender is "user"
    -- ai_thinks BOOLEAN -- UI state, not stored
    CONSTRAINT check_sender_type CHECK (sender IN ('user', 'ai'))
);
CREATE INDEX IF NOT EXISTS idx_idea_chat_messages_idea_id ON public.idea_chat_messages(idea_id);
COMMENT ON TABLE public.idea_chat_messages IS 'Stores chat history for an idea''s AI interview.';

-- 6. Create public.idea_value_selections table
CREATE TABLE IF NOT EXISTS public.idea_value_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    dimension_key TEXT NOT NULL, -- e.g., "revenue", "cost_saving"
    selected_band_key TEXT NOT NULL, -- e.g., "A", "B"
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_idea_value_selections_idea_id ON public.idea_value_selections(idea_id);
COMMENT ON TABLE public.idea_value_selections IS 'Stores value dimension selections for an idea.';


-- RLS Policies for ideas and related tables

-- public.ideas RLS
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert ideas"
    ON public.ideas FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = submitter_user_id);

CREATE POLICY "Allow submitter to read/update/delete their own draft ideas"
    ON public.ideas FOR ALL -- SELECT, UPDATE, DELETE
    TO authenticated
    USING (auth.uid() = submitter_user_id AND status = 'Draft')
    WITH CHECK (auth.uid() = submitter_user_id AND status = 'Draft');

CREATE POLICY "Allow authenticated users to read non-draft ideas" -- Adjust as needed for visibility
    ON public.ideas FOR SELECT
    TO authenticated
    USING (status != 'Draft');
    -- Consider adding organisation_id checks if multi-tenant

CREATE POLICY "Allow admin to manage all ideas"
    ON public.ideas FOR ALL
    USING (public.is_user_admin(auth.uid())) -- Assumes is_user_admin function from previous migration
    WITH CHECK (public.is_user_admin(auth.uid()));


-- public.idea_tags RLS
ALTER TABLE public.idea_tags ENABLE ROW LEVEL SECURITY;
-- Users can manage tags for ideas they can update (simplified: if they can select the idea, they can see tags)
CREATE POLICY "Allow users to view tags for accessible ideas"
    ON public.idea_tags FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id)); -- RLS on ideas table will apply

CREATE POLICY "Allow users to manage tags for ideas they own (drafts) or admins"
    ON public.idea_tags FOR INSERT, UPDATE, DELETE
    TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.submitter_user_id = auth.uid() AND i.status = 'Draft'))
        OR public.is_user_admin(auth.uid())
    );


-- public.questions RLS (if table is used)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read questions"
    ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin to manage questions"
    ON public.questions FOR ALL USING (public.is_user_admin(auth.uid()));


-- public.idea_answers RLS
ALTER TABLE public.idea_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view answers for accessible ideas"
    ON public.idea_answers FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));

CREATE POLICY "Allow submitter to manage answers for their draft ideas or admins"
    ON public.idea_answers FOR INSERT, UPDATE, DELETE
    TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.submitter_user_id = auth.uid() AND i.status = 'Draft' AND user_id = auth.uid()))
        OR public.is_user_admin(auth.uid())
    );


-- public.idea_chat_messages RLS
ALTER TABLE public.idea_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view chat messages for accessible ideas"
    ON public.idea_chat_messages FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));

CREATE POLICY "Allow submitter to add chat messages for their draft ideas or admins"
    ON public.idea_chat_messages FOR INSERT
    TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.submitter_user_id = auth.uid() AND i.status = 'Draft') AND ( (sender = 'user' AND user_id = auth.uid()) OR sender = 'ai' ) )
        OR (public.is_user_admin(auth.uid()) AND ( (sender = 'user' AND user_id = auth.uid()) OR sender = 'ai' ) )
    );
-- Deletion/Update of chat messages might be restricted further or disallowed.


-- public.idea_value_selections RLS
ALTER TABLE public.idea_value_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view value selections for accessible ideas"
    ON public.idea_value_selections FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));

CREATE POLICY "Allow submitter to manage value selections for their draft ideas or admins"
    ON public.idea_value_selections FOR INSERT, UPDATE, DELETE
    TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.submitter_user_id = auth.uid() AND i.status = 'Draft'))
        OR public.is_user_admin(auth.uid())
    );
