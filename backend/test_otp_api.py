#!/usr/bin/env python3
"""Test the /auth/send-otp endpoint locally."""

import requests
import json

API_BASE = "http://127.0.0.1:8000"

# Test sending OTP
print("Testing /auth/send-otp endpoint...")
try:
    resp = requests.post(
        f"{API_BASE}/auth/send-otp",
        json={"email": "test@example.com"},
        timeout=5
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {json.dumps(resp.json(), indent=2)}")
except requests.exceptions.ConnectionError:
    print("❌ Could not connect to API. Is the backend running?")
    print("   Run: uvicorn app.main:app --reload")
except Exception as e:
    print(f"❌ Error: {e}")
