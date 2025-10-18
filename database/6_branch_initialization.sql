--- Insert Addresses for 5 Fixed Branches

INSERT INTO address (address_id, address_line1, address_line2, city, province, postal_code, country) 
VALUES 
    (UUID(), '456 Clinic Road', 'Ground Floor', 'Colombo 08', 'Western', '00800', 'Sri Lanka'),  -- Colombo Central Branch
    (UUID(), '789 Fort Street', NULL, 'Galle', 'Southern', '80000', 'Sri Lanka'),  -- Galle Branch
    (UUID(), '321 Temple Lane', '2nd Floor', 'Kandy', 'Central', '20000', 'Sri Lanka'),  -- Kandy Branch
    (UUID(), '654 Library Road', NULL, 'Jaffna', 'Northern', '40000', 'Sri Lanka'),  -- Jaffna Branch
    (UUID(), '987 Main Bazaar', 'Suite B', 'Kurunegala', 'North Western', '60000', 'Sri Lanka');  -- Kurunegala Branch

-- Insert Contacts for 5 Fixed Branches

INSERT INTO contact (contact_id, contact_num1, contact_num2) 
VALUES 
    (UUID(), '+94114567890', '+94774567890'),  -- Colombo Central
    (UUID(), '+94945678901', '+94785678901'),  -- Galle
    (UUID(), '+94812345678', NULL),  -- Kandy
    (UUID(), '+94211234567', '+94791234567'),  -- Jaffna
    (UUID(), '+94372234567', NULL);  -- Kurunegala

INSERT INTO branch (branch_id, branch_name, contact_id, address_id, manager_id, is_active) 
VALUES 
    (UUID(), 'Colombo Central Branch', 'REPLACE_WITH_LATEST_CONTACT_ID_1', 'REPLACE_WITH_LATEST_ADDRESS_ID_1', NULL, TRUE),  -- e.g., contact_id from first insert in Step 2
    (UUID(), 'Galle Branch', 'REPLACE_WITH_LATEST_CONTACT_ID_2', 'REPLACE_WITH_LATEST_ADDRESS_ID_2', NULL, TRUE),
    (UUID(), 'Kandy Branch', 'REPLACE_WITH_LATEST_CONTACT_ID_3', 'REPLACE_WITH_LATEST_ADDRESS_ID_3', NULL, TRUE),
    (UUID(), 'Jaffna Branch', 'REPLACE_WITH_LATEST_CONTACT_ID_4', 'REPLACE_WITH_LATEST_ADDRESS_ID_4', NULL, TRUE),
    (UUID(), 'Kurunegala Branch', 'REPLACE_WITH_LATEST_CONTACT_ID_5', 'REPLACE_WITH_LATEST_ADDRESS_ID_5', NULL, TRUE);


