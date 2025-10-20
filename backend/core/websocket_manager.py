from fastapi import WebSocket
from typing import Dict, Set
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections and broadcasts for real-time updates"""
    
    def __init__(self):
        # Store connections by doctor_id
        self.doctor_connections: Dict[str, Set[WebSocket]] = {}
        # Store all connections
        self.all_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket, resource_type: str = None, resource_id: str = None):
        """
        Accept new WebSocket connection
        
        Args:
            websocket: WebSocket connection
            resource_type: Type of resource (e.g., 'doctor')
            resource_id: ID of the resource
        """
        # ✅ ACCEPT CONNECTION FIRST!
        await websocket.accept()
        logger.info(f"✅ WebSocket accepted for {resource_type}:{resource_id}")
        
        self.all_connections.add(websocket)
        
        if resource_type == 'doctor' and resource_id:
            if resource_id not in self.doctor_connections:
                self.doctor_connections[resource_id] = set()
            self.doctor_connections[resource_id].add(websocket)
            logger.info(f"📡 WebSocket connected for doctor: {resource_id} (Total: {len(self.doctor_connections[resource_id])})")
        else:
            logger.info(f"📡 WebSocket connected (global). Total: {len(self.all_connections)}")
    
    def disconnect(self, websocket: WebSocket, resource_type: str = None, resource_id: str = None):
        """Remove disconnected WebSocket"""
        self.all_connections.discard(websocket)
        
        if resource_type == 'doctor' and resource_id:
            if resource_id in self.doctor_connections:
                self.doctor_connections[resource_id].discard(websocket)
                
                if not self.doctor_connections[resource_id]:
                    del self.doctor_connections[resource_id]
                    logger.info(f"📴 Last WebSocket disconnected for doctor: {resource_id}")
                else:
                    logger.info(f"📴 WebSocket disconnected for doctor: {resource_id} (Remaining: {len(self.doctor_connections[resource_id])})")
        else:
            logger.info(f"📴 WebSocket disconnected (global). Remaining: {len(self.all_connections)}")
    
    async def broadcast_to_doctor(self, doctor_id: str, message: dict):
        """Send message to all clients watching a specific doctor's schedule"""
        if doctor_id not in self.doctor_connections:
            logger.debug(f"⚠️ No active connections for doctor: {doctor_id}")
            return
        
        dead_connections = set()
        successful = 0
        
        # Copy to avoid modification during iteration
        connections = self.doctor_connections[doctor_id].copy()
        
        for connection in connections:
            try:
                await connection.send_json(message)
                successful += 1
                logger.debug(f"📤 Sent message to client: {message.get('type')}")
            except Exception as e:
                logger.error(f"❌ Error sending message to client: {e}")
                dead_connections.add(connection)
        
        # Clean up dead connections
        for connection in dead_connections:
            self.disconnect(connection, 'doctor', doctor_id)
        
        if successful > 0:
            logger.info(f"📡 Broadcasted '{message.get('type')}' to {successful} client(s) for doctor {doctor_id}")
        else:
            logger.warning(f"⚠️ Failed to broadcast to any clients for doctor {doctor_id}")
    
    async def broadcast_all(self, message: dict):
        """Send message to all connected clients"""
        dead_connections = set()
        successful = 0
        
        connections = self.all_connections.copy()
        
        for connection in connections:
            try:
                await connection.send_json(message)
                successful += 1
            except Exception as e:
                logger.error(f"❌ Error broadcasting to client: {e}")
                dead_connections.add(connection)
        
        # Clean up dead connections
        for connection in dead_connections:
            self.disconnect(connection)
        
        logger.info(f"📡 Broadcasted to {successful}/{len(connections)} total clients")

# Global instance
manager = ConnectionManager()