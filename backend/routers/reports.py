"""
Reports Router - PDF Report Generation Endpoints
Generates formatted PDF reports from database views
"""

from fastapi import APIRouter, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from core.database import get_db
from services.pdf_generator import pdf_generator
import logging
from datetime import datetime

router = APIRouter(tags=["reports"])

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================
# BRANCH APPOINTMENT SUMMARY REPORT
# ============================================

@router.get("/branch-appointments/pdf", status_code=status.HTTP_200_OK)
def get_branch_appointment_summary_pdf(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    branch_name: Optional[str] = Query(None, description="Filter by specific branch")
):
    """
    Generate PDF report for branch-wise appointment summary
    
    **Uses View**: `branch_appointment_daily_summary`
    
    **Parameters**:
    - date_from: Optional start date filter
    - date_to: Optional end date filter
    - branch_name: Optional branch name filter
    
    **Returns**: PDF file
    
    **Report includes**:
    - Summary statistics (total appointments, branches)
    - Detailed breakdown by branch, date, and status
    - Status breakdown: Scheduled, Completed, Cancelled
    """
    try:
        logger.info(f"Generating branch appointment summary PDF with filters: date_from={date_from}, date_to={date_to}, branch={branch_name}")
        
        with get_db() as (cursor, connection):
            # Build query with filters
            query = """
                SELECT 
                    branch_name,
                    available_date,
                    status,
                    appointment_count
                FROM branch_appointment_daily_summary
                WHERE 1=1
            """
            params = []
            
            # Add date filters
            if date_from:
                query += " AND available_date >= %s"
                params.append(date_from)
            
            if date_to:
                query += " AND available_date <= %s"
                params.append(date_to)
            
            # Add branch filter
            if branch_name:
                query += " AND branch_name = %s"
                params.append(branch_name)
            
            query += " ORDER BY available_date DESC, branch_name, status"
            
            cursor.execute(query, params)
            data = cursor.fetchall()
            
            if not data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No appointment data found for the specified filters"
                )
            
            logger.info(f"Retrieved {len(data)} appointment records")
            
            # Generate PDF
            pdf_buffer = pdf_generator.generate_branch_appointment_summary(
                data=data,
                date_from=date_from,
                date_to=date_to
            )
            
            # Create filename
            filename = f"branch_appointment_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            logger.info(f"✅ PDF generated successfully: {filename}")
            
            # Return PDF as streaming response
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "Content-Type": "application/pdf"
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating branch appointment summary PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(e)}"
        )


# ============================================
# DOCTOR REVENUE REPORT
# ============================================

@router.get("/doctor-revenue/pdf", status_code=status.HTTP_200_OK)
def get_doctor_revenue_pdf(
    year: Optional[int] = Query(None, description="Filter by year (e.g., 2024)"),
    month: Optional[str] = Query(None, description="Filter by month (YYYY-MM format)"),
    doctor_id: Optional[str] = Query(None, description="Filter by specific doctor ID")
):
    """
    Generate PDF report for doctor-wise revenue
    
    **Uses View**: `doctor_monthly_revenue`
    
    **Parameters**:
    - year: Optional year filter (e.g., 2024)
    - month: Optional month filter in YYYY-MM format
    - doctor_id: Optional specific doctor UUID
    
    **Returns**: PDF file
    
    **Report includes**:
    - Total revenue across all doctors
    - Average revenue per doctor
    - Monthly breakdown by doctor
    - Percentage contribution of each doctor
    """
    try:
        logger.info(f"Generating doctor revenue PDF with filters: year={year}, month={month}, doctor_id={doctor_id}")
        
        with get_db() as (cursor, connection):
            # Build query with filters
            query = """
                SELECT 
                    doctor_id,
                    doctor_name,
                    month,
                    revenue
                FROM doctor_monthly_revenue
                WHERE 1=1
            """
            params = []
            
            # Add year filter
            if year:
                query += " AND YEAR(STR_TO_DATE(CONCAT(month, '-01'), '%Y-%m-%d')) = %s"
                params.append(year)
            
            # Add month filter
            if month:
                query += " AND month = %s"
                params.append(month)
            
            # Add doctor filter
            if doctor_id:
                query += " AND doctor_id = %s"
                params.append(doctor_id)
            
            query += " ORDER BY month DESC, revenue DESC"
            
            cursor.execute(query, params)
            data = cursor.fetchall()
            
            if not data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No revenue data found for the specified filters"
                )
            
            logger.info(f"Retrieved {len(data)} revenue records")
            
            # Generate PDF
            pdf_buffer = pdf_generator.generate_doctor_revenue_report(
                data=data,
                year=year,
                month=month
            )
            
            # Create filename
            filename = f"doctor_revenue_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            logger.info(f"✅ PDF generated successfully: {filename}")
            
            # Return PDF as streaming response
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "Content-Type": "application/pdf"
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating doctor revenue PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(e)}"
        )


# ============================================
# OUTSTANDING BALANCE REPORT
# ============================================

@router.get("/outstanding-balances/pdf", status_code=status.HTTP_200_OK)
def get_outstanding_balances_pdf(
    min_balance: Optional[float] = Query(None, ge=0, description="Minimum balance filter"),
    max_balance: Optional[float] = Query(None, ge=0, description="Maximum balance filter"),
    sort_by: str = Query("balance_desc", description="Sort order: balance_desc, balance_asc")
):
    """
    Generate PDF report for patients with outstanding balances
    
    **Uses View**: `patients_outstanding_balances`
    
    **Parameters**:
    - min_balance: Optional minimum balance threshold (e.g., 1000)
    - max_balance: Optional maximum balance threshold
    - sort_by: Sort order - "balance_desc" (default) or "balance_asc"
    
    **Returns**: PDF file
    
    **Report includes**:
    - Total outstanding amount across all patients
    - Number of patients with outstanding balances
    - Average outstanding balance
    - Color-coded status levels (High/Medium/Low)
    - Patient-wise balance details
    
    **Status Levels**:
    - High: Balance > 10,000 LKR (Red)
    - Medium: Balance 5,000-10,000 LKR (Orange)
    - Low: Balance < 5,000 LKR (Green)
    """
    try:
        logger.info(f"Generating outstanding balances PDF with filters: min={min_balance}, max={max_balance}, sort={sort_by}")
        
        with get_db() as (cursor, connection):
            # Build query with filters
            query = """
                SELECT 
                    patient_id,
                    patient_name,
                    patient_balance
                FROM patients_outstanding_balances
                WHERE 1=1
            """
            params = []
            
            # Add balance filters
            if min_balance is not None:
                query += " AND patient_balance >= %s"
                params.append(min_balance)
            
            if max_balance is not None:
                query += " AND patient_balance <= %s"
                params.append(max_balance)
            
            # Add sorting
            if sort_by == "balance_asc":
                query += " ORDER BY patient_balance ASC"
            else:  # balance_desc (default)
                query += " ORDER BY patient_balance DESC"
            
            cursor.execute(query, params)
            data = cursor.fetchall()
            
            if not data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No patients with outstanding balances found for the specified filters"
                )
            
            logger.info(f"Retrieved {len(data)} patients with outstanding balances")
            
            # Generate PDF
            pdf_buffer = pdf_generator.generate_outstanding_balance_report(data=data)
            
            # Create filename
            filename = f"outstanding_balances_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            logger.info(f"✅ PDF generated successfully: {filename}")
            
            # Return PDF as streaming response
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "Content-Type": "application/pdf"
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating outstanding balances PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(e)}"
        )


# ============================================
# UTILITY ENDPOINTS - Get Raw Data
# ============================================

@router.get("/branch-appointments/data", status_code=status.HTTP_200_OK)
def get_branch_appointment_data(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    branch_name: Optional[str] = Query(None, description="Filter by specific branch")
):
    """
    Get raw JSON data from branch_appointment_daily_summary view
    (Utility endpoint for previewing before generating PDF)
    """
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    branch_name,
                    available_date,
                    status,
                    appointment_count
                FROM branch_appointment_daily_summary
                WHERE 1=1
            """
            params = []
            
            if date_from:
                query += " AND available_date >= %s"
                params.append(date_from)
            
            if date_to:
                query += " AND available_date <= %s"
                params.append(date_to)
            
            if branch_name:
                query += " AND branch_name = %s"
                params.append(branch_name)
            
            query += " ORDER BY available_date DESC, branch_name, status"
            
            cursor.execute(query, params)
            data = cursor.fetchall()
            
            return {
                "success": True,
                "total_records": len(data),
                "data": data
            }
    except Exception as e:
        logger.error(f"Error fetching branch appointment data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/doctor-revenue/data", status_code=status.HTTP_200_OK)
def get_doctor_revenue_data(
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[str] = Query(None, description="Filter by month (YYYY-MM)"),
    doctor_id: Optional[str] = Query(None, description="Filter by doctor ID")
):
    """
    Get raw JSON data from doctor_monthly_revenue view
    (Utility endpoint for previewing before generating PDF)
    """
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    doctor_id,
                    doctor_name,
                    month,
                    revenue
                FROM doctor_monthly_revenue
                WHERE 1=1
            """
            params = []
            
            if year:
                query += " AND YEAR(STR_TO_DATE(CONCAT(month, '-01'), '%Y-%m-%d')) = %s"
                params.append(year)
            
            if month:
                query += " AND month = %s"
                params.append(month)
            
            if doctor_id:
                query += " AND doctor_id = %s"
                params.append(doctor_id)
            
            query += " ORDER BY month DESC, revenue DESC"
            
            cursor.execute(query, params)
            data = cursor.fetchall()
            
            # Calculate totals
            total_revenue = sum(float(row['revenue']) for row in data)
            
            return {
                "success": True,
                "total_records": len(data),
                "total_revenue": total_revenue,
                "data": data
            }
    except Exception as e:
        logger.error(f"Error fetching doctor revenue data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/outstanding-balances/data", status_code=status.HTTP_200_OK)
def get_outstanding_balances_data(
    min_balance: Optional[float] = Query(None, ge=0, description="Minimum balance"),
    max_balance: Optional[float] = Query(None, ge=0, description="Maximum balance")
):
    """
    Get raw JSON data from patients_outstanding_balances view
    (Utility endpoint for previewing before generating PDF)
    """
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    patient_id,
                    patient_name,
                    patient_balance
                FROM patients_outstanding_balances
                WHERE 1=1
            """
            params = []
            
            if min_balance is not None:
                query += " AND patient_balance >= %s"
                params.append(min_balance)
            
            if max_balance is not None:
                query += " AND patient_balance <= %s"
                params.append(max_balance)
            
            query += " ORDER BY patient_balance DESC"
            
            cursor.execute(query, params)
            data = cursor.fetchall()
            
            # Calculate totals
            total_outstanding = sum(float(row['patient_balance']) for row in data)
            
            return {
                "success": True,
                "total_patients": len(data),
                "total_outstanding": total_outstanding,
                "data": data
            }
    except Exception as e:
        logger.error(f"Error fetching outstanding balances data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================
# TREATMENTS BY CATEGORY REPORT
# ============================================

@router.get("/treatments-by-category/pdf", status_code=status.HTTP_200_OK)
def get_treatments_by_category_pdf(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Generate PDF report for treatments by category
    
    **Parameters**:
    - date_from: Optional start date filter
    - date_to: Optional end date filter
    
    **Returns**: PDF file
    
    **Report includes**:
    - Total number of treatments
    - Revenue per treatment category
    - Treatment count and percentage breakdown
    - Top performing treatment category
    """
    try:
        logger.info(f"Generating treatments by category PDF with filters: date_from={date_from}, date_to={date_to}")
        
        with get_db() as (cursor, connection):
            # Build query to get treatments grouped by category
            query = """
                SELECT 
                    tc.treatment_name,
                    COUNT(t.treatment_id) as treatment_count,
                    SUM(tc.base_price) as total_revenue
                FROM treatment t
                JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                JOIN consultation_record cr ON t.consultation_rec_id = cr.consultation_rec_id
                WHERE 1=1
            """
            params = []
            
            # Add date filters
            if date_from:
                query += " AND DATE(cr.created_at) >= %s"
                params.append(date_from)
            
            if date_to:
                query += " AND DATE(cr.created_at) <= %s"
                params.append(date_to)
            
            query += """
                GROUP BY tc.treatment_service_code, tc.treatment_name
                ORDER BY treatment_count DESC
            """
            
            cursor.execute(query, params)
            data = cursor.fetchall()
            
            if not data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No treatment data found for the specified period"
                )
            
            logger.info(f"Retrieved {len(data)} treatment categories")
            
            # Generate PDF
            pdf_buffer = pdf_generator.generate_treatments_by_category_report(
                data=data,
                date_from=date_from,
                date_to=date_to
            )
            
            # Create filename
            filename = f"treatments_by_category_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            logger.info(f"✅ PDF generated successfully: {filename}")
            
            # Return PDF as streaming response
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "Content-Type": "application/pdf"
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating treatments by category PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(e)}"
        )


# ============================================
# INSURANCE VS OUT-OF-POCKET REPORT
# ============================================

@router.get("/insurance-vs-outofpocket/pdf", status_code=status.HTTP_200_OK)
def get_insurance_vs_outofpocket_pdf(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Generate PDF report comparing insurance coverage vs out-of-pocket payments
    
    **Parameters**:
    - date_from: Optional start date filter
    - date_to: Optional end date filter
    
    **Returns**: PDF file
    
    **Report includes**:
    - Total insurance-covered payments
    - Total out-of-pocket payments
    - Insurance coverage percentage
    - Transaction count breakdown
    - Detailed payment method statistics
    - Insights and recommendations
    """
    try:
        logger.info(f"Generating insurance vs out-of-pocket PDF with filters: date_from={date_from}, date_to={date_to}")
        
        with get_db() as (cursor, connection):
            # Query insurance claims
            insurance_query = """
                SELECT 
                    COALESCE(SUM(claim_amount), 0) AS insurance_total,
                    COUNT(*) AS insurance_count
                FROM claim
                WHERE 1=1
            """
            insurance_params = []
            
            if date_from:
                insurance_query += " AND DATE(claim_date) >= %s"
                insurance_params.append(date_from)
            
            if date_to:
                insurance_query += " AND DATE(claim_date) <= %s"
                insurance_params.append(date_to)
            
            cursor.execute(insurance_query, insurance_params)
            insurance_result = cursor.fetchone()
            
            # Query out-of-pocket payments
            outofpocket_query = """
                SELECT 
                    COALESCE(SUM(amount_paid), 0) AS out_of_pocket_total,
                    COUNT(*) AS out_of_pocket_count
                FROM payment
                WHERE payment_method NOT IN ('Insurance')
            """
            outofpocket_params = []
            
            if date_from:
                outofpocket_query += " AND DATE(payment_date) >= %s"
                outofpocket_params.append(date_from)
            
            if date_to:
                outofpocket_query += " AND DATE(payment_date) <= %s"
                outofpocket_params.append(date_to)
            
            cursor.execute(outofpocket_query, outofpocket_params)
            outofpocket_result = cursor.fetchone()
            
            # Get detailed breakdown by payment method
            details_query = """
                SELECT 
                    payment_method,
                    COUNT(DISTINCT patient_id) as patient_count,
                    AVG(amount_paid) as avg_payment,
                    SUM(amount_paid) as total
                FROM payment
                WHERE 1=1
            """
            details_params = []
            
            if date_from:
                details_query += " AND DATE(payment_date) >= %s"
                details_params.append(date_from)
            
            if date_to:
                details_query += " AND DATE(payment_date) <= %s"
                details_params.append(date_to)
            
            details_query += " GROUP BY payment_method ORDER BY total DESC"
            
            cursor.execute(details_query, details_params)
            details = cursor.fetchall()
            
            # Prepare data for PDF generation
            report_data = {
                'insurance_total': float(insurance_result['insurance_total']) if insurance_result['insurance_total'] else 0,
                'insurance_count': int(insurance_result['insurance_count']) if insurance_result['insurance_count'] else 0,
                'out_of_pocket_total': float(outofpocket_result['out_of_pocket_total']) if outofpocket_result['out_of_pocket_total'] else 0,
                'out_of_pocket_count': int(outofpocket_result['out_of_pocket_count']) if outofpocket_result['out_of_pocket_count'] else 0,
                'details': details
            }
            
            logger.info(f"Insurance: LKR {report_data['insurance_total']:,.2f}, Out-of-Pocket: LKR {report_data['out_of_pocket_total']:,.2f}")
            
            # Generate PDF
            pdf_buffer = pdf_generator.generate_insurance_vs_outofpocket_report(
                data=report_data,
                date_from=date_from,
                date_to=date_to
            )
            
            # Create filename
            filename = f"insurance_vs_outofpocket_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            logger.info(f"✅ PDF generated successfully: {filename}")
            
            # Return PDF as streaming response
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "Content-Type": "application/pdf"
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating insurance vs out-of-pocket PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(e)}"
        )


# ============================================
# UTILITY ENDPOINTS - Additional Data
# ============================================

@router.get("/treatments-by-category/data", status_code=status.HTTP_200_OK)
def get_treatments_by_category_data(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get raw JSON data for treatments by category
    (Utility endpoint for previewing before generating PDF)
    """
    try:
        with get_db() as (cursor, connection):
            query = """
                SELECT 
                    tc.treatment_name,
                    COUNT(t.treatment_id) as treatment_count,
                    SUM(tc.base_price) as total_revenue
                FROM treatment t
                JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
                JOIN consultation_record cr ON t.consultation_rec_id = cr.consultation_rec_id
                WHERE 1=1
            """
            params = []
            
            if date_from:
                query += " AND DATE(cr.created_at) >= %s"
                params.append(date_from)
            
            if date_to:
                query += " AND DATE(cr.created_at) <= %s"
                params.append(date_to)
            
            query += """
                GROUP BY tc.treatment_service_code, tc.treatment_name
                ORDER BY treatment_count DESC
            """
            
            cursor.execute(query, params)
            data = cursor.fetchall()
            
            total_treatments = sum(int(row['treatment_count']) for row in data)
            total_revenue = sum(float(row['total_revenue']) for row in data)
            
            return {
                "success": True,
                "total_categories": len(data),
                "total_treatments": total_treatments,
                "total_revenue": total_revenue,
                "data": data
            }
    except Exception as e:
        logger.error(f"Error fetching treatments by category data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/insurance-vs-outofpocket/data", status_code=status.HTTP_200_OK)
def get_insurance_vs_outofpocket_data(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get raw JSON data for insurance vs out-of-pocket comparison
    (Utility endpoint for previewing before generating PDF)
    """
    try:
        with get_db() as (cursor, connection):
            # Insurance payments
            insurance_query = """
                SELECT 
                    COALESCE(SUM(amount_paid), 0) as total,
                    COUNT(*) as count
                FROM payment
                WHERE payment_method = 'Insurance'
            """
            insurance_params = []
            
            if date_from:
                insurance_query += " AND DATE(payment_date) >= %s"
                insurance_params.append(date_from)
            
            if date_to:
                insurance_query += " AND DATE(payment_date) <= %s"
                insurance_params.append(date_to)
            
            cursor.execute(insurance_query, insurance_params)
            insurance_result = cursor.fetchone()
            
            # Out-of-pocket payments
            out_of_pocket_query = """
                SELECT 
                    COALESCE(SUM(amount_paid), 0) as total,
                    COUNT(*) as count
                FROM payment
                WHERE payment_method != 'Insurance'
            """
            out_of_pocket_params = []
            
            if date_from:
                out_of_pocket_query += " AND DATE(payment_date) >= %s"
                out_of_pocket_params.append(date_from)
            
            if date_to:
                out_of_pocket_query += " AND DATE(payment_date) <= %s"
                out_of_pocket_params.append(date_to)
            
            cursor.execute(out_of_pocket_query, out_of_pocket_params)
            out_of_pocket_result = cursor.fetchone()
            
            # Detailed breakdown
            details_query = """
                SELECT 
                    payment_method,
                    COUNT(DISTINCT patient_id) as patient_count,
                    AVG(amount_paid) as avg_payment,
                    SUM(amount_paid) as total
                FROM payment
                WHERE 1=1
            """
            details_params = []
            
            if date_from:
                details_query += " AND DATE(payment_date) >= %s"
                details_params.append(date_from)
            
            if date_to:
                details_query += " AND DATE(payment_date) <= %s"
                details_params.append(date_to)
            
            details_query += " GROUP BY payment_method ORDER BY total DESC"
            
            cursor.execute(details_query, details_params)
            details = cursor.fetchall()
            
            grand_total = float(insurance_result['total']) + float(out_of_pocket_result['total'])
            insurance_percentage = (float(insurance_result['total']) / grand_total * 100) if grand_total > 0 else 0
            
            return {
                "success": True,
                "insurance_total": insurance_result['total'],
                "insurance_count": insurance_result['count'],
                "out_of_pocket_total": out_of_pocket_result['total'],
                "out_of_pocket_count": out_of_pocket_result['count'],
                "grand_total": grand_total,
                "insurance_percentage": insurance_percentage,
                "details": details
            }
    except Exception as e:
        logger.error(f"Error fetching insurance vs out-of-pocket data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
