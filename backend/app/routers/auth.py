"""
Authentication endpoints: signup, login, send-otp, verify-otp.
"""

import os
import time
import random
import smtplib
import logging
from email.mime.text import MIMEText
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import User, Candidate, CompanyAccount, CompanyUser, OTPStore
from ..schemas import (
    SignUpRequest, LoginRequest, LoginResponse,
    SendOTPRequest, SendOTPResponse,
    VerifyOTPRequest, VerifyOTPResponse
)
from ..security import hash_password, verify_password, create_access_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

logger.info("Auth router initialized")# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "TalentGraph")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)

OTP_EXPIRY_SECONDS = 600  # 10 minutes


def _send_email_otp(to_email: str, code: str) -> None:
    """Send OTP via SMTP."""
    if not (SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD):
        print(f"[DEV] OTP Code for {to_email}: {code}")
        return
    
    try:
        subject = "Your TalentGraph Login Verification Code"
        body = f"Your verification code is: {code}\n\nThis code expires in 10 minutes."
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {str(e)}")


@router.post("/signup", response_model=dict)
def signup(req: SignUpRequest, session: Session = Depends(get_session)):
    """
    Sign up a new user (candidate or company).
    After signup, user must call /auth/send-otp and /auth/verify-otp to complete login.
    """
    email_lower = req.email.lower()
    logger.info(f"[SIGNUP] Starting signup for email: {email_lower}, type: {req.user_type}")
    
    # Check if user already exists
    existing = session.exec(select(User).where(User.email == email_lower)).first()
    if existing:
        logger.warning(f"[SIGNUP] User already exists: {email_lower}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create user
    logger.info(f"[SIGNUP] Creating user account for {email_lower}")
    password_hash = hash_password(req.password)
    user = User(
        email=email_lower,
        password_hash=password_hash,
        user_type=req.user_type
    )
    session.add(user)
    session.flush()  # Get the user ID
    logger.info(f"[SIGNUP] User created with ID: {user.id}")
    
    # Create candidate or company user profile
    if req.user_type == "candidate":
        logger.info(f"[SIGNUP] Creating candidate profile for user {user.id}")
        candidate = Candidate(
            user_id=user.id,
            name=email_lower.split("@")[0]  # Default name
        )
        session.add(candidate)
        logger.info(f"[SIGNUP] Candidate profile created for {user.id}")
    elif req.user_type == "company":
        logger.info(f"[SIGNUP] Creating company account and CompanyUser for {user.id}")
        
        # Validate company_role
        valid_roles = ["ADMIN", "HR", "RECRUITER"]
        if not req.company_role or req.company_role not in valid_roles:
            logger.warning(f"[SIGNUP] Invalid company_role: {req.company_role}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"For company users, company_role must be one of: {', '.join(valid_roles)}"
            )
        
        # Create CompanyAccount and CompanyUser for company
        company = CompanyAccount(
            company_name=email_lower.split("@")[1].capitalize(),  # Default company name from domain
            domain=email_lower.split("@")[1]
        )
        session.add(company)
        session.flush()  # Get the company ID
        logger.info(f"[SIGNUP] Company created with ID: {company.id}")
        
        # Create CompanyUser linking User to Company with selected role
        company_user = CompanyUser(
            user_id=user.id,
            company_id=company.id,
            first_name=email_lower.split("@")[0],
            last_name="",
            role=req.company_role  # Use the role selected during signup
        )
        logger.info(f"[SIGNUP] CompanyUser created linking user {user.id} to company {company.id} with role: {req.company_role}")
        session.add(company_user)
    
    session.commit()
    
    return {
        "ok": True,
        "message": "Signup successful. Please login to verify your email.",
        "user_id": user.id,
        "user_type": req.user_type
    }


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, session: Session = Depends(get_session)):
    """
    Login with email and password.
    Returns JWT token directly if password is correct.
    OTP is optional - stored in skip_otp flag (currently set to True for better UX).
    """
    email_lower = req.email.lower()
    logger.info(f"[LOGIN] Login attempt for email: {email_lower}")
    
    # Find user
    user = session.exec(select(User).where(User.email == email_lower)).first()
    if not user:
        logger.warning(f"[LOGIN] User not found: {email_lower}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    logger.info(f"[LOGIN] User found: {email_lower}, ID: {user.id}")
    
    # Verify password
    if not verify_password(req.password, user.password_hash):
        logger.warning(f"[LOGIN] Invalid password for user: {email_lower}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    logger.info(f"[LOGIN] Password verified for user: {email_lower}")
    
    if not user.is_active:
        logger.warning(f"[LOGIN] User account inactive: {email_lower}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create JWT token directly (skip OTP for returning users)
    logger.info(f"[LOGIN] Creating JWT token for user: {email_lower}")
    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "user_type": user.user_type
    }
    
    # Add company role if company user
    if user.user_type == "company":
        logger.info(f"[LOGIN] User is company type, fetching CompanyUser record")
        company_user = session.exec(
            select(CompanyUser).where(CompanyUser.user_id == user.id)
        ).first()
        if company_user:
            token_data["company_role"] = company_user.role
            token_data["company_id"] = company_user.company_id
            logger.info(f"[LOGIN] CompanyUser found: role={company_user.role}, company_id={company_user.company_id}")
            token_data["company_id"] = company_user.company_id
    
    access_token = create_access_token(token_data)
    
    return LoginResponse(
        needs_otp=False,
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        user_type=user.user_type,
        message=f"Login successful!"
    )


@router.post("/send-otp", response_model=SendOTPResponse)
def send_otp(req: SendOTPRequest, session: Session = Depends(get_session)):
    """
    Send OTP code to email for multi-factor authentication.
    """
    email_lower = req.email.lower()
    
    # Check user exists
    user = session.exec(select(User).where(User.email == email_lower)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    # Generate OTP
    code = f"{random.randint(100000, 999999)}"
    expires_at = int(time.time()) + OTP_EXPIRY_SECONDS
    
    # Save OTP to database
    otp_record = OTPStore(
        email=email_lower,
        code=code,
        expires_at=expires_at
    )
    session.add(otp_record)
    session.commit()
    
    # Send email
    try:
        _send_email_otp(email_lower, code)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}"
        )
    
    return SendOTPResponse(
        ok=True,
        message=f"OTP sent to {email_lower}",
        expires_in_sec=OTP_EXPIRY_SECONDS
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(req: VerifyOTPRequest, session: Session = Depends(get_session)):
    """
    Verify OTP code and issue JWT access token.
    """
    email_lower = req.email.lower()
    
    # Find user
    user = session.exec(select(User).where(User.email == email_lower)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    # Find latest OTP record
    otp_record = session.exec(
        select(OTPStore)
        .where(OTPStore.email == email_lower)
        .order_by(OTPStore.created_at.desc())
    ).first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found. Please request a new one."
        )
    
    # Check expiry
    if int(time.time()) > otp_record.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired. Please request a new code."
        )
    
    # Verify code
    if req.code.strip() != otp_record.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    # Mark OTP as used (or delete it)
    session.delete(otp_record)
    session.commit()
    
    # Create JWT token with user claims
    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "user_type": user.user_type
    }
    
    # Add company role if company user
    if user.user_type == "company":
        company_user = session.exec(
            select(CompanyUser).where(CompanyUser.user_id == user.id)
        ).first()
        if company_user:
            token_data["company_role"] = company_user.role
            token_data["company_id"] = company_user.company_id
    
    access_token = create_access_token(token_data)
    
    return VerifyOTPResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        user_type=user.user_type
    )
