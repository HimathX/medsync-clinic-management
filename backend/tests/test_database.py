import pytest
from sqlalchemy import text

def test_database_connection(db):
    """Test that database connection works"""
    result = db.execute(text("SELECT 1"))
    assert result.fetchone()[0] == 1

def test_database_has_tables(db):
    """Test that database has expected tables"""
    result = db.execute(text("SHOW TABLES"))
    tables = [row[0] for row in result.fetchall()]
    
    expected_tables = ['users', 'patients', 'doctors', 'appointments']
    for table in expected_tables:
        assert any(table.lower() in t.lower() for t in tables), f"Table {table} not found"

def test_database_functions_exist(db):
    """Test that database functions are created"""
    result = db.execute(text("""
        SELECT COUNT(*) as count 
        FROM information_schema.ROUTINES 
        WHERE ROUTINE_SCHEMA = DATABASE() 
        AND ROUTINE_TYPE = 'FUNCTION'
    """))
    count = result.fetchone()[0]
    assert count > 0, "No functions found in database"

def test_database_procedures_exist(db):
    """Test that database procedures are created"""
    result = db.execute(text("""
        SELECT COUNT(*) as count 
        FROM information_schema.ROUTINES 
        WHERE ROUTINE_SCHEMA = DATABASE() 
        AND ROUTINE_TYPE = 'PROCEDURE'
    """))
    count = result.fetchone()[0]
    assert count > 0, "No procedures found in database"

def test_database_triggers_exist(db):
    """Test that database triggers are created"""
    result = db.execute(text("""
        SELECT COUNT(*) as count 
        FROM information_schema.TRIGGERS 
        WHERE TRIGGER_SCHEMA = DATABASE()
    """))
    count = result.fetchone()[0]
    assert count > 0, "No triggers found in database"