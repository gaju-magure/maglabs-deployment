
// UUID types are now handled by string type for simplicity

export enum IdeaCategoryEnum {
    PRODUCT_INNOVATION = "Product Innovation",
    SERVICE_INNOVATION = "Service Innovation",
    PROCESS_INNOVATION = "Process Innovation / Efficiency Improvement",
    BUSINESS_MODEL_INNOVATION = "Business Model Innovation",
    TECHNOLOGICAL_INNOVATION = "Technological Innovation",
    MARKETING_INNOVATION = "Marketing Innovation",
    CUSTOMER_EXPERIENCE_INNOVATION = "Customer Experience Innovation",
    SUSTAINABILITY_INNOVATION = "Sustainability / Environmental Innovation",
    SOCIAL_INNOVATION = "Social Innovation",
    REGULATORY_COMPLIANCE_INNOVATION = "Regulatory & Compliance Innovation",
    EMPLOYEE_EXPERIENCE_INNOVATION = "Employee Experience Innovation",
    TRANSFORMATIONAL_INNOVATION = "Transformational (Disruptive/Radical/Horizon 3) Innovation",
    UNCATEGORIZED = "Uncategorized"
}

export enum IdeaStatusEnum {
    DRAFT = "Draft",
    SUBMITTED = "Submitted", 
    IN_QUESTIONNAIRE_SETUP = "Selecting Categories", 
    IN_QUESTIONNAIRE_CHAT = "In Questionnaire Chat", 
    IN_VALUE_DEFINITION = "Defining Value & Effort", 
    UNDER_SCREENING = "Under Screening", 
    SCREENING_FAILED = "Screening Failed",
    SCREENING_PASSED = "Screening Passed",
    NEEDS_ENRICHMENT = "Needs Enrichment",
    UNDER_EVALUATION = "Under Evaluation", // Existing, can be used by Reviewers
    REJECTED = "Rejected", // Generic Rejected
    APPROVED = "Approved", // Generic Approved
    IN_INCUBATION = "In Incubation",
    COMPLETED = "Completed",
    ARCHIVED = "Archived",
    PENDING_REVIEW = "Pending Review", // New status for reviewer queue
    REVIEW_APPROVED = "Review Approved", // Specific approval by reviewer
    REVIEW_REJECTED = "Review Rejected"  // Specific rejection by reviewer
}

export enum QuestionTypeEnum {
    GENERAL = "General",
    CATEGORY_SPECIFIC = "Category-Specific",
    FOLLOW_UP = "Follow-Up",
}

export enum ResponseScoreTypeEnum {
    AI_QUALITY_SCORE = "AI Quality Score",
    VALUE_BAND_SELECTION = "Value Band Selection",
    EFFORT_POINT_SELECTION = "Effort Point Selection",
}

export enum ValueBandEnum {
    BAND_A = "Band A",
    BAND_B = "Band B",
    BAND_C = "Band C",
    BAND_D = "Band D",
    NOT_APPLICABLE = "Not Applicable",
}

export enum EffortPointEnum {
    XS = "XS (1)",
    S = "S (3)",
    M = "M (5)",
    L = "L (8)",
    XL = "XL (13)",
    NOT_APPLICABLE = "Not Applicable",
}

export enum WorkflowEventTypeEnum {
    STATUS_CHANGE = "Status Change",
    COMMENT_ADDED = "Comment Added",
    ASSIGNMENT_CHANGE = "Assignment Change",
    EVALUATION_SUBMITTED = "Evaluation Submitted",
    AI_INTERVIEW_COMPLETED = "AI Interview Completed",
    MANUAL_TAG_ADDED = "Manual Tag Added",
    AI_TAG_SUGGESTED = "AI Tag Suggested",
}

export interface IdeaTag {
    id: string; 
    category: IdeaCategoryEnum;
    source: string; 
    confidence?: number;
    is_primary: boolean;
}

export interface Question {
  id: string; 
  stage: 1 | 2 | 3; 
  text: string;
  category?: IdeaCategoryEnum; 
  theme: string; 
  isMandatory?: boolean; 
}

export interface Answer {
  questionId: string;
  text: string;
  answeredAt: Date;
}

export interface Response {
  id: string;
  idea_id: string;
  question_id: string;
  question_theme_id: string;
  user_id: string;
  response_text?: string;
  response_value_band?: ValueBandEnum;
  response_effort_point?: EffortPointEnum;
  response_attachments: string[];
  responded_at: Date;
}

export interface ResponseScore {
  id: string;
  idea_id: string;
  response_id?: string;
  score_type: ResponseScoreTypeEnum;
  score_value_numeric?: number;
  score_value_text?: string;
  scored_by_user_id?: string;
  scored_by_agent_id?: string;
  score_rationale?: string;
  scored_at: Date;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  forQuestionId?: string; 
  isClarification?: boolean; 
  aiThinks?: boolean; 
}

export type ValueDimensionKey = 'revenue' | 'cost_saving' | 'nps' | 'risk_reduction' | string; 
export type ValueBandKey = 'A' | 'B' | 'C' | 'D';
export type EffortLevelKey = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface ValueBandConfig {
    key: ValueBandKey;
    label: string; 
    score: number; 
}

export interface ValueDimensionConfig {
    key: ValueDimensionKey;
    label: string; 
    bands: ValueBandConfig[];
    weight: number;
}

export interface EffortLevelConfig {
    key: EffortLevelKey;
    label: string; 
    points: number; 
}

export interface ValueSelection {
    dimensionKey: ValueDimensionKey;
    selectedBandKey: ValueBandKey;
}

// Legacy enum - use UserRole from lib/supabase.ts for new code
export enum UserRole {
  CONTRIBUTOR = "Contributor",
  EVALUATOR = "Evaluator", // Reviewer role
  ADMIN = "Admin"
}

// Legacy interface - use AuthenticatedUser from AuthContext.tsx for new code
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  organisationId?: string | null;
}

export interface Idea {
    id: string; 
    title: string; 
    description: string; 
    submitterEmail: string; // Email of the user who submitted the idea
    organisationId?: string; // For future scoping of ideas
    status: IdeaStatusEnum;
    tags: IdeaTag[];
    created_at: Date;
    updated_at: Date;
    
    selectedCategories?: IdeaCategoryEnum[];
    questionnaireAnswers?: Response[];
    chatHistory?: ChatMessage[]; 

    category_suggestion_loading?: boolean; 
    category_suggestion_error?: string; 

    clarityScore?: number; 
    valueScore?: number; 
    readinessScore?: number; 
    
    valueSelections?: ValueSelection[];
    effortSelection?: EffortLevelKey;
    roiIndex?: number;
}

export interface CategorizationResult {
    category: IdeaCategoryEnum;
    confidence?: number; 
    error?: string; 
}

export type WorkflowStage = 'idle' | 'categorySelection' | 'questionnaireChat' | 'valueDefinition' | 'submitting' | 'submitted' | 'login' | 'reviewerDashboard';

export type QuestionnaireInteractionState = 
  | 'IDLE'                           
  | 'AI_INITIATING'                 
  | 'AI_ASKING_MAIN_QUESTION'       
  | 'AWAITING_USER_RESPONSE'        
  | 'USER_RESPONDED_AI_EVALUATING'  
  | 'AI_ASKING_CLARIFICATION'       
  | 'AI_CONCLUDING';                

export interface CurrentQuestionnaireIdea {
    id: string;
    submitterEmail: string;
    organisationId?: string;
    selectedCategories: IdeaCategoryEnum[];
    answers: Response[];
    currentQuestionSet: Question[];
    currentSystemQuestionIndex: number; 
    
    chatHistory: ChatMessage[];
    interactionState: QuestionnaireInteractionState;
    
    status: IdeaStatusEnum; 
    createdAt: Date;

    clarityScore: number; 

    valueSelections: ValueSelection[];
    effortSelection: EffortLevelKey | null;
    roiIndex?: number;
}

export interface MeterScores {
    clarity: number;
    value: number;
    readiness: number;
}

export interface EvaluationResult {
    type: 'proceed' | 'clarify';
    aiResponseToUser: string;
    finalAnswerForQuestion?: string;
    clarityMeterDelta?: number;
    error?: string;
}

export interface CriterionScore {
    criterion_id: string;
    score: number | string;
    comments?: string;
}

export interface EvaluationCriterion {
    id: string;
    name: string;
    description?: string;
    weight: number;
}

export interface EvaluationRubric {
    id: string;
    name: string;
    description?: string;
    applicable_categories: IdeaCategoryEnum[];
    applicable_stage?: string; // IdeationStageEnum as string
    criteria: EvaluationCriterion[];
    is_active: boolean;
}

export interface Evaluation {
    id: string;
    idea_id: string;
    rubric_id: string;
    evaluator_user_id: string;
    scores_per_criterion: CriterionScore[];
    overall_score?: number;
    overall_comments?: string;
    recommendation?: string;
    submitted_at: Date;
}

export interface WorkflowEvent {
    id: string;
    idea_id: string;
    event_type: WorkflowEventTypeEnum;
    user_id?: string;
    agent_id?: string;
    timestamp: Date;
    details: Record<string, unknown>;
}
