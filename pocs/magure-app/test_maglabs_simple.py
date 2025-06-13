#!/usr/bin/env python3
"""
Simple diagnostic test for MagLabs VLLM API
"""

import httpx
import json

API_BASE = "http://localhost:8001"

print("MagLabs VLLM API Diagnostic Test")
print("=" * 50)

# Test 1: Check if API is running
print("\n1. Testing API connectivity...")
try:
    response = httpx.get(f"{API_BASE}/")
    print(f"   ✓ API is running: {response.json()}")
except Exception as e:
    print(f"   ✗ API not reachable: {e}")
    exit(1)

# Test 2: Check available endpoints
print("\n2. Checking available endpoints...")
try:
    response = httpx.get(f"{API_BASE}/openapi.json")
    openapi = response.json()
    print(f"   ✓ API Title: {openapi['info']['title']}")
    print(f"   ✓ API Version: {openapi['info']['version']}")
    print("   ✓ Available endpoints:")
    for path in openapi['paths']:
        print(f"      - {path}")
except Exception as e:
    print(f"   ✗ Could not fetch OpenAPI spec: {e}")

# Test 3: Try different model configurations
print("\n3. Testing chat completions with different configurations...")

test_configs = [
    {
        "name": "Default model (ollama/phi3)",
        "payload": {
            "messages": [{"role": "user", "content": "Hi"}]
        }
    },
    {
        "name": "With explicit model",
        "payload": {
            "model": "ollama/phi3",
            "messages": [{"role": "user", "content": "Hi"}]
        }
    },
    {
        "name": "With system message",
        "payload": {
            "messages": [
                {"role": "system", "content": "You are helpful."},
                {"role": "user", "content": "Hi"}
            ]
        }
    },
    {
        "name": "Different model (gpt-4o-mini)",
        "payload": {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Hi"}]
        }
    },
    {
        "name": "Empty model string",
        "payload": {
            "model": "",
            "messages": [{"role": "user", "content": "Hi"}]
        }
    }
]

for config in test_configs:
    print(f"\n   Testing: {config['name']}")
    print(f"   Payload: {json.dumps(config['payload'], indent=2)}")
    
    try:
        response = httpx.post(
            f"{API_BASE}/v1/chat/completions",
            json=config['payload'],
            timeout=10.0
        )
        
        if response.status_code == 200:
            data = response.json()
            if "choices" in data and data["choices"]:
                content = data["choices"][0]["message"]["content"]
                print(f"   ✓ Success! Response: {content[:50]}...")
            else:
                print(f"   ✓ Success but unexpected format: {json.dumps(data)[:100]}...")
        else:
            print(f"   ✗ Failed with status {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"   ✗ Error: {type(e).__name__}: {str(e)}")

print("\n" + "=" * 50)
print("Diagnostics complete!")
print("\nIf all tests are failing with 500 errors, please check:")
print("1. The MagLabs API terminal for error messages")
print("2. Whether Ollama is installed and running")
print("3. Whether the required models are downloaded")
print("4. The environment variables in run_server.sh")