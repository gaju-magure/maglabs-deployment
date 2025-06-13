#!/usr/bin/env python3
"""Debug test to understand what's causing the 500 errors."""

import httpx
import json

def test_with_debug():
    """Test with verbose output to understand the issue."""
    print("Debug Test for MagLabs API")
    print("=" * 40)
    
    # Test 1: Minimal possible request
    print("\n1. Testing minimal request...")
    payload = {"messages": [{"role": "user", "content": "hi"}]}
    
    try:
        with httpx.Client() as client:
            response = client.post(
                "http://localhost:8001/v1/chat/completions",
                json=payload,
                timeout=30.0
            )
            
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 500:
            print("Raw response:", response.text)
            
            # Check if it's HTML error page or JSON
            content_type = response.headers.get('content-type', '')
            if 'text/html' in content_type:
                print("Error: Server returned HTML error page instead of JSON")
            elif 'application/json' in content_type:
                try:
                    error_data = response.json()
                    print("JSON Error:", json.dumps(error_data, indent=2))
                except:
                    print("Could not parse JSON error response")
        else:
            print("Success! Response:", response.json())
            
    except Exception as e:
        print(f"Request failed: {e}")
    
    # Test 2: Check if it's model-specific
    print("\n2. Testing with explicit model...")
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "hi"}]
    }
    
    try:
        with httpx.Client() as client:
            response = client.post(
                "http://localhost:8001/v1/chat/completions",
                json=payload,
                timeout=30.0
            )
            
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print("Response:", response.text)
        else:
            data = response.json()
            print("Success!")
            print(f"Model used: {data.get('model', 'unknown')}")
            
    except Exception as e:
        print(f"Request failed: {e}")
    
    # Test 3: Try the idea assistant endpoint (we know this works)
    print("\n3. Testing idea assistant (known working endpoint)...")
    try:
        with httpx.Client() as client:
            response = client.post(
                "http://localhost:8001/v1/idea_assistant/start",
                json={"initial_message": "test idea"},
                timeout=30.0
            )
            
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Idea assistant works: {data.get('session_id', 'no session')}")
        else:
            print("Response:", response.text)
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_with_debug()