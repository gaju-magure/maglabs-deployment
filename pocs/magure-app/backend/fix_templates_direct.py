#!/usr/bin/env python
"""
Fix ChatTemplate table directly via SQL
"""
import os
import sys
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
        
        # Delete all existing templates (bypass Django ORM)
        cursor.execute("DELETE FROM ideas_chattemplate")
        print(f"  - Deleted all existing templates")
        
        # Insert fresh templates with proper JSON
        templates = [
            {
                'name': 'New Product Feature',
                'description': 'Brainstorm innovative features for existing products or services',
                'initial_prompt': "I'd like to brainstorm new features for our product/service. Can you help me explore creative ideas that could improve user experience or add value?"
            },
            {
                'name': 'Process Improvement',
                'description': 'Generate ideas to streamline and improve existing workflows',
                'initial_prompt': "I want to improve our current processes and workflows. Can you help me identify inefficiencies and brainstorm solutions?"
            },
            {
                'name': 'Customer Experience',
                'description': 'Develop ideas to improve customer satisfaction and engagement',
                'initial_prompt': "How can we enhance our customer experience? I'd like to explore ideas that make our customers happier and more engaged."
            },
            {
                'name': 'Cost Reduction',
                'description': 'Identify opportunities to reduce costs without compromising quality',
                'initial_prompt': "I need to find ways to reduce costs in our operations. Can you help me identify areas where we might be overspending or inefficient?"
            },
            {
                'name': 'Technology Innovation',
                'description': 'Explore how emerging technologies could benefit the organization',
                'initial_prompt': "What emerging technologies could we leverage to stay competitive? I want to explore innovative tech solutions for our business."
            },
            {
                'name': 'General Discussion',
                'description': 'Open-ended conversation about any topic',
                'initial_prompt': ""
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
                '[]',  # expected_stages as JSON string
                '{}',  # stage_prompts as JSON string
                '',    # conversation_goals
                0.7,   # temperature
                '[]',  # focus_stages as JSON string
                True   # is_active
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