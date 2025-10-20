import pytest
import pymysql

def test_database_connection(db_config):
    """Test that database connection works"""
    try:
        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        assert result[0] == 1
        cursor.close()
        connection.close()
    except Exception as e:
        pytest.fail(f"Database connection failed: {e}")

def test_database_has_tables(db_config):
    """Test that database has expected tables"""
    connection = pymysql.connect(**db_config)
    cursor = connection.cursor()
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]
    cursor.close()
    connection.close()
    
    expected_tables = ['users', 'patients', 'doctors', 'appointments']
    for table in expected_tables:
        assert any(table.lower() in t.lower() for t in tables), f"Table {table} not found"

def test_database_functions_exist(db_config):
    """Test that database functions are created"""
    connection = pymysql.connect(**db_config)
    cursor = connection.cursor()
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM information_schema.ROUTINES 
        WHERE ROUTINE_SCHEMA = DATABASE() 
        AND ROUTINE_TYPE = 'FUNCTION'
    """)
    count = cursor.fetchone()[0]
    cursor.close()
    connection.close()
    assert count > 0, "No functions found in database"

def test_database_procedures_exist(db_config):
    """Test that database procedures are created"""
    connection = pymysql.connect(**db_config)
    cursor = connection.cursor()
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM information_schema.ROUTINES 
        WHERE ROUTINE_SCHEMA = DATABASE() 
        AND ROUTINE_TYPE = 'PROCEDURE'
    """)
    count = cursor.fetchone()[0]
    cursor.close()
    connection.close()
    assert count > 0, "No procedures found in database"

def test_database_triggers_exist(db_config):
    """Test that database triggers are created"""
    connection = pymysql.connect(**db_config)
    cursor = connection.cursor()
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM information_schema.TRIGGERS 
        WHERE TRIGGER_SCHEMA = DATABASE()
    """)
    count = cursor.fetchone()[0]
    cursor.close()
    connection.close()
    assert count > 0, "No triggers found in database"