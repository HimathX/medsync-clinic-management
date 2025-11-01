# Database Performance Optimization Guide

## Overview
This document provides recommendations for database indexes and configuration to improve query performance for the MedSync Clinic Management System.

## Recommended Indexes

### High-Priority Indexes (Immediate Impact)

Execute these SQL commands on your MySQL database to create performance-critical indexes:

```sql
-- Patient table indexes
CREATE INDEX idx_patient_branch ON patient(registered_branch_id);
CREATE INDEX idx_patient_created ON patient(created_at);

-- Appointment table indexes  
CREATE INDEX idx_appointment_patient ON appointment(patient_id);
CREATE INDEX idx_appointment_timeslot ON appointment(time_slot_id);
CREATE INDEX idx_appointment_status ON appointment(status);
CREATE INDEX idx_appointment_patient_status ON appointment(patient_id, status);

-- Time slot table indexes
CREATE INDEX idx_timeslot_doctor ON time_slot(doctor_id);
CREATE INDEX idx_timeslot_branch ON time_slot(branch_id);
CREATE INDEX idx_timeslot_date ON time_slot(available_date);
CREATE INDEX idx_timeslot_booked ON time_slot(is_booked);
CREATE INDEX idx_timeslot_doctor_date ON time_slot(doctor_id, available_date, is_booked);

-- Consultation record indexes
CREATE INDEX idx_consultation_appointment ON consultation_record(appointment_id);
CREATE INDEX idx_consultation_created ON consultation_record(created_at);

-- Prescription item indexes
CREATE INDEX idx_prescription_consultation ON prescription_item(consultation_rec_id);
CREATE INDEX idx_prescription_medication ON prescription_item(medication_id);
CREATE INDEX idx_prescription_created ON prescription_item(created_at);

-- Invoice indexes
CREATE INDEX idx_invoice_consultation ON invoice(consultation_rec_id);
CREATE INDEX idx_invoice_created ON invoice(created_at);

-- Payment indexes
CREATE INDEX idx_payment_patient ON payment(patient_id);
CREATE INDEX idx_payment_date ON payment(payment_date);

-- User table indexes
CREATE INDEX idx_user_type ON user(user_type);
CREATE INDEX idx_user_nic ON user(NIC);

-- Employee table indexes
CREATE INDEX idx_employee_branch ON employee(branch_id);
CREATE INDEX idx_employee_role ON employee(role);
CREATE INDEX idx_employee_active ON employee(is_active);

-- Doctor specialization indexes
CREATE INDEX idx_doctor_spec_doctor ON doctor_specialization(doctor_id);
CREATE INDEX idx_doctor_spec_specialization ON doctor_specialization(specialization_id);

-- Patient allergy indexes
CREATE INDEX idx_patient_allergy_patient ON patient_allergy(patient_id);
CREATE INDEX idx_patient_allergy_active ON patient_allergy(is_active);
```

### Medium-Priority Indexes (Reporting & Analytics)

```sql
-- For reporting queries
CREATE INDEX idx_appointment_date_status ON appointment(time_slot_id, status);
CREATE INDEX idx_invoice_date ON invoice(created_at, sub_total);
CREATE INDEX idx_payment_date_amount ON payment(payment_date, amount_paid);
```

## Query Optimization Tips

### 1. Use EXPLAIN to Analyze Queries
Before and after creating indexes, run EXPLAIN on your slow queries:

```sql
EXPLAIN SELECT * FROM appointment 
WHERE patient_id = 'patient-uuid' 
ORDER BY created_at DESC;
```

### 2. Monitor Slow Query Log
Enable MySQL slow query log to identify problematic queries:

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2; -- Log queries taking more than 2 seconds
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

### 3. Connection Pool Optimization
The application already uses connection pooling with 10 connections. Monitor usage:

```python
# In database.py, the pool is configured with:
pool_size=10
pool_reset_session=True
```

Consider increasing `pool_size` to 20-30 for high-traffic deployments.

## Application-Level Optimizations

### 1. Caching Strategy
The application now implements two-tier caching:

- **Backend cache** (`core/cache.py`): 5-minute TTL for static data
- **Frontend cache** (`utils/clientCache.js`): 5-10 minute TTL for API responses

Cached endpoints:
- `/branches/` - 10 minutes (rarely changes)
- Static lookup data (medications, specializations) - 10 minutes

### 2. Query Result Limits
Maximum result limits have been implemented:
- Patient complete profile: 50 appointments, 50 consultations, 100 prescriptions
- Appointment listings: Configurable with `limit` parameter (max 500)
- Patient listings: Configurable with `limit` parameter (max 500)

### 3. Optimized Queries
The following queries have been optimized:

#### Before:
```python
# N+1 query pattern (2 queries)
cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
patient = cursor.fetchone()
cursor.execute("SELECT * FROM user WHERE user_id = %s", (patient_id,))
user = cursor.fetchone()
```

#### After:
```python
# Single JOIN query
cursor.execute("""
    SELECT p.*, u.full_name, u.NIC, u.email, u.gender, u.DOB
    FROM patient p
    JOIN user u ON p.patient_id = u.user_id
    WHERE p.patient_id = %s
""", (patient_id,))
patient_data = cursor.fetchone()
```

## Monitoring & Maintenance

### 1. Index Usage Statistics
Check index usage regularly:

```sql
-- Show index usage statistics
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'medsync'
ORDER BY TABLE_NAME, INDEX_NAME;
```

### 2. Table Statistics
Update table statistics for better query planning:

```sql
-- Run periodically (weekly recommended)
ANALYZE TABLE patient, appointment, time_slot, consultation_record, 
              prescription_item, invoice, payment;
```

### 3. Monitor Database Performance
```sql
-- Check slow queries
SELECT * FROM mysql.slow_log 
ORDER BY start_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
    TABLE_NAME,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'medsync'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
```

## Expected Performance Improvements

After implementing these optimizations:

1. **Patient profile queries**: 40-60% faster (from ~500ms to ~200ms)
2. **Appointment listings**: 50-70% faster with indexes
3. **Dashboard loads**: 30-50% faster with caching
4. **Branch/static data**: 90% faster with caching (cached requests)
5. **Complex JOIN queries**: 40-50% faster with proper GROUP BY

## Rollback Plan

If any index causes issues, remove it with:

```sql
DROP INDEX index_name ON table_name;
```

For example:
```sql
DROP INDEX idx_appointment_patient ON appointment;
```

## Next Steps

1. Apply high-priority indexes first
2. Monitor performance for 1 week
3. Analyze slow query log
4. Apply medium-priority indexes if needed
5. Consider partitioning large tables (appointments, consultations) if they exceed 1M rows

## Additional Recommendations

### 1. Database Configuration
For MySQL 8.0, consider these configuration optimizations in `my.cnf`:

```ini
[mysqld]
# Buffer pool (set to 70-80% of available RAM for dedicated DB server)
innodb_buffer_pool_size = 2G

# Connection settings
max_connections = 200
thread_cache_size = 16

# Query cache (if using MySQL 5.7)
query_cache_type = 1
query_cache_size = 128M

# Logging
slow_query_log = 1
long_query_time = 2
log_queries_not_using_indexes = 1
```

### 2. Application Configuration
In production, increase connection pool:

```python
# backend/core/database.py
connection_pool = pooling.MySQLConnectionPool(
    pool_name='medsync_pool',
    pool_size=20,  # Increased from 10
    pool_reset_session=True,
    **DB_CONFIG
)
```

### 3. Frontend Performance
- Implement lazy loading for dashboard components
- Use React.lazy() for route-based code splitting
- Consider implementing a service worker for offline caching

## Support

For questions or issues with these optimizations, please:
1. Check the slow query log for problematic queries
2. Use EXPLAIN to analyze query execution plans
3. Monitor cache hit rates in application logs
4. Review database metrics (CPU, memory, disk I/O)
