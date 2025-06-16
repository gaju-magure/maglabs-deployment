#!/usr/bin/env python
"""
Final fix for ChatTemplate JSON corruption
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

def fix_templates_for_tenant(schema_name):
    """Fix templates for a specific tenant"""
    print(f"Fixing templates for {schema_name}...")
    
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
            print(f"  - Table ideas_chattemplate does not exist in {schema_name}, skipping")
            return
        
        # Delete all existing templates (bypass Django ORM to avoid JSON parsing)
        cursor.execute("DELETE FROM ideas_chattemplate")
        print(f"  - Deleted all existing templates")
        
        # Insert fresh templates with proper JSON strings
        templates = [
            {
                'name': 'New Product Feature',
                'description': 'Brainstorm innovative features for existing products or services',
                'initial_prompt': "I'd like to brainstorm new features for our product/service. Can you help me explore creative ideas that could improve user experience or add value?",
                'expected_stages': json.dumps(['user_profiling', 'solution_brainstorming', 'value_proposition']),
                'stage_prompts': json.dumps({}),
                'focus_stages': json.dumps(['solution_brainstorming'])
            },
            {
                'name': 'Process Improvement',
                'description': 'Generate ideas to streamline and improve existing workflows',
                'initial_prompt': "I want to improve our current processes and workflows. Can you help me identify inefficiencies and brainstorm solutions?",
                'expected_stages': json.dumps(['problem_analysis', 'solution_brainstorming', 'implementation_planning']),
                'stage_prompts': json.dumps({}),
                'focus_stages': json.dumps(['problem_analysis', 'solution_brainstorming'])
            },
            {
                'name': 'Customer Experience',
                'description': 'Develop ideas to improve customer satisfaction and engagement',
                'initial_prompt': "How can we enhance our customer experience? I'd like to explore ideas that make our customers happier and more engaged.",
                'expected_stages': json.dumps(['user_profiling', 'problem_analysis', 'solution_brainstorming']),
                'stage_prompts': json.dumps({}),
                'focus_stages': json.dumps(['user_profiling', 'solution_brainstorming'])
            },
            {
                'name': 'Cost Reduction',
                'description': 'Identify opportunities to reduce costs without compromising quality',
                'initial_prompt': "I need to find ways to reduce costs in our operations. Can you help me identify areas where we might be overspending or inefficient?",
                'expected_stages': json.dumps(['problem_analysis', 'solution_brainstorming', 'value_proposition']),
                'stage_prompts': json.dumps({}),
                'focus_stages': json.dumps(['problem_analysis'])
            },
            {
                'name': 'Technology Innovation',
                'description': 'Explore how emerging technologies could benefit the organization',
                'initial_prompt': "What emerging technologies could we leverage to stay competitive? I want to explore innovative tech solutions for our business.",
                'expected_stages': json.dumps(['solution_brainstorming', 'value_proposition', 'implementation_planning']),
                'stage_prompts': json.dumps({}),
                'focus_stages': json.dumps(['solution_brainstorming'])
            },
            {
                'name': 'General Discussion',
                'description': 'Open-ended conversation about any topic',
                'initial_prompt': "",
                'expected_stages': json.dumps([]),
                'stage_prompts': json.dumps({}),
                'focus_stages': json.dumps([])
            }
        ]
        
        for template in templates:
            cursor.execute("""
                INSERT INTO ideas_chattemplate 
                (name, description, initial_prompt, maglabs_interview_type, expected_stages, 
                 stage_prompts, conversation_goals, temperature, focus_stages, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                fix_templates_for_tenant(tenant.schema_name)
            except Exception as e:
                print(f"Error fixing {tenant.schema_name}: {e}")
    
    print("All templates fixed!")

if __name__ == '__main__':
    main()