-- ============================================================
-- INSURANCE CLAIMS SYSTEM
-- Comprehensive implementation for treatment reimbursement
-- ============================================================

-- 1. TREATMENT COVERAGE POLICY TABLE
-- Links treatments to insurance policies and defines coverage rules
CREATE TABLE IF NOT EXISTS treatment_coverage_policy (
    coverage_id CHAR(36) PRIMARY KEY,
    insurance_id CHAR(36) NOT NULL,
    treatment_id CHAR(36) NOT NULL,
    coverage_percentage DECIMAL(5,2) NOT NULL DEFAULT 100,  -- % of treatment cost covered (0-100)
    max_coverage_amount DECIMAL(12,2),  -- Maximum amount the insurance will cover
    requires_preauth BOOLEAN DEFAULT FALSE,  -- Does it need pre-authorization?
    min_treatment_cost DECIMAL(12,2),  -- Minimum treatment cost to trigger coverage
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL DEFAULT (CURRENT_DATE),
    effective_to DATE,  -- NULL = indefinite coverage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (insurance_id) REFERENCES insurance(insurance_id) ON DELETE CASCADE,
    FOREIGN KEY (treatment_id) REFERENCES treatment_catalogue(treatment_id) ON DELETE CASCADE,
    UNIQUE KEY unique_coverage (insurance_id, treatment_id, effective_from),
    CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    CHECK (min_treatment_cost >= 0)
);

-- 2. CLAIM STATUS TABLE (Reference for claim statuses)
CREATE TABLE IF NOT EXISTS claim_status_type (
    status_id TINYINT PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

INSERT INTO claim_status_type (status_id, status_name, description) VALUES
(1, 'DRAFT', 'Claim is being prepared'),
(2, 'PENDING', 'Claim submitted, awaiting approval'),
(3, 'APPROVED', 'Claim approved by insurance'),
(4, 'REJECTED', 'Claim rejected by insurance'),
(5, 'PARTIAL', 'Claim partially approved'),
(6, 'PAID', 'Claim amount has been paid'),
(7, 'CANCELLED', 'Claim cancelled');

-- 3. ENHANCED CLAIM TABLE (with additional fields)
-- NOTE: If claim table already exists, you can add these columns separately
ALTER TABLE claim ADD COLUMN IF NOT EXISTS 
    claim_status_id TINYINT DEFAULT 1 AFTER claim_amount;
    
ALTER TABLE claim ADD COLUMN IF NOT EXISTS 
    patient_id CHAR(36) AFTER claim_status_id;
    
ALTER TABLE claim ADD COLUMN IF NOT EXISTS 
    treatment_id CHAR(36) AFTER patient_id;
    
ALTER TABLE claim ADD COLUMN IF NOT EXISTS 
    submitted_date DATETIME AFTER treatment_id;
    
ALTER TABLE claim ADD COLUMN IF NOT EXISTS 
    approved_date DATETIME AFTER submitted_date;
    
ALTER TABLE claim ADD COLUMN IF NOT EXISTS 
    rejection_reason VARCHAR(500) AFTER approved_date;
    
ALTER TABLE claim ADD COLUMN IF NOT EXISTS 
    approved_amount DECIMAL(12,2) AFTER rejection_reason;
    
ALTER TABLE claim ADD COLUMN IF NOT EXISTS 
    payment_status ENUM('PENDING', 'PAID', 'PARTIALLY_PAID') DEFAULT 'PENDING' AFTER approved_amount;

-- Add foreign keys for the new columns
ALTER TABLE claim ADD CONSTRAINT fk_claim_status 
    FOREIGN KEY (claim_status_id) REFERENCES claim_status_type(status_id) ON DELETE RESTRICT;

ALTER TABLE claim ADD CONSTRAINT fk_claim_patient 
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE;

ALTER TABLE claim ADD CONSTRAINT fk_claim_treatment 
    FOREIGN KEY (treatment_id) REFERENCES treatment_catalogue(treatment_id) ON DELETE RESTRICT;

-- 4. CLAIM AUDIT TABLE (Track all changes)
CREATE TABLE IF NOT EXISTS claim_audit (
    audit_id CHAR(36) PRIMARY KEY,
    claim_id CHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,  -- CREATED, SUBMITTED, APPROVED, REJECTED, PAID
    old_status TINYINT,
    new_status TINYINT,
    old_amount DECIMAL(12,2),
    new_amount DECIMAL(12,2),
    changed_by CHAR(36),  -- User who made the change
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id) REFERENCES claim(claim_id) ON DELETE CASCADE,
    FOREIGN KEY (old_status) REFERENCES claim_status_type(status_id),
    FOREIGN KEY (new_status) REFERENCES claim_status_type(status_id),
    FOREIGN KEY (changed_by) REFERENCES user(user_id) ON DELETE SET NULL,
    INDEX idx_claim_audit (claim_id, changed_at)
);

-- 5. INSURANCE POLICY LIMITS TABLE (Track usage against limits)
CREATE TABLE IF NOT EXISTS insurance_policy_limits (
    limit_id CHAR(36) PRIMARY KEY,
    insurance_id CHAR(36) NOT NULL,
    plan_year INT NOT NULL,
    annual_limit DECIMAL(12,2),  -- Total annual coverage limit
    used_amount DECIMAL(12,2) DEFAULT 0,  -- Amount already claimed
    remaining_amount DECIMAL(12,2),  -- Calculated field
    copay_amount DECIMAL(10,2),  -- Fixed copay per treatment
    deductible_amount DECIMAL(12,2),  -- Annual deductible
    deductible_used DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (insurance_id) REFERENCES insurance(insurance_id) ON DELETE CASCADE,
    UNIQUE KEY unique_policy_year (insurance_id, plan_year),
    CHECK (used_amount <= annual_limit OR annual_limit IS NULL)
);

-- 6. TRIGGER: Auto-update claim audit when claim status changes
DELIMITER //

CREATE TRIGGER IF NOT EXISTS claim_status_audit_trigger
AFTER UPDATE ON claim
FOR EACH ROW
BEGIN
    IF OLD.claim_status_id != NEW.claim_status_id THEN
        INSERT INTO claim_audit (
            audit_id, claim_id, action, old_status, new_status,
            old_amount, new_amount, changed_at
        ) VALUES (
            UUID(),
            NEW.claim_id,
            CONCAT('STATUS_CHANGED_TO_', (SELECT status_name FROM claim_status_type WHERE status_id = NEW.claim_status_id)),
            OLD.claim_status_id,
            NEW.claim_status_id,
            OLD.claim_amount,
            NEW.approved_amount,
            NOW()
        );
    END IF;
END//

DELIMITER ;

-- 7. TRIGGER: Auto-update insurance policy limits when claim is approved
DELIMITER //

CREATE TRIGGER IF NOT EXISTS claim_approved_update_limits
AFTER UPDATE ON claim
FOR EACH ROW
BEGIN
    IF NEW.claim_status_id = 3 AND OLD.claim_status_id != 3 THEN  -- Status 3 = APPROVED
        UPDATE insurance_policy_limits
        SET used_amount = used_amount + NEW.approved_amount,
            remaining_amount = annual_limit - (used_amount + NEW.approved_amount)
        WHERE insurance_id = (SELECT insurance_id FROM claim WHERE claim_id = NEW.claim_id)
        AND plan_year = YEAR(NEW.approved_date);
    END IF;
END//

DELIMITER ;

-- 8. STORED PROCEDURE: Calculate claim amount based on policy
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS CalculateClaimAmount(
    IN p_patient_id CHAR(36),
    IN p_invoice_id CHAR(36),
    IN p_treatment_id CHAR(36),
    IN p_insurance_id CHAR(36),
    IN p_treatment_cost DECIMAL(12,2),
    OUT p_covered_amount DECIMAL(12,2),
    OUT p_patient_cost DECIMAL(12,2),
    OUT p_is_eligible BOOLEAN,
    OUT p_message VARCHAR(500)
)
READS SQL DATA
BEGIN
    DECLARE v_coverage_percentage DECIMAL(5,2);
    DECLARE v_max_coverage DECIMAL(12,2);
    DECLARE v_annual_limit DECIMAL(12,2);
    DECLARE v_used_amount DECIMAL(12,2);
    DECLARE v_copay DECIMAL(10,2);
    DECLARE v_deductible_remaining DECIMAL(12,2);
    
    SET p_is_eligible = FALSE;
    SET p_covered_amount = 0;
    SET p_patient_cost = p_treatment_cost;
    
    -- Check if treatment coverage exists for this insurance
    SELECT coverage_percentage, max_coverage_amount
    INTO v_coverage_percentage, v_max_coverage
    FROM treatment_coverage_policy
    WHERE insurance_id = p_insurance_id
    AND treatment_id = p_treatment_id
    AND is_active = TRUE
    AND (effective_to IS NULL OR effective_to >= CURDATE())
    LIMIT 1;
    
    IF v_coverage_percentage IS NULL THEN
        SET p_message = 'Treatment not covered under this insurance policy';
        RETURN;
    END IF;
    
    -- Check annual limits
    SELECT annual_limit, used_amount, copay_amount, (deductible_amount - deductible_used)
    INTO v_annual_limit, v_used_amount, v_copay, v_deductible_remaining
    FROM insurance_policy_limits
    WHERE insurance_id = p_insurance_id
    AND plan_year = YEAR(CURDATE());
    
    -- Calculate covered amount
    SET p_covered_amount = (p_treatment_cost * v_coverage_percentage) / 100;
    
    -- Apply maximum coverage if set
    IF v_max_coverage IS NOT NULL AND p_covered_amount > v_max_coverage THEN
        SET p_covered_amount = v_max_coverage;
    END IF;
    
    -- Apply annual limit
    IF v_annual_limit IS NOT NULL AND (v_used_amount + p_covered_amount) > v_annual_limit THEN
        SET p_covered_amount = v_annual_limit - v_used_amount;
        SET p_message = 'Claim partially covered due to annual limit';
    END IF;
    
    -- Apply deductible if remaining
    IF v_deductible_remaining > 0 AND p_covered_amount > 0 THEN
        IF p_covered_amount >= v_deductible_remaining THEN
            SET p_covered_amount = p_covered_amount - v_deductible_remaining;
        ELSE
            SET p_covered_amount = 0;
        END IF;
    END IF;
    
    -- Apply copay
    IF v_copay IS NOT NULL AND v_copay > 0 THEN
        SET p_covered_amount = p_covered_amount - v_copay;
    END IF;
    
    -- Ensure covered amount is not negative
    IF p_covered_amount < 0 THEN
        SET p_covered_amount = 0;
    END IF;
    
    SET p_patient_cost = p_treatment_cost - p_covered_amount;
    SET p_is_eligible = TRUE;
    
    IF p_message IS NULL THEN
        SET p_message = 'Claim eligible for coverage';
    END IF;
END//

DELIMITER ;

-- 9. STORED PROCEDURE: Submit insurance claim
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS SubmitInsuranceClaim(
    IN p_patient_id CHAR(36),
    IN p_invoice_id CHAR(36),
    IN p_treatment_id CHAR(36),
    IN p_insurance_id CHAR(36),
    IN p_treatment_cost DECIMAL(12,2),
    OUT p_claim_id CHAR(36),
    OUT p_success BOOLEAN,
    OUT p_error_message VARCHAR(500)
)
MODIFIES SQL DATA
BEGIN
    DECLARE v_covered_amount DECIMAL(12,2);
    DECLARE v_patient_cost DECIMAL(12,2);
    DECLARE v_is_eligible BOOLEAN;
    DECLARE v_message VARCHAR(500);
    
    SET p_success = FALSE;
    SET p_claim_id = NULL;
    
    -- Validate inputs
    IF p_patient_id IS NULL OR p_invoice_id IS NULL THEN
        SET p_error_message = 'Patient ID and Invoice ID are required';
        RETURN;
    END IF;
    
    -- Calculate claim amount
    CALL CalculateClaimAmount(
        p_patient_id, p_invoice_id, p_treatment_id, p_insurance_id,
        p_treatment_cost, v_covered_amount, v_patient_cost, v_is_eligible, v_message
    );
    
    IF NOT v_is_eligible THEN
        SET p_error_message = v_message;
        RETURN;
    END IF;
    
    -- Create claim
    SET p_claim_id = UUID();
    
    INSERT INTO claim (
        claim_id, invoice_id, insurance_id, claim_amount,
        patient_id, treatment_id, submitted_date, claim_status_id
    ) VALUES (
        p_claim_id, p_invoice_id, p_insurance_id, v_covered_amount,
        p_patient_id, p_treatment_id, NOW(), 2  -- Status 2 = PENDING
    );
    
    INSERT INTO claim_audit (
        audit_id, claim_id, action, new_status, changed_at
    ) VALUES (
        UUID(), p_claim_id, 'SUBMITTED', 2, NOW()
    );
    
    SET p_success = TRUE;
    SET p_error_message = CONCAT('Claim submitted. Covered amount: LKR ', v_covered_amount);
END//

DELIMITER ;

-- 10. STORED PROCEDURE: Approve/Reject claim
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS ProcessClaimDecision(
    IN p_claim_id CHAR(36),
    IN p_new_status TINYINT,  -- 3=APPROVED, 4=REJECTED, 5=PARTIAL
    IN p_approved_amount DECIMAL(12,2),
    IN p_rejection_reason VARCHAR(500),
    OUT p_success BOOLEAN,
    OUT p_error_message VARCHAR(500)
)
MODIFIES SQL DATA
BEGIN
    DECLARE v_old_status TINYINT;
    DECLARE v_insurance_id CHAR(36);
    
    SET p_success = FALSE;
    
    -- Get current claim status
    SELECT claim_status_id, insurance_id
    INTO v_old_status, v_insurance_id
    FROM claim
    WHERE claim_id = p_claim_id;
    
    IF v_old_status IS NULL THEN
        SET p_error_message = 'Claim not found';
        RETURN;
    END IF;
    
    IF v_old_status NOT IN (1, 2) THEN
        SET p_error_message = 'Cannot modify claim in current status';
        RETURN;
    END IF;
    
    -- Update claim
    UPDATE claim
    SET claim_status_id = p_new_status,
        approved_date = NOW(),
        approved_amount = p_approved_amount,
        rejection_reason = p_rejection_reason
    WHERE claim_id = p_claim_id;
    
    -- Log in audit
    INSERT INTO claim_audit (
        audit_id, claim_id, action, old_status, new_status,
        new_amount, change_reason, changed_at
    ) VALUES (
        UUID(), p_claim_id, 
        CASE p_new_status 
            WHEN 3 THEN 'APPROVED'
            WHEN 4 THEN 'REJECTED'
            WHEN 5 THEN 'PARTIALLY_APPROVED'
        END,
        v_old_status, p_new_status,
        p_approved_amount, p_rejection_reason, NOW()
    );
    
    SET p_success = TRUE;
    SET p_error_message = 'Claim decision processed successfully';
END//

DELIMITER ;

-- 11. VIEW: Claims by patient
CREATE OR REPLACE VIEW patient_claims_view AS
SELECT 
    c.claim_id,
    c.patient_id,
    u.full_name as patient_name,
    c.claim_amount,
    c.approved_amount,
    c.claim_status_id,
    st.status_name,
    i.insurance_company_name,
    tc.treatment_name,
    c.submitted_date,
    c.approved_date,
    DATEDIFF(c.approved_date, c.submitted_date) as days_to_approve
FROM claim c
JOIN patient p ON c.patient_id = p.patient_id
JOIN user u ON p.user_id = u.user_id
JOIN insurance i ON c.insurance_id = i.insurance_id
JOIN treatment_catalogue tc ON c.treatment_id = tc.treatment_id
LEFT JOIN claim_status_type st ON c.claim_status_id = st.status_id
ORDER BY c.submitted_date DESC;

-- 12. VIEW: Insurance coverage summary
CREATE OR REPLACE VIEW insurance_coverage_summary AS
SELECT 
    i.insurance_id,
    i.insurance_company_name,
    COUNT(tcp.coverage_id) as treatments_covered,
    SUM(tcp.coverage_percentage) / COUNT(tcp.coverage_id) as avg_coverage_percentage,
    COUNT(DISTINCT c.claim_id) as total_claims,
    SUM(CASE WHEN c.claim_status_id = 3 THEN c.approved_amount ELSE 0 END) as total_approved_amount,
    COUNT(CASE WHEN c.claim_status_id = 4 THEN 1 END) as rejected_claims
FROM insurance i
LEFT JOIN treatment_coverage_policy tcp ON i.insurance_id = tcp.insurance_id AND tcp.is_active = TRUE
LEFT JOIN claim c ON i.insurance_id = c.insurance_id
GROUP BY i.insurance_id, i.insurance_company_name;

-- 13. VIEW: Pending claims
CREATE OR REPLACE VIEW pending_claims_view AS
SELECT 
    c.claim_id,
    c.patient_id,
    u.full_name as patient_name,
    i.insurance_company_name,
    tc.treatment_name,
    c.claim_amount,
    c.submitted_date,
    DATEDIFF(CURDATE(), c.submitted_date) as days_pending
FROM claim c
JOIN patient p ON c.patient_id = p.patient_id
JOIN user u ON p.user_id = u.user_id
JOIN insurance i ON c.insurance_id = i.insurance_id
JOIN treatment_catalogue tc ON c.treatment_id = tc.treatment_id
WHERE c.claim_status_id = 2  -- PENDING status
ORDER BY c.submitted_date ASC;

-- Create indexes for performance
CREATE INDEX idx_claim_patient ON claim(patient_id);
CREATE INDEX idx_claim_insurance ON claim(insurance_id);
CREATE INDEX idx_claim_status ON claim(claim_status_id);
CREATE INDEX idx_claim_submitted ON claim(submitted_date);
CREATE INDEX idx_coverage_insurance ON treatment_coverage_policy(insurance_id, is_active);
CREATE INDEX idx_policy_limits_year ON insurance_policy_limits(insurance_id, plan_year);
