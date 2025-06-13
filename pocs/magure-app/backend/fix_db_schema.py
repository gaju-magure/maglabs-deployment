#!/usr/bin/env python
"""
Direct database schema fix for conversation_type column removal
"""
import os
import sys
import django

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.db import connection
from django_tenants.utils import get_tenant_model

def fix_schema_for_tenant(schema_name):
    """Fix the schema for a specific tenant"""
    print(f"Fixing schema for {schema_name}...")
    
    with connection.cursor() as cursor:
        # Set schema
        cursor.execute(f"SET search_path TO {schema_name}")
        
        # Check if conversation_type exists in ChatSession
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='ideas_chatsession' 
            AND column_name='conversation_type'
            AND table_schema=%s
        """, [schema_name])
        
        if cursor.fetchone():
            print(f"  - Dropping conversation_type from ideas_chatsession in {schema_name}")
            cursor.execute("ALTER TABLE ideas_chatsession DROP COLUMN conversation_type")
        
        # Check if conversation_type exists in ChatTemplate
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='ideas_chattemplate' 
            AND column_name='conversation_type'
            AND table_schema=%s
        """, [schema_name])
        
        if cursor.fetchone():
            print(f"  - Dropping conversation_type from ideas_chattemplate in {schema_name}")
            cursor.execute("ALTER TABLE ideas_chattemplate DROP COLUMN conversation_type")
        
    print(f"  - Schema {schema_name} fixed!")

def main():
    # Fix public schema
    print("Fixing public schema...")
    fix_schema_for_tenant('public')
    
    # Fix all tenant schemas
    Tenant = get_tenant_model()
    tenants = Tenant.objects.all()
    
    for tenant in tenants:
        try:
            fix_schema_for_tenant(tenant.schema_name)
        except Exception as e:
            print(f"Error fixing {tenant.schema_name}: {e}")
    
    print("All schemas fixed!")

if __name__ == '__main__':
    main()