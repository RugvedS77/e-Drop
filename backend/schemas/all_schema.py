# schemas/all_schema.py

from pydantic import BaseModel, ConfigDict, EmailStr, model_validator, Field
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

# --- Base Schemas for Nesting ---
class User(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    model_config = ConfigDict(from_attributes=True)

# --- Full Schemas ---

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

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    userRole: str
    
class TokenData(BaseModel):
    username: Optional[str] = None

# This will be your new response model for the login route
class TokenWithUser(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse # <-- Nest the user object here

# --- NEW: Password Reset Schemas ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# UserResponse.model_rebuild()
