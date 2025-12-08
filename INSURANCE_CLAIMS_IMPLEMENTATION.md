# Insurance Claims Backend Implementation

## Overview
Complete backend implementation for handling insurance claims in the MedSync clinic management system.

---

## ✅ What Was Implemented

### **1. Main Claim Creation Endpoint**
**`POST /claims/add`**
- Uses the `AddClaim` stored procedure
- Validates invoice and insurance
- Automatically deducts claim from invoice and patient balance
- Returns claim ID and updated patient balance

**Request:**
```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "insurance_id": "660e8400-e29b-41d4-a716-446655440001",
  "claim_amount": 5000.00,
  "notes": "Routine checkup and blood tests"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Claim added successfully",
  "claim_id": "770e8400-e29b-41d4-a716-446655440002",
  "patient_balance_updated": 2500.00
}
```

---

### **2. Calculate Claimable Amount Endpoint**
**`POST /claims/calculate-claimable`**
- Calculates max claimable amount for an invoice
- Validates insurance status and patient match
- Shows already claimed amounts
- Returns detailed analysis

**Request:**
```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "insurance_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response:**
```json
{
  "invoice": {
    "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
    "patient_name": "John Doe",
    "sub_total": 10000.00,
    "tax_amount": 0.00,
    "invoice_total": 10000.00,
    "already_claimed": 0.00
  },
  "insurance": {
    "insurance_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "Active",
    "policy_number": "POL-12345",
    "package_name": "Gold Package"
  },
  "claimable_analysis": {
    "max_claimable_amount": 10000.00,
    "can_claim": true,
    "validation_errors": []
  }
}
```

---

### **3. Get Claim Details**
**`GET /claims/{claim_id}`**
- Returns full claim details with invoice and insurance info

---

### **4. Get Patient Claims**
**`GET /claims/patient/{patient_id}`**
- Lists all claims for a patient
- Optional filters: status, date range
- Shows total claimed amount

**Query Parameters:**
- `status_filter`: Filter by insurance status (Active, Inactive, etc.)
- `date_from`: Start date
- `date_to`: End date

---

### **5. Get Invoice Claims**
**`GET /claims/invoice/{invoice_id}`**
- Shows all claims for a specific invoice
- Calculates remaining balance after claims
- Useful for checking if invoice is fully claimed

---

### **6. Get All Claims**
**`GET /claims/`**
- Paginated list of all claims
- Filters by status and date range

**Query Parameters:**
- `skip`: Pagination offset (default: 0)
- `limit`: Results per page (default: 50, max: 500)
- `status_filter`: Filter by insurance status
- `date_from`: Start date
- `date_to`: End date

---

## 🔧 How the System Works

### **Flow: Creating a Claim**

1. **Staff/Patient initiates claim** (via frontend)
2. **Frontend calls** `POST /claims/add`
3. **Backend validates**:
   - Invoice exists
   - Insurance is active for the patient
   - Claim amount is valid (> 0, ≤ invoice sub_total)
4. **Stored procedure executes**:
   - Inserts claim record
   - Deducts claim from invoice `sub_total`
   - Deducts claim from patient balance
5. **Response returned** with claim ID and updated balance

### **Flow: Before Creating Claim (Helper)**

1. **Frontend calls** `POST /claims/calculate-claimable`
2. **Backend returns**:
   - Invoice details
   - Insurance validation status
   - Max claimable amount
   - Whether claim is allowed
3. **Frontend shows** this info to user before submitting claim

---

## 🗄️ Database Integration

### **Stored Procedure Used:**
```sql
CALL AddClaim(
    p_invoice_id,
    p_insurance_id,
    p_claim_amount,
    p_notes,
    OUT p_claim_id,
    OUT p_error_message,
    OUT p_success
)
```

### **What the Procedure Does:**
1. Validates invoice and insurance
2. Checks claim amount (must be ≤ invoice sub_total)
3. Inserts claim record
4. **Deducts** claim amount from invoice `sub_total`
5. **Deducts** claim amount from `patient_balance`
6. Returns success/error message

---

## 📊 Example Use Cases

### **Use Case 1: Patient has insurance, wants to claim full invoice**
```bash
# Step 1: Check claimable amount
POST /claims/calculate-claimable
{
  "invoice_id": "xxx",
  "insurance_id": "yyy"
}

# Step 2: Submit claim
POST /claims/add
{
  "invoice_id": "xxx",
  "insurance_id": "yyy",
  "claim_amount": 10000.00,
  "notes": "Full coverage claim"
}
```

### **Use Case 2: View all claims for a patient**
```bash
GET /claims/patient/patient-uuid-here?date_from=2025-01-01&date_to=2025-12-31
```

### **Use Case 3: Check if invoice is fully claimed**
```bash
GET /claims/invoice/invoice-uuid-here
# Returns: total_claimed, remaining_balance
```

---

## 🚨 Error Handling

The endpoints return appropriate HTTP status codes:
- **200**: Success
- **201**: Created (new claim)
- **400**: Bad request (validation failed)
- **404**: Resource not found
- **500**: Server error

**Example Error Response:**
```json
{
  "detail": "Invoice not found"
}
```

---

## 🔐 Security Considerations

- All endpoints should require authentication
- Validate user permissions (staff/admin for claims)
- Ensure patient can only see their own claims
- Add rate limiting for claim creation

**TODO: Add authentication middleware**

---

## 📝 Next Steps (Optional Enhancements)

1. **Add claim approval workflow** (pending → approved → paid)
2. **Add treatment-level claimability** (flag in `treatment_catalogue`)
3. **Add insurance coverage table** (which treatments each policy covers)
4. **Add claim status tracking** (submitted, processing, approved, rejected)
5. **Add notifications** when claim is processed
6. **Add audit log** for claim modifications

---

## 🧪 Testing

### **Test with Swagger UI:**
1. Start backend: `python main.py`
2. Go to: `http://localhost:8000/docs`
3. Find `/claims` endpoints
4. Test with sample data

### **Required Test Data:**
- Valid invoice ID (from consultation)
- Valid insurance ID (patient must have active insurance)
- Patient balance must be initialized

---

## 📞 Support

For questions or issues, contact the development team.

**Last Updated:** October 21, 2025
