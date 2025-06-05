#!/usr/bin/env python3
import asyncio
import httpx
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from app.core.config import settings

async def check_error():
    url = f'{settings.SUPABASE_URL}/rest/v1/users?select=id&limit=1'
    headers = {
        'apikey': settings.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
    }
    
    print(f"Testing URL: {url}")
    print(f"Headers: {headers}")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        print(f'Status: {response.status_code}')
        print(f'Response: {response.text}')

if __name__ == "__main__":
    asyncio.run(check_error())
