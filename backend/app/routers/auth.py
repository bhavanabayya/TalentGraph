# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel, EmailStr
# from datetime import datetime, timedelta
# import random
# import smtplib
# import os

# router = APIRouter(prefix="/auth", tags=["Auth"])

# # In-memory store (POC only)
# OTP_STORE = {}

# SMTP_EMAIL = os.getenv("SMTP_EMAIL")
# SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# class SendOTPRequest(BaseModel):
#     email: EmailStr

# class VerifyOTPRequest(BaseModel):
#     email: EmailStr
#     code: str


# def send_email_otp(to_email: str, code: str):
#     subject = "Your Login Verification Code"
#     body = f"""
# Your verification code is: {code}

# This code will expire in 10 minutes.
# """
#     message = f"Subject: {subject}\n\n{body}"

#     with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
#         server.login(SMTP_EMAIL, SMTP_PASSWORD)
#         server.sendmail(SMTP_EMAIL, to_email, message)


# @router.post("/send-otp")
# def send_otp(req: SendOTPRequest):
#     code = str(random.randint(100000, 999999))
#     expiry = datetime.utcnow() + timedelta(minutes=10)

#     OTP_STORE[req.email] = {
#         "code": code,
#         "expires_at": expiry
#     }

#     try:
#         send_email_otp(req.email, code)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Email send failed: {e}")

#     return {"message": "OTP sent successfully"}


# @router.post("/verify-otp")
# def verify_otp(req: VerifyOTPRequest):
#     record = OTP_STORE.get(req.email)

#     if not record:
#         raise HTTPException(status_code=400, detail="No OTP found for this email")

#     if datetime.utcnow() > record["expires_at"]:
#         raise HTTPException(status_code=400, detail="OTP expired")

#     if req.code != record["code"]:
#         raise HTTPException(status_code=400, detail="Invalid OTP")

#     # OTP verified → delete it
#     del OTP_STORE[req.email]

#     return {"message": "OTP verified"}
import os
import time
import random
import smtplib
import jwt
from email.mime.text import MIMEText
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["auth"])

JWT_SECRET = os.getenv("APP_JWT_SECRET", "dev-secret")
JWT_EXP_MIN = int(os.getenv("APP_JWT_EXP_MIN", "120"))

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "TalentGraph")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)

# In-memory OTP store for POC (OK for Tuesday demo)
# key=email, value={"code": "123456", "expires_at": epoch_seconds}
OTP_STORE: dict[str, dict] = {}


class SendOtpRequest(BaseModel):
    email: EmailStr


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    code: str


def _send_email_otp(to_email: str, code: str) -> None:
    if not (SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM_EMAIL):
        raise RuntimeError("SMTP is not configured. Please set SMTP_* env vars.")

    subject = "Your login verification code"
    body = f"Your verification code is: {code}\n\nThis code expires in 10 minutes."
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = to_email

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())


def _mint_token(email: str) -> str:
    now = int(time.time())
    payload = {
        "sub": email,
        "iat": now,
        "exp": now + (JWT_EXP_MIN * 60),
        "iss": "talentgraph",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@router.post("/send-otp")
def send_otp(req: SendOtpRequest):
    code = f"{random.randint(100000, 999999)}"
    expires_at = int(time.time()) + 10 * 60  # 10 minutes
    OTP_STORE[req.email.lower()] = {"code": code, "expires_at": expires_at}

    try:
        _send_email_otp(req.email, code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {str(e)}")

    return {"ok": True, "message": "OTP sent", "expires_in_sec": 600}


@router.post("/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    key = req.email.lower()
    rec = OTP_STORE.get(key)
    if not rec:
        raise HTTPException(status_code=400, detail="No OTP requested for this email.")
    if int(time.time()) > int(rec["expires_at"]):
        OTP_STORE.pop(key, None)
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new code.")
    if req.code.strip() != rec["code"]:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    # One-time use
    OTP_STORE.pop(key, None)

    token = _mint_token(req.email)
    return {"access_token": token, "token_type": "bearer"}
