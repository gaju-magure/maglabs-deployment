#!/usr/bin/env python3
"""Check what environment variables are being read"""

import os
from pathlib import Path

# Add the project root to test environment loading
env_file = Path("/Users/gajanandsharma/magure/ai-lab/prototypes/maglabs-vllm-api/.env")

print("Environment Variable Check")
print("=" * 40)

print(f"\n1. .env file exists: {env_file.exists()}")

if env_file.exists():
    print(f"2. .env file contents for model config:")
    with open(env_file, 'r') as f:
        lines = f.readlines()
        for i, line in enumerate(lines, 1):
            if 'DEFAULT_MODEL_STRING' in line or 'ASSISTANT_MODEL_STRING' in line:
                print(f"   Line {i}: {line.strip()}")

print(f"\n3. Current environment variables:")
model_vars = [
    "DEFAULT_MODEL_STRING",
    "ASSISTANT_MODEL_STRING", 
    "LITELLM_DEFAULT_MODEL",
    "LITELLM_ASSISTANT_MODEL"
]

for var in model_vars:
    value = os.getenv(var, "NOT SET")
    print(f"   {var}: '{value}'")
    if value != "NOT SET" and "#" in value:
        print(f"     ⚠️  Contains comment: {value}")

print(f"\n4. Test clean parsing:")
# Simulate what should happen
test_value = "gpt-4o-mini    # Comment"
clean_value = test_value.split('#')[0].strip()
print(f"   Original: '{test_value}'")
print(f"   Cleaned:  '{clean_value}'")