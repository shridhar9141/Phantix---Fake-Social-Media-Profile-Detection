from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserSyncRequest(BaseModel):
    firebase_uid: str
    email: EmailStr
    username: Optional[str] = None
    display_name: Optional[str] = None

class UserUpdate(BaseModel):
    display_name: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    firebase_uid: str
    email: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True
