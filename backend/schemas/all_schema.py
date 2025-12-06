# schemas/all_schema.py

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from typing import List, Optional, Any
from enum import Enum

# --- ENUMS (Re-declared for Pydantic validation) ---
class ItemConditionEnum(str, Enum):
    WORKING = "working"
    REPAIRABLE = "repairable"
    SCRAP = "scrap"

class PickupStatusEnum(str, Enum):
    SCHEDULED = "scheduled"
    COLLECTED = "collected"
    PROCESSED = "processed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# --- EXISTING AUTH SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    business_type: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    userRole: str

class TokenWithUser(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse 

class TokenData(BaseModel):
    username: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# --- NEW: AI & SCANNING SCHEMAS ---

class DetectedItem(BaseModel):
    """Response from the YOLO AI model"""
    item: str
    condition: ItemConditionEnum
    estimated_value: int
    confidence: float

class ScanResponse(BaseModel):
    detected_items: List[DetectedItem]
    total_estimated_credits: int

# --- NEW: PICKUP / DROP SCHEMAS ---

class PickupItemCreate(BaseModel):
    """Item details sent when booking a pickup"""
    item_name: str
    detected_condition: ItemConditionEnum
    credit_value: int

class PickupCreate(BaseModel):
    """Payload for creating a new Drop request"""
    scheduled_time: datetime
    latitude: float = Field(..., description="Latitude of the pickup location")
    longitude: float = Field(..., description="Longitude of the pickup location")
    address_text: Optional[str] = None
    items: List[PickupItemCreate]
    
    # Confirmation of data wipe (Required for electronics)
    data_wipe_confirmed: bool

class PickupResponse(BaseModel):
    """Response after successful booking"""
    id: int
    status: PickupStatusEnum
    scheduled_time: datetime
    total_credits: int
    message: str
    model_config = ConfigDict(from_attributes=True)

# --- NEW: COLLECTOR / DASHBOARD SCHEMAS ---

class RoutePoint(BaseModel):
    """Used for drawing routes on the Collector's map"""
    pickup_id: int
    latitude: float
    longitude: float
    status: PickupStatusEnum

class InventoryUpdate(BaseModel):
    """Used by Collectors to update item status"""
    processing_status: str
    warehouse_location: Optional[str] = None