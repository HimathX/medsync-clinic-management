from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from urllib.parse import quote_plus

# Your Aiven MySQL database URL
DATABASE_URL = "mysql+mysqlconnector://avnadmin:AVNS_TUjuWbnDFelNGr5P098@medcync01-medsyncproject1.j.aivencloud.com:21382/defaultdb?ssl_mode=REQUIRED"

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", DATABASE_URL)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_database_connection():
    """Test database connection"""
    try:
        # Test the connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            if row and row[0] == 1:
                print("✅ Database connection successful!")
                return True
            else:
                print("❌ Database connection failed!")
                return False
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def get_database_info():
    """Get database information"""
    try:
        with engine.connect() as connection:
            # Get database version
            result = connection.execute(text("SELECT VERSION() as version"))
            version_row = result.fetchone()
            version = version_row[0] if version_row else "Unknown"
            
            # Get current database name
            result = connection.execute(text("SELECT DATABASE() as db_name"))
            db_row = result.fetchone()
            db_name = db_row[0] if db_row else "Unknown"
            
            # Get available tables
            result = connection.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result.fetchall()]
            
            print(f"📊 Database Info:")
            print(f"   Version: {version}")
            print(f"   Current Database: {db_name}")
            print(f"   Tables: {tables if tables else 'No tables found'}")
            
            return {
                "version": version,
                "database": db_name,
                "tables": tables
            }
    except Exception as e:
        print(f"❌ Error getting database info: {e}")
        return None