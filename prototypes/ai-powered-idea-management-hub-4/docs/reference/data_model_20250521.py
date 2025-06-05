from __future__ import annotations # For forward references in type hints

from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, EmailStr, HttpUrl, conlist

# --- Base and Versioning ---

class VersionInfo(BaseModel):
    """
    Mixin for version tracking of records.
    """
    version: int = Field(default=1, description="Record version number.")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of record creation.")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of last record update.")

class Auditable(BaseModel):
    """
    Mixin for tracking who created and last updated a record.
    """
    created_by_user_id: Optional[UUID] = Field(None, description="ID of the user who created this record.")
    updated_by_user_id: Optional[UUID] = Field(None, description="ID of the user who last updated this record.")

# --- Enums ---

class IdeaCategoryEnum(str, Enum):
    PRODUCT_INNOVATION = "Product Innovation"
    SERVICE_INNOVATION = "Service Innovation"
    PROCESS_INNOVATION = "Process Innovation / Efficiency Improvement"
    BUSINESS_MODEL_INNOVATION = "Business Model Innovation"
    TECHNOLOGICAL_INNOVATION = "Technological Innovation"
    MARKETING_INNOVATION = "Marketing Innovation"
    CUSTOMER_EXPERIENCE_INNOVATION = "Customer Experience Innovation"
    SUSTAINABILITY_INNOVATION = "Sustainability / Environmental Innovation"
    SOCIAL_INNOVATION = "Social Innovation"
    REGULATORY_COMPLIANCE_INNOVATION = "Regulatory & Compliance Innovation"
    EMPLOYEE_EXPERIENCE_INNOVATION = "Employee Experience Innovation"
    TRANSFORMATIONAL_INNOVATION = "Transformational (Disruptive/Radical/Horizon 3) Innovation"

class IdeationStageEnum(str, Enum):
    CONCEPT_DEFINITION_SCOPE = "Concept Definition & Scope"
    OPPORTUNITY_IMPACT_ANALYSIS = "Opportunity & Impact Analysis"
    SOLUTION_OUTLINE_IMPLEMENTATION_APPROACH = "Solution Outline & Implementation Approach"
    # These align with the platform's lifecycle stages
    CAPTURE = "Capture"
    SCREENING = "Screening"
    EVALUATION = "Evaluation"
    APPROVAL = "Approval"
    INCUBATION = "Incubation"
    IMPLEMENTATION = "Implementation"
    VALUE_REALIZATION = "Value Realization"
    ARCHIVED = "Archived" # General archive state

class IdeaStatusEnum(str, Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted" # Same as CAPTURED
    UNDER_SCREENING = "Under Screening"
    SCREENING_FAILED = "Screening Failed"
    SCREENING_PASSED = "Screening Passed" # Ready for Evaluation
    NEEDS_ENRICHMENT = "Needs Enrichment" # From AI interview or manual flag
    UNDER_EVALUATION = "Under Evaluation"
    EVALUATION_REJECTED = "Evaluation Rejected"
    EVALUATION_APPROVED = "Evaluation Approved" # Ready for Final Approval
    PENDING_FINAL_APPROVAL = "Pending Final Approval"
    REJECTED = "Rejected" # Final rejection
    APPROVED = "Approved" # Final approval, ready for Incubation
    IN_INCUBATION = "In Incubation"
    IMPLEMENTATION_IN_PROGRESS = "Implementation In Progress"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"
    ARCHIVED = "Archived"

class UserRoleEnum(str, Enum):
    CONTRIBUTOR = "Contributor"
    INNOVATION_MANAGER = "Innovation Manager"
    MENTOR = "Mentor"
    EVALUATOR = "Evaluator"
    REG_OPS_REVIEWER = "Reg-Ops Reviewer"
    ESG_REVIEWER = "ESG Reviewer"
    PRODUCT_STEERCO = "Product SteerCo"
    FINANCE_COO = "Finance COO"
    OPS_VP = "Ops VP"
    INNOVATION_PMO = "Innovation PMO"
    C_SUITE_BOARD = "C-Suite / Board"
    SYSTEM_ADMIN = "System Admin"
    SUPERVISOR = "Supervisor" # Generic supervisor role

class QuestionTypeEnum(str, Enum):
    GENERAL = "General"
    CATEGORY_SPECIFIC = "Category-Specific"
    FOLLOW_UP = "Follow-Up" # For AI Interview

class ResponseScoreTypeEnum(str, Enum):
    AI_QUALITY_SCORE = "AI Quality Score" # e.g., clarity, completeness from LLM
    VALUE_BAND_SELECTION = "Value Band Selection"
    EFFORT_POINT_SELECTION = "Effort Point Selection"

class ValueBandEnum(str, Enum):
    # Example bands, can be configured per dimension
    BAND_A = "Band A" # e.g., <1% revenue impact OR <$10k cost saving
    BAND_B = "Band B" # e.g., 1-3% revenue impact OR $10-50k cost saving
    BAND_C = "Band C" # e.g., 3-7% revenue impact OR $50-250k cost saving
    BAND_D = "Band D" # e.g., >7% revenue impact OR >$250k cost saving
    NOT_APPLICABLE = "Not Applicable"

class EffortPointEnum(str, Enum):
    XS = "XS (1)"
    S = "S (3)"
    M = "M (5)"
    L = "L (8)"
    XL = "XL (13)"
    NOT_APPLICABLE = "Not Applicable"

class WorkflowEventTypeEnum(str, Enum):
    STATUS_CHANGE = "Status Change"
    COMMENT_ADDED = "Comment Added"
    ASSIGNMENT_CHANGE = "Assignment Change"
    EVALUATION_SUBMITTED = "Evaluation Submitted"
    AI_INTERVIEW_COMPLETED = "AI Interview Completed"
    MANUAL_TAG_ADDED = "Manual Tag Added"
    AI_TAG_SUGGESTED = "AI Tag Suggested"

# --- Core Data Models ---

class Organization(VersionInfo, Auditable):
    """
    Represents an organization or a distinct tenant in a multi-tenant setup.
    """
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the organization.")
    name: str = Field(..., max_length=255, description="Name of the organization.")
    domain: Optional[HttpUrl] = Field(None, description="Primary domain of the organization.")
    settings: Dict[str, Any] = Field(default_factory=dict, description="Organization-specific settings.")

class User(VersionInfo, Auditable):
    """
    Represents a user within the system.
    """
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the user.")
    organization_id: Optional[UUID] = Field(None, description="ID of the organization the user belongs to.") # Optional if not multi-tenant by default
    sso_id: Optional[str] = Field(None, index=True, description="Single Sign-On ID from an external provider.")
    email: EmailStr = Field(..., index=True, description="User's email address.")
    full_name: Optional[str] = Field(None, max_length=255, description="User's full name.")
    roles: List[UserRoleEnum] = Field(default_factory=list, description="Roles assigned to the user.")
    profile_picture_url: Optional[HttpUrl] = Field(None, description="URL of the user's profile picture.")
    is_active: bool = Field(default=True, description="Whether the user account is active.")
    last_login_at: Optional[datetime] = Field(None, description="Timestamp of the user's last login.")
    preferences: Dict[str, Any] = Field(default_factory=dict, description="User-specific preferences.")

class Question(VersionInfo, Auditable):
    """
    Represents a question in the structured questionnaire.
    """
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the question.")
    question_text: str = Field(..., description="The text of the question.")
    question_theme_id: str = Field(..., description="Identifier for the question theme (e.g., Q1, Q-P1).")
    question_type: QuestionTypeEnum = Field(..., description="Type of the question.")
    ideation_stage: IdeationStageEnum = Field(..., description="Ideation stage this question primarily belongs to.")
    associated_categories: List[IdeaCategoryEnum] = Field(default_factory=list, description="Categories this question is specifically relevant for (empty if general).")
    guidance_text: Optional[str] = Field(None, description="Helper text or guidance for answering the question.")
    expected_response_format: Optional[str] = Field(None, description="Hint for expected response format (e.g., text, number, list).")
    is_active: bool = Field(default=True)

class Response(VersionInfo, Auditable):
    """
    Represents a user's response to a specific question for a given idea.
    """
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the response.")
    idea_id: UUID = Field(..., description="ID of the idea this response relates to.")
    question_id: UUID = Field(..., description="ID of the question being answered.")
    question_theme_id: str = Field(..., description="Identifier for the question theme (e.g., Q1, Q-P1).") # Denormalized for easier querying
    user_id: UUID = Field(..., description="ID of the user who provided the response.")
    response_text: Optional[str] = Field(None, description="The textual answer provided by the user.")
    response_value_band: Optional[ValueBandEnum] = Field(None, description="Selected value band, if applicable.")
    response_effort_point: Optional[EffortPointEnum] = Field(None, description="Selected effort point, if applicable.")
    response_attachments: List[HttpUrl] = Field(default_factory=list, description="URLs to any attachments related to this response.")
    responded_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the response was provided.")

class ResponseScore(VersionInfo, Auditable):
    """
    Represents a score associated with a response or a set of responses for an idea.
    """
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the response score.")
    idea_id: UUID = Field(..., description="ID of the idea this score relates to.")
    response_id: Optional[UUID] = Field(None, description="ID of the specific response being scored (if applicable).")
    score_type: ResponseScoreTypeEnum = Field(..., description="Type of score.")
    score_value_numeric: Optional[float] = Field(None, description="Numerical score value.")
    score_value_text: Optional[str] = Field(None, description="Textual score value (e.g., for qualitative scores).")
    scored_by_user_id: Optional[UUID] = Field(None, description="ID of the user who provided the score (if manual).")
    scored_by_agent_id: Optional[str] = Field(None, description="Identifier of the AI agent that provided the score.")
    score_rationale: Optional[str] = Field(None, description="Rationale or explanation for the score.")
    scored_at: datetime = Field(default_factory=datetime.utcnow)

class AIInterviewLogEntry(BaseModel):
    """
    Represents a single exchange in the AI-driven interview for idea enrichment.
    """
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    question_asked_by_ai: str
    user_response: Optional[str] = None
    ai_assessment_of_response: Optional[str] = None # e.g., "Clarity improved"

class IdeaValueAssessment(BaseModel):
    """
    Captures the value and effort band selections for an idea.
    """
    value_band_selections: Dict[str, ValueBandEnum] = Field(default_factory=dict, description="Dimension-specific value band selections, e.g., {'revenue_impact': 'BAND_B'}")
    effort_points_selection: Optional[EffortPointEnum] = None
    calculated_roi_index: Optional[float] = Field(None, description="Calculated ROI Index based on bands and effort.")
    normalized_value_score: Optional[float] = Field(None, ge=0, le=100, description="Overall normalized value score (0-100).")

class IdeaQualityMetrics(BaseModel):
    """
    Metrics related to the quality of the idea submission.
    """
    ai_completeness_score: Optional[float] = Field(None, ge=0, le=1, description="AI-assessed completeness score.")
    ai_clarity_score: Optional[float] = Field(None, ge=0, le=1, description="AI-assessed clarity score.")
    overall_quality_score: Optional[float] = Field(None, ge=0, le=1, description="Combined quality score.")
    quality_history: List[Dict[str, Any]] = Field(default_factory=list, description="Log of quality score changes over time.") # e.g., [{"ts": datetime, "completeness": 0.5, "clarity": 0.6}]
    ai_interview_log: List[AIInterviewLogEntry] = Field(default_factory=list, description="Log of the AI interview.")

class IdeaTag(BaseModel):
    """
    Represents a category tag associated with an idea.
    """
    category: IdeaCategoryEnum
    source: str = Field(..., description="Source of the tag (e.g., 'user_manual', 'ai_suggested', 'ai_reconciled').")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Confidence score if AI-generated.")
    is_primary: bool = Field(default=False, description="Indicates if this is the user-designated or system-inferred primary tag.")

class Idea(VersionInfo, Auditable):
    """
    The central model representing an idea.
    """
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the idea.")
    organization_id: Optional[UUID] = Field(None, description="ID of the organization this idea belongs to.")
    title: str = Field(..., min_length=5, max_length=255, description="Title of the idea.")
    description: str = Field(..., min_length=20, description="Detailed description of the idea.")
    submitter_user_id: UUID = Field(..., description="ID of the user who submitted the idea.")
    
    tags: conlist(IdeaTag, min_length=1) = Field(..., description="List of category tags associated with the idea.")
    
    status: IdeaStatusEnum = Field(default=IdeaStatusEnum.DRAFT, description="Current lifecycle status of the idea.")
    status_reason: Optional[str] = Field(None, description="Reason for the current status (e.g., why it was rejected or put on hold).")
    
    # Questionnaire responses would be linked via a separate table/collection in a DB,
    # but can be embedded for certain API responses if needed.
    # responses: List[Response] = Field(default_factory=list) # Potentially too large to embed always

    value_assessment: Optional[IdeaValueAssessment] = Field(None, description="Assessment of the idea's value and effort.")
    quality_metrics: Optional[IdeaQualityMetrics] = Field(None, description="Metrics related to the idea's submission quality.")
    
    attachments: List[HttpUrl] = Field(default_factory=list, description="URLs to attachments related to the idea (e.g., documents, images).")
    
    # For duplicate checking
    embedding_vector: Optional[List[float]] = Field(None, description="Semantic embedding vector for similarity checks.")
    potential_duplicates: List[UUID] = Field(default_factory=list, description="IDs of potential duplicate ideas identified by AI.")
    
    # Lifecycle and review
    assigned_to_user_id: Optional[UUID] = Field(None, description="ID of the user currently assigned to review or manage this idea.")
    due_date: Optional[datetime] = Field(None, description="Due date for the current stage or action.")
    priority: Optional[int] = Field(None, ge=1, le=5, description="Priority of the idea (e.g., 1=Highest, 5=Lowest).")
    
    # Analytics and tracking
    kpis_impacted: List[str] = Field(default_factory=list, description="Key Performance Indicators this idea is expected to impact.")
    strategic_alignment_score: Optional[float] = Field(None, ge=0, le=1, description="Score indicating alignment with strategic objectives.")

    # For the "Interactive Business Analyst" AI
    ai_interview_completed: bool = Field(default=False, description="Flag indicating if the AI enrichment interview was completed.")

class EvaluationCriterion(VersionInfo, Auditable):
    """
    A single criterion within an evaluation rubric.
    """
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., description="Name of the criterion (e.g., 'Strategic Fit', 'ROI Potential').")
    description: Optional[str] = Field(None, description="Detailed description of the criterion.")
    weight: float = Field(..., ge=0, le=1, description="Weight of this criterion in the overall score (0.0 to 1.0).")
    # scoring_scale: Optional[Dict[str, Any]] = None # e.g., { "type": "likert", "levels": 5 } or { "type": "numeric_range", "min": 0, "max": 10 }

class EvaluationRubric(VersionInfo, Auditable):
    """
    A collection of criteria used to evaluate ideas, potentially tailored per category or stage.
    """
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., description="Name of the rubric (e.g., 'Product Innovation - Initial Screening Rubric').")
    description: Optional[str] = None
    applicable_categories: List[IdeaCategoryEnum] = Field(default_factory=list)
    applicable_stage: Optional[IdeationStageEnum] = None # Stage where this rubric is used
    criteria: List[EvaluationCriterion] = Field(..., min_length=1)
    is_active: bool = Field(default=True)

class CriterionScore(BaseModel):
    criterion_id: UUID
    score: Union[float, str] # Can be numeric or a selection like "High", "Medium", "Low"
    comments: Optional[str] = None

class Evaluation(VersionInfo, Auditable):
    """
    Represents an evaluation submitted for an idea by a user using a specific rubric.
    """
    id: UUID = Field(default_factory=uuid4)
    idea_id: UUID
    rubric_id: UUID
    evaluator_user_id: UUID
    scores_per_criterion: List[CriterionScore] = Field(...)
    overall_score: Optional[float] = Field(None, description="Calculated overall score based on criteria scores and weights.")
    overall_comments: Optional[str] = None
    recommendation: Optional[str] = Field(None, description="Evaluator's recommendation (e.g., 'Approve', 'Reject', 'Needs More Info').")
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

class WorkflowEvent(VersionInfo):
    """
    Logs significant events in an idea's lifecycle.
    """
    id: UUID = Field(default_factory=uuid4)
    idea_id: UUID
    event_type: WorkflowEventTypeEnum
    user_id: Optional[UUID] = Field(None, description="User who triggered the event, if applicable.")
    agent_id: Optional[str] = Field(None, description="AI agent that triggered the event, if applicable.")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional details about the event (e.g., old_status, new_status).")

class SmartContractLog(VersionInfo):
    """
    Logs when SMART metrics are checked or achieved for an idea stage.
    """
    id: UUID = Field(default_factory=uuid4)
    idea_id: UUID
    stage: IdeationStageEnum
    metric_name: str
    metric_target: str
    metric_actual: str
    is_met: bool
    checked_at: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[str] = None

# Example of how you might use these models
if __name__ == "__main__":
    # Create a user
    user1_id = uuid4()
    user1 = User(id=user1_id, email="submitter@example.com", full_name="Idea Submitter", roles=[UserRoleEnum.CONTRIBUTOR])
    print(f"User created: {user1.model_dump_json(indent=2)}")

    # Create an idea
    idea1_id = uuid4()
    idea_tags = [
        IdeaTag(category=IdeaCategoryEnum.PRODUCT_INNOVATION, source="user_manual", is_primary=True),
        IdeaTag(category=IdeaCategoryEnum.TECHNOLOGICAL_INNOVATION, source="ai_suggested", confidence=0.85)
    ]
    idea1 = Idea(
        id=idea1_id,
        title="AI-Powered Smart Toaster",
        description="A toaster that uses AI to perfectly toast bread based on visual analysis and user preferences.",
        submitter_user_id=user1.id,
        tags=idea_tags,
        status=IdeaStatusEnum.SUBMITTED,
        value_assessment=IdeaValueAssessment(
            value_band_selections={"revenue_impact": ValueBandEnum.BAND_B, "cost_saving": ValueBandEnum.NOT_APPLICABLE},
            effort_points_selection=EffortPointEnum.M,
            calculated_roi_index=1.5, # Example
            normalized_value_score=75.0 # Example
        ),
        quality_metrics=IdeaQualityMetrics(
            ai_completeness_score=0.9,
            ai_clarity_score=0.85,
            overall_quality_score=0.875,
            ai_interview_log=[
                AIInterviewLogEntry(question_asked_by_ai="What is the target market?", user_response="Tech enthusiasts.")
            ]
        )
    )
    print(f"\nIdea created: {idea1.model_dump_json(indent=2)}")

    # Create a question
    q1_id = uuid4()
    question1 = Question(
        id=q1_id,
        question_text="What specific problem does this product solve?",
        question_theme_id="Q-P1.1", # Custom theme ID
        question_type=QuestionTypeEnum.CATEGORY_SPECIFIC,
        ideation_stage=IdeationStageEnum.CONCEPT_DEFINITION_SCOPE,
        associated_categories=[IdeaCategoryEnum.PRODUCT_INNOVATION]
    )
    print(f"\nQuestion created: {question1.model_dump_json(indent=2)}")

    # Create a response
    response1 = Response(
        idea_id=idea1.id,
        question_id=question1.id,
        question_theme_id=question1.question_theme_id,
        user_id=user1.id,
        response_text="It solves the problem of inconsistently toasted bread and the user's cognitive load of setting the toaster."
    )
    print(f"\nResponse created: {response1.model_dump_json(indent=2)}")

    # Create a workflow event
    event1 = WorkflowEvent(
        idea_id=idea1.id,
        event_type=WorkflowEventTypeEnum.STATUS_CHANGE,
        user_id=user1.id, # Or system if automated
        details={"old_status": "Draft", "new_status": "Submitted"}
    )
    print(f"\nWorkflow Event created: {event1.model_dump_json(indent=2)}")

