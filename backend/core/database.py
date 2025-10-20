"""
Database Connection Module
Handles MySQL database connections with connection pooling
"""
import mysql.connector
from mysql.connector import pooling, Error
from mysql.connector.cursor import MySQLCursorDict  # ✅ ADD THIS
from contextlib import contextmanager
from fastapi import HTTPException, status
import logging
import os

# Configure logging
logger = logging.getLogger(__name__)

# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'mysql'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'Admin.123'),
    'database': os.getenv('DB_NAME', 'medsync_db'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': False,
    'raise_on_warnings': True
}

# Connection pool configuration
POOL_CONFIG = {
    'pool_name': 'medsync_pool',
    'pool_size': 10,
    'pool_reset_session': True,
    **DB_CONFIG
}

# Global connection pool
connection_pool = None


def create_connection_pool():
    """
    Create MySQL connection pool
    
    Returns:
        Connection pool object
        
    Raises:
        Exception: If pool creation fails
    """
    global connection_pool
    
    try:
        connection_pool = pooling.MySQLConnectionPool(**POOL_CONFIG)
        logger.info("✅ Database connection pool created successfully")
        return connection_pool
    except Error as e:
        logger.error(f"❌ Error creating connection pool: {e}")
        raise Exception(f"Failed to create database connection pool: {e}")


def get_connection_pool():
    """
    Get or create connection pool
    
    Returns:
        Connection pool object
    """
    global connection_pool
    
    if connection_pool is None:
        connection_pool = create_connection_pool()
    
    return connection_pool


@contextmanager
def get_db():
    """
    Database connection context manager with dictionary cursor
    
    Yields:
        Tuple of (cursor, connection)
        
    Raises:
        HTTPException: If database connection fails
        
    Example:
        ```python
        with get_db() as (cursor, connection):
            cursor.execute("SELECT * FROM user")
            result = cursor.fetchone()
            print(result['email'])  # Access by column name
        ```
    """
    print(f"   🔌 [DB] Opening database connection...")
    connection = None
    cursor = None
    
    try:
        # Get connection from pool or create new one
        try:
            pool = get_connection_pool()
            connection = pool.get_connection()
        except Exception as pool_error:
            logger.warning(f"⚠️  Pool connection failed, creating direct connection: {pool_error}")
            # Fallback to direct connection
            connection = mysql.connector.connect(**DB_CONFIG)
        
        # Create cursor that returns results as dictionaries
        cursor = connection.cursor(dictionary=True)  # ✅ USE dictionary=True instead of DictCursor
        print(f"   ✅ [DB] Connection established")
        
        yield cursor, connection
        
    except mysql.connector.Error as e:
        print(f"   ❌ [DB] Connection error: {str(e)}")
        logger.error(f"Database connection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )
    except Exception as e:
        print(f"   ❌ [DB] Unexpected error: {str(e)}")
        logger.error(f"Unexpected database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed"
        )
    finally:
        # Clean up resources
        if cursor:
            try:
                cursor.close()
                print(f"   🔌 [DB] Cursor closed")
            except Exception as e:
                logger.error(f"Error closing cursor: {e}")
        
        if connection and connection.is_connected():
            try:
                connection.close()
                print(f"   🔌 [DB] Connection closed")
            except Exception as e:
                logger.error(f"Error closing connection: {e}")


def test_connection():
    """
    Test database connection
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            
            if result and result['test'] == 1:
                logger.info("✅ Database connection test successful")
                return True
            else:
                logger.error("❌ Database connection test failed - unexpected result")
                return False
                
    except Exception as e:
        logger.error(f"❌ Database connection test failed: {e}")
        return False


def execute_query(query: str, params: tuple = None, fetch_one: bool = False):
    """
    Execute a database query with automatic connection management
    
    Args:
        query: SQL query string
        params: Query parameters tuple
        fetch_one: If True, fetch one result; if False, fetch all
        
    Returns:
        Query results as dict or list of dicts
        
    Raises:
        HTTPException: If query execution fails
    """
    try:
        with get_db() as (cursor, connection):
            cursor.execute(query, params or ())
            
            if fetch_one:
                result = cursor.fetchone()
            else:
                result = cursor.fetchall()
            
            connection.commit()
            return result
            
    except mysql.connector.Error as e:
        logger.error(f"Query execution error: {e}")
        logger.error(f"Query: {query}")
        logger.error(f"Params: {params}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query failed: {str(e)}"
        )


def execute_stored_procedure(proc_name: str, args: list = None):
    """
    Execute a stored procedure
    
    Args:
        proc_name: Name of the stored procedure
        args: List of procedure arguments
        
    Returns:
        Procedure results
        
    Raises:
        HTTPException: If procedure execution fails
    """
    try:
        with get_db() as (cursor, connection):
            cursor.callproc(proc_name, args or [])
            
            # Fetch results if available
            results = []
            for result in cursor.stored_results():
                results.extend(result.fetchall())
            
            connection.commit()
            return results
            
    except mysql.connector.Error as e:
        logger.error(f"Stored procedure execution error: {e}")
        logger.error(f"Procedure: {proc_name}")
        logger.error(f"Args: {args}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stored procedure failed: {str(e)}"
        )


# Initialize connection pool on module import
try:
    create_connection_pool()
except Exception as e:
    logger.error(f"Failed to initialize database connection pool: {e}")
    logger.warning("⚠️  Database connections will be created on-demand")


# Health check function
def get_db_health():
    """
    Get database health status
    
    Returns:
        dict: Health status information
    """
    try:
        with get_db() as (cursor, connection):
            # Check connection
            cursor.execute("SELECT 1 as test")
            cursor.fetchone()
            
            # Get database info
            cursor.execute("SELECT VERSION() as version")
            version_result = cursor.fetchone()
            
            # Get connection count
            cursor.execute("SHOW STATUS LIKE 'Threads_connected'")
            threads_result = cursor.fetchone()
            
            # Get database size
            cursor.execute("""
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
                FROM information_schema.TABLES 
                WHERE table_schema = %s
            """, (DB_CONFIG['database'],))
            size_result = cursor.fetchone()
            
            return {
                "status": "healthy",
                "connected": True,
                "version": version_result['version'] if version_result else "unknown",
                "active_connections": threads_result['Value'] if threads_result else "unknown",
                "database_size_mb": size_result['size_mb'] if size_result else "unknown",
                "database": DB_CONFIG['database'],
                "host": DB_CONFIG['host']
            }
            
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "connected": False,
            "error": str(e),
            "database": DB_CONFIG['database'],
            "host": DB_CONFIG['host']
        }