from typing import Dict, Any, List, Optional
from datetime import date, datetime
from .auth import hash_password
from .db_utils import (
    register_patient, register_employee, register_doctor, 
    book_appointment, add_patient_allergy, add_patient_condition,
    add_time_slot, add_consultation_record, add_prescription_item, add_treatment,
    get_user_by_email, get_user_by_id, get_patient_by_user_id, 
    get_employee_by_user_id, get_doctor_by_user_id, get_branches, 
    get_specializations, get_medications
)
from .database import execute_query
import uuid
import logging

logger = logging.getLogger(__name__)

# ============================================
# USER MANAGEMENT
# ============================================

def create_patient_account(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new patient account using stored procedure"""
    try:
        print(f"👤 CRUD: Creating patient account with data: {patient_data}")
        
        # Hash the password
        print(f"🔐 CRUD: Hashing password...")
        hashed_password = hash_password(patient_data['password'])
        print(f"🔐 CRUD: Password hashed successfully")
        
        print(f"🏥 CRUD: Calling register_patient function...")
        result = register_patient(
            # Address data
            address_line1=patient_data['address_line1'],
            city=patient_data['city'],
            province=patient_data['province'],
            postal_code=patient_data['postal_code'],
            # Contact data  
            contact_num1=patient_data['contact_num1'],
            # User data
            full_name=patient_data['full_name'],
            nic=patient_data['nic'],
            email=patient_data['email'],
            gender=patient_data['gender'],
            dob=patient_data['dob'],
            password_hash=hashed_password,
            # Patient data
            blood_group=patient_data['blood_group'],
            registered_branch_name=patient_data['registered_branch_name'],
            # Optional data
            address_line2=patient_data.get('address_line2'),
            country=patient_data.get('country', 'Sri Lanka'),
            contact_num2=patient_data.get('contact_num2')
        )
        
        print(f"📋 CRUD: register_patient returned: {result}")
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error creating patient account: {e}")
        return {
            'success': False,
            'user_id': None,
            'error_message': str(e),
            'results': []
        }

def create_doctor_account(doctor_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new doctor account using stored procedure"""
    try:
        print(f"👨‍⚕️ CRUD: Creating doctor account with data: {doctor_data}")
        
        # Hash the password
        print(f"🔐 CRUD: Hashing password...")
        hashed_password = hash_password(doctor_data['password'])
        print(f"🔐 CRUD: Password hashed successfully")
        
        print(f"👨‍⚕️ CRUD: Calling register_doctor function...")
        result = register_doctor(
            # Address data
            address_line1=doctor_data['address_line1'],
            city=doctor_data['city'],
            province=doctor_data['province'],
            postal_code=doctor_data['postal_code'],
            # Contact data  
            contact_num1=doctor_data['contact_num1'],
            # User data
            full_name=doctor_data['full_name'],
            nic=doctor_data['nic'],
            email=doctor_data['email'],
            gender=doctor_data['gender'],
            dob=doctor_data['dob'],
            password_hash=hashed_password,
            # Employee data
            branch_name=doctor_data['branch_name'],
            salary=doctor_data['salary'],
            joined_date=doctor_data['joined_date'],
            # Doctor data
            medical_licence_no=doctor_data['medical_licence_no'],
            consultation_fee=doctor_data['consultation_fee'],
            # Optional data
            address_line2=doctor_data.get('address_line2'),
            country=doctor_data.get('country', 'Sri Lanka'),
            contact_num2=doctor_data.get('contact_num2'),
            room_no=doctor_data.get('room_no'),
            specialization_ids=doctor_data.get('specialization_ids')
        )
        
        print(f"📋 CRUD: register_doctor returned: {result}")
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error creating doctor account: {e}")
        return {
            'success': False,
            'user_id': None,
            'error_message': str(e),
            'results': []
        }

# ============================================
# HELPER FUNCTIONS
# ============================================

def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID - wrapper for compatibility"""
    return get_user_by_id(user_id)

def get_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    """Get patient by patient ID"""
    return get_patient_by_user_id(patient_id)

def get_branches_list() -> List[Dict[str, Any]]:
    """Get all branches - wrapper for compatibility"""
    return get_branches()

def get_specializations_list() -> List[Dict[str, Any]]:
    """Get all specializations - wrapper for compatibility"""
    return get_specializations()

def get_medications_list(search: Optional[str] = None, form: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get medications with filtering - wrapper for compatibility"""
    return get_medications(search, form)

# ============================================
# APPOINTMENT MANAGEMENT
# ============================================

def get_appointments(
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    appointment_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get appointments with filtering"""
    try:
        print(f"📅 CRUD: Getting appointments with filters - patient:{patient_id}, doctor:{doctor_id}, branch:{branch_id}, status:{status}, date:{appointment_date}")
        
        # Build the query with filters
        query = """
        SELECT 
            a.appointment_id,
            a.patient_id,
            a.time_slot_id,
            a.status,
            a.notes,
            a.created_at,
            a.updated_at,
            ts.doctor_id,
            ts.available_date,
            ts.start_time,
            ts.end_time,
            p.full_name as patient_name,
            p.email as patient_email,
            d_user.full_name as doctor_name,
            d.room_no,
            d.consultation_fee,
            b.branch_name
        FROM appointment a
        JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
        JOIN user p ON a.patient_id = p.user_id
        JOIN doctor d ON ts.doctor_id = d.doctor_id
        JOIN employee e ON d.doctor_id = e.employee_id
        JOIN user d_user ON e.employee_id = d_user.user_id
        JOIN branch b ON e.branch_id = b.branch_id
        WHERE 1=1
        """
        
        params = []
        
        if patient_id:
            query += " AND a.patient_id = %s"
            params.append(patient_id)
        
        if doctor_id:
            query += " AND ts.doctor_id = %s"
            params.append(doctor_id)
            
        if branch_id:
            query += " AND b.branch_id = %s"
            params.append(branch_id)
            
        if status:
            query += " AND a.status = %s"
            params.append(status)
            
        if appointment_date:
            query += " AND DATE(ts.available_date) = %s"
            params.append(appointment_date)
        
        query += " ORDER BY ts.available_date DESC, ts.start_time DESC"
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, skip])
        
        result = execute_query(query, tuple(params), fetch='all')
        print(f"📅 CRUD: Retrieved {len(result) if result else 0} appointments")
        
        return result or []
        
    except Exception as e:
        print(f"❌ CRUD: Error getting appointments: {e}")
        logger.error(f"Error getting appointments: {e}")
        return []

def get_appointment(appointment_id: str) -> Optional[Dict[str, Any]]:
    """Get appointment by ID"""
    try:
        print(f"📅 CRUD: Getting appointment {appointment_id}")
        
        query = """
        SELECT 
            a.appointment_id,
            a.patient_id,
            a.time_slot_id,
            a.status,
            a.notes,
            a.created_at,
            a.updated_at,
            ts.doctor_id,
            ts.available_date,
            ts.start_time,
            ts.end_time,
            p.full_name as patient_name,
            p.email as patient_email,
            p.NIC as patient_nic,
            d_user.full_name as doctor_name,
            d.room_no,
            d.consultation_fee,
            b.branch_name,
            b.branch_id
        FROM appointment a
        JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
        JOIN user p ON a.patient_id = p.user_id
        JOIN doctor d ON ts.doctor_id = d.doctor_id
        JOIN employee e ON d.doctor_id = e.employee_id
        JOIN user d_user ON e.employee_id = d_user.user_id
        JOIN branch b ON e.branch_id = b.branch_id
        WHERE a.appointment_id = %s
        """
        
        result = execute_query(query, (appointment_id,), fetch='one')
        print(f"📅 CRUD: Found appointment: {'Yes' if result else 'No'}")
        
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error getting appointment {appointment_id}: {e}")
        logger.error(f"Error getting appointment {appointment_id}: {e}")
        return None

def create_appointment(appointment_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new appointment using stored procedure"""
    try:
        print(f"📅 CRUD: Creating appointment with data: {appointment_data}")
        
        result = book_appointment(
            patient_id=appointment_data['patient_id'],
            time_slot_id=appointment_data['time_slot_id'],
            notes=appointment_data.get('notes')
        )
        
        print(f"📅 CRUD: book_appointment returned: {result}")
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error creating appointment: {e}")
        logger.error(f"Error creating appointment: {e}")
        return {
            'success': False,
            'appointment_id': None,
            'error_message': str(e)
        }

def get_timeslot(time_slot_id: str) -> Optional[Dict[str, Any]]:
    """Get time slot by ID"""
    try:
        print(f"📅 CRUD: Getting time slot {time_slot_id}")
        
        query = """
        SELECT 
            ts.*,
            d_user.full_name as doctor_name,
            b.branch_name
        FROM time_slot ts
        JOIN doctor d ON ts.doctor_id = d.doctor_id
        JOIN employee e ON d.doctor_id = e.employee_id
        JOIN user d_user ON e.employee_id = d_user.user_id
        JOIN branch b ON e.branch_id = b.branch_id
        WHERE ts.time_slot_id = %s
        """
        
        result = execute_query(query, (time_slot_id,), fetch='one')
        print(f"📅 CRUD: Found time slot: {'Yes' if result else 'No'}")
        
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error getting time slot {time_slot_id}: {e}")
        logger.error(f"Error getting time slot {time_slot_id}: {e}")
        return None

def create_consultation_record(consultation_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create consultation record using stored procedure"""
    try:
        print(f"👨‍⚕️ CRUD: Creating consultation record with data: {consultation_data}")
        
        result = add_consultation_record(
            appointment_id=consultation_data['appointment_id'],
            diagnosis=consultation_data['diagnosis'],
            treatment_plan=consultation_data.get('treatment_plan'),
            notes=consultation_data.get('notes'),
            follow_up_required=consultation_data.get('follow_up_required', False),
            follow_up_date=consultation_data.get('follow_up_date')
        )
        
        print(f"👨‍⚕️ CRUD: add_consultation_record returned: {result}")
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error creating consultation record: {e}")
        logger.error(f"Error creating consultation record: {e}")
        return {
            'success': False,
            'consultation_id': None,
            'error_message': str(e)
        }

def get_consultations(
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get consultation records with filtering"""
    try:
        print(f"🩺 CRUD: Getting consultations with filters")
        
        query = """
        SELECT 
            cr.consultation_rec_id,
            cr.appointment_id,
            cr.diagnosis,
            cr.treatment_plan,
            cr.notes,
            cr.follow_up_required,
            cr.follow_up_date,
            cr.created_at,
            cr.updated_at,
            a.patient_id,
            a.status as appointment_status,
            p_user.full_name as patient_name,
            p_user.email as patient_email,
            ts.doctor_id,
            d_user.full_name as doctor_name,
            ts.available_date as consultation_date,
            ts.start_time,
            b.branch_name
        FROM consultation_record cr
        JOIN appointment a ON cr.appointment_id = a.appointment_id
        JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
        JOIN user p_user ON a.patient_id = p_user.user_id
        JOIN doctor d ON ts.doctor_id = d.doctor_id
        JOIN employee e ON d.doctor_id = e.employee_id
        JOIN user d_user ON e.employee_id = d_user.user_id
        JOIN branch b ON e.branch_id = b.branch_id
        WHERE 1=1
        """
        
        params = []
        
        if patient_id:
            query += " AND a.patient_id = %s"
            params.append(patient_id)
        
        if doctor_id:
            query += " AND ts.doctor_id = %s"
            params.append(doctor_id)
            
        if date_from:
            query += " AND DATE(ts.available_date) >= %s"
            params.append(date_from)
            
        if date_to:
            query += " AND DATE(ts.available_date) <= %s"
            params.append(date_to)
        
        query += " ORDER BY ts.available_date DESC, ts.start_time DESC"
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, skip])
        
        result = execute_query(query, tuple(params), fetch='all')
        print(f"🩺 CRUD: Retrieved {len(result) if result else 0} consultations")
        
        return result or []
        
    except Exception as e:
        print(f"❌ CRUD: Error getting consultations: {e}")
        logger.error(f"Error getting consultations: {e}")
        return []

def get_consultation_record(consultation_id: str) -> Optional[Dict[str, Any]]:
    """Get consultation record by ID"""
    try:
        print(f"🩺 CRUD: Getting consultation record {consultation_id}")
        
        query = """
        SELECT 
            cr.*,
            a.patient_id,
            a.status as appointment_status,
            p_user.full_name as patient_name,
            p_user.email as patient_email,
            ts.doctor_id,
            d_user.full_name as doctor_name,
            ts.available_date as consultation_date,
            ts.start_time,
            b.branch_name
        FROM consultation_record cr
        JOIN appointment a ON cr.appointment_id = a.appointment_id
        JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
        JOIN user p_user ON a.patient_id = p_user.user_id
        JOIN doctor d ON ts.doctor_id = d.doctor_id
        JOIN employee e ON d.doctor_id = e.employee_id
        JOIN user d_user ON e.employee_id = d_user.user_id
        JOIN branch b ON e.branch_id = b.branch_id
        WHERE cr.consultation_rec_id = %s
        """
        
        result = execute_query(query, (consultation_id,), fetch='one')
        print(f"🩺 CRUD: Found consultation record: {'Yes' if result else 'No'}")
        
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error getting consultation record {consultation_id}: {e}")
        logger.error(f"Error getting consultation record {consultation_id}: {e}")
        return None

def update_consultation_record(consultation_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update consultation record"""
    try:
        print(f"🩺 CRUD: Updating consultation record {consultation_id} with data: {update_data}")
        
        # Build update query
        updates = []
        params = []
        
        for field, value in update_data.items():
            if value is not None:
                updates.append(f"{field} = %s")
                params.append(value)
        
        if not updates:
            return {
                'success': False,
                'error_message': 'No fields to update'
            }
        
        # Add updated_at
        updates.append("updated_at = NOW()")
        
        query = f"UPDATE consultation_record SET {', '.join(updates)} WHERE consultation_rec_id = %s"
        params.append(consultation_id)
        
        execute_query(query, tuple(params))
        
        print(f"🩺 CRUD: Consultation record updated successfully")
        return {
            'success': True,
            'error_message': None
        }
        
    except Exception as e:
        print(f"❌ CRUD: Error updating consultation record {consultation_id}: {e}")
        logger.error(f"Error updating consultation record {consultation_id}: {e}")
        return {
            'success': False,
            'error_message': str(e)
        }

def get_consultation_prescriptions(consultation_id: str) -> List[Dict[str, Any]]:
    """Get prescriptions for a consultation"""
    try:
        print(f"💊 CRUD: Getting prescriptions for consultation {consultation_id}")
        
        query = """
        SELECT 
            pi.*,
            m.generic_name,
            m.brand_name,
            m.manufacturer,
            m.form,
            m.strength
        FROM prescription_item pi
        JOIN medication m ON pi.medication_id = m.medication_id
        WHERE pi.consultation_rec_id = %s
        ORDER BY pi.created_at
        """
        
        result = execute_query(query, (consultation_id,), fetch='all')
        print(f"💊 CRUD: Retrieved {len(result) if result else 0} prescriptions")
        
        return result or []
        
    except Exception as e:
        print(f"❌ CRUD: Error getting prescriptions for consultation {consultation_id}: {e}")
        logger.error(f"Error getting prescriptions for consultation {consultation_id}: {e}")
        return []

def add_prescription_item_to_consultation(prescription_data: Dict[str, Any]) -> Dict[str, Any]:
    """Add prescription item using stored procedure"""
    try:
        print(f"💊 CRUD: Adding prescription item with data: {prescription_data}")
        
        from .db_utils import add_prescription_item as db_add_prescription_item
        
        result = db_add_prescription_item(
            consultation_rec_id=prescription_data['consultation_rec_id'],
            medication_id=prescription_data['medication_id'],
            dosage=prescription_data['dosage'],
            frequency=prescription_data['frequency'],
            duration_days=prescription_data['duration_days'],
            instructions=prescription_data.get('instructions')
        )
        
        print(f"💊 CRUD: add_prescription_item returned: {result}")
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error adding prescription item: {e}")
        logger.error(f"Error adding prescription item: {e}")
        return {
            'success': False,
            'prescription_id': None,
            'error_message': str(e)
        }

# ============================================
# MEDICATION MANAGEMENT
# ============================================

def get_medication(medication_id: str) -> Optional[Dict[str, Any]]:
    """Get medication by ID"""
    try:
        print(f"💊 CRUD: Getting medication {medication_id}")
        
        query = """
        SELECT 
            m.*,
            mc.category_name,
            s.supplier_name
        FROM medication m
        LEFT JOIN medication_category mc ON m.category_id = mc.category_id
        LEFT JOIN supplier s ON m.supplier_id = s.supplier_id
        WHERE m.medication_id = %s
        """
        
        result = execute_query(query, (medication_id,), fetch='one')
        print(f"💊 CRUD: Found medication: {'Yes' if result else 'No'}")
        
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error getting medication {medication_id}: {e}")
        logger.error(f"Error getting medication {medication_id}: {e}")
        return None

def create_medication(medication_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new medication"""
    try:
        print(f"💊 CRUD: Creating medication with data: {medication_data}")
        
        # Generate medication ID
        medication_id = str(uuid.uuid4())
        
        # Insert medication
        query = """
        INSERT INTO medication (
            medication_id, generic_name, brand_name, manufacturer, 
            form, strength, unit_price, description, 
            category_id, supplier_id, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
        )
        """
        
        params = (
            medication_id,
            medication_data['generic_name'],
            medication_data.get('brand_name'),
            medication_data.get('manufacturer'),
            medication_data.get('form'),
            medication_data.get('strength'),
            medication_data.get('unit_price'),
            medication_data.get('description'),
            medication_data.get('category_id'),
            medication_data.get('supplier_id')
        )
        
        execute_query(query, params)
        
        print(f"💊 CRUD: Medication created successfully with ID: {medication_id}")
        return {
            'success': True,
            'medication_id': medication_id,
            'error_message': None
        }
        
    except Exception as e:
        print(f"❌ CRUD: Error creating medication: {e}")
        logger.error(f"Error creating medication: {e}")
        return {
            'success': False,
            'medication_id': None,
            'error_message': str(e)
        }

def update_medication(medication_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update medication"""
    try:
        print(f"💊 CRUD: Updating medication {medication_id} with data: {update_data}")
        
        # Build update query
        updates = []
        params = []
        
        for field, value in update_data.items():
            if value is not None:
                updates.append(f"{field} = %s")
                params.append(value)
        
        if not updates:
            return {
                'success': False,
                'error_message': 'No fields to update'
            }
        
        # Add updated_at
        updates.append("updated_at = NOW()")
        
        query = f"UPDATE medication SET {', '.join(updates)} WHERE medication_id = %s"
        params.append(medication_id)
        
        execute_query(query, tuple(params))
        
        print(f"💊 CRUD: Medication updated successfully")
        return {
            'success': True,
            'error_message': None
        }
        
    except Exception as e:
        print(f"❌ CRUD: Error updating medication {medication_id}: {e}")
        logger.error(f"Error updating medication {medication_id}: {e}")
        return {
            'success': False,
            'error_message': str(e)
        }

# ============================================
# BRANCH MANAGEMENT  
# ============================================

def get_branch(branch_id: str) -> Optional[Dict[str, Any]]:
    """Get branch by ID"""
    try:
        print(f"🏢 CRUD: Getting branch {branch_id}")
        
        query = """
        SELECT 
            b.*,
            a.address_line1,
            a.address_line2,
            a.city,
            a.province,
            a.postal_code,
            a.country
        FROM branch b
        LEFT JOIN address a ON b.address_id = a.address_id
        WHERE b.branch_id = %s
        """
        
        result = execute_query(query, (branch_id,), fetch='one')
        print(f"🏢 CRUD: Found branch: {'Yes' if result else 'No'}")
        
        return result
        
    except Exception as e:
        print(f"❌ CRUD: Error getting branch {branch_id}: {e}")
        logger.error(f"Error getting branch {branch_id}: {e}")
        return None

def create_branch(branch_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new branch"""
    try:
        print(f"🏢 CRUD: Creating branch with data: {branch_data}")
        
        # Generate branch ID
        branch_id = str(uuid.uuid4())
        
        # Create address first if provided
        address_id = None
        if branch_data.get('address_line1'):
            address_id = str(uuid.uuid4())
            address_query = """
            INSERT INTO address (
                address_id, address_line1, address_line2, city, 
                province, postal_code, country, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
            )
            """
            
            address_params = (
                address_id,
                branch_data['address_line1'],
                branch_data.get('address_line2'),
                branch_data.get('city'),
                branch_data.get('province'),
                branch_data.get('postal_code'),
                branch_data.get('country', 'Sri Lanka')
            )
            
            execute_query(address_query, address_params)
        
        # Insert branch
        branch_query = """
        INSERT INTO branch (
            branch_id, branch_name, address_id, district, 
            is_active, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, NOW(), NOW()
        )
        """
        
        branch_params = (
            branch_id,
            branch_data['branch_name'],
            address_id,
            branch_data.get('district'),
            branch_data.get('is_active', True)
        )
        
        execute_query(branch_query, branch_params)
        
        print(f"🏢 CRUD: Branch created successfully with ID: {branch_id}")
        return {
            'success': True,
            'branch_id': branch_id,
            'error_message': None
        }
        
    except Exception as e:
        print(f"❌ CRUD: Error creating branch: {e}")
        logger.error(f"Error creating branch: {e}")
        return {
            'success': False,
            'branch_id': None,
            'error_message': str(e)
        }

def update_branch(branch_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update branch"""
    try:
        print(f"🏢 CRUD: Updating branch {branch_id} with data: {update_data}")
        
        # Build update query
        updates = []
        params = []
        
        for field, value in update_data.items():
            if value is not None and field not in ['address_line1', 'address_line2', 'city', 'province', 'postal_code', 'country']:
                updates.append(f"{field} = %s")
                params.append(value)
        
        if updates:
            # Add updated_at
            updates.append("updated_at = NOW()")
            
            query = f"UPDATE branch SET {', '.join(updates)} WHERE branch_id = %s"
            params.append(branch_id)
            
            execute_query(query, tuple(params))
        
        print(f"🏢 CRUD: Branch updated successfully")
        return {
            'success': True,
            'error_message': None
        }
        
    except Exception as e:
        print(f"❌ CRUD: Error updating branch {branch_id}: {e}")
        logger.error(f"Error updating branch {branch_id}: {e}")
        return {
            'success': False,
            'error_message': str(e)
        }