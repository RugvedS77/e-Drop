# schemas/all_schema.py

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime, date
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
    id: Optional[int] = None
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
    image_url: Optional[str] = None # <--- Added

# --- NEW: PICKUP / DROP SCHEMAS ---

class PickupItemCreate(BaseModel):
    """Item details sent when booking a pickup"""
    item_name: str
    detected_condition: ItemConditionEnum
    credit_value: int
    description: Optional[str] = None
    years_used: Optional[int] = None

class PickupCreate(BaseModel):
    """Payload for creating a new Drop request"""
    pickup_date: datetime
    timeslot: str
    latitude: float = Field(..., description="Latitude of the pickup location")
    longitude: float = Field(..., description="Longitude of the pickup location")
    address_text: Optional[str] = None
    items: List[PickupItemCreate]
    
    # Confirmation of data wipe (Required for electronics)
    data_wipe_confirmed: bool
    image_url: Optional[str] = None # <--- Added

class PickupResponse(BaseModel):
    """Response after successful booking"""
    id: int
    status: PickupStatusEnum
    image_url: Optional[str] = None # <--- Added
    pickup_date: datetime
    timeslot: str
    total_credits: int
    message: str
    model_config = ConfigDict(from_attributes=True)
    address_text: Optional[str] = None

# --- PROFILE SCHEMAS ---

class ProfileBase(BaseModel):
    carbon_balance: int = 0
    co2_saved: float = 0.0

class ProfileCreate(ProfileBase):
    # Used internally when registering a user
    user_id: int

class ProfileUpdate(BaseModel):
    # Only Admin/System should update credits, but we define it here
    carbon_balance: Optional[int] = None
    co2_saved: Optional[float] = None

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    
    # We can also nest the User info here if needed
    # user: UserResponse 

    model_config = ConfigDict(from_attributes=True)

# --- NEW: COLLECTOR / DASHBOARD SCHEMAS ---

class RoutePoint(BaseModel):
    """Used for drawing routes on the Collector's map"""
    pickup_id: int
    latitude: float
    longitude: float
    status: PickupStatusEnum
    order: int  # Sequence in the route

class InventoryUpdate(BaseModel):
    """Used by Collectors to update item status"""
    processing_status: str
    warehouse_location: Optional[str] = None
    

# --- NEW: LOGISTICS / ALERTS ---
class AlertRequest(BaseModel):
    """Payload for notifying the driver/collector"""
    driver_name: str
    location_area: str
    target_phone: str # Must be verified on Twilio if using Free Tier

class InventoryStatusUpdate(BaseModel):
    status: str # received, refurbishing, recycled

class InventoryItemResponse(BaseModel):
    id: int
    formatted_id: str 
    name: str
    category: str
    status: str
    receivedDate: Optional[date]
    value: int
    condition: Optional[str] = "Good"
    customer: str 
    
    model_config = ConfigDict(from_attributes=True)

# ===========certificate SCHEMAS ============
class CertificateCreate(BaseModel):
    pickup_id: int
    cert_type: str # 'individual' or 'corporate'

class CertificateResponse(BaseModel):
    id: str           # Formatted ID (CERT-001)
    orderId: str      # Formatted Pickup ID (PU-100)
    customerName: str
    issueDate: date
    carbonOffset: float
    itemsRecycled: int
    type: str
    
    model_config = ConfigDict(from_attributes=True)

# --- NEW: History Specific Schemas ---

class HistoryItem(BaseModel):
    name: str
    category: str
    value: int

class PickupHistoryDetail(BaseModel):
    id: str             # Formatted ID (RC-2024-001)
    date: Optional[date]
    status: str
    address: str
    driver: str         # Placeholder name
    carbonOffset: float
    points: int
    items: List[HistoryItem] # Nested list of items

    model_config = ConfigDict(from_attributes=True)

class TransactionResponse(BaseModel):
    id: int
    amount: int
    type: str # earn, redeem
    description: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)