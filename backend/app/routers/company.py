"""
Company endpoints: profiles, employee management, job posting.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import CompanyAccount, CompanyUser, User, JobPost
from ..schemas import (
    CompanyAccountCreate, CompanyAccountRead, CompanyProfileRead, CompanyUserRead
)
from ..security import (
    get_current_user, require_company_user, require_company_role
)

router = APIRouter(prefix="/company", tags=["company"])


@router.post("/create-account", response_model=dict)
def create_company_account(
    req: CompanyAccountCreate,
    current_user: dict = Depends(require_company_user),
    session: Session = Depends(get_session)
):
    """
    Create a new company account (only first user/admin can do this).
    """
    user_id = current_user.get("user_id")
    email = current_user.get("sub")
    
    # Check if user already has a company
    existing_company_user = session.exec(
        select(CompanyUser).where(CompanyUser.user_id == user_id)
    ).first()
    if existing_company_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a company"
        )
    
    # Create company account
    company = CompanyAccount(
        company_name=req.company_name,
        domain=req.domain,
        hq_location=req.hq_location,
        description=req.description,
        logo_path=req.logo_path
    )
    session.add(company)
    session.flush()
    
    # Add user as ADMIN
    company_user = CompanyUser(
        user_id=user_id,
        company_id=company.id,
        first_name=email.split("@")[0],
        last_name="Admin",
        role="ADMIN"
    )
    session.add(company_user)
    session.commit()
    
    return {
        "ok": True,
        "company_id": company.id,
        "message": f"Company '{req.company_name}' created successfully"
    }


@router.get("/profile", response_model=CompanyProfileRead)
def get_company_profile(
    current_user: dict = Depends(require_company_user),
    session: Session = Depends(get_session)
):
    """
    Get current user's company profile.
    """
    user_id = current_user.get("user_id")
    
    company_user = session.exec(
        select(CompanyUser).where(CompanyUser.user_id == user_id)
    ).first()
    if not company_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company user not found"
        )
    
    company = company_user.company
    
    # Convert to response model
    users_read = [
        CompanyUserRead(
            id=cu.id,
            first_name=cu.first_name,
            last_name=cu.last_name,
            role=cu.role,
            is_active=cu.is_active
        )
        for cu in company.company_users
    ]
    
    return CompanyProfileRead(
        id=company.id,
        company_name=company.company_name,
        domain=company.domain,
        hq_location=company.hq_location,
        description=company.description,
        logo_path=company.logo_path,
        company_users=users_read
    )


@router.post("/invite-employee", response_model=dict)
def invite_employee(
    employee_email: str,
    first_name: str,
    last_name: str,
    role: str,
    current_user: dict = Depends(require_company_role(["HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Invite a new employee to the company (HR/ADMIN only).
    
    Employee must first sign up, then admin invites them to company.
    """
    user_id = current_user.get("user_id")
    company_id = current_user.get("company_id")
    
    # Check if inviter is admin/hr in company
    inviter = session.exec(
        select(CompanyUser).where(CompanyUser.user_id == user_id)
    ).first()
    if not inviter or inviter.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not authorized in this company"
        )
    
    # Find employee user
    emp_user = session.exec(
        select(User).where(User.email == employee_email.lower())
    ).first()
    if not emp_user or emp_user.user_type != "company":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee not found or not a company user type"
        )
    
    # Check if already in company
    existing = session.exec(
        select(CompanyUser).where(CompanyUser.user_id == emp_user.id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee already in a company"
        )
    
    # Create company user record
    company_user = CompanyUser(
        user_id=emp_user.id,
        company_id=company_id,
        first_name=first_name,
        last_name=last_name,
        role=role
    )
    session.add(company_user)
    session.commit()
    
    return {
        "ok": True,
        "company_user_id": company_user.id,
        "message": f"Employee {employee_email} added with role {role}"
    }


@router.get("/employees", response_model=list[CompanyUserRead])
def list_employees(
    current_user: dict = Depends(require_company_user),
    session: Session = Depends(get_session)
):
    """
    List all employees in the company.
    """
    user_id = current_user.get("user_id")
    company_id = current_user.get("company_id")
    
    employees = session.exec(
        select(CompanyUser).where(CompanyUser.company_id == company_id)
    ).all()
    
    return [
        CompanyUserRead(
            id=emp.id,
            first_name=emp.first_name,
            last_name=emp.last_name,
            role=emp.role,
            is_active=emp.is_active
        )
        for emp in employees
    ]
