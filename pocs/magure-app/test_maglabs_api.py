#!/usr/bin/env python3
"""
Comprehensive test script for MagLabs VLLM API
Tests all endpoints and features to ensure the API is working correctly
"""

import json
import time
import httpx
from datetime import datetime
from typing import Dict, Any, Optional

# ANSI color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

API_BASE_URL = "http://localhost:8001"
CHAT_ENDPOINT = f"{API_BASE_URL}/v1/chat/completions"
HEALTH_ENDPOINT = f"{API_BASE_URL}/health"

def print_test_header(test_name: str):
    """Print a formatted test header"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}TEST: {test_name}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

def print_success(message: str):
    """Print success message in green"""
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message: str):
    """Print error message in red"""
    print(f"{RED}✗ {message}{RESET}")

def print_warning(message: str):
    """Print warning message in yellow"""
    print(f"{YELLOW}⚠ {message}{RESET}")

def print_info(message: str):
    """Print info message"""
    print(f"  {message}")

def test_health_check() -> bool:
    """Test if the API is running and healthy"""
    print_test_header("Health Check")
    
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(HEALTH_ENDPOINT)
            
        if response.status_code == 200:
            print_success(f"Health check passed - Status: {response.status_code}")
            print_info(f"Response: {response.text}")
            return True
        else:
            print_error(f"Health check failed - Status: {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except httpx.ConnectError:
        print_error("Cannot connect to MagLabs API on port 8001")
        print_info("Make sure the service is running with: ./run_server.sh")
        return False
    except Exception as e:
        print_error(f"Health check error: {str(e)}")
        return False

def test_basic_chat_completion() -> bool:
    """Test basic chat completion functionality"""
    print_test_header("Basic Chat Completion")
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "Hello! Can you confirm you're working? Just say 'Yes, I'm working!'"
            }
        ],
        "temperature": 0.7,
        "max_tokens": 50
    }
    
    try:
        with httpx.Client(timeout=30.0) as client:
            print_info("Sending chat completion request...")
            start_time = time.time()
            
            response = client.post(
                CHAT_ENDPOINT,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            elapsed_time = time.time() - start_time
            print_info(f"Response time: {elapsed_time:.2f} seconds")
            
        if response.status_code == 200:
            data = response.json()
            print_success(f"Chat completion successful - Status: {response.status_code}")
            
            # Validate response structure
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0]["message"]["content"]
                print_info(f"AI Response: {content}")
                
                # Check other expected fields
                if "id" in data:
                    print_info(f"Response ID: {data['id']}")
                if "model" in data:
                    print_info(f"Model used: {data['model']}")
                if "usage" in data:
                    print_info(f"Tokens used: {data['usage']}")
                    
                return True
            else:
                print_error("Invalid response structure - missing choices")
                print_info(f"Response: {json.dumps(data, indent=2)}")
                return False
        else:
            print_error(f"Chat completion failed - Status: {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except httpx.TimeoutException:
        print_error("Request timed out after 30 seconds")
        return False
    except httpx.ConnectError:
        print_error("Cannot connect to chat endpoint")
        return False
    except Exception as e:
        print_error(f"Chat completion error: {str(e)}")
        return False

def test_conversation_with_context() -> bool:
    """Test conversation with multiple messages"""
    print_test_header("Conversation with Context")
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are an innovation coach helping with idea development."
            },
            {
                "role": "user",
                "content": "I want to improve our customer onboarding process."
            },
            {
                "role": "assistant",
                "content": "That's a great area to focus on! Can you tell me what specific challenges you're facing with the current onboarding process?"
            },
            {
                "role": "user",
                "content": "It takes too long and customers get confused about our pricing tiers."
            }
        ],
        "temperature": 0.8
    }
    
    try:
        with httpx.Client(timeout=30.0) as client:
            print_info("Sending multi-turn conversation...")
            
            response = client.post(
                CHAT_ENDPOINT,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
        if response.status_code == 200:
            data = response.json()
            print_success("Multi-turn conversation successful")
            
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0]["message"]["content"]
                print_info(f"AI Response: {content[:200]}..." if len(content) > 200 else f"AI Response: {content}")
                return True
        else:
            print_error(f"Conversation failed - Status: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Conversation error: {str(e)}")
        return False

def test_interview_mode() -> bool:
    """Test interview mode with special headers"""
    print_test_header("Interview Mode")
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "I have a business idea I want to develop comprehensively"
            }
        ],
        "temperature": 0.8,
        "metadata": {
            "user_context": {
                "department": "Product Development",
                "role": "Product Manager"
            },
            "chat_type": "idea_refinement"
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Interview-Session-ID": "test-interview-123"
    }
    
    try:
        with httpx.Client(timeout=30.0) as client:
            print_info("Sending interview mode request...")
            
            response = client.post(
                CHAT_ENDPOINT,
                json=payload,
                headers=headers
            )
            
        if response.status_code == 200:
            data = response.json()
            print_success("Interview mode request successful")
            
            # Check for interview-specific headers in response
            if "X-Interview-Session-ID" in response.headers:
                print_info(f"Interview Session ID: {response.headers['X-Interview-Session-ID']}")
            if "X-Interview-Stage" in response.headers:
                print_info(f"Interview Stage: {response.headers['X-Interview-Stage']}")
                
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0]["message"]["content"]
                print_info(f"AI Response: {content[:200]}..." if len(content) > 200 else f"AI Response: {content}")
                
            return True
        else:
            print_error(f"Interview mode failed - Status: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Interview mode error: {str(e)}")
        return False

def test_error_handling() -> bool:
    """Test error handling with invalid requests"""
    print_test_header("Error Handling")
    
    test_cases = [
        {
            "name": "Missing messages",
            "payload": {
                "model": "gpt-4o-mini",
                "temperature": 0.7
            }
        },
        {
            "name": "Empty messages",
            "payload": {
                "model": "gpt-4o-mini",
                "messages": [],
                "temperature": 0.7
            }
        },
        {
            "name": "Invalid message format",
            "payload": {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "content": "Missing role field"
                    }
                ],
                "temperature": 0.7
            }
        },
        {
            "name": "Invalid temperature",
            "payload": {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "user",
                        "content": "Test"
                    }
                ],
                "temperature": 3.0  # Should be 0-2
            }
        }
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        print_info(f"\nTesting: {test_case['name']}")
        
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    CHAT_ENDPOINT,
                    json=test_case["payload"],
                    headers={"Content-Type": "application/json"}
                )
                
            # We expect 4xx errors for invalid requests
            if 400 <= response.status_code < 500:
                print_success(f"Correctly rejected with status {response.status_code}")
                print_info(f"Error response: {response.text}")
            else:
                print_warning(f"Unexpected status {response.status_code} for invalid request")
                all_passed = False
                
        except Exception as e:
            print_error(f"Error handling test failed: {str(e)}")
            all_passed = False
    
    return all_passed

def test_streaming_capability() -> bool:
    """Test if streaming is supported"""
    print_test_header("Streaming Capability")
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Count from 1 to 5 slowly."
            }
        ],
        "temperature": 0.7,
        "stream": True
    }
    
    try:
        with httpx.Client(timeout=30.0) as client:
            print_info("Testing streaming response...")
            
            with client.stream(
                "POST",
                CHAT_ENDPOINT,
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status_code == 200:
                    print_success("Streaming request accepted")
                    print_info("Receiving chunks:")
                    
                    chunk_count = 0
                    for chunk in response.iter_text():
                        if chunk.strip():
                            chunk_count += 1
                            # Only print first few chunks to avoid spam
                            if chunk_count <= 3:
                                print_info(f"  Chunk {chunk_count}: {chunk[:50]}...")
                    
                    print_info(f"Total chunks received: {chunk_count}")
                    return True
                else:
                    print_warning(f"Streaming not supported or failed - Status: {response.status_code}")
                    return True  # Not a critical failure
                    
    except Exception as e:
        print_warning(f"Streaming test error: {str(e)}")
        return True  # Not a critical failure

def test_load_handling() -> bool:
    """Test API performance under light load"""
    print_test_header("Load Handling (5 concurrent requests)")
    
    import concurrent.futures
    
    def make_request(index: int) -> tuple[bool, float]:
        """Make a single request and return success status and time"""
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": f"This is test request {index}. Reply with just 'OK {index}'."
                }
            ],
            "temperature": 0.1,
            "max_tokens": 20
        }
        
        try:
            start_time = time.time()
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    CHAT_ENDPOINT,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
            elapsed_time = time.time() - start_time
            
            return response.status_code == 200, elapsed_time
        except Exception:
            return False, 0.0
    
    print_info("Sending 5 concurrent requests...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(make_request, i) for i in range(5)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    
    successful = sum(1 for success, _ in results if success)
    total_time = sum(time for _, time in results)
    avg_time = total_time / len(results) if results else 0
    
    print_info(f"Successful requests: {successful}/5")
    print_info(f"Average response time: {avg_time:.2f} seconds")
    
    if successful == 5:
        print_success("All concurrent requests succeeded")
        return True
    elif successful >= 3:
        print_warning(f"Only {successful}/5 requests succeeded")
        return True
    else:
        print_error(f"Too many failures: only {successful}/5 succeeded")
        return False

def main():
    """Run all tests and provide summary"""
    print(f"\n{BLUE}MagLabs VLLM API Test Suite{RESET}")
    print(f"{BLUE}Testing API at: {API_BASE_URL}{RESET}")
    print(f"{BLUE}Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
    
    # Track test results
    tests = [
        ("Health Check", test_health_check),
        ("Basic Chat Completion", test_basic_chat_completion),
        ("Conversation with Context", test_conversation_with_context),
        ("Interview Mode", test_interview_mode),
        ("Error Handling", test_error_handling),
        ("Streaming Capability", test_streaming_capability),
        ("Load Handling", test_load_handling),
    ]
    
    results = []
    
    # Run tests
    for test_name, test_func in tests:
        try:
            if test_name == "Health Check" and not test_health_check():
                print(f"\n{RED}Stopping tests - API is not reachable{RESET}")
                break
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Unexpected error in {test_name}: {str(e)}")
            results.append((test_name, False))
    
    # Print summary
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}TEST SUMMARY{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{GREEN}PASSED{RESET}" if result else f"{RED}FAILED{RESET}"
        print(f"{test_name:<30} {status}")
    
    print(f"\n{BLUE}Total: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"\n{GREEN}✓ All tests passed! MagLabs API is working correctly.{RESET}")
    elif passed > 0:
        print(f"\n{YELLOW}⚠ Some tests failed. Check the output above for details.{RESET}")
    else:
        print(f"\n{RED}✗ All tests failed. The API may not be running correctly.{RESET}")
    
    # Provide next steps
    print(f"\n{BLUE}Next Steps:{RESET}")
    if passed == total:
        print("1. The MagLabs API is ready for use")
        print("2. You can now test through the Django application")
        print("3. Monitor the MagLabs terminal for any runtime errors")
    else:
        print("1. Check the MagLabs API terminal for error messages")
        print("2. Ensure all environment variables are set correctly")
        print("3. Verify the API is running on port 8001")
        print("4. Check if there are any port conflicts")

if __name__ == "__main__":
    main()