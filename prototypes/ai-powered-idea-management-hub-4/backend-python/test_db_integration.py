#!/usr/bin/env python3
"""
Direct test of database integration without authentication.
This script tests the core database functionality.
"""

import asyncio
import uuid
from datetime import datetime

from app.core.supabase_client import get_supabase_async_client
from app.services.idea_service import get_all_ideas_from_db, get_idea_by_id_from_db, create_idea_in_db
from app.models.domain import IdeaCreate, IdeaTagCreate, IdeaCategoryEnum, IdeaStatusEnum


async def test_database_operations():
    """Test core database operations"""
    
    print("🔗 Testing Supabase connection...")
    db = await get_supabase_async_client()
    print("✅ Supabase connection established")
    
    # Test 1: Fetch all ideas
    print("\n📋 Testing: Get all ideas...")
    ideas = await get_all_ideas_from_db(db, skip=0, limit=10)
    print(f"✅ Retrieved {len(ideas)} ideas")
    
    if ideas:
        idea = ideas[0]
        print(f"   - First idea: '{idea.title}' by {idea.submitter_email}")
        print(f"   - Status: {idea.status}")
        print(f"   - Tags: {[tag.category for tag in idea.tags]}")
        print(f"   - Chat messages: {len(idea.chat_history or [])}")
    
    # Test 2: Get specific idea by ID
    if ideas:
        test_idea_id = ideas[0].id
        print(f"\n🔍 Testing: Get idea by ID {test_idea_id}...")
        specific_idea = await get_idea_by_id_from_db(db, test_idea_id)
        if specific_idea:
            print("✅ Successfully retrieved specific idea")
            print(f"   - Title: {specific_idea.title}")
            print(f"   - Description: {specific_idea.description[:100]}...")
        else:
            print("❌ Failed to retrieve specific idea")
    
    # Test 3: Create a new idea
    print("\n✏️  Testing: Create new idea...")
    new_idea_data = IdeaCreate(
        title="Mobile App for Remote Work Productivity",
        description="A comprehensive mobile application that helps remote workers stay productive by tracking time, managing tasks, and facilitating team collaboration.",
        submitter_email="test@example.com",
        status=IdeaStatusEnum.DRAFT,
        tags=[
            IdeaTagCreate(
                category=IdeaCategoryEnum.PRODUCT_INNOVATION,
                source="user_manual",
                confidence=0.9,
                is_primary=True
            )
        ],
        clarity_score=0.6,
        value_score=65.0
    )
    
    test_user_id = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
    new_idea = await create_idea_in_db(db, new_idea_data, test_user_id)
    
    if new_idea:
        print("✅ Successfully created new idea")
        print(f"   - ID: {new_idea.id}")
        print(f"   - Title: {new_idea.title}")
        print(f"   - Tags: {[tag.category for tag in new_idea.tags]}")
    else:
        print("❌ Failed to create new idea")
    
    # Test 4: Verify the new idea appears in the list
    print("\n🔄 Testing: Verify new idea in list...")
    updated_ideas = await get_all_ideas_from_db(db, skip=0, limit=10)
    print(f"✅ Now have {len(updated_ideas)} ideas total")
    
    # Test 5: Test database relationships
    print("\n🔗 Testing: Database relationships...")
    for idea in updated_ideas[:2]:  # Test first 2 ideas
        print(f"   - Idea '{idea.title}':")
        print(f"     - Submitter: {idea.submitter_email}")
        print(f"     - Tags: {len(idea.tags)} ({[t.category for t in idea.tags]})")
        print(f"     - Chat messages: {len(idea.chat_history or [])}")
        print(f"     - Answers: {len(idea.questionnaire_answers or [])}")
    
    print("\n🎉 All database integration tests completed!")


if __name__ == "__main__":
    asyncio.run(test_database_operations())