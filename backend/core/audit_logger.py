"""
Central Audit Logging Module
Provides consistent audit trail logging across all routers
"""
from typing import Optional, Dict, Any
from datetime import datetime
from core.database import get_db
import logging
import json

logger = logging.getLogger(__name__)


class AuditLogger:
    """
    Central audit logger for HIPAA compliance and security tracking
    
    Logs all sensitive data access to the audit_log table
    """
    
    @staticmethod
    def log_access(
        user_id: str,
        action_type: str,
        table_name: str,
        record_id: Optional[str] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> bool:
        """
        Log an audit entry
        
        Args:
            user_id: User performing the action
            action_type: Type of action (INSERT, UPDATE, DELETE, LOGIN, LOGOUT, ACCESS_DENIED)
            table_name: Table being accessed
            record_id: ID of the record (if applicable)
            old_values: Previous values (for updates/deletes)
            new_values: New values (for inserts/updates)
            ip_address: Client IP address
            user_agent: Client user agent
            session_id: Session ID
            
        Returns:
            True if logged successfully, False otherwise
        """
        try:
            with get_db() as (cursor, connection):
                # Convert dicts to JSON strings
                old_json = json.dumps(old_values) if old_values else None
                new_json = json.dumps(new_values) if new_values else None
                
                cursor.execute("""
                    INSERT INTO audit_log (
                        user_id, action_type, table_name, record_id,
                        old_values, new_values, ip_address, user_agent, session_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id, action_type, table_name, record_id,
                    old_json, new_json, ip_address, user_agent, session_id
                ))
                
                connection.commit()
                
                logger.debug(f"Audit log: {action_type} on {table_name} by {user_id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
            # Don't raise exception - audit logging failure shouldn't break app
            return False
    
    @staticmethod
    def log_data_access(
        user_id: str,
        accessed_user_id: str,
        access_type: str,
        resource_type: str,
        resource_id: str,
        ip_address: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> bool:
        """
        Log sensitive data access (HIPAA compliance)
        
        Args:
            user_id: User accessing the data
            accessed_user_id: Patient/user whose data is being accessed
            access_type: VIEW, DOWNLOAD, EXPORT, PRINT
            resource_type: MEDICAL_RECORD, PRESCRIPTION, INVOICE, etc.
            resource_id: ID of the resource
            ip_address: Client IP
            session_id: Session ID
            
        Returns:
            True if logged successfully
        """
        try:
            with get_db() as (cursor, connection):
                cursor.execute("""
                    INSERT INTO data_access_log (
                        user_id, accessed_user_id, access_type, resource_type,
                        resource_id, ip_address, session_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id, accessed_user_id, access_type, resource_type,
                    resource_id, ip_address, session_id
                ))
                
                connection.commit()
                
                logger.info(f"Data access logged: {user_id} accessed {resource_type} {resource_id} of user {accessed_user_id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to log data access: {e}")
            return False
    
    @staticmethod
    def log_failed_access(
        user_id: str,
        action_type: str,
        table_name: str,
        record_id: Optional[str],
        reason: str,
        ip_address: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> bool:
        """
        Log failed access attempt (security monitoring)
        
        Args:
            user_id: User who attempted access
            action_type: What they tried to do
            table_name: What they tried to access
            record_id: Which record
            reason: Why it failed
            ip_address: Client IP
            session_id: Session ID
            
        Returns:
            True if logged successfully
        """
        try:
            with get_db() as (cursor, connection):
                cursor.execute("""
                    INSERT INTO audit_log (
                        user_id, action_type, table_name, record_id,
                        new_values, ip_address, session_id
                    ) VALUES (%s, 'ACCESS_DENIED', %s, %s, %s, %s, %s)
                """, (
                    user_id, table_name, record_id,
                    json.dumps({"reason": reason, "attempted_action": action_type}),
                    ip_address, session_id
                ))
                
                connection.commit()
                
                logger.warning(f"Access denied logged: {user_id} attempted {action_type} on {table_name}/{record_id} - {reason}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to log access denial: {e}")
            return False


# Convenience instance
audit = AuditLogger()