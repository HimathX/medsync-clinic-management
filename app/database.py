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
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', '2003'),
    'database': os.getenv('DB_NAME', 'ClinicManagementNew'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': False,
    'raise_on_warnings': True,
    'pool_name': 'catms_pool',
    'pool_size': 10,
    'pool_reset_session': True
}

# Create connection pool
try:
    connection_pool = pooling.MySQLConnectionPool(**DB_CONFIG)
    logger.info("Database connection pool created successfully")
except mysql.connector.Error as err:
    logger.error(f"Error creating connection pool: {err}")
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
            print(f"🗄️ DATABASE: Executing query: {query[:100]}...")
            print(f"🗄️ DATABASE: Params: {params}")
            
            cursor.execute(query, params or ())
            
            if fetch == 'one':
                result = cursor.fetchone()
                print(f"🗄️ DATABASE: Query result (one): {result}")
                return result
            elif fetch == 'all':
                results = cursor.fetchall()
                print(f"🗄️ DATABASE: Query results (all): {len(results) if results else 0} rows")
                return results
            elif fetch == 'none':
                connection.commit()
                affected_rows = cursor.rowcount
                print(f"🗄️ DATABASE: Affected rows: {affected_rows}")
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
                print(f"🔧 DATABASE: Executing stored procedure: {proc_name}")
                print(f"🔧 DATABASE: Args: {args}")
                
                result = cursor.callproc(proc_name, args or [])
                print(f"🔧 DATABASE: Procedure call result: {result}")
                
                # Get all result sets
                results = []
                for result_set in cursor.stored_results():
                    results.extend(result_set.fetchall())
                
                print(f"🔧 DATABASE: Result sets: {results}")
                connection.commit()
                print(f"✅ DATABASE: Procedure {proc_name} completed successfully")
                return results, result
                
            except mysql.connector.Error as err:
                print(f"❌ DATABASE: Stored procedure error: {err}")
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

# Dependency for FastAPI
def get_db():
    """FastAPI dependency for database connection"""
    with get_db_connection() as connection:
        yield connection