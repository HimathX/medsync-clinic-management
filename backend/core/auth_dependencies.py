"""
Authentication Dependencies
Role-based access control helpers for FastAPI endpoints
"""
from fastapi import Depends, HTTPException, status
from typing import List, Dict, Any

from core.auth import get_current_user, get_doctor_details


# ============================================
# ROLE-BASED ACCESS CONTROL
# ============================================

def require_roles(allowed_roles: List[str]):
    """
    Dependency factory to require specific roles
    
    Args:
        allowed_roles: List of allowed role names
        
    Returns:
        FastAPI dependency function
        
    Example:
        @router.get("/admin-only")
        async def admin_endpoint(user = Depends(require_roles(['admin']))):
            pass
    """
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get('role') or current_user.get('user_type')
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    
    return role_checker


# ============================================
# SPECIFIC ROLE DEPENDENCIES
# ============================================

async def get_current_patient(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated patient
    
    Returns:
        Patient user dict with patient_id
        
    Raises:
        HTTPException: If user is not a patient
    """
    if current_user.get('user_type') != 'patient':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient access required"
        )
    
    if 'patient_id' not in current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient record not found"
        )
    
    return current_user


async def get_current_doctor(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated doctor
    
    Returns:
        Doctor user dict with doctor_id and employee_id
        
    Raises:
        HTTPException: If user is not a doctor
    """
    if current_user.get('role') != 'doctor':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor access required"
        )
    
    # Get doctor details if not already loaded
    if 'doctor_id' not in current_user:
        doctor = get_doctor_details(current_user['user_id'])
        if doctor:
            current_user.update(doctor)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor record not found"
            )
    
    return current_user


async def get_current_nurse(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated nurse
    
    Returns:
        Nurse user dict
        
    Raises:
        HTTPException: If user is not a nurse
    """
    if current_user.get('role') != 'nurse':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nurse access required"
        )
    return current_user


async def get_current_receptionist(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated receptionist
    
    Returns:
        Receptionist user dict
        
    Raises:
        HTTPException: If user is not a receptionist
    """
    if current_user.get('role') != 'receptionist':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionist access required"
        )
    return current_user


async def get_current_pharmacist(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated pharmacist
    
    Returns:
        Pharmacist user dict
        
    Raises:
        HTTPException: If user is not a pharmacist
    """
    if current_user.get('role') != 'pharmacist':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pharmacist access required"
        )
    return current_user


async def get_current_manager(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated manager or admin
    
    Returns:
        Manager/admin user dict
        
    Raises:
        HTTPException: If user is not a manager or admin
    """
    if current_user.get('role') not in ['manager', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or admin access required"
        )
    return current_user


async def get_current_admin(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated admin
    
    Returns:
        Admin user dict
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_employee(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated employee (any role)
    
    Returns:
        Employee user dict
        
    Raises:
        HTTPException: If user is not an employee
    """
    if current_user.get('user_type') != 'employee':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee access required"
        )
    
    if 'employee_id' not in current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee record not found"
        )
    
    return current_user