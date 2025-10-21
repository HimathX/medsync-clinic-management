from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from pydantic import BaseModel, Field, validator
from core.database import get_db
from datetime import date
import logging
import uuid

router = APIRouter(tags=["claims"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# SCHEMAS
# ============================================

class ClaimCreate(BaseModel):
    invoice_id: str
    insurance_id: str
    claim_amount: float = Field(..., gt=0)
    claim_date: Optional[date] = None
    notes: Optional[str] = None
    
    @validator('invoice_id', 'insurance_id')
    def validate_uuid(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid UUID: {v}")

class ClaimResponse(BaseModel):
    success: bool
    message: str
    claim_id: Optional[str] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_claim(data: ClaimCreate):
    """Create claim with validation: insurance limits, copayment, patient matching"""
    try:
        with get_db() as (cursor, connection):
            # Complex query: Get invoice with patient
            cursor.execute("""
                SELECT i.*, (i.sub_total + i.tax_amount) as total, a.patient_id
                FROM invoice i
                JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                WHERE i.invoice_id = %s
            """, (data.invoice_id,))
            invoice = cursor.fetchone()
            if not invoice:
                raise HTTPException(404, "Invoice not found")
            
            # Complex query: Get insurance with package details
            cursor.execute("""
                SELECT ins.*, ip.annual_limit, ip.copayment_percentage, ip.package_name
                FROM insurance ins
                JOIN insurance_package ip ON ins.insurance_package_id = ip.insurance_package_id
                WHERE ins.insurance_id = %s
            """, (data.insurance_id,))
            insurance = cursor.fetchone()
            if not insurance:
                raise HTTPException(404, "Insurance not found")
            
            # Validation
            if insurance['status'] != 'Active':
                raise HTTPException(400, f"Insurance is {insurance['status']}")
            if insurance['patient_id'] != invoice['patient_id']:
                raise HTTPException(400, "Insurance/patient mismatch")
            
            # Check annual limit
            cursor.execute("""
                SELECT COALESCE(SUM(claim_amount), 0) as total
                FROM claim WHERE insurance_id = %s AND YEAR(claim_date) = YEAR(CURDATE())
            """, (data.insurance_id,))
            year_total = float(cursor.fetchone()['total'])
            remaining = float(insurance['annual_limit']) - year_total
            
            if remaining <= 0:
                raise HTTPException(400, "Annual limit reached")
            
            # Calculate max claimable
            copay = float(insurance['copayment_percentage'])
            max_claim = float(invoice['total']) * ((100 - copay) / 100)
            
            if data.claim_amount > max_claim:
                raise HTTPException(400, f"Max claimable: {max_claim:.2f} (after {copay}% copay)")
            if data.claim_amount > remaining:
                raise HTTPException(400, f"Exceeds remaining limit: {remaining:.2f}")
            
            # Create claim
            claim_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO claim (claim_id, invoice_id, insurance_id, claim_amount, claim_date, notes) VALUES (%s,%s,%s,%s,%s,%s)",
                (claim_id, data.invoice_id, data.insurance_id, data.claim_amount, data.claim_date or date.today(), data.notes)
            )
            connection.commit()
            
            return {"success": True, "message": f"Claim created. Remaining: {remaining - data.claim_amount:.2f}", "claim_id": claim_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/{claim_id}")
def get_claim_details(claim_id: str):
    """Get claim with full details using complex join query"""
    try:
        with get_db() as (cursor, connection):
            # Complex query with multiple joins
            cursor.execute("""
                SELECT 
                    c.*,
                    i.sub_total, i.tax_amount, (i.sub_total + i.tax_amount) as invoice_total,
                    ins.status as insurance_status,
                    ip.package_name, ip.annual_limit, ip.copayment_percentage,
                    u.full_name as patient_name, u.email as patient_email,
                    u_doc.full_name as doctor_name,
                    cr.symptoms, cr.diagnoses
                FROM claim c
                JOIN invoice i ON c.invoice_id = i.invoice_id
                JOIN insurance ins ON c.insurance_id = ins.insurance_id
                JOIN insurance_package ip ON ins.insurance_package_id = ip.insurance_package_id
                JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                JOIN user u ON a.patient_id = u.user_id
                JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
                JOIN user u_doc ON ts.doctor_id = u_doc.user_id
                WHERE c.claim_id = %s
            """, (claim_id,))
            claim = cursor.fetchone()
            if not claim:
                raise HTTPException(404, "Claim not found")
            return {"claim": claim}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/patient/{patient_id}")
def get_patient_claims(patient_id: str):
    """Get all claims for patient with insurance details"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("""
                SELECT c.*, (i.sub_total + i.tax_amount) as invoice_total,
                       ip.package_name, ip.copayment_percentage, ins.status
                FROM claim c
                JOIN invoice i ON c.invoice_id = i.invoice_id
                JOIN insurance ins ON c.insurance_id = ins.insurance_id
                JOIN insurance_package ip ON ins.insurance_package_id = ip.insurance_package_id
                JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
                JOIN appointment a ON cr.appointment_id = a.appointment_id
                WHERE a.patient_id = %s
                ORDER BY c.claim_date DESC
            """, (patient_id,))
            return {"claims": cursor.fetchall() or []}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/insurance/{insurance_id}/summary")
def get_insurance_summary(insurance_id: str):
    """Get insurance claim summary with limits and utilization"""
    try:
        with get_db() as (cursor, connection):
            # Get package info
            cursor.execute("""
                SELECT ip.annual_limit FROM insurance ins
                JOIN insurance_package ip ON ins.insurance_package_id = ip.insurance_package_id
                WHERE ins.insurance_id = %s
            """, (insurance_id,))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(404, "Insurance not found")
            annual_limit = float(result['annual_limit'])
            
            # Get year total
            cursor.execute("""
                SELECT COALESCE(SUM(claim_amount), 0) as year_total, COUNT(*) as count
                FROM claim WHERE insurance_id = %s AND YEAR(claim_date) = YEAR(CURDATE())
            """, (insurance_id,))
            year_data = cursor.fetchone()
            year_total = float(year_data['year_total'])
            
            # All time
            cursor.execute(
                "SELECT COALESCE(SUM(claim_amount), 0) as total FROM claim WHERE insurance_id = %s",
                (insurance_id,)
            )
            all_time = float(cursor.fetchone()['total'])
            
            return {
                "annual_limit": annual_limit,
                "current_year_total": year_total,
                "remaining_limit": annual_limit - year_total,
                "utilization_percentage": (year_total / annual_limit * 100) if annual_limit > 0 else 0,
                "all_time_total": all_time,
                "claim_count": year_data['count']
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/statistics/summary")
def get_claims_statistics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get claims statistics with complex aggregations"""
    try:
        with get_db() as (cursor, connection):
            date_filter = ""
            params = []
            if start_date and end_date:
                date_filter = "WHERE claim_date BETWEEN %s AND %s"
                params = [start_date, end_date]
            
            # Overall stats
            cursor.execute(f"""
                SELECT COUNT(*) as total, COALESCE(SUM(claim_amount), 0) as sum,
                       COALESCE(AVG(claim_amount), 0) as avg
                FROM claim {date_filter}
            """, params)
            overall = cursor.fetchone()
            
            # By package
            cursor.execute(f"""
                SELECT ip.package_name, COUNT(c.claim_id) as count, COALESCE(SUM(c.claim_amount), 0) as total
                FROM insurance_package ip
                LEFT JOIN insurance ins ON ip.insurance_package_id = ins.insurance_package_id
                LEFT JOIN claim c ON ins.insurance_id = c.insurance_id {date_filter.replace('claim_date', 'c.claim_date') if date_filter else ''}
                GROUP BY ip.package_name
                ORDER BY total DESC
            """, params if date_filter else [])
            by_package = cursor.fetchall()
            
            # Monthly trend
            cursor.execute(f"""
                SELECT DATE_FORMAT(claim_date, '%Y-%m') as month,
                       COUNT(*) as count, COALESCE(SUM(claim_amount), 0) as total
                FROM claim {date_filter}
                GROUP BY month ORDER BY month DESC LIMIT 12
            """, params)
            monthly = cursor.fetchall()
            
            return {
                "overall": overall,
                "by_package": by_package or [],
                "monthly_trend": monthly or []
            }
    except Exception as e:
        raise HTTPException(500, str(e))




@router.delete("/{claim_id}")
def delete_claim(claim_id: str):
    """Delete a claim"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT * FROM claim WHERE claim_id = %s", (claim_id,))
            if not cursor.fetchone():
                raise HTTPException(404, "Claim not found")
            cursor.execute("DELETE FROM claim WHERE claim_id = %s", (claim_id,))
            connection.commit()
            return {"success": True, "message": "Claim deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ============================================
# INSURANCE CLAIMS MANAGEMENT (Enhanced)
# ============================================

class TreatmentCoveragePolicy(BaseModel):
    coverage_id: Optional[str] = None
    insurance_id: str
    treatment_id: str
    coverage_percentage: float = Field(..., ge=0, le=100)
    max_coverage_amount: Optional[float] = None
    requires_preauth: bool = False
    min_treatment_cost: Optional[float] = None
    is_active: bool = True
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None

class ClaimDecisionRequest(BaseModel):
    claim_id: str
    new_status: int = Field(..., description="3=APPROVED, 4=REJECTED, 5=PARTIAL")
    approved_amount: Optional[float] = None
    rejection_reason: Optional[str] = None


@router.post("/coverage-policies", status_code=status.HTTP_201_CREATED)
def create_coverage_policy(policy: TreatmentCoveragePolicy):
    """Create a new treatment coverage policy for an insurance company"""
    try:
        with get_db() as (cursor, connection):
            coverage_id = policy.coverage_id or str(uuid.uuid4())
            
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
                "total_policies": len(policies) if policies else 0,
                "policies": policies or []
            }
    except Exception as e:
        logger.error(f"Error fetching coverage policies: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching coverage policies: {str(e)}"
        )


@router.post("/submit-claim", status_code=status.HTTP_201_CREATED)
def submit_insurance_claim(
    patient_id: str,
    invoice_id: str,
    treatment_id: str,
    insurance_id: str,
    treatment_cost: float
):
    """Submit an insurance claim for a treatment"""
    try:
        with get_db() as (cursor, connection):
            # Call stored procedure
            cursor.execute("SET @p_claim_id = NULL")
            cursor.execute("SET @p_success = NULL")
            cursor.execute("SET @p_error_message = NULL")
            
            cursor.execute("""
                CALL SubmitInsuranceClaim(%s, %s, %s, %s, %s, @p_claim_id, @p_success, @p_error_message)
            """, (patient_id, invoice_id, treatment_id, insurance_id, treatment_cost))
            
            cursor.execute("SELECT @p_claim_id, @p_success, @p_error_message")
            result = cursor.fetchone()
            
            claim_id = result['@p_claim_id']
            success = result['@p_success']
            error_message = result['@p_error_message']
            
            if success:
                logger.info(f"✅ Claim submitted: {claim_id}")
                return {
                    "success": True,
                    "claim_id": claim_id,
                    "message": error_message or "Claim submitted successfully"
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_message or "Failed to submit claim"
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
                CALL ProcessClaimDecision(%s, %s, %s, %s, @p_success, @p_error_message)
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
                "total_claims": len(claims) if claims else 0,
                "claims": claims or []
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
            
            logger.info(f"Fetched {len(claims) if claims else 0} pending claims")
            return {
                "total_pending": len(claims) if claims else 0,
                "claims": claims or []
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
                    ROUND(avg_coverage_percentage, 2) as avg_coverage_percentage,
                    total_claims, total_approved_amount,
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
                CALL CalculateClaimAmount(%s, %s, %s, %s, %s, @p_covered_amount, @p_patient_cost, @p_is_eligible, @p_message)
            """, (patient_id, invoice_id, treatment_id, insurance_id, treatment_cost))
            
            cursor.execute("SELECT @p_covered_amount, @p_patient_cost, @p_is_eligible, @p_message")
            result = cursor.fetchone()
            
            return {
                "treatment_cost": treatment_cost,
                "covered_amount": float(result['@p_covered_amount'] or 0),
                "patient_cost": float(result['@p_patient_cost'] or treatment_cost),
                "is_eligible": bool(result['@p_is_eligible'] or False),
                "message": result['@p_message']
            }
    except Exception as e:
        logger.error(f"Error calculating claim amount: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating claim amount: {str(e)}"
        )


@router.get("/claims/{claim_id}/details")
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
