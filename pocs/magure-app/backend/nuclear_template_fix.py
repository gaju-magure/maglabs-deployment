#!/usr/bin/env python
"""
Nuclear option: Delete ALL template data and recreate from scratch
"""
import os
import sys
import json
import django

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.db import connection
from django_tenants.utils import get_tenant_model

def fix_templates_nuclear(schema_name):
    """Nuclear fix for templates in a specific tenant"""
    print(f"Nuclear fix for {schema_name}...")
    
    with connection.cursor() as cursor:
        # Set schema
        cursor.execute(f"SET search_path TO {schema_name}")
        
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = %s 
                AND table_name = 'ideas_chattemplate'
            )
        """, [schema_name])
        
        if not cursor.fetchone()[0]:
            print(f"  - Table ideas_chattemplate does not exist in {schema_name}")
            
            # Create the table manually with all required fields
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ideas_chattemplate (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    initial_prompt TEXT NOT NULL,
                    maglabs_interview_type VARCHAR(50) DEFAULT 'business_idea',
                    expected_stages JSONB DEFAULT '[]'::jsonb,
                    stage_prompts JSONB DEFAULT '{}'::jsonb,
                    conversation_goals TEXT DEFAULT '',
                    temperature DOUBLE PRECISION DEFAULT 0.7,
                    focus_stages JSONB DEFAULT '[]'::jsonb,
                    is_active BOOLEAN DEFAULT TRUE,
                    department_id INTEGER,
                    created_by_id INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            print(f"  - Created ideas_chattemplate table")
        else:
            # Drop and recreate to ensure clean state
            cursor.execute("DROP TABLE IF EXISTS ideas_chattemplate CASCADE")
            cursor.execute("""
                CREATE TABLE ideas_chattemplate (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    initial_prompt TEXT NOT NULL,
                    maglabs_interview_type VARCHAR(50) DEFAULT 'business_idea',
                    expected_stages JSONB DEFAULT '[]'::jsonb,
                    stage_prompts JSONB DEFAULT '{}'::jsonb,
                    conversation_goals TEXT DEFAULT '',
                    temperature DOUBLE PRECISION DEFAULT 0.7,
                    focus_stages JSONB DEFAULT '[]'::jsonb,
                    is_active BOOLEAN DEFAULT TRUE,
                    department_id INTEGER,
                    created_by_id INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            print(f"  - Recreated ideas_chattemplate table")
        
        # Insert fresh templates with proper JSON
        templates = [
            {
                'name': 'New Product Feature',
                'description': 'Brainstorm innovative features for existing products or services',
                'initial_prompt': "I'd like to brainstorm new features for our product/service. Can you help me explore creative ideas that could improve user experience or add value?",
                'expected_stages': '["user_profiling", "solution_brainstorming", "value_proposition"]',
                'stage_prompts': '{}',
                'focus_stages': '["solution_brainstorming"]'
            },
            {
                'name': 'Process Improvement',
                'description': 'Generate ideas to streamline and improve existing workflows',
                'initial_prompt': "I want to improve our current processes and workflows. Can you help me identify inefficiencies and brainstorm solutions?",
                'expected_stages': '["problem_analysis", "solution_brainstorming", "implementation_planning"]',
                'stage_prompts': '{}',
                'focus_stages': '["problem_analysis", "solution_brainstorming"]'
            },
            {
                'name': 'Customer Experience',
                'description': 'Develop ideas to improve customer satisfaction and engagement',
                'initial_prompt': "How can we enhance our customer experience? I'd like to explore ideas that make our customers happier and more engaged.",
                'expected_stages': '["user_profiling", "problem_analysis", "solution_brainstorming"]',
                'stage_prompts': '{}',
                'focus_stages': '["user_profiling", "solution_brainstorming"]'
            },
            {
                'name': 'Cost Reduction',
                'description': 'Identify opportunities to reduce costs without compromising quality',
                'initial_prompt': "I need to find ways to reduce costs in our operations. Can you help me identify areas where we might be overspending or inefficient?",
                'expected_stages': '["problem_analysis", "solution_brainstorming", "value_proposition"]',
                'stage_prompts': '{}',
                'focus_stages': '["problem_analysis"]'
            },
            {
                'name': 'Technology Innovation',
                'description': 'Explore how emerging technologies could benefit the organization',
                'initial_prompt': "What emerging technologies could we leverage to stay competitive? I want to explore innovative tech solutions for our business.",
                'expected_stages': '["solution_brainstorming", "value_proposition", "implementation_planning"]',
                'stage_prompts': '{}',
                'focus_stages': '["solution_brainstorming"]'
            },
            {
                'name': 'General Discussion',
                'description': 'Open-ended conversation about any topic',
                'initial_prompt': "",
                'expected_stages': '[]',
                'stage_prompts': '{}',
                'focus_stages': '[]'
            }
        ]
        
        for template in templates:
            cursor.execute("""
                INSERT INTO ideas_chattemplate 
                (name, description, initial_prompt, maglabs_interview_type, expected_stages, 
                 stage_prompts, conversation_goals, temperature, focus_stages, is_active)
                VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s, %s, %s::jsonb, %s)
            """, [
                template['name'],
                template['description'], 
                template['initial_prompt'],
                'business_idea',  # maglabs_interview_type
                template['expected_stages'],  # JSON string
                template['stage_prompts'],    # JSON string
                '',               # conversation_goals
                0.7,             # temperature
                template['focus_stages'],     # JSON string
                True             # is_active
            ])
            print(f"  - Created template: {template['name']}")
        
    print(f"  - All templates created for {schema_name}")

def main():
    # Fix all tenant schemas (skip public)
    Tenant = get_tenant_model()
    tenants = Tenant.objects.all()
    
    for tenant in tenants:
        if tenant.schema_name != 'public':
            try:
                fix_templates_nuclear(tenant.schema_name)
            except Exception as e:
                print(f"Error fixing {tenant.schema_name}: {e}")
    
    print("Nuclear template fix complete!")

if __name__ == '__main__':
    main()