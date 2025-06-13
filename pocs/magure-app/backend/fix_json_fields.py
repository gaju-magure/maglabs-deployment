#!/usr/bin/env python
"""
Fix JSON fields that have invalid data types
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

def fix_json_fields_for_tenant(schema_name):
    """Fix JSON fields for a specific tenant"""
    print(f"Fixing JSON fields for {schema_name}...")
    
    with connection.cursor() as cursor:
        # Set schema
        cursor.execute(f"SET search_path TO {schema_name}")
        
        # Fix ChatTemplate JSON fields
        cursor.execute("""
            UPDATE ideas_chattemplate 
            SET expected_stages = '[]'::jsonb
            WHERE expected_stages IS NULL OR expected_stages::text = 'null'
        """)
        
        cursor.execute("""
            UPDATE ideas_chattemplate 
            SET stage_prompts = '{}'::jsonb
            WHERE stage_prompts IS NULL OR stage_prompts::text = 'null'
        """)
        
        cursor.execute("""
            UPDATE ideas_chattemplate 
            SET focus_stages = '[]'::jsonb
            WHERE focus_stages IS NULL OR focus_stages::text = 'null'
        """)
        
        # Fix ChatSession JSON fields
        cursor.execute("""
            UPDATE ideas_chatsession 
            SET target_stages = '[]'::jsonb
            WHERE target_stages IS NULL OR target_stages::text = 'null'
        """)
        
        cursor.execute("""
            UPDATE ideas_chatsession 
            SET completed_stages = '[]'::jsonb
            WHERE completed_stages IS NULL OR completed_stages::text = 'null'
        """)
        
        cursor.execute("""
            UPDATE ideas_chatsession 
            SET context_metadata = '{}'::jsonb
            WHERE context_metadata IS NULL OR context_metadata::text = 'null'
        """)
        
        print(f"  - JSON fields fixed for {schema_name}")

def main():
    # Fix all tenant schemas (skip public)
    Tenant = get_tenant_model()
    tenants = Tenant.objects.all()
    
    for tenant in tenants:
        try:
            fix_json_fields_for_tenant(tenant.schema_name)
        except Exception as e:
            print(f"Error fixing {tenant.schema_name}: {e}")
    
    print("All JSON fields fixed!")

if __name__ == '__main__':
    main()