#!/usr/bin/env python3
"""Test SMTP connection with the configured credentials."""

import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from pathlib import Path

# Load env
load_dotenv(Path(__file__).resolve().parent / ".env")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)

print(f"SMTP_HOST: {SMTP_HOST}")
print(f"SMTP_PORT: {SMTP_PORT}")
print(f"SMTP_USERNAME: {SMTP_USERNAME}")
print(f"SMTP_FROM_EMAIL: {SMTP_FROM_EMAIL}")

if not all([SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD]):
    print("❌ Missing SMTP config!")
    exit(1)

try:
    print("\n🔗 Connecting to SMTP server...")
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        print("✓ TLS connection established")
        
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        print("✓ Login successful!")
        
        # Test send (to self)
        msg = MIMEText("Test OTP code: 123456")
        msg["Subject"] = "Test OTP Email"
        msg["From"] = SMTP_FROM_EMAIL
        msg["To"] = SMTP_USERNAME
        
        server.sendmail(SMTP_FROM_EMAIL, [SMTP_USERNAME], msg.as_string())
        print(f"✓ Test email sent to {SMTP_USERNAME}")
        
    print("\n✅ SMTP is working correctly!")
except smtplib.SMTPAuthenticationError as e:
    print(f"❌ Authentication failed: {e}")
    print("   Check SMTP_USERNAME and SMTP_PASSWORD in .env")
except smtplib.SMTPException as e:
    print(f"❌ SMTP error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
