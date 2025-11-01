# Quick Start: Implementing Performance Optimizations

This guide helps you apply the performance optimizations to your MedSync deployment.

## Prerequisites

- MySQL 8.0+ database access
- Python 3.7+ for backend
- Node.js 16+ for frontend
- Database admin privileges for creating indexes

## Step 1: Verify Code Changes

The optimizations have been implemented in the code. Verify by running:

```bash
# Backend validation
cd backend
python3 ../tests/validate_optimizations.py

# Expected output: ✅ ALL VALIDATIONS PASSED!
```

## Step 2: Update Environment Variables

Remove any hardcoded credentials and use environment variables:

```bash
# Create/update .env file in backend/
cat > backend/.env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_secure_password
DB_NAME=medsync
EOF
```

## Step 3: Apply Database Indexes

Connect to your MySQL database and apply the recommended indexes:

```bash
# Connect to MySQL
mysql -u root -p medsync

# Or copy from the SQL file
mysql -u root -p medsync < docs/recommended_indexes.sql
```

Apply these high-priority indexes first:

```sql
-- Patient table
CREATE INDEX idx_patient_branch ON patient(registered_branch_id);
CREATE INDEX idx_patient_created ON patient(created_at);

-- Appointment table
CREATE INDEX idx_appointment_patient ON appointment(patient_id);
CREATE INDEX idx_appointment_timeslot ON appointment(time_slot_id);
CREATE INDEX idx_appointment_status ON appointment(status);

-- Time slot table
CREATE INDEX idx_timeslot_doctor_date ON time_slot(doctor_id, available_date, is_booked);

-- Consultation & Prescription
CREATE INDEX idx_consultation_appointment ON consultation_record(appointment_id);
CREATE INDEX idx_prescription_consultation ON prescription_item(consultation_rec_id);

-- User & Employee
CREATE INDEX idx_user_nic ON user(NIC);
CREATE INDEX idx_employee_branch ON employee(branch_id);
```

## Step 4: Verify Index Creation

Check that indexes were created successfully:

```sql
-- Show all indexes for a table
SHOW INDEX FROM appointment;
SHOW INDEX FROM time_slot;
SHOW INDEX FROM patient;
```

## Step 5: Update Table Statistics

Update statistics for better query planning:

```sql
ANALYZE TABLE patient, appointment, time_slot, consultation_record, 
              prescription_item, invoice, payment;
```

## Step 6: Restart Application

```bash
# Backend (FastAPI)
cd backend
pkill -f "uvicorn main:app"  # Stop existing
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (React)
cd frontend
npm start
```

## Step 7: Monitor Performance

### Enable Slow Query Log

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

### Check Application Logs

Look for cache hit/miss messages:

```bash
# Backend logs will show:
# Cache HIT: /branches/...
# Cache MISS: /branches/...
# Cache SET: /branches/... (TTL: 600s)
```

### Monitor Cache Statistics

The cache stats are available in logs. For production monitoring, you could add an endpoint:

```python
# In main.py (optional)
@app.get("/admin/cache-stats")
def get_cache_stats():
    from core.cache import cache
    return cache.get_stats()
```

## Step 8: Verify Performance Improvements

Test key operations and compare with baseline:

```bash
# Use curl or Postman to time responses

# Get patient profile (should be ~200ms first time, ~50ms cached)
time curl http://localhost:8000/patients/{patient_id}

# Get branches (should be ~5ms when cached)
time curl http://localhost:8000/branches/

# Get appointments (should be ~120ms with indexes)
time curl http://localhost:8000/appointments/patient/{patient_id}
```

## Expected Results

After applying optimizations:

| Operation | Expected Performance |
|-----------|---------------------|
| First request (cache miss) | 40-60% faster than before |
| Cached requests | 90-95% faster than before |
| Database queries with indexes | 50-70% faster |
| Dashboard initial load | 50% faster |

## Troubleshooting

### Cache Not Working

```python
# Check cache is enabled
from core.cache import cache
stats = cache.get_stats()
print(stats)  # Should show cache keys
```

### Indexes Not Used

```sql
-- Check query execution plan
EXPLAIN SELECT * FROM appointment WHERE patient_id = 'uuid';
-- Should show 'Using index' in Extra column
```

### High Memory Usage

- Reduce cache TTL values in `core/cache.py` (default: 300s)
- Reduce connection pool size in `core/database.py` (default: 10)

### Slow Queries Still Occurring

```sql
-- Check slow query log
SELECT * FROM mysql.slow_log 
ORDER BY start_time DESC 
LIMIT 10;
```

## Rollback Instructions

If you need to rollback:

```bash
# 1. Revert code
git revert 59f77fd

# 2. Remove indexes
mysql -u root -p << EOF
DROP INDEX idx_appointment_patient ON appointment;
DROP INDEX idx_timeslot_doctor_date ON time_slot;
-- ... drop other indexes
EOF
```

## Next Steps

1. Monitor performance for 1 week
2. Review slow query log
3. Apply medium-priority indexes if needed
4. Consider Redis for distributed caching in production
5. Implement query monitoring dashboard

## Support

For detailed information:
- See `docs/PERFORMANCE_OPTIMIZATION.md` for complete guide
- See `OPTIMIZATION_SUMMARY.md` for executive summary
- Run `python3 tests/validate_optimizations.py` to verify installation

## Maintenance Schedule

- **Daily**: Monitor error logs for cache issues
- **Weekly**: Review slow query log, update table statistics
- **Monthly**: Review cache hit rates, adjust TTL if needed
- **Quarterly**: Audit and optimize new queries added
