import mysql.connector
from mysql.connector import pooling
import os
import logging
from typing import Optional, Tuple, Any, List, Dict
from contextlib import contextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'Himathavenge!23'),
    'database': os.getenv('DB_NAME', 'medsync_db'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': False,
    'raise_on_warnings': True,
}

# Create connection pool
try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name='medsync_pool',
        pool_size=10,
        pool_reset_session=True,
        **DB_CONFIG
    )
    logger.info("✅ Database connection pool created successfully")
except mysql.connector.Error as err:
    logger.error(f"❌ Error creating connection pool: {err}")
    raise


@contextmanager
def get_db_connection():
    """Get database connection from pool with automatic cleanup"""
    connection = None
    try:
        connection = connection_pool.get_connection()
        yield connection
    except mysql.connector.Error as err:
        logger.error(f"Database error: {err}")
        if connection:
            connection.rollback()
        raise
    except Exception as err:
        logger.error(f"Unexpected error: {err}")
        if connection:
            connection.rollback()
        raise
    finally:
        if connection and connection.is_connected():
            connection.close()


@contextmanager
def get_db_cursor(connection):
    """Get database cursor with automatic cleanup"""
    cursor = None
    try:
        cursor = connection.cursor(dictionary=True, buffered=True)
        yield cursor
    except mysql.connector.Error as err:
        logger.error(f"Cursor error: {err}")
        raise
    finally:
        if cursor:
            cursor.close()


@contextmanager
def get_db():
    """Context manager for database connection and cursor (FastAPI compatible)"""
    connection = None
    cursor = None
    try:
        connection = connection_pool.get_connection()
        cursor = connection.cursor(dictionary=True, buffered=True)
        yield (cursor, connection)
        connection.commit()
    except mysql.connector.Error as err:
        logger.error(f"Database error: {err}")
        if connection:
            connection.rollback()
        raise
    except Exception as err:
        logger.error(f"Unexpected error: {err}")
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def execute_query(query: str, params: Optional[Tuple] = None, fetch: str = 'none') -> Any:
    """
    Execute SQL query with parameters to prevent SQL injection
    
    Args:
        query: SQL query string with placeholders
        params: Parameters tuple for the query
        fetch: 'one', 'all', or 'none' for return type
    
    Returns:
        Query results based on fetch parameter
    """
    with get_db_connection() as connection:
        with get_db_cursor(connection) as cursor:
            cursor.execute(query, params or ())
            
            if fetch == 'one':
                result = cursor.fetchone()
                return result
            elif fetch == 'all':
                results = cursor.fetchall()
                return results
            elif fetch == 'none':
                connection.commit()
                affected_rows = cursor.rowcount
                return affected_rows
            else:
                raise ValueError("fetch must be 'one', 'all', or 'none'")


def execute_stored_procedure(proc_name: str, args: List = None) -> Tuple[List[Dict], List[Any]]:
    """
    Execute stored procedure with parameters
    
    Args:
        proc_name: Name of the stored procedure
        args: List of arguments for the procedure
    
    Returns:
        Tuple of (result_sets, output_values)
    """
    with get_db_connection() as connection:
        with get_db_cursor(connection) as cursor:
            try:
                result = cursor.callproc(proc_name, args or [])
                
                # Get all result sets
                results = []
                for result_set in cursor.stored_results():
                    results.extend(result_set.fetchall())
                
                connection.commit()
                return results, result
                
            except mysql.connector.Error as err:
                logger.error(f"Stored procedure error in {proc_name}: {err}")
                connection.rollback()
                raise


def execute_function(func_name: str, *args) -> Any:
    """
    Execute database function with parameters
    
    Args:
        func_name: Name of the database function
        *args: Arguments for the function
    
    Returns:
        Function result
    """
    placeholders = ', '.join(['%s'] * len(args))
    query = f"SELECT {func_name}({placeholders}) as result"
    
    result = execute_query(query, args, fetch='one')
    return result['result'] if result else None


def test_database_connection():
    """Test database connection"""
    try:
        with get_db_connection() as connection:
            with get_db_cursor(connection) as cursor:
                cursor.execute("SELECT 1 as test")
                result = cursor.fetchone()
                if result and result['test'] == 1:
                    print("✅ Database connection successful!")
                    return True
                print("❌ Database test returned unexpected result")
                return False
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False


def get_database_info():
    """Get database information"""
    try:
        with get_db_connection() as connection:
            with get_db_cursor(connection) as cursor:
                cursor.execute("SELECT VERSION() as version")
                version = cursor.fetchone()['version']
                
                cursor.execute("SELECT DATABASE() as db_name")
                db_name = cursor.fetchone()['db_name']
                
                cursor.execute("SHOW TABLES")
                tables = [row[f'Tables_in_{DB_CONFIG["database"]}'] for row in cursor.fetchall()]
                
                info = {
                    "version": version,
                    "database": db_name,
                    "tables": tables
                }
                return info
    except Exception as e:
        print(f"❌ Error getting database info: {e}")
        return None