from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db

router = APIRouter(tags=["branches"])


@router.get("/", status_code=status.HTTP_200_OK)
def get_all_branches(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """Get all branches with pagination"""
    query = db.query(Branch)
    
    if is_active is not None:
        query = query.filter(Branch.is_active == is_active)
    
    branches = query.offset(skip).limit(limit).all()
    
    return {
        "total": query.count(),
        "branches": branches
    }

@router.get("/{branch_id}", status_code=status.HTTP_200_OK)
def get_branch_by_id(
    branch_id: str,
    db: Session = Depends(get_db)
):
    """Get branch details by ID"""
    branch = db.query(Branch).filter(Branch.branch_id == branch_id).first()
    
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with ID {branch_id} not found"
        )
    
    return {
        "branch": branch
    }

@router.get("/{branch_id}/employees", status_code=status.HTTP_200_OK)
def get_branch_employees(
    branch_id: str,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """Get all employees in a branch"""
    branch = db.query(Branch).filter(Branch.branch_id == branch_id).first()
    
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with ID {branch_id} not found"
        )
    
    query = db.query(Employee).filter(Employee.branch_id == branch_id)
    
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    
    employees = query.all()
    
    return {
        "branch_id": branch_id,
        "branch_name": branch.branch_name,
        "total": len(employees),
        "employees": employees
    }

@router.get("/{branch_id}/patients", status_code=status.HTTP_200_OK)
def get_branch_patients(
    branch_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all patients registered in a branch"""
    branch = db.query(Branch).filter(Branch.branch_id == branch_id).first()
    
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with ID {branch_id} not found"
        )
    
    patients = db.query(Patient).filter(
        Patient.registered_branch_id == branch_id
    ).offset(skip).limit(limit).all()
    
    total = db.query(Patient).filter(
        Patient.registered_branch_id == branch_id
    ).count()
    
    return {
        "branch_id": branch_id,
        "branch_name": branch.branch_name,
        "total": total,
        "patients": patients
    }

@router.get("/search/by-name/{branch_name}", status_code=status.HTTP_200_OK)
def search_branch_by_name(
    branch_name: str,
    db: Session = Depends(get_db)
):
    """Search branch by name (partial match)"""
    branches = db.query(Branch).filter(
        Branch.branch_name.like(f"%{branch_name}%")
    ).all()
    
    if not branches:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No branches found matching '{branch_name}'"
        )
    
    return {
        "search_term": branch_name,
        "total": len(branches),
        "branches": branches
    }
