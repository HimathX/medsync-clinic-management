-- ============================================
-- Branch Initialization Script
-- Creates 5 Fixed Branches with Proper FK References
-- ============================================

USE `medsync_db`;

-- ============================================
-- 1. Insert Addresses for 5 Branches
-- ============================================
INSERT INTO address (address_id, address_line1, address_line2, city, province, postal_code, country) 
VALUES 
    (UUID(), '456 Clinic Road', 'Ground Floor', 'Colombo 08', 'Western', '00800', 'Sri Lanka'),
    (UUID(), '789 Fort Street', NULL, 'Galle', 'Southern', '80000', 'Sri Lanka'),
    (UUID(), '321 Temple Lane', '2nd Floor', 'Kandy', 'Central', '20000', 'Sri Lanka'),
    (UUID(), '654 Library Road', NULL, 'Jaffna', 'Northern', '40000', 'Sri Lanka'),
    (UUID(), '987 Main Bazaar', 'Suite B', 'Kurunegala', 'North Western', '60000', 'Sri Lanka');

-- ============================================
-- 2. Insert Contacts for 5 Branches
-- ============================================
INSERT INTO contact (contact_id, contact_num1, contact_num2) 
VALUES 
    (UUID(), '+94114567890', '+94774567890'),
    (UUID(), '+94945678901', '+94785678901'),
    (UUID(), '+94812345678', NULL),
    (UUID(), '+94211234567', '+94791234567'),
    (UUID(), '+94372234567', NULL);

-- ============================================
-- 3. Insert 5 Branches (Using Subqueries)
-- ============================================
INSERT INTO branch (branch_id, branch_name, contact_id, address_id, manager_id, is_active)
SELECT 
    UUID(),
    'Colombo Central Branch',
    (SELECT contact_id FROM contact WHERE contact_num1 = '+94114567890' LIMIT 1),
    (SELECT address_id FROM address WHERE address_line1 = '456 Clinic Road' AND city = 'Colombo 08' LIMIT 1),
    NULL,
    TRUE
UNION ALL
SELECT 
    UUID(),
    'Galle Branch',
    (SELECT contact_id FROM contact WHERE contact_num1 = '+94945678901' LIMIT 1),
    (SELECT address_id FROM address WHERE address_line1 = '789 Fort Street' AND city = 'Galle' LIMIT 1),
    NULL,
    TRUE
UNION ALL
SELECT 
    UUID(),
    'Kandy Branch',
    (SELECT contact_id FROM contact WHERE contact_num1 = '+94812345678' LIMIT 1),
    (SELECT address_id FROM address WHERE address_line1 = '321 Temple Lane' AND city = 'Kandy' LIMIT 1),
    NULL,
    TRUE
UNION ALL
SELECT 
    UUID(),
    'Jaffna Branch',
    (SELECT contact_id FROM contact WHERE contact_num1 = '+94211234567' LIMIT 1),
    (SELECT address_id FROM address WHERE address_line1 = '654 Library Road' AND city = 'Jaffna' LIMIT 1),
    NULL,
    TRUE
UNION ALL
SELECT 
    UUID(),
    'Kurunegala Branch',
    (SELECT contact_id FROM contact WHERE contact_num1 = '+94372234567' LIMIT 1),
    (SELECT address_id FROM address WHERE address_line1 = '987 Main Bazaar' AND city = 'Kurunegala' LIMIT 1),
    NULL,
    TRUE;


