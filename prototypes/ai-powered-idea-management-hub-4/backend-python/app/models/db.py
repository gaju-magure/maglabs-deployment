# This file is intended for database-specific models, if needed.
# For example, if using an ORM like SQLModel or Tortoise ORM,
# or if you need to define table structures explicitly for raw SQL queries.

# With Supabase, often Pydantic models (from domain.py) are sufficient for interacting
# with the Supabase client, as it handles the mapping to/from JSON and database rows.

# If you were using SQLModel, it might look something like this:
# from typing import List, Optional
# from uuid import UUID, uuid4
# from datetime import datetime

# from sqlmodel import Field, Relationship, SQLModel
# from app.models.domain import IdeaCategoryEnum, IdeaStatusEnum, UserRoleEnum # Import enums

# class IdeaTagLink(SQLModel, table=True):
#     idea_id: Optional[UUID] = Field(default=None, primary_key=True, foreign_key="idea.id")
#     tag_id: Optional[UUID] = Field(default=None, primary_key=True, foreign_key="tag.id")

# class TagTable(SQLModel, table=True):
#     id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
#     name: str = Field(unique=True, index=True)
#     ideas: List["IdeaTable"] = Relationship(back_populates="tags", link_model=IdeaTagLink)

# class IdeaTable(SQLModel, table=True):
#     __tablename__ = "idea" # Explicit table name

#     id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
#     title: str = Field(index=True)
#     description: str
#     submitter_user_id: UUID = Field(foreign_key="usertable.id") # Assuming UserTable exists
#     status: IdeaStatusEnum = Field(default=IdeaStatusEnum.DRAFT)
#     created_at: datetime = Field(default_factory=datetime.utcnow)
#     updated_at: datetime = Field(default_factory=datetime.utcnow)

#     # Relationships
#     submitter: Optional["UserTable"] = Relationship(back_populates="ideas")
#     tags: List[TagTable] = Relationship(back_populates="ideas", link_model=IdeaTagLink)
#     # questionnaire_answers: List["AnswerTable"] = Relationship(back_populates="idea")
#     # chat_history: List["ChatMessageTable"] = Relationship(back_populates="idea")

# class UserTable(SQLModel, table=True):
#     __tablename__ = "user" # Explicit table name

#     id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
#     email: str = Field(unique=True, index=True)
#     full_name: Optional[str] = None
#     # hashed_password: Optional[str] = None # If managing passwords directly
#     is_active: bool = True
#     # roles: List[UserRoleEnum] # This would need a join table or array type in DB

#     ideas: List[IdeaTable] = Relationship(back_populates="submitter")


# For now, this file can remain empty or be used for notes on DB schema design
# that will be implemented directly in Supabase Studio or via SQL migration scripts.

"""
Notes on Supabase Table Structure (to be created via Supabase Studio or migrations):

1.  users:
    - id (uuid, primary key, default: auth.uid()) - Links to Supabase auth.users table
    - email (text, unique)
    - full_name (text, nullable)
    - roles (jsonb or text[]) - e.g., ["Contributor", "Admin"]
    - profile_picture_url (text, nullable)
    - is_active (boolean, default: true)
    - last_login_at (timestamp with time zone, nullable)
    - preferences (jsonb, nullable)
    - created_at (timestamp with time zone, default: now())
    - updated_at (timestamp with time zone, default: now())
    - organisation_id (uuid, nullable, foreign key to organisations.id if multi-tenant)

    RLS Policies:
    - Users can select their own record.
    - Admins can select/update/delete any user record.

2.  ideas:
    - id (uuid, primary key, default: uuid_generate_v4())
    - title (text, not null)
    - description (text, not null)
    - submitter_user_id (uuid, not null, foreign key to users.id)
    - organisation_id (uuid, nullable, foreign key to organisations.id if multi-tenant)
    - status (text, not null, default: 'Draft') # Corresponds to IdeaStatusEnum
    - clarity_score (real, nullable)
    - value_score (real, nullable)
    - readiness_score (real, nullable)
    - effort_selection (text, nullable) # Corresponds to EffortLevelKeyEnum
    - roi_index (real, nullable)
    - created_at (timestamp with time zone, default: now())
    - updated_at (timestamp with time zone, default: now())
    - category_suggestion_loading (boolean, nullable, default: false) # UI state, maybe not needed in DB
    - category_suggestion_error (text, nullable) # UI state, maybe not needed in DB

    RLS Policies:
    - Users can insert new ideas.
    - Users can select/update/delete their own draft ideas.
    - Once submitted, only specific roles (e.g., Admin, Evaluator) can update.
    - All authenticated users can select submitted ideas (or based on organisation).

3.  idea_tags: (Many-to-many relationship between ideas and a conceptual "tags" table, or store tags directly)
    - id (uuid, primary key, default: uuid_generate_v4())
    - idea_id (uuid, not null, foreign key to ideas.id, on delete cascade)
    - category (text, not null) # Corresponds to IdeaCategoryEnum
    - source (text, not null) # "user_manual", "ai_suggested"
    - confidence (real, nullable)
    - is_primary (boolean, default: false)
    - created_at (timestamp with time zone, default: now())

    RLS Policies:
    - Users can manage tags for ideas they can update.

4.  questions: (If storing predefined questions, otherwise questions might be dynamic)
    - id (text, primary key) # e.g., "Q1", "THEME_A_Q2"
    - stage (integer, nullable)
    - text (text, not null)
    - category (text, nullable) # Corresponds to IdeaCategoryEnum
    - theme (text, not null)
    - is_mandatory (boolean, default: false)
    - created_at (timestamp with time zone, default: now())
    - updated_at (timestamp with time zone, default: now())

    RLS Policies:
    - All authenticated users can select.
    - Admins can manage questions.

5.  idea_answers:
    - id (uuid, primary key, default: uuid_generate_v4())
    - idea_id (uuid, not null, foreign key to ideas.id, on delete cascade)
    - question_id (text, not null) # Foreign key to questions.id if questions table exists
    - text (text, not null)
    - answered_at (timestamp with time zone, default: now())
    - user_id (uuid, not null, foreign key to users.id) # User who provided the answer

    RLS Policies:
    - Users can manage answers for ideas they can update.

6.  idea_chat_messages:
    - id (uuid, primary key, default: uuid_generate_v4()) # Or text if matching domain model
    - idea_id (uuid, not null, foreign key to ideas.id, on delete cascade)
    - sender (text, not null) # "user" or "ai"
    - text (text, not null)
    - timestamp (timestamp with time zone, default: now())
    - for_question_id (text, nullable) # Foreign key to questions.id if questions table exists
    - is_clarification (boolean, nullable)
    - user_id (uuid, nullable, foreign key to users.id) # If sender is "user"

    RLS Policies:
    - Users can manage chat messages for ideas they can update.

7.  idea_value_selections:
    - id (uuid, primary key, default: uuid_generate_v4())
    - idea_id (uuid, not null, foreign key to ideas.id, on delete cascade)
    - dimension_key (text, not null) # e.g., "revenue", "cost_saving"
    - selected_band_key (text, not null) # e.g., "A", "B"
    - created_at (timestamp with time zone, default: now())

    RLS Policies:
    - Users can manage value selections for ideas they can update.

This structure provides a starting point. Indexes should be added to foreign keys and frequently queried columns.
Supabase's `auth.users` table will be the source of truth for user authentication details.
The `users` table in the public schema will store additional profile information and application-specific roles,
linked via `id (public.users) = auth.uid()`.
"""
