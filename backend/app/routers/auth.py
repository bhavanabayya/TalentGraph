"""
Authentication endpoints: signup, login.

1. for logging
 - records useful logs (signup/login events)
 
2. fastapi pieces:
 - APIRouter → defines a grouped set of routes
 - HTTPException → throws proper API errors
 - Depends → dependency injection (DB session)
 - status → standard HTTP status codes

3. sqlmodel.Session, select → DB session + query builder
 - get_session → function that provides DB session per request

4. Models:

 - User → main auth identity table
 - Candidate → candidate profile table (linked to user)
 - CompanyAccount → company entity table
 - CompanyUser → employee inside a company (linked to user + company)

5.Schemas:

 - SignUpRequest → what signup expects in JSON
 - LoginRequest → what login expects
 - LoginResponse → what login returns

6. Security:

 - hash_password() → converts raw password to stored hash
 - verify_password() → checks raw password vs stored hash
 - create_access_token() → generates JWT


 """

import logging
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import User, Candidate, CompanyAccount, CompanyUser
from ..schemas import SignUpRequest, LoginRequest, LoginResponse
from ..security import hash_password, verify_password, create_access_token

logger = logging.getLogger(__name__)
# All endpoints start with /auth
router = APIRouter(prefix="/auth", tags=["auth"])
logger.info("Auth router initialized")

#creates a new user for candidate or the company 
@router.post("/signup", response_model=dict)
def signup(req: SignUpRequest, session: Session = Depends(get_session)):
    """
    Sign up a new user (candidate or company).
    Returns success message - user can immediately login.
    """
    email_lower = req.email.lower()
    logger.info(f"[SIGNUP] Starting signup for email: {email_lower}, type: {req.user_type}")
    
    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.email == email_lower)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate user type
    if req.user_type not in ["candidate", "company"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_type. Must be 'candidate' or 'company'"
        )
    
    # Validate company role before committing user to avoid orphaned accounts
    if req.user_type == "company":
        if not req.company_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="company_role required for company users"
            )

        if req.company_role not in ["ADMIN", "HR", "RECRUITER"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="company_role must be ADMIN, HR, or RECRUITER"
            )

    # Hash password
    password_hash = hash_password(req.password)

    # Create user
    new_user = User(
        email=email_lower,
        password_hash=password_hash,
        user_type=req.user_type
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    logger.info(f"[SIGNUP] Created User ID {new_user.id} for {email_lower}")

    # Create candidate profile
    if req.user_type == "candidate":
        candidate = Candidate(
            user_id=new_user.id,
            name="",
            email=email_lower,
            is_general_info_complete=False
        )
        session.add(candidate)
        session.commit()
        logger.info(f"[SIGNUP] Created Candidate profile for User ID {new_user.id}")
    
    # Create company profile
    elif req.user_type == "company":
        # Create company account
        company_account = CompanyAccount(
            company_name="",
            domain="",
            hq_location=""
        )
        session.add(company_account)
        session.commit()
        session.refresh(company_account)
        
        # Create company user
        company_user = CompanyUser(
            user_id=new_user.id,
            company_id=company_account.id,
            first_name="",
            last_name="",
            role=req.company_role
        )
        session.add(company_user)
        session.commit()
        logger.info(f"[SIGNUP] Created Company Account ID {company_account.id} and CompanyUser for User ID {new_user.id}")
    
    return {
        "ok": True,
        "message": f"Signup successful! You can now login with {email_lower}",
        "user_id": new_user.id,
        "user_type": new_user.user_type
    }

#verifies the credentials and returns a jwt token
@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, session: Session = Depends(get_session)):
    """
    Login with email and password.
    Returns JWT access token immediately.
    """
    email_lower = req.email.lower()
    logger.info(f"[LOGIN] Login attempt for: {email_lower}")
    
    # Find user from the database 
    user = session.exec(select(User).where(User.email == email_lower)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
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
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        user_type=user.user_type,
        message=f"Login successful!"
    )

#simple test endpoint to verify the auth router is working
@router.get("/test")
def test_auth():
    """Simple test endpoint"""
    return {"status": "ok", "message": "Auth router is working"}
