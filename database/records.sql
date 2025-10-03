-- ============================================
-- MedSync Clinic Management System
-- Sample Data Population Script
-- 3 Branches with comprehensive records
-- ============================================

-- ============================================
-- 1. ADDRESS DATA (15 addresses)
-- ============================================
INSERT INTO address (address_id, address_line1, address_line2, city, province, postal_code, country) VALUES
-- Branch Addresses
(UUID(), '123 Galle Road', 'Colombo 03', 'Colombo', 'Western', '00300', 'Sri Lanka'),
(UUID(), '456 Kandy Road', 'Peradeniya', 'Kandy', 'Central', '20400', 'Sri Lanka'),
(UUID(), '789 Matara Road', 'Galle Fort', 'Galle', 'Southern', '80000', 'Sri Lanka'),

-- Patient Addresses
(UUID(), '12 Temple Street', 'Wellawatta', 'Colombo', 'Western', '00600', 'Sri Lanka'),
(UUID(), '34 Lake View Road', 'Rajagiriya', 'Colombo', 'Western', '10100', 'Sri Lanka'),
(UUID(), '56 Hill Street', 'Kandy', 'Kandy', 'Central', '20000', 'Sri Lanka'),
(UUID(), '78 Beach Road', 'Mount Lavinia', 'Colombo', 'Western', '10370', 'Sri Lanka'),
(UUID(), '90 Station Road', 'Gampaha', 'Gampaha', 'Western', '11000', 'Sri Lanka'),
(UUID(), '11 Park Avenue', 'Nugegoda', 'Colombo', 'Western', '10250', 'Sri Lanka'),
(UUID(), '22 Green Lane', 'Moratuwa', 'Colombo', 'Western', '10400', 'Sri Lanka'),

-- Employee Addresses (Fixed apostrophe)
(UUID(), '33 Doctor Lane', 'Colombo 07', 'Colombo', 'Western', '00700', 'Sri Lanka'),
(UUID(), '44 Hospital Road', 'Kandy', 'Kandy', 'Central', '20000', 'Sri Lanka'),
(UUID(), '55 Medical Street', 'Galle', 'Galle', 'Southern', '80000', 'Sri Lanka'),
(UUID(), '66 Clinic Avenue', 'Colombo 05', 'Colombo', 'Western', '00500', 'Sri Lanka'),
(UUID(), '77 Health Road', 'Peradeniya', 'Kandy', 'Central', '20400', 'Sri Lanka');

-- ============================================
-- 2. CONTACT DATA (30 contacts)
-- ============================================
INSERT INTO contact (contact_id, contact_num1, contact_num2) VALUES
-- Branch Contacts
(UUID(), '+94112345001', '+94777123001'),
(UUID(), '+94812345002', '+94777123002'),
(UUID(), '+94912345003', '+94777123003'),

-- Patient Contacts (20)
(UUID(), '+94112345101', '+94777123101'),
(UUID(), '+94112345102', '+94777123102'),
(UUID(), '+94112345103', '+94777123103'),
(UUID(), '+94112345104', '+94777123104'),
(UUID(), '+94112345105', '+94777123105'),
(UUID(), '+94112345106', '+94777123106'),
(UUID(), '+94112345107', '+94777123107'),
(UUID(), '+94112345108', '+94777123108'),
(UUID(), '+94112345109', '+94777123109'),
(UUID(), '+94112345110', '+94777123110'),
(UUID(), '+94112345111', '+94777123111'),
(UUID(), '+94112345112', '+94777123112'),
(UUID(), '+94112345113', '+94777123113'),
(UUID(), '+94112345114', '+94777123114'),
(UUID(), '+94112345115', '+94777123115'),
(UUID(), '+94112345116', '+94777123116'),
(UUID(), '+94112345117', '+94777123117'),
(UUID(), '+94112345118', '+94777123118'),
(UUID(), '+94112345119', '+94777123119'),
(UUID(), '+94112345120', '+94777123120'),

-- Employee Contacts (10)
(UUID(), '+94112345201', '+94777123201'),
(UUID(), '+94112345202', '+94777123202'),
(UUID(), '+94112345203', '+94777123203'),
(UUID(), '+94112345204', '+94777123204'),
(UUID(), '+94112345205', '+94777123205'),
(UUID(), '+94112345206', '+94777123206'),
(UUID(), '+94112345207', '+94777123207'),
(UUID(), '+94112345208', '+94777123208'),
(UUID(), '+94112345209', '+94777123209'),
(UUID(), '+94112345210', '+94777123210');

-- ============================================
-- 3. BRANCHES (3 branches)
-- ============================================
INSERT INTO branch (branch_id, branch_name, contact_id, address_id, is_active)
SELECT 
    UUID() as branch_id,
    'MedSync Colombo' as branch_name,
    (SELECT contact_id FROM contact LIMIT 1) as contact_id,
    (SELECT address_id FROM address LIMIT 1) as address_id,
    TRUE as is_active
UNION ALL
SELECT 
    UUID(),
    'MedSync Kandy',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 1),
    (SELECT address_id FROM address LIMIT 1 OFFSET 1),
    TRUE
UNION ALL
SELECT 
    UUID(),
    'MedSync Galle',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 2),
    (SELECT address_id FROM address LIMIT 1 OFFSET 2),
    TRUE;

-- ============================================
-- 4. USERS - EMPLOYEES (10 employees)
-- ============================================
-- Managers (3)
INSERT INTO user (user_id, address_id, user_type, full_name, NIC, email, gender, DOB, contact_id, password_hash)
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 10),
    'employee',
    'Dr. Samantha Perera',
    '198501234567',
    'samantha.perera@medsync.lk',
    'Female',
    '1985-05-15',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 23),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6' -- password: manager123
UNION ALL
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 11),
    'employee',
    'Dr. Nimal Silva',
    '198201234568',
    'nimal.silva@medsync.lk',
    'Male',
    '1982-08-22',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 24),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'
UNION ALL
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 12),
    'employee',
    'Dr. Chamari Fernando',
    '198701234569',
    'chamari.fernando@medsync.lk',
    'Female',
    '1987-12-10',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 25),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6';

-- Doctors (4)
INSERT INTO user (user_id, address_id, user_type, full_name, NIC, email, gender, DOB, contact_id, password_hash)
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 13),
    'employee',
    'Dr. Kasun Rajapaksha',
    '199001234570',
    'kasun.rajapaksha@medsync.lk',
    'Male',
    '1990-03-15',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 26),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6' -- password: doctor123
UNION ALL
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 14),
    'employee',
    'Dr. Priya Jayawardena',
    '199201234571',
    'priya.jayawardena@medsync.lk',
    'Female',
    '1992-07-20',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 27),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'
UNION ALL
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 10),
    'employee',
    'Dr. Rohan Wickramasinghe',
    '198801234572',
    'rohan.wickramasinghe@medsync.lk',
    'Male',
    '1988-11-05',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 28),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'
UNION ALL
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 11),
    'employee',
    'Dr. Dilini Gunasekara',
    '199301234573',
    'dilini.gunasekara@medsync.lk',
    'Female',
    '1993-04-18',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 29),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6';

-- Nurses & Admin Staff (3)
INSERT INTO user (user_id, address_id, user_type, full_name, NIC, email, gender, DOB, contact_id, password_hash)
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 12),
    'employee',
    'Nimali Wijesinghe',
    '199501234574',
    'nimali.wijesinghe@medsync.lk',
    'Female',
    '1995-06-25',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 30),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6' -- password: nurse123
UNION ALL
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 13),
    'employee',
    'Sanduni Amarasinghe',
    '199601234575',
    'sanduni.amarasinghe@medsync.lk',
    'Female',
    '1996-09-12',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 31),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'
UNION ALL
SELECT 
    UUID(),
    (SELECT address_id FROM address LIMIT 1 OFFSET 14),
    'employee',
    'Kavinda Dissanayake',
    '199401234576',
    'kavinda.dissanayake@medsync.lk',
    'Male',
    '1994-02-28',
    (SELECT contact_id FROM contact LIMIT 1 OFFSET 32),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6';

-- ============================================
-- 5. USERS - PATIENTS (20 patients)
-- ============================================
INSERT INTO user (user_id, address_id, user_type, full_name, NIC, email, gender, DOB, contact_id, password_hash) VALUES
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 3), 'patient', 'Amara Bandara', '198801234501', 'amara.bandara@email.com', 'Male', '1988-03-14', (SELECT contact_id FROM contact LIMIT 1 OFFSET 3), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 4), 'patient', 'Tharushi De Silva', '199201234502', 'tharushi.desilva@email.com', 'Female', '1992-07-22', (SELECT contact_id FROM contact LIMIT 1 OFFSET 4), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 5), 'patient', 'Kavindu Jayasinghe', '199501234503', 'kavindu.jayasinghe@email.com', 'Male', '1995-11-08', (SELECT contact_id FROM contact LIMIT 1 OFFSET 5), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 6), 'patient', 'Nethmi Samaraweera', '199801234504', 'nethmi.samaraweera@email.com', 'Female', '1998-05-17', (SELECT contact_id FROM contact LIMIT 1 OFFSET 6), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 7), 'patient', 'Dinesh Fernando', '198501234505', 'dinesh.fernando@email.com', 'Male', '1985-09-30', (SELECT contact_id FROM contact LIMIT 1 OFFSET 7), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 8), 'patient', 'Sandali Perera', '199001234506', 'sandali.perera@email.com', 'Female', '1990-12-25', (SELECT contact_id FROM contact LIMIT 1 OFFSET 8), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 9), 'patient', 'Ravindu Silva', '199301234507', 'ravindu.silva@email.com', 'Male', '1993-04-12', (SELECT contact_id FROM contact LIMIT 1 OFFSET 9), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 3), 'patient', 'Ishara Gamage', '199601234508', 'ishara.gamage@email.com', 'Female', '1996-08-19', (SELECT contact_id FROM contact LIMIT 1 OFFSET 10), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 4), 'patient', 'Lakshan Wijewardena', '198201234509', 'lakshan.wijewardena@email.com', 'Male', '1982-01-07', (SELECT contact_id FROM contact LIMIT 1 OFFSET 11), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 5), 'patient', 'Malsha Rathnayake', '199901234510', 'malsha.rathnayake@email.com', 'Female', '1999-10-03', (SELECT contact_id FROM contact LIMIT 1 OFFSET 12), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 6), 'patient', 'Prasad Mendis', '198701234511', 'prasad.mendis@email.com', 'Male', '1987-06-15', (SELECT contact_id FROM contact LIMIT 1 OFFSET 13), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 7), 'patient', 'Dulani Hewage', '199401234512', 'dulani.hewage@email.com', 'Female', '1994-02-28', (SELECT contact_id FROM contact LIMIT 1 OFFSET 14), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 8), 'patient', 'Nuwan Kumara', '199101234513', 'nuwan.kumara@email.com', 'Male', '1991-11-20', (SELECT contact_id FROM contact LIMIT 1 OFFSET 15), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 9), 'patient', 'Sachini Wickramasinghe', '199701234514', 'sachini.wickramasinghe@email.com', 'Female', '1997-05-09', (SELECT contact_id FROM contact LIMIT 1 OFFSET 16), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 3), 'patient', 'Chaminda Rajapaksha', '198601234515', 'chaminda.rajapaksha@email.com', 'Male', '1986-09-04', (SELECT contact_id FROM contact LIMIT 1 OFFSET 17), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 4), 'patient', 'Anusha Jayawardena', '199101234516', 'anusha.jayawardena@email.com', 'Female', '1991-03-21', (SELECT contact_id FROM contact LIMIT 1 OFFSET 18), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 5), 'patient', 'Thilina Gunasekara', '199501234517', 'thilina.gunasekara@email.com', 'Male', '1995-07-16', (SELECT contact_id FROM contact LIMIT 1 OFFSET 19), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 6), 'patient', 'Harini Dissanayake', '199801234518', 'harini.dissanayake@email.com', 'Female', '1998-12-08', (SELECT contact_id FROM contact LIMIT 1 OFFSET 20), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 7), 'patient', 'Janaka Senanayake', '198401234519', 'janaka.senanayake@email.com', 'Male', '1984-08-11', (SELECT contact_id FROM contact LIMIT 1 OFFSET 21), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6'),
(UUID(), (SELECT address_id FROM address LIMIT 1 OFFSET 8), 'patient', 'Chathurika Bandara', '199201234520', 'chathurika.bandara@email.com', 'Female', '1992-04-27', (SELECT contact_id FROM contact LIMIT 1 OFFSET 22), '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6');

-- ============================================
-- 6. EMPLOYEES (Link to users & branches)
-- ============================================
-- Managers
INSERT INTO employee (employee_id, branch_id, role, salary, joined_date, is_active)
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo'),
    'manager',
    250000.00,
    '2020-01-15',
    TRUE
FROM user u
WHERE u.email = 'samantha.perera@medsync.lk'
UNION ALL
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy'),
    'manager',
    240000.00,
    '2020-02-01',
    TRUE
FROM user u
WHERE u.email = 'nimal.silva@medsync.lk'
UNION ALL
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle'),
    'manager',
    245000.00,
    '2020-03-10',
    TRUE
FROM user u
WHERE u.email = 'chamari.fernando@medsync.lk';

-- Update branch managers
UPDATE branch b
SET manager_id = (SELECT employee_id FROM employee e WHERE e.branch_id = b.branch_id AND e.role = 'manager');

-- Doctors
INSERT INTO employee (employee_id, branch_id, role, salary, joined_date, is_active)
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo'),
    'doctor',
    180000.00,
    '2021-05-01',
    TRUE
FROM user u
WHERE u.email = 'kasun.rajapaksha@medsync.lk'
UNION ALL
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo'),
    'doctor',
    175000.00,
    '2021-06-15',
    TRUE
FROM user u
WHERE u.email = 'priya.jayawardena@medsync.lk'
UNION ALL
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy'),
    'doctor',
    170000.00,
    '2021-07-20',
    TRUE
FROM user u
WHERE u.email = 'rohan.wickramasinghe@medsync.lk'
UNION ALL
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle'),
    'doctor',
    172000.00,
    '2021-08-10',
    TRUE
FROM user u
WHERE u.email = 'dilini.gunasekara@medsync.lk';

-- Other Staff
INSERT INTO employee (employee_id, branch_id, role, salary, joined_date, is_active)
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo'),
    'nurse',
    80000.00,
    '2022-01-10',
    TRUE
FROM user u
WHERE u.email = 'nimali.wijesinghe@medsync.lk'
UNION ALL
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy'),
    'nurse',
    78000.00,
    '2022-02-15',
    TRUE
FROM user u
WHERE u.email = 'sanduni.amarasinghe@medsync.lk'
UNION ALL
SELECT 
    u.user_id,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle'),
    'receptionist',
    60000.00,
    '2022-03-01',
    TRUE
FROM user u
WHERE u.email = 'kavinda.dissanayake@medsync.lk';

-- ============================================
-- 7. DOCTORS (Link to employees)
-- ============================================
INSERT INTO doctor (doctor_id, room_no, medical_licence_no, consultation_fee, is_available)
SELECT 
    e.employee_id,
    'C101',
    'SLMC001234',
    5000.00,
    TRUE
FROM employee e
INNER JOIN user u ON e.employee_id = u.user_id
WHERE u.email = 'kasun.rajapaksha@medsync.lk'
UNION ALL
SELECT 
    e.employee_id,
    'C102',
    'SLMC001235',
    5500.00,
    TRUE
FROM employee e
INNER JOIN user u ON e.employee_id = u.user_id
WHERE u.email = 'priya.jayawardena@medsync.lk'
UNION ALL
SELECT 
    e.employee_id,
    'K101',
    'SLMC001236',
    4800.00,
    TRUE
FROM employee e
INNER JOIN user u ON e.employee_id = u.user_id
WHERE u.email = 'rohan.wickramasinghe@medsync.lk'
UNION ALL
SELECT 
    e.employee_id,
    'G101',
    'SLMC001237',
    4500.00,
    TRUE
FROM employee e
INNER JOIN user u ON e.employee_id = u.user_id
WHERE u.email = 'dilini.gunasekara@medsync.lk';

-- ============================================
-- 8. SPECIALIZATIONS
-- ============================================
INSERT INTO specialization (specialization_id, specialization_title, other_details) VALUES
(UUID(), 'General Medicine', 'General practice and primary care'),
(UUID(), 'Cardiology', 'Heart and cardiovascular diseases'),
(UUID(), 'Pediatrics', 'Medical care for infants, children, and adolescents'),
(UUID(), 'Dermatology', 'Skin, hair, and nail conditions'),
(UUID(), 'Orthopedics', 'Musculoskeletal system disorders');

-- ============================================
-- 9. DOCTOR SPECIALIZATIONS
-- ============================================
INSERT INTO doctor_specialization (doctor_id, specialization_id, certification_date)
SELECT 
    d.doctor_id,
    (SELECT specialization_id FROM specialization WHERE specialization_title = 'General Medicine'),
    '2020-05-01'
FROM doctor d
INNER JOIN user u ON d.doctor_id = u.user_id
WHERE u.email = 'kasun.rajapaksha@medsync.lk'
UNION ALL
SELECT 
    d.doctor_id,
    (SELECT specialization_id FROM specialization WHERE specialization_title = 'Cardiology'),
    '2020-06-15'
FROM doctor d
INNER JOIN user u ON d.doctor_id = u.user_id
WHERE u.email = 'priya.jayawardena@medsync.lk'
UNION ALL
SELECT 
    d.doctor_id,
    (SELECT specialization_id FROM specialization WHERE specialization_title = 'Pediatrics'),
    '2020-07-20'
FROM doctor d
INNER JOIN user u ON d.doctor_id = u.user_id
WHERE u.email = 'rohan.wickramasinghe@medsync.lk'
UNION ALL
SELECT 
    d.doctor_id,
    (SELECT specialization_id FROM specialization WHERE specialization_title = 'Dermatology'),
    '2020-08-10'
FROM doctor d
INNER JOIN user u ON d.doctor_id = u.user_id
WHERE u.email = 'dilini.gunasekara@medsync.lk';

-- ============================================
-- 10. PATIENTS
-- ============================================
INSERT INTO patient (patient_id, blood_group, allergies, chronic_conditions, registered_branch_id)
SELECT 
    u.user_id,
    'O+',
    NULL,
    NULL,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email LIKE '%amara.bandara%'
UNION ALL
SELECT 
    u.user_id,
    'A+',
    'Penicillin',
    'Hypertension',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email LIKE '%tharushi.desilva%'
-- Continue for all 20 patients...
UNION ALL
SELECT 
    u.user_id,
    'B+',
    NULL,
    'Diabetes Type 2',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy')
FROM user u
WHERE u.user_type = 'patient' AND u.email LIKE '%kavindu.jayasinghe%'
UNION ALL
SELECT 
    u.user_id,
    'AB+',
    'Aspirin',
    NULL,
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle')
FROM user u
WHERE u.user_type = 'patient' AND u.email LIKE '%nethmi.samaraweera%';

-- ============================================
-- 11. CONDITION CATEGORIES & CONDITIONS
-- ============================================
INSERT INTO conditions_category (condition_category_id, category_name, description) VALUES
(UUID(), 'Cardiovascular', 'Heart and blood vessel related conditions'),
(UUID(), 'Metabolic', 'Metabolism related disorders'),
(UUID(), 'Respiratory', 'Breathing and lung conditions'),
(UUID(), 'Musculoskeletal', 'Bones, muscles, and joints'),
(UUID(), 'Skin', 'Dermatological conditions');

INSERT INTO conditions (condition_id, condition_category_id, condition_name, description, severity)
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Cardiovascular'),
    'Hypertension',
    'High blood pressure',
    'Moderate'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Metabolic'),
    'Diabetes Type 2',
    'Insulin resistance',
    'Moderate'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Respiratory'),
    'Asthma',
    'Chronic inflammatory airway disease',
    'Mild';

-- Continue the script in next part...