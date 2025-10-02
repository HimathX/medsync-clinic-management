from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from pathlib import Path
import os

# Database credentials
DB_USER = "avnadmin"
DB_PASSWORD = "AVNS_TUjuWbnDFe1NGr5P098"
DB_HOST = "medcync01-medsyncproject1.j.aivencloud.com"
DB_PORT = "21382"
DB_NAME = "defaultdb"

# SSL certificate path (inside core folder)
CA_CERT_PATH = Path(__file__).parent / "ca.pem"

# Verify the CA cert exists
if not CA_CERT_PATH.exists():
    raise FileNotFoundError(f"SSL CA certificate not found at: {CA_CERT_PATH}")

# Construct Database URL
DATABASE_URL = (
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Configure SSL connection
connect_args = {
    "ssl_ca": str(CA_CERT_PATH),
    "ssl_verify_cert": True
}

print(f"Using CA certificate at: {CA_CERT_PATH}")

# Create engine with SSL configuration
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
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
            version = result.fetchone()[0]
            
            result = connection.execute(text("SELECT DATABASE() as db_name"))
            db_name = result.fetchone()[0]
            
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