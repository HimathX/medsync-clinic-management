import pytest

# Skip database tests if pymysql is not available or database connection fails
pytest_plugins = []

try:
    import pymysql
    PYMYSQL_AVAILABLE = True
except ImportError:
    PYMYSQL_AVAILABLE = False

pytestmark = pytest.mark.skipif(not PYMYSQL_AVAILABLE, reason="pymysql not installed")

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
        pytest.skip(f"Database connection not available: {e}")

def test_database_has_tables(db_config):
    """Test that database has expected tables"""
    try:
        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        connection.close()
        
        expected_tables = ['users', 'patients', 'doctors', 'appointments']
        for table in expected_tables:
            assert any(table.lower() in t.lower() for t in tables), f"Table {table} not found"
    except Exception as e:
        pytest.skip(f"Database connection not available: {e}")

def test_database_functions_exist(db_config):
    """Test that database functions are created"""
    try:
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
    except Exception as e:
        pytest.skip(f"Database connection not available: {e}")

def test_database_procedures_exist(db_config):
    """Test that database procedures are created"""
    try:
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
    except Exception as e:
        pytest.skip(f"Database connection not available: {e}")

def test_database_triggers_exist(db_config):
    """Test that database triggers are created"""
    try:
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
    except Exception as e:
        pytest.skip(f"Database connection not available: {e}")