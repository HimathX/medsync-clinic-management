"""
Insurance Claims Management Router
Handles claim submission, processing, and reimbursement calculations
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field
from core.database import get_db
import logging

router = APIRouter(tags=["claims"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC SCHEMAS
# ============================================

class TreatmentCoveragePolicy(BaseModel):
    coverage_id: str
    insurance_id: str
    treatment_id: str
    coverage_percentage: float = Field(..., ge=0, le=100)
    max_coverage_amount: Optional[float] = None
    requires_preauth: bool = False
    min_treatment_cost: Optional[float] = None
    is_active: bool = True
    effective_from: date
    effective_to: Optional[date] = None

class InsurancePolicyLimits(BaseModel):
    limit_id: str
    insurance_id: str
    plan_year: int
    annual_limit: Optional[float] = None
    copay_amount: Optional[float] = None
    deductible_amount: Optional[float] = None

class ClaimRequest(BaseModel):
    patient_id: str = Field(..., description="Patient UUID")
    invoice_id: str = Field(..., description="Invoice UUID")
    treatment_id: str = Field(..., description="Treatment UUID")
    insurance_id: str = Field(..., description="Insurance UUID")
    treatment_cost: float = Field(..., gt=0, description="Treatment cost in LKR")

class ClaimDecisionRequest(BaseModel):
    claim_id: str
    new_status: int = Field(..., description="3=APPROVED, 4=REJECTED, 5=PARTIAL")
    approved_amount: Optional[float] = None
    rejection_reason: Optional[str] = None

class ClaimResponse(BaseModel):
    claim_id: str
    patient_id: str
    patient_name: str
    insurance_company: str
    treatment_name: str
    claim_amount: float
    approved_amount: Optional[float]
    status: str
    submitted_date: datetime
    approved_date: Optional[datetime]

# ============================================
# COVERAGE POLICY ENDPOINTS
# ============================================

@router.post("/coverage-policies", status_code=status.HTTP_201_CREATED)
def create_coverage_policy(policy: TreatmentCoveragePolicy):
    """Create a new treatment coverage policy for an insurance company"""
    try:
        with get_db() as (cursor, connection):
            coverage_id = str(__import__('uuid').uuid4())
            
            query = """
                INSERT INTO treatment_coverage_policy (
                    coverage_id, insurance_id, treatment_id, coverage_percentage,
                    max_coverage_amount, requires_preauth, min_treatment_cost,
                    is_active, effective_from, effective_to
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(query, (
                coverage_id, policy.insurance_id, policy.treatment_id,
                policy.coverage_percentage, policy.max_coverage_amount,
                policy.requires_preauth, policy.min_treatment_cost,
                policy.is_active, policy.effective_from, policy.effective_to
            ))
            connection.commit()
            
            logger.info(f"✅ Coverage policy created: {coverage_id}")
            return {
                "success": True,
                "coverage_id": coverage_id,
                "message": "Coverage policy created successfully"
            }
    except Exception as e:
        logger.error(f"Error creating coverage policy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating coverage policy: {str(e)}"
        )

@router.get("/coverage-policies/insurance/{insurance_id}")
def get_coverage_policies(insurance_id: str):
    """Get all active coverage policies for an insurance company"""
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    tcp.coverage_id, tcp.insurance_id, tcp.treatment_id,
                    tcp.coverage_percentage, tcp.max_coverage_amount,
                    tc.treatment_name, i.insurance_company_name,
                    tcp.requires_preauth, tcp.effective_from, tcp.effective_to
                FROM treatment_coverage_policy tcp
                JOIN treatment_catalogue tc ON tcp.treatment_id = tc.treatment_id
                JOIN insurance i ON tcp.insurance_id = i.insurance_id
                WHERE tcp.insurance_id = %s AND tcp.is_active = TRUE
                ORDER BY tcp.effective_from DESC
            """
            
            cursor.execute(query, (insurance_id,))
            policies = cursor.fetchall()
            
            return {
                "insurance_id": insurance_id,
                "total_policies": len(policies),
                "policies": policies
            }
    except Exception as e:
        logger.error(f"Error fetching coverage policies: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching coverage policies: {str(e)}"
        )

# ============================================
# CLAIM ENDPOINTS
# ============================================

@router.post("/submit-claim", status_code=status.HTTP_201_CREATED)
def submit_insurance_claim(claim_request: ClaimRequest):
    """Submit an insurance claim for a treatment"""
    try:
        with get_db() as (cursor, connection):
            # Call stored procedure
            cursor.execute("SET @p_claim_id = NULL")
            cursor.execute("SET @p_success = NULL")
            cursor.execute("SET @p_error_message = NULL")
            
            cursor.execute("""
                CALL SubmitInsuranceClaim(
                    %s, %s, %s, %s, %s,
                    @p_claim_id, @p_success, @p_error_message
                )
            """, (
                claim_request.patient_id,
                claim_request.invoice_id,
                claim_request.treatment_id,
                claim_request.insurance_id,
                claim_request.treatment_cost
            ))
            
            cursor.execute("""
                SELECT @p_claim_id, @p_success, @p_error_message
            """)
            result = cursor.fetchone()
            
            claim_id = result['@p_claim_id']
            success = result['@p_success']
            error_message = result['@p_error_message']
            
            if success:
                logger.info(f"✅ Claim submitted: {claim_id}")
                return {
                    "success": True,
                    "claim_id": claim_id,
                    "message": error_message
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting claim: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting claim: {str(e)}"
        )

@router.post("/claims/{claim_id}/decision")
def process_claim_decision(claim_id: str, decision: ClaimDecisionRequest):
    """Approve, reject, or partially approve a claim"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SET @p_success = NULL")
            cursor.execute("SET @p_error_message = NULL")
            
            cursor.execute("""
                CALL ProcessClaimDecision(
                    %s, %s, %s, %s,
                    @p_success, @p_error_message
                )
            """, (
                claim_id,
                decision.new_status,
                decision.approved_amount,
                decision.rejection_reason
            ))
            
            cursor.execute("SELECT @p_success, @p_error_message")
            result = cursor.fetchone()
            
            if result['@p_success']:
                logger.info(f"✅ Claim decision processed: {claim_id}")
                return {
                    "success": True,
                    "claim_id": claim_id,
                    "message": result['@p_error_message']
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result['@p_error_message']
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing claim decision: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing claim decision: {str(e)}"
        )

@router.get("/patient/{patient_id}/claims")
def get_patient_claims(patient_id: str):
    """Get all claims for a patient"""
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    c.claim_id, c.patient_id, u.full_name as patient_name,
                    c.claim_amount, c.approved_amount, c.claim_status_id,
                    st.status_name, i.insurance_company_name,
                    tc.treatment_name, c.submitted_date, c.approved_date
                FROM claim c
                JOIN patient p ON c.patient_id = p.patient_id
                JOIN user u ON p.user_id = u.user_id
                JOIN insurance i ON c.insurance_id = i.insurance_id
                JOIN treatment_catalogue tc ON c.treatment_id = tc.treatment_id
                JOIN claim_status_type st ON c.claim_status_id = st.status_id
                WHERE c.patient_id = %s
                ORDER BY c.submitted_date DESC
            """
            
            cursor.execute(query, (patient_id,))
            claims = cursor.fetchall()
            
            return {
                "patient_id": patient_id,
                "total_claims": len(claims),
                "claims": claims
            }
    except Exception as e:
        logger.error(f"Error fetching patient claims: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching patient claims: {str(e)}"
        )

@router.get("/pending-claims")
def get_pending_claims(limit: int = Query(50, ge=1, le=500)):
    """Get all pending claims awaiting approval"""
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT * FROM pending_claims_view
                LIMIT %s
            """
            
            cursor.execute(query, (limit,))
            claims = cursor.fetchall()
            
            logger.info(f"Fetched {len(claims)} pending claims")
            return {
                "total_pending": len(claims),
                "claims": claims
            }
    except Exception as e:
        logger.error(f"Error fetching pending claims: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pending claims: {str(e)}"
        )

@router.get("/insurance/{insurance_id}/summary")
def get_insurance_summary(insurance_id: str):
    """Get insurance coverage and claim statistics"""
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    insurance_id, insurance_company_name, treatments_covered,
                    avg_coverage_percentage, total_claims, total_approved_amount,
                    rejected_claims
                FROM insurance_coverage_summary
                WHERE insurance_id = %s
            """
            
            cursor.execute(query, (insurance_id,))
            summary = cursor.fetchone()
            
            if not summary:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Insurance not found"
                )
            
            return {"summary": summary}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching insurance summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching insurance summary: {str(e)}"
        )

@router.get("/calculate-coverage")
def calculate_claim_amount(
    patient_id: str,
    invoice_id: str,
    treatment_id: str,
    insurance_id: str,
    treatment_cost: float
):
    """Calculate what would be covered before submitting a claim"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SET @p_covered_amount = NULL")
            cursor.execute("SET @p_patient_cost = NULL")
            cursor.execute("SET @p_is_eligible = NULL")
            cursor.execute("SET @p_message = NULL")
            
            cursor.execute("""
                CALL CalculateClaimAmount(
                    %s, %s, %s, %s, %s,
                    @p_covered_amount, @p_patient_cost, @p_is_eligible, @p_message
                )
            """, (patient_id, invoice_id, treatment_id, insurance_id, treatment_cost))
            
            cursor.execute("""
                SELECT @p_covered_amount, @p_patient_cost, @p_is_eligible, @p_message
            """)
            result = cursor.fetchone()
            
            return {
                "treatment_cost": treatment_cost,
                "covered_amount": result['@p_covered_amount'] or 0,
                "patient_cost": result['@p_patient_cost'] or treatment_cost,
                "is_eligible": result['@p_is_eligible'] or False,
                "message": result['@p_message']
            }
    except Exception as e:
        logger.error(f"Error calculating claim amount: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating claim amount: {str(e)}"
        )

@router.get("/claims/{claim_id}")
def get_claim_details(claim_id: str):
    """Get detailed information about a specific claim"""
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    c.claim_id, c.patient_id, u.full_name as patient_name,
                    c.claim_amount, c.approved_amount, c.claim_status_id,
                    st.status_name, i.insurance_company_name,
                    tc.treatment_name, c.submitted_date, c.approved_date,
                    c.rejection_reason, c.payment_status
                FROM claim c
                JOIN patient p ON c.patient_id = p.patient_id
                JOIN user u ON p.user_id = u.user_id
                JOIN insurance i ON c.insurance_id = i.insurance_id
                JOIN treatment_catalogue tc ON c.treatment_id = tc.treatment_id
                JOIN claim_status_type st ON c.claim_status_id = st.status_id
                WHERE c.claim_id = %s
            """
            
            cursor.execute(query, (claim_id,))
            claim = cursor.fetchone()
            
            if not claim:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Claim not found"
                )
            
            return {"claim": claim}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching claim details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching claim details: {str(e)}"
        )
