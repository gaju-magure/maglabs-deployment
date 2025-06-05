-- Migration: Create organizations and evaluation related tables
-- Timestamp: {{ YYYYMMDDHHMMSS }} (Placeholder for actual timestamp)

-- 1. Create public.organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.organizations IS 'Tenant organizations for multi-tenancy.';

-- Trigger for updated_at on organizations table
CREATE TRIGGER handle_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add foreign keys to existing tables
ALTER TABLE public.users
    ADD CONSTRAINT fk_users_organisation
    FOREIGN KEY (organisation_id) REFERENCES public.organizations(id);

ALTER TABLE public.ideas
    ADD CONSTRAINT fk_ideas_organisation
    FOREIGN KEY (organisation_id) REFERENCES public.organizations(id);

-- 3. Create public.responses table
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_theme_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    response_text TEXT,
    response_value_band TEXT,
    response_effort_point TEXT,
    response_attachments JSONB,
    responded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_responses_idea_id ON public.responses(idea_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON public.responses(question_id);
COMMENT ON TABLE public.responses IS 'User responses to structured questions.';

CREATE TRIGGER handle_responses_updated_at
    BEFORE UPDATE ON public.responses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create public.response_scores table
CREATE TABLE IF NOT EXISTS public.response_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    response_id UUID REFERENCES public.responses(id) ON DELETE CASCADE,
    score_type TEXT NOT NULL,
    score_value_numeric REAL,
    score_value_text TEXT,
    scored_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    scored_by_agent_id TEXT,
    score_rationale TEXT,
    scored_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_response_scores_idea_id ON public.response_scores(idea_id);
CREATE INDEX IF NOT EXISTS idx_response_scores_response_id ON public.response_scores(response_id);
COMMENT ON TABLE public.response_scores IS 'Scores for questionnaire responses.';

CREATE TRIGGER handle_response_scores_updated_at
    BEFORE UPDATE ON public.response_scores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create public.idea_value_assessments table
CREATE TABLE IF NOT EXISTS public.idea_value_assessments (
    idea_id UUID PRIMARY KEY REFERENCES public.ideas(id) ON DELETE CASCADE,
    value_band_selections JSONB,
    effort_points_selection TEXT,
    calculated_roi_index REAL,
    normalized_value_score REAL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.idea_value_assessments IS 'Aggregated value assessment for an idea.';
CREATE TRIGGER handle_idea_value_assessments_updated_at
    BEFORE UPDATE ON public.idea_value_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create public.idea_quality_metrics table
CREATE TABLE IF NOT EXISTS public.idea_quality_metrics (
    idea_id UUID PRIMARY KEY REFERENCES public.ideas(id) ON DELETE CASCADE,
    ai_completeness_score REAL,
    ai_clarity_score REAL,
    overall_quality_score REAL,
    quality_history JSONB,
    ai_interview_log JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.idea_quality_metrics IS 'Quality metrics for an idea submission.';
CREATE TRIGGER handle_idea_quality_metrics_updated_at
    BEFORE UPDATE ON public.idea_quality_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create public.evaluation_rubrics table
CREATE TABLE IF NOT EXISTS public.evaluation_rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    applicable_categories TEXT[],
    applicable_stage TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.evaluation_rubrics IS 'Collection of criteria used to evaluate ideas.';
CREATE TRIGGER handle_evaluation_rubrics_updated_at
    BEFORE UPDATE ON public.evaluation_rubrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create public.evaluation_criteria table
CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rubric_id UUID NOT NULL REFERENCES public.evaluation_rubrics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    weight REAL CHECK (weight >= 0 AND weight <= 1),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_rubric_id ON public.evaluation_criteria(rubric_id);
COMMENT ON TABLE public.evaluation_criteria IS 'Criteria items for evaluation rubrics.';
CREATE TRIGGER handle_evaluation_criteria_updated_at
    BEFORE UPDATE ON public.evaluation_criteria
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create public.evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    rubric_id UUID NOT NULL REFERENCES public.evaluation_rubrics(id) ON DELETE CASCADE,
    evaluator_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    scores_per_criterion JSONB NOT NULL,
    overall_score REAL,
    overall_comments TEXT,
    recommendation TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evaluations_idea_id ON public.evaluations(idea_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_rubric_id ON public.evaluations(rubric_id);
COMMENT ON TABLE public.evaluations IS 'Submitted evaluations for ideas.';
CREATE TRIGGER handle_evaluations_updated_at
    BEFORE UPDATE ON public.evaluations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create public.workflow_events table
CREATE TABLE IF NOT EXISTS public.workflow_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    agent_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflow_events_idea_id ON public.workflow_events(idea_id);
COMMENT ON TABLE public.workflow_events IS 'Lifecycle events for ideas.';

-- 11. Create public.smart_contract_logs table
CREATE TABLE IF NOT EXISTS public.smart_contract_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_target TEXT NOT NULL,
    metric_actual TEXT NOT NULL,
    is_met BOOLEAN,
    checked_at TIMESTAMPTZ DEFAULT now(),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_smart_contract_logs_idea_id ON public.smart_contract_logs(idea_id);
COMMENT ON TABLE public.smart_contract_logs IS 'SMART metric check logs for ideas.';

-- RLS Policies

-- public.organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage organizations" ON public.organizations FOR ALL USING (public.is_user_admin(auth.uid())) WITH CHECK (public.is_user_admin(auth.uid()));

-- public.responses
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view responses for accessible ideas" ON public.responses FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));
CREATE POLICY "Allow submitter to manage responses for their draft ideas or admins" ON public.responses FOR INSERT, UPDATE, DELETE TO authenticated USING ( (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.submitter_user_id = auth.uid() AND i.status = 'Draft' AND user_id = auth.uid())) OR public.is_user_admin(auth.uid()) );

-- public.response_scores
ALTER TABLE public.response_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view response scores for accessible ideas" ON public.response_scores FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));
CREATE POLICY "Allow submitter to manage response scores for their draft ideas or admins" ON public.response_scores FOR INSERT, UPDATE, DELETE TO authenticated USING ( (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.submitter_user_id = auth.uid() AND i.status = 'Draft')) OR public.is_user_admin(auth.uid()) );

-- public.idea_value_assessments
ALTER TABLE public.idea_value_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view value assessments for accessible ideas" ON public.idea_value_assessments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));
CREATE POLICY "Allow submitter to manage value assessments for their draft ideas or admins" ON public.idea_value_assessments FOR INSERT, UPDATE, DELETE TO authenticated USING ( (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.submitter_user_id = auth.uid() AND i.status = 'Draft')) OR public.is_user_admin(auth.uid()) );

-- public.idea_quality_metrics
ALTER TABLE public.idea_quality_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view quality metrics for accessible ideas" ON public.idea_quality_metrics FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));
CREATE POLICY "Allow submitter to manage quality metrics for their draft ideas or admins" ON public.idea_quality_metrics FOR INSERT, UPDATE, DELETE TO authenticated USING ( (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.submitter_user_id = auth.uid() AND i.status = 'Draft')) OR public.is_user_admin(auth.uid()) );

-- public.evaluation_rubrics
ALTER TABLE public.evaluation_rubrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read evaluation rubrics" ON public.evaluation_rubrics FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage evaluation rubrics" ON public.evaluation_rubrics FOR ALL USING (public.is_user_admin(auth.uid())) WITH CHECK (public.is_user_admin(auth.uid()));

-- public.evaluation_criteria
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read evaluation criteria" ON public.evaluation_criteria FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage evaluation criteria" ON public.evaluation_criteria FOR ALL USING (public.is_user_admin(auth.uid())) WITH CHECK (public.is_user_admin(auth.uid()));

-- public.evaluations
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view evaluations for accessible ideas" ON public.evaluations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));
CREATE POLICY "Allow evaluator to submit evaluations or admins" ON public.evaluations FOR INSERT, UPDATE, DELETE TO authenticated USING ( (evaluator_user_id = auth.uid()) OR public.is_user_admin(auth.uid()) );

-- public.workflow_events
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view workflow events for accessible ideas" ON public.workflow_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));
CREATE POLICY "Allow admin to insert workflow events" ON public.workflow_events FOR INSERT TO authenticated USING (public.is_user_admin(auth.uid()));

-- public.smart_contract_logs
ALTER TABLE public.smart_contract_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view smart contract logs for accessible ideas" ON public.smart_contract_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id));
CREATE POLICY "Allow admin to insert smart contract logs" ON public.smart_contract_logs FOR INSERT TO authenticated USING (public.is_user_admin(auth.uid()));

