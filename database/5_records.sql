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
-- 10. PATIENTS
-- ============================================
INSERT INTO patient (patient_id, blood_group, registered_branch_id)
SELECT 
    u.user_id,
    'O+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'amara.bandara@email.com'
UNION ALL
SELECT 
    u.user_id,
    'A+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'tharushi.desilva@email.com'
UNION ALL
SELECT 
    u.user_id,
    'B+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'kavindu.jayasinghe@email.com'
UNION ALL
SELECT 
    u.user_id,
    'AB+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'nethmi.samaraweera@email.com'
UNION ALL
SELECT 
    u.user_id,
    'O-',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'dinesh.fernando@email.com'
UNION ALL
SELECT 
    u.user_id,
    'A-',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'sandali.perera@email.com'
UNION ALL
SELECT 
    u.user_id,
    'B-',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'ravindu.silva@email.com'
UNION ALL
SELECT 
    u.user_id,
    'AB-',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'ishara.gamage@email.com'
UNION ALL
SELECT 
    u.user_id,
    'O+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'lakshan.wijewardena@email.com'
UNION ALL
SELECT 
    u.user_id,
    'A+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'malsha.rathnayake@email.com'
UNION ALL
SELECT 
    u.user_id,
    'B+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'prasad.mendis@email.com'
UNION ALL
SELECT 
    u.user_id,
    'AB+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'dulani.hewage@email.com'
UNION ALL
SELECT 
    u.user_id,
    'O-',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'nuwan.kumara@email.com'
UNION ALL
SELECT 
    u.user_id,
    'A-',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'sachini.wickramasinghe@email.com'
UNION ALL
SELECT 
    u.user_id,
    'B-',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'chaminda.rajapaksha@email.com'
UNION ALL
SELECT 
    u.user_id,
    'AB-',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'anusha.jayawardena@email.com'
UNION ALL
SELECT 
    u.user_id,
    'O+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'thilina.gunasekara@email.com'
UNION ALL
SELECT 
    u.user_id,
    'A+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Colombo')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'harini.dissanayake@email.com'
UNION ALL
SELECT 
    u.user_id,
    'B+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Kandy')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'janaka.senanayake@email.com'
UNION ALL
SELECT 
    u.user_id,
    'AB+',
    (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle')
FROM user u
WHERE u.user_type = 'patient' AND u.email = 'chathurika.bandara@email.com';

-- ============================================
-- 10a. CONDITION CATEGORIES
-- ============================================
INSERT INTO conditions_category (condition_category_id, category_name, description) VALUES
(UUID(), 'Cardiovascular', 'Heart and blood vessel related conditions'),
(UUID(), 'Respiratory', 'Lung and breathing related conditions'),
(UUID(), 'Endocrine', 'Hormonal and metabolic disorders'),
(UUID(), 'Infectious', 'Bacterial, viral, and parasitic infections'),
(UUID(), 'Neurological', 'Brain and nervous system disorders'),
(UUID(), 'Musculoskeletal', 'Bone, joint, and muscle conditions'),
(UUID(), 'Dermatological', 'Skin related conditions'),
(UUID(), 'Gastrointestinal', 'Digestive system disorders');

-- ============================================
-- 10b. CONDITIONS
-- ============================================
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
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Endocrine'),
    'Diabetes Type 2',
    'Insulin resistance and high blood sugar',
    'Moderate'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Respiratory'),
    'Asthma',
    'Chronic inflammatory airway disease',
    'Moderate'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Cardiovascular'),
    'Coronary Artery Disease',
    'Narrowing of coronary arteries',
    'Severe'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Endocrine'),
    'Hypothyroidism',
    'Underactive thyroid gland',
    'Mild'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Musculoskeletal'),
    'Arthritis',
    'Joint inflammation',
    'Moderate'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Respiratory'),
    'Chronic Bronchitis',
    'Long-term inflammation of bronchi',
    'Moderate'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Neurological'),
    'Migraine',
    'Severe recurring headaches',
    'Moderate'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Gastrointestinal'),
    'Gastroesophageal Reflux Disease',
    'Acid reflux from stomach to esophagus',
    'Mild'
UNION ALL
SELECT 
    UUID(),
    (SELECT condition_category_id FROM conditions_category WHERE category_name = 'Dermatological'),
    'Eczema',
    'Chronic inflammatory skin condition',
    'Mild';

-- ============================================
-- 10c. PATIENT ALLERGIES
-- ============================================
INSERT INTO patient_allergy (patient_allergy_id, patient_id, allergy_name, severity, reaction_description, diagnosed_date)
SELECT 
    UUID(),
    u.user_id,
    'Penicillin',
    'Mild',
    'Rash and itching',
    '2021-05-10'
FROM user u
WHERE u.email = 'amara.bandara@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Latex',
    'Severe',
    'Anaphylaxis',
    '2020-08-15'
FROM user u
WHERE u.email = 'tharushi.desilva@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Peanuts',
    'Moderate',
    'Hives and swelling',
    '2019-11-20'
FROM user u
WHERE u.email = 'kavindu.jayasinghe@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Shellfish',
    'Severe',
    'Anaphylaxis',
    '2022-01-25'
FROM user u
WHERE u.email = 'nethmi.samaraweera@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Soy',
    'Mild',
    'Nausea and vomiting',
    '2021-07-30'
FROM user u
WHERE u.email = 'dinesh.fernando@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Milk',
    'Moderate',
    'Abdominal cramps',
    '2020-12-05'
FROM user u
WHERE u.email = 'sandali.perera@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Eggs',
    'Mild',
    'Skin rash',
    '2021-03-15'
FROM user u
WHERE u.email = 'ravindu.silva@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Wheat',
    'Moderate',
    'Breathing difficulty',
    '2022-02-10'
FROM user u
WHERE u.email = 'ishara.gamage@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Corn',
    'Mild',
    'Itching and swelling',
    '2021-09-20'
FROM user u
WHERE u.email = 'lakshan.wijewardena@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Tomato',
    'Moderate',
    'Heartburn',
    '2022-03-05'
FROM user u
WHERE u.email = 'malsha.rathnayake@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Potato',
    'Mild',
    'Nasal congestion',
    '2021-06-18'
FROM user u
WHERE u.email = 'prasad.mendis@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Carrot',
    'Moderate',
    'Skin irritation',
    '2020-11-12'
FROM user u
WHERE u.email = 'dulani.hewage@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Cucumber',
    'Mild',
    'Mouth itching',
    '2021-08-25'
FROM user u
WHERE u.email = 'nuwan.kumara@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Onion',
    'Moderate',
    'Eye irritation',
    '2022-04-15'
FROM user u
WHERE u.email = 'sachini.wickramasinghe@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Garlic',
    'Mild',
    'Breath odor',
    '2021-10-30'
FROM user u
WHERE u.email = 'chaminda.rajapaksha@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Ginger',
    'Moderate',
    'Stomach upset',
    '2020-07-22'
FROM user u
WHERE u.email = 'anusha.jayawardena@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Turmeric',
    'Mild',
    'Skin rash',
    '2021-04-10'
FROM user u
WHERE u.email = 'thilina.gunasekara@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Chili Pepper',
    'Moderate',
    'Burning sensation',
    '2022-05-05'
FROM user u
WHERE u.email = 'harini.dissanayake@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Cinnamon',
    'Mild',
    'Nausea',
    '2021-01-15'
FROM user u
WHERE u.email = 'janaka.senanayake@email.com'
UNION ALL
SELECT 
    UUID(),
    u.user_id,
    'Clove',
    'Moderate',
    'Toothache',
    '2020-09-20'
FROM user u
WHERE u.email = 'chathurika.bandara@email.com';

-- ============================================
-- 10d. PATIENT CHRONIC CONDITIONS
-- ============================================
INSERT INTO patient_condition (patient_id, condition_id, diagnosed_date, is_chronic, current_status, notes)
SELECT 
    u.user_id,
    (SELECT condition_id FROM conditions WHERE condition_name = 'Hypertension'),  -- ✅ Now exists!
    '2020-01-15',
    TRUE,
    'Managed',
    'On medication, regular checkups required'
FROM user u
WHERE u.email = 'tharushi.desilva@email.com'
UNION ALL
SELECT 
    u.user_id,
    (SELECT condition_id FROM conditions WHERE condition_name = 'Diabetes Type 2'),  -- ✅ Now exists!
    '2019-06-20',
    TRUE,
    'In Treatment',
    'Diet control and insulin therapy'
FROM user u
WHERE u.email = 'kavindu.jayasinghe@email.com'
UNION ALL
SELECT 
    u.user_id,
    (SELECT condition_id FROM conditions WHERE condition_name = 'Asthma'),  -- ✅ Now exists!
    '2021-03-12',
    TRUE,
    'Active',
    'Using inhaler as needed'
FROM user u
WHERE u.email = 'malsha.rathnayake@email.com';

-- ============================================
-- 10e. PATIENT BALANCE INITIALIZATION
-- ============================================
INSERT INTO patient_balance (patient_id, total_balance)
SELECT user_id, 0.00
FROM user
WHERE user_type = 'patient';