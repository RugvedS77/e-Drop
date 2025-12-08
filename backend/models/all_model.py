
import enum
from sqlalchemy import (
    Column, Integer, String, Float, Date, Enum,
    ForeignKey, DateTime, Text, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Optional
from geoalchemy2 import Geography # Required for PostGIS

# Import the single, shared Base object
from database.postgresConn import Base

# ==========================================
# 1. ENUMS
# ==========================================

class UserRole(str, enum.Enum):
    dropper = "Dropper"
    collector = "Collector"

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

class InventoryStatus(str, enum.Enum):
    PENDING = "pending"         # Initial state (optional)
    RECEIVED = "received"       # Arrived at Warehouse
    REFURBISHING = "refurbishing"
    RECYCLED = "recycled"

class CertificateType(str, enum.Enum):
    INDIVIDUAL = "individual"
    CORPORATE = "corporate"

class TransactionType(str, enum.Enum):
    EARN = "earn"       # From Pickups
    REDEEM = "redeem"   # Buying rewards
    ADJUSTMENT = "adjustment"

# ==========================================
# 2. MODELS
# ==========================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), nullable=False)
    
    # Reset Password Tokens
    reset_token = Column(String, nullable=True)         
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)

class Profile(Base):
    """
    Gamification & Impact Tracking.
    """
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    carbon_balance = Column(Integer, default=0)    # Credits available
    co2_saved = Column(Float, default=0.0)         # Impact in kg
    
    # Relationships
    user = relationship("User", back_populates="profile")
    pickups = relationship("Pickup", back_populates="profile")
    transactions = relationship("Transaction", back_populates="profile")


class Pickup(Base):
    """
    The Logistics Ticket. Managed by Drivers.
    """
    __tablename__ = "pickups"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    
    status = Column(Enum(PickupStatus), default=PickupStatus.SCHEDULED)
    
    # Scheduling Details
    pickup_date = Column(Date, nullable=True) 
    timeslot = Column(String, nullable=True)  # e.g. "Morning (9-12)"
    
    # Location (PostGIS)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    address_text = Column(String, nullable=True)
    
    # Image Proof (Added recently)
    image_url = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profile = relationship("Profile", back_populates="pickups")
    
    # The list of items the user declared (Manifest)
    items = relationship("PickupItem", back_populates="pickup", cascade="all, delete-orphan")
    
    # The actual inventory records created after collection (Warehouse)
    inventory_logs = relationship("InventoryLog", back_populates="pickup")

class PickupItem(Base):
    """
    The User's Manifest. What they CLAIM they are giving.
    """
    __tablename__ = "pickup_items"

    id = Column(Integer, primary_key=True, index=True)
    pickup_id = Column(Integer, ForeignKey("pickups.id"), nullable=False)
    
    item_name = Column(String, nullable=False)
    detected_condition = Column(Enum(ItemCondition), nullable=False)
    credit_value = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    years_used = Column(Integer, nullable=True)
    
    pickup = relationship("Pickup", back_populates="items")

class InventoryLog(Base):
    """
    The Warehouse Inventory.
    Created automatically when a driver marks a pickup as 'COLLECTED'.
    """
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Link back to the origin pickup for traceability
    pickup_id = Column(Integer, ForeignKey("pickups.id"))
    
    # Item Details (Copied from PickupItem)
    item_name = Column(String)
    category = Column(String) # e.g. "Laptop", "Smartphone"
    value = Column(Integer)
    
    # Lifecycle Status (Managed by Warehouse)
    status = Column(Enum(InventoryStatus), default=InventoryStatus.RECEIVED)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    pickup = relationship("Pickup", back_populates="inventory_logs")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    unique_code = Column(String, unique=True, index=True) # e.g., CERT-001
    
    # Link to the source Pickup
    pickup_id = Column(Integer, ForeignKey("pickups.id"), nullable=False)
    
    # Snapshot of data at time of issuance
    recipient_name = Column(String) 
    cert_type = Column(Enum(CertificateType), default=CertificateType.INDIVIDUAL)
    issue_date = Column(Date, default=func.now())
    carbon_offset_snapshot = Column(Float)
    items_count_snapshot = Column(Integer)
    
    # Relationship
    pickup = relationship("Pickup")

# 2. Add Transaction Table
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    
    amount = Column(Integer, nullable=False) # e.g. +500 or -200
    type = Column(Enum(TransactionType), nullable=False)
    description = Column(String, nullable=False) # e.g. "Recycled Laptop" or "Amazon Card"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    profile = relationship("Profile", back_populates="transactions")

