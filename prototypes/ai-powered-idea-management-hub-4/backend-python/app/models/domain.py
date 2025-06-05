from __future__ import annotations  # For forward references in type hints

import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field, HttpUrl, validator


# --- Base Models for Timestamps and Auditing ---
class TimestampedModel(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AuditableModel(TimestampedModel):
    created_by_user_id: uuid.UUID | None = None
    updated_by_user_id: uuid.UUID | None = None


class VersionedModel(TimestampedModel):
    version: int = Field(default=1)


class VersionedAuditableModel(AuditableModel):
    version: int = Field(default=1)


# --- Enums (aligned with types.ts and data_model_20250521.py) ---
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
    UNCATEGORIZED = "Uncategorized"


class IdeaStatusEnum(str, Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    IN_QUESTIONNAIRE_SETUP = "Selecting Categories"  # Specific to frontend flow
    IN_QUESTIONNAIRE_CHAT = "In Questionnaire Chat"  # Specific to frontend flow
    IN_VALUE_DEFINITION = "Defining Value & Effort"  # Specific to frontend flow
    UNDER_SCREENING = "Under Screening"
    SCREENING_FAILED = "Screening Failed"
    SCREENING_PASSED = "Screening Passed"
    NEEDS_ENRICHMENT = "Needs Enrichment"
    UNDER_EVALUATION = "Under Evaluation"
    REJECTED = "Rejected"  # Generic, can be Evaluation Rejected or Final Rejected
    APPROVED = "Approved"  # Generic, can be Evaluation Approved or Final Approved
    IN_INCUBATION = "In Incubation"
    COMPLETED = "Completed"
    ARCHIVED = "Archived"
    PENDING_REVIEW = "Pending Review"  # For reviewer queue
    REVIEW_APPROVED = "Review Approved"  # Specific approval by reviewer
    REVIEW_REJECTED = "Review Rejected"  # Specific rejection by reviewer
    # From data_model_20250521.py, can be added if needed:
    # EVALUATION_REJECTED = "Evaluation Rejected"
    # EVALUATION_APPROVED = "Evaluation Approved"
    # PENDING_FINAL_APPROVAL = "Pending Final Approval"
    # IMPLEMENTATION_IN_PROGRESS = "Implementation In Progress"
    # ON_HOLD = "On Hold"


class UserRoleEnum(str, Enum):
    CONTRIBUTOR = "Contributor"
    EVALUATOR = "Evaluator"  # Maps to Reviewer in types.ts
    ADMIN = "Admin"
    # Extended roles from data_model_20250521.py can be added if Supabase supports them
    # INNOVATION_MANAGER = "Innovation Manager"
    # SYSTEM_ADMIN = "System Admin"


class SenderTypeEnum(str, Enum):
    USER = "user"
    AI = "ai"


class IdeationStageEnum(str, Enum):
    CONCEPT_DEFINITION_SCOPE = "Concept Definition & Scope"
    OPPORTUNITY_IMPACT_ANALYSIS = "Opportunity & Impact Analysis"
    SOLUTION_OUTLINE_IMPLEMENTATION_APPROACH = "Solution Outline & Implementation Approach"
    CAPTURE = "Capture"
    SCREENING = "Screening"
    EVALUATION = "Evaluation"
    APPROVAL = "Approval"
    INCUBATION = "Incubation"
    IMPLEMENTATION = "Implementation"
    VALUE_REALIZATION = "Value Realization"
    ARCHIVED = "Archived"


class ResponseScoreTypeEnum(str, Enum):
    AI_QUALITY_SCORE = "AI Quality Score"
    VALUE_BAND_SELECTION = "Value Band Selection"
    EFFORT_POINT_SELECTION = "Effort Point Selection"


class ValueBandEnum(str, Enum):
    BAND_A = "Band A"
    BAND_B = "Band B"
    BAND_C = "Band C"
    BAND_D = "Band D"
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


# --- Models from types.ts, adapted to Pydantic ---


class IdeaTagBase(BaseModel):
    category: IdeaCategoryEnum
    source: str  # e.g., "user_manual", "ai_suggested"
    confidence: float | None = Field(None, ge=0, le=1)
    is_primary: bool = False


class IdeaTagCreate(IdeaTagBase):
    pass


class IdeaTag(IdeaTagBase):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    # idea_id: uuid.UUID # This would be part of a DB model, linking it to an Idea


class Question(BaseModel):  # Corresponds to Question in types.ts
    id: str  # In types.ts this is string, could be UUID if we generate them
    stage: int | None = None  # 1 | 2 | 3 in types.ts, optional for now
    text: str
    category: IdeaCategoryEnum | None = None
    theme: str
    is_mandatory: bool | None = False


class Answer(BaseModel):  # Corresponds to Answer in types.ts
    question_id: str  # Matches Question.id
    text: str
    answered_at: datetime = Field(default_factory=datetime.utcnow)


class ChatMessage(BaseModel):  # Corresponds to ChatMessage in types.ts
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender: SenderTypeEnum
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    for_question_id: str | None = None  # Matches Question.id
    is_clarification: bool | None = False
    ai_thinks: bool | None = False  # UI state, might not be stored


class ValueDimensionKeyEnum(str, Enum):  # For ValueSelection
    REVENUE = "revenue"
    COST_SAVING = "cost_saving"
    NPS = "nps"
    RISK_REDUCTION = "risk_reduction"
    # Allow string for extensibility as in types.ts, but Pydantic prefers explicit enums


class ValueBandKeyEnum(str, Enum):  # For ValueSelection
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class EffortLevelKeyEnum(str, Enum):  # For ValueSelection
    XS = "XS"
    S = "S"
    M = "M"
    L = "L"
    XL = "XL"


class ValueSelection(BaseModel):
    dimension_key: ValueDimensionKeyEnum | str  # Allow string for flexibility
    selected_band_key: ValueBandKeyEnum


class AuthenticatedUser(BaseModel):  # Corresponds to AuthenticatedUser in types.ts
    id: str  # In types.ts, this is string (can be email for mock). For Supabase, it's UUID.
    email: EmailStr
    role: UserRoleEnum
    organisation_id: str | None = None  # Could be UUID

    @validator("id", pre=True, always=True)
    def ensure_id_is_uuid_string(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v


class IdeaBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=250)
    description: str = Field(..., min_length=10)
    submitter_email: EmailStr  # Will be derived from AuthenticatedUser.email
    organisation_id: str | None = None  # Could be UUID
    status: IdeaStatusEnum = IdeaStatusEnum.DRAFT
    tags: list[IdeaTagCreate] = []  # For creation, tags are embedded
    selected_categories: list[IdeaCategoryEnum] | None = None  # From questionnaire setup

    clarity_score: float | None = Field(None, ge=0, le=1)  # From questionnaire
    value_score: float | None = Field(None, ge=0, le=100)  # From value definition
    readiness_score: float | None = Field(None, ge=0, le=1)  # Placeholder

    value_selections: list[ValueSelection] | None = None
    effort_selection: EffortLevelKeyEnum | None = None
    roi_index: float | None = None


class IdeaCreate(IdeaBase):
    pass


class Idea(IdeaBase, TimestampedModel):  # Corresponds to Idea in types.ts
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    # In DB, tags, answers, chatHistory would be separate tables linked by idea_id
    # For API responses, they can be embedded if needed.
    questionnaire_answers: list[Answer] | None = None
    chat_history: list[ChatMessage] | None = None

    # UI state fields, might not be stored or only temporarily
    category_suggestion_loading: bool | None = None
    category_suggestion_error: str | None = None

    class Config:
        from_attributes = True  # For Pydantic V2, replaces orm_mode = True


class IdeaUpdate(BaseModel):  # For PATCH requests
    title: str | None = Field(None, min_length=3, max_length=250)
    description: str | None = Field(None, min_length=10)
    status: IdeaStatusEnum | None = None
    tags: list[IdeaTagCreate] | None = None
    selected_categories: list[IdeaCategoryEnum] | None = None
    questionnaire_answers: list[Answer] | None = None
    chat_history: list[ChatMessage] | None = None
    clarity_score: float | None = Field(None, ge=0, le=1)
    value_score: float | None = Field(None, ge=0, le=100)
    readiness_score: float | None = Field(None, ge=0, le=1)
    value_selections: list[ValueSelection] | None = None
    effort_selection: EffortLevelKeyEnum | None = None
    roi_index: float | None = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# --- API Request/Response Models (for /categorize and /evaluate) ---


class CategorizeRequest(BaseModel):
    title: str
    description: str


class CategorizationResult(BaseModel):  # Corresponds to CategorizationResult in types.ts
    category: IdeaCategoryEnum
    confidence: float | None = Field(None, ge=0, le=1)
    error: str | None = None


class EvaluateAnswerRequest(BaseModel):
    main_question: Question  # Embed the full Question object
    user_answer_text: str
    full_chat_history: list[ChatMessage] | None = None


class EvaluationResult(BaseModel):  # Corresponds to EvaluationResult in types.ts
    type: str  # 'proceed' | 'clarify'
    ai_response_to_user: str = Field(alias="aiResponseToUser")
    final_answer_for_question: str | None = Field(None, alias="finalAnswerForQuestion")
    clarity_meter_delta: float | None = Field(None, ge=0, le=0.3, alias="clarityMeterDelta")
    error: str | None = None

    model_config = {"populate_by_name": True}


# --- Models from data_model_20250521.py (can be expanded as needed) ---
# These are more detailed and can be used for DB schema design.
# For now, focusing on what's needed for the initial API port.


class Organization(VersionedAuditableModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str = Field(..., max_length=255)
    domain: HttpUrl | None = None
    settings: dict[str, Any] = Field(default_factory=dict)


class User(VersionedAuditableModel):  # Corresponds to User in data_model_20250521.py
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    organization_id: uuid.UUID | None = None
    sso_id: str | None = None  # If using external SSO provider via Supabase
    email: EmailStr = Field(..., unique=True)
    full_name: str | None = Field(None, max_length=255)
    roles: list[UserRoleEnum] = Field(default_factory=list)
    profile_picture_url: HttpUrl | None = None
    is_active: bool = True
    last_login_at: datetime | None = None
    preferences: dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True


# Token models for authentication (as per FastAPI best practices)
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # Subject (user ID or email)
    exp: int | None = None  # Expiry timestamp
    # Add other claims like roles, email, etc.
    email: EmailStr | None = None
    roles: list[UserRoleEnum] | None = None
    # Supabase specific claims if needed
    # aud: Optional[str] = None
    # iss: Optional[str] = None


# --- Helper models for API responses ---
class MessageResponse(BaseModel):
    message: str


# Example of a paginated response model
# class PaginatedResponse[T](BaseModel):
#     items: List[T]
#     total: int
#     page: int
#     size: int
#     pages: int


class Response(VersionedAuditableModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    idea_id: uuid.UUID
    question_id: uuid.UUID
    question_theme_id: str
    user_id: uuid.UUID
    response_text: str | None = None
    response_value_band: ValueBandEnum | None = None
    response_effort_point: EffortPointEnum | None = None
    response_attachments: list[HttpUrl] = Field(default_factory=list)
    responded_at: datetime = Field(default_factory=datetime.utcnow)


class ResponseScore(VersionedAuditableModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    idea_id: uuid.UUID
    response_id: uuid.UUID | None = None
    score_type: ResponseScoreTypeEnum
    score_value_numeric: float | None = None
    score_value_text: str | None = None
    scored_by_user_id: uuid.UUID | None = None
    scored_by_agent_id: str | None = None
    score_rationale: str | None = None
    scored_at: datetime = Field(default_factory=datetime.utcnow)


class AIInterviewLogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    question_asked_by_ai: str
    user_response: str | None = None
    ai_assessment_of_response: str | None = None


class IdeaValueAssessment(BaseModel):
    value_band_selections: dict[str, ValueBandEnum] = Field(default_factory=dict)
    effort_points_selection: EffortPointEnum | None = None
    calculated_roi_index: float | None = None
    normalized_value_score: float | None = Field(None, ge=0, le=100)


class IdeaQualityMetrics(BaseModel):
    ai_completeness_score: float | None = Field(None, ge=0, le=1)
    ai_clarity_score: float | None = Field(None, ge=0, le=1)
    overall_quality_score: float | None = Field(None, ge=0, le=1)
    quality_history: list[dict[str, Any]] = Field(default_factory=list)
    ai_interview_log: list[AIInterviewLogEntry] = Field(default_factory=list)


class EvaluationCriterion(VersionedAuditableModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    description: str | None = None
    weight: float = Field(..., ge=0, le=1)


class EvaluationRubric(VersionedAuditableModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    description: str | None = None
    applicable_categories: list[IdeaCategoryEnum] = Field(default_factory=list)
    applicable_stage: IdeationStageEnum | None = None
    criteria: list[EvaluationCriterion] = Field(..., min_length=1)
    is_active: bool = True


class CriterionScore(BaseModel):
    criterion_id: uuid.UUID
    score: float | str
    comments: str | None = None


class Evaluation(VersionedAuditableModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    idea_id: uuid.UUID
    rubric_id: uuid.UUID
    evaluator_user_id: uuid.UUID
    scores_per_criterion: list[CriterionScore]
    overall_score: float | None = None
    overall_comments: str | None = None
    recommendation: str | None = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)


class WorkflowEvent(VersionedModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    idea_id: uuid.UUID
    event_type: WorkflowEventTypeEnum
    user_id: uuid.UUID | None = None
    agent_id: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: dict[str, Any] = Field(default_factory=dict)


class SmartContractLog(VersionedModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    idea_id: uuid.UUID
    stage: IdeationStageEnum
    metric_name: str
    metric_target: str
    metric_actual: str
    is_met: bool
    checked_at: datetime = Field(default_factory=datetime.utcnow)
    details: str | None = None
