# models/all_model.py

import enum
from sqlalchemy import (
    Column, Integer, String, Float, Date, Enum,
    ForeignKey, DateTime, Text, Numeric, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Enum as SQLAlchemyEnum
from geoalchemy2 import Geography # REQUIRED for Location features

# IMPORTANT: Import the single, shared Base object from your database file
from database.postgresConn import Base

# --- ENUMS ---
class UserRole(str, enum.Enum):
    dropper = "Dropper"     # Regular User
    collector = "Collector" # Admin/Driver

class PickupStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COLLECTED = "collected"
    PROCESSED = "processed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ItemCondition(str, enum.Enum):
    WORKING = "working"
    REPAIRABLE = "repairable"
    SCRAP = "scrap"

class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    REFURBISHING = "refurbishing"
    RECYCLED = "recycled"

# --- MODELS ---

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), nullable=False)
    reset_token = Column(String, nullable=True)         
    reset_token_expiry = Column(DateTime, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to Profile (One-to-One)
    profile = relationship("Profile", back_populates="user", uselist=False)

class Profile(Base):
    """
    Extended user details for Gamification & Impact Tracking.
    Created automatically when a User is created.
    """
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    carbon_balance = Column(Integer, default=0)    # Credits available to redeem
    co2_saved = Column(Float, default=0.0)         # Environmental impact (kg)
    
    # Relationships
    user = relationship("User", back_populates="profile")
    pickups = relationship("Pickup", back_populates="profile")

class Pickup(Base):
    """
    The core 'Drop' request. 
    Uses PostGIS for location to enable 'Find nearest driver' queries.
    """
    __tablename__ = "pickups"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    
    status = Column(Enum(PickupStatus), default=PickupStatus.SCHEDULED)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    
    # GEO-SPATIAL COLUMN: Stores (Latitude, Longitude) efficiently
    # Ensure you have 'CREATE EXTENSION postgis;' run in your DB
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    
    # For address display purposes (optional but helpful)
    address_text = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profile = relationship("Profile", back_populates="pickups")
    items = relationship("PickupItem", back_populates="pickup", cascade="all, delete-orphan")
    inventory_log = relationship("InventoryLog", back_populates="pickup", uselist=False)

class PickupItem(Base):
    """
    Individual items within a single Pickup request.
    Stores a snapshot of the value at the time of booking.
    """
    __tablename__ = "pickup_items"

    id = Column(Integer, primary_key=True, index=True)
    pickup_id = Column(Integer, ForeignKey("pickups.id"), nullable=False)
    
    item_name = Column(String, nullable=False)        # e.g., "Dell Laptop"
    detected_condition = Column(Enum(ItemCondition), nullable=False)
    credit_value = Column(Integer, nullable=False)    # Value awarded for this item
    
    pickup = relationship("Pickup", back_populates="items")

class InventoryLog(Base):
    """
    Lifecycle tracking for the Collector/Admin side.
    """
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    pickup_id = Column(Integer, ForeignKey("pickups.id"), unique=True, nullable=False)
    
    processing_status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING)
    warehouse_location = Column(String, nullable=True)
    certificate_url = Column(String, nullable=True)   # URL to the generated PDF
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    pickup = relationship("Pickup", back_populates="inventory_log")