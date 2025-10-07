DELIMITER $$

-- ============================================
-- AUDIT TRIGGERS
-- ============================================

-- User Activity Log
DROP TRIGGER IF EXISTS log_user_login$$
CREATE TRIGGER log_user_login
AFTER UPDATE ON user
FOR EACH ROW
BEGIN
    IF NEW.last_login != OLD.last_login THEN
        INSERT INTO audit_log (user_id, action, timestamp)
        VALUES (NEW.user_id, 'LOGIN', NOW());
    END IF;
END$$

-- Appointment Status Change
DROP TRIGGER IF EXISTS log_appointment_status$$
CREATE TRIGGER log_appointment_status
AFTER UPDATE ON appointment
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO audit_log (user_id, action, details, timestamp)
        VALUES (
            NEW.patient_id, 
            'APPOINTMENT_STATUS_CHANGE',
            JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status),
            NOW()
        );
    END IF;
END$$

-- ============================================
-- DATA VALIDATION TRIGGERS
-- ============================================

-- Prevent Double Booking
DROP TRIGGER IF EXISTS prevent_double_booking$$
CREATE TRIGGER prevent_double_booking
BEFORE INSERT ON appointment
FOR EACH ROW
BEGIN
    DECLARE slot_booked INT;
    SELECT is_booked INTO slot_booked 
    FROM time_slot 
    WHERE time_slot_id = NEW.time_slot_id;
    
    IF slot_booked = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Time slot already booked';
    END IF;
END$$

-- Validate Age for Patient Registration
DROP TRIGGER IF EXISTS validate_patient_age$$
CREATE TRIGGER validate_patient_age
BEFORE INSERT ON patient
FOR EACH ROW
BEGIN
    DECLARE patient_age INT;
    SELECT TIMESTAMPDIFF(YEAR, DOB, CURDATE()) INTO patient_age
    FROM user WHERE user_id = NEW.patient_id;
    
    IF patient_age < 18 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Patient must be at least 18 years old';
    END IF;
END$$

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================

-- Auto-update Bill Total
DROP TRIGGER IF EXISTS calculate_bill_total$$
CREATE TRIGGER calculate_bill_total
BEFORE INSERT ON bill
FOR EACH ROW
BEGIN
    SET NEW.total_amount = 
        NEW.consultation_fee + 
        NEW.medication_charges + 
        NEW.test_charges + 
        NEW.other_charges -
        COALESCE(NEW.discount_amount, 0);
    
    SET NEW.tax_amount = NEW.total_amount * (COALESCE(NEW.tax_percentage, 0) / 100);
    SET NEW.final_amount = NEW.total_amount + NEW.tax_amount;
END$$

-- Update Time Slot on Appointment Cancellation
DROP TRIGGER IF EXISTS free_timeslot_on_cancel$$
CREATE TRIGGER free_timeslot_on_cancel
AFTER UPDATE ON appointment
FOR EACH ROW
BEGIN
    IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
        UPDATE time_slot 
        SET is_booked = FALSE 
        WHERE time_slot_id = NEW.time_slot_id;
    END IF;
END$$

-- Update Insurance Used Amount
DROP TRIGGER IF EXISTS update_insurance_usage$$
CREATE TRIGGER update_insurance_usage
AFTER INSERT ON insurance_claim
FOR EACH ROW
BEGIN
    UPDATE insurance 
    SET used_amount = used_amount + NEW.approved_amount
    WHERE insurance_id = NEW.insurance_id;
END$$

-- ============================================
-- NOTIFICATION TRIGGERS
-- ============================================

-- Appointment Reminder (Insert to notification table)
DROP TRIGGER IF EXISTS schedule_appointment_reminder$$
CREATE TRIGGER schedule_appointment_reminder
AFTER INSERT ON appointment
FOR EACH ROW
BEGIN
    DECLARE appointment_datetime DATETIME;
    DECLARE reminder_time DATETIME;
    
    SELECT CONCAT(ts.available_date, ' ', ts.start_time) INTO appointment_datetime
    FROM time_slot ts WHERE ts.time_slot_id = NEW.time_slot_id;
    
    SET reminder_time = DATE_SUB(appointment_datetime, INTERVAL 24 HOUR);
    
    INSERT INTO notification (
        patient_id, 
        message, 
        scheduled_time, 
        type
    ) VALUES (
        NEW.patient_id,
        CONCAT('Reminder: You have an appointment tomorrow at ', appointment_datetime),
        reminder_time,
        'APPOINTMENT_REMINDER'
    );
END$$

-- Low Medication Stock Alert
DROP TRIGGER IF EXISTS alert_low_stock$$
CREATE TRIGGER alert_low_stock
AFTER UPDATE ON medication
FOR EACH ROW
BEGIN
    IF NEW.stock_quantity < NEW.reorder_level THEN
        INSERT INTO notification (
            user_id, 
            message, 
            type,
            created_at
        ) VALUES (
            (SELECT user_id FROM employee WHERE role = 'admin' LIMIT 1),
            CONCAT('Low stock alert: ', NEW.medication_name, ' (Qty: ', NEW.stock_quantity, ')'),
            'STOCK_ALERT',
            NOW()
        );
    END IF;
END$$

-- ============================================
-- BUSINESS LOGIC TRIGGERS
-- ============================================

-- Auto-expire Insurance
DROP TRIGGER IF EXISTS check_insurance_expiry$$
CREATE TRIGGER check_insurance_expiry
BEFORE UPDATE ON insurance
FOR EACH ROW
BEGIN
    IF CURDATE() > NEW.end_date AND NEW.status = 'Active' THEN
        SET NEW.status = 'Expired';
    END IF;
END$$

-- Mark Doctor Unavailable if No Slots
DROP TRIGGER IF EXISTS update_doctor_availability$$
CREATE TRIGGER update_doctor_availability
AFTER UPDATE ON time_slot
FOR EACH ROW
BEGIN
    DECLARE available_slots INT;
    
    SELECT COUNT(*) INTO available_slots
    FROM time_slot
    WHERE doctor_id = NEW.doctor_id
    AND is_booked = FALSE
    AND available_date >= CURDATE();
    
    IF available_slots = 0 THEN
        UPDATE doctor SET is_available = FALSE WHERE doctor_id = NEW.doctor_id;
    ELSE
        UPDATE doctor SET is_available = TRUE WHERE doctor_id = NEW.doctor_id;
    END IF;
END$$

DELIMITER ;

