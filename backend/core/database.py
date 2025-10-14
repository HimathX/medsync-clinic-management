from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from pathlib import Path
from urllib.parse import quote_plus

# Database credentials - update with your MySQL Workbench password
DB_USER = "root"
DB_PASSWORD = "Himathavenge!23"  # Replace with your actual MySQL root password
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "medsync_db"

# Quote password to handle special characters
DATABASE_URL = (
    f"mysql+mysqlconnector://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=False  # Set to True to see SQL queries
)

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
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            if row and row[0] == 1:
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
        with engine.connect() as connection:
            result = connection.execute(text("SELECT VERSION() as version"))
            version = result.fetchone()[0]  # type: ignore
            
            result = connection.execute(text("SELECT DATABASE() as db_name"))
            db_name = result.fetchone()[0] # type: ignore
            
            result = connection.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result.fetchall()]
            
            info = {
                "version": version,
                "database": db_name,
                "tables": tables
            }
            return info
    except Exception as e:
        print(f"❌ Error getting database info: {e}")
        return None