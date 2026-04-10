import socketio
from typing import Dict, Any

# Create a Socket.io AsyncServer
# cors_allowed_origins="*" or specify origins from settings
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")

# The ASGI application that will be wrapped by FastAPI
sio_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"WS Connect: {sid}")
    # You could perform auth checks here using environ

@sio.event
async def disconnect(sid):
    print(f"WS Disconnect: {sid}")

@sio.event
async def join_batch(sid, batch_id):
    """Students and trainers join a room specific to their batch."""
    print(f"SID {sid} joining batch {batch_id}")
    await sio.enter_room(sid, f"batch_{batch_id}")

async def emit_violation_alert(batch_id: str, data: Dict[str, Any]):
    """Helper to broadcast a violation alert to all trainers in a batch room."""
    print(f"Broadcasting violation to batch_{batch_id}")
    await sio.emit('violation_alert', data, room=f"batch_{batch_id}")

async def emit_task_unlock(batch_id: str, task_data: Dict[str, Any]):
    """Helper to notify students when a task becomes live."""
    await sio.emit('task_unlocked', task_data, room=f"batch_{batch_id}")
