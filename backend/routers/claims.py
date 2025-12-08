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
