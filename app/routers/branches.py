from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from .. import crud, schemas, auth
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/branches", tags=["branches"])

@router.get("/test")
def test_endpoint():
    """Test endpoint to verify router is working"""
    return {"message": "Branches router is working"}

@router.get("/", response_model=List[Dict[str, Any]])
def get_branches(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=100),
    district: Optional[str] = None,
    is_active: Optional[bool] = True
):
    """Get all branches with optional filtering"""
    try:
        print(f"🏢 ROUTER: Getting branches with filters - district:{district}, is_active:{is_active}")
        
        branches = crud.get_branches_list()
        
        # Apply filters
        if district:
            branches = [b for b in branches if b.get('district', '').lower() == district.lower()]
        
        if is_active is not None:
            branches = [b for b in branches if b.get('is_active') == is_active]
        
        # Apply pagination
        start = skip
        end = skip + limit
        paginated_branches = branches[start:end] if branches else []
        
        print(f"🏢 ROUTER: Retrieved {len(paginated_branches)} branches")
        return paginated_branches
        
    except Exception as e:
        print(f"❌ ROUTER: Error getting branches: {e}")
        logger.error(f"Error getting branches: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve branches")

@router.get("/{branch_id}", response_model=Dict[str, Any])
def get_branch(branch_id: str):
    """Get branch by ID"""
    try:
        branch = crud.get_branch(branch_id)
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        return branch
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting branch {branch_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve branch")

@router.post("/", response_model=Dict[str, Any])
def create_branch(
    branch: schemas.BranchCreate, 
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin"]))
):
    """Create a new branch (Admin only)"""
    try:
        branch_data = branch.dict()
        result = crud.create_branch(branch_data)
        
        if not result.get('success', True):
            raise HTTPException(status_code=400, detail=result.get('error_message', 'Failed to create branch'))
        
        return {
            "message": "Branch created successfully",
            "branch_id": result.get('branch_id'),
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating branch: {e}")
        raise HTTPException(status_code=500, detail="Failed to create branch")

@router.put("/{branch_id}", response_model=Dict[str, Any])
def update_branch(
    branch_id: str,
    branch: schemas.BranchUpdate,
    current_user: Dict[str, Any] = Depends(auth.require_role(["admin"]))
):
    """Update branch (Admin only)"""
    try:
        existing_branch = crud.get_branch(branch_id)
        if not existing_branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        
        update_data = branch.dict(exclude_unset=True)
        result = crud.update_branch(branch_id, update_data)
        
        if not result.get('success', True):
            raise HTTPException(status_code=400, detail=result.get('error_message', 'Failed to update branch'))
        
        return {
            "message": "Branch updated successfully",
            "branch_id": branch_id,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating branch {branch_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update branch")