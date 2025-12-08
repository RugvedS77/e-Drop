# router/inventory_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List

from database.postgresConn import get_db
from models.all_model import InventoryLog, User, UserRole, Pickup, Profile
from schemas.all_schema import InventoryItemResponse, InventoryStatusUpdate
from auth.oauth2 import get_current_user

router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory Management"]
)

# --- HELPER: Role Check ---
def ensure_collector_role(user: User):
    if user.role != UserRole.collector:
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")

# router/inventory_routes.py

@router.get("/", response_model=List[InventoryItemResponse])
def get_live_inventory(
    status: str = "all",
    search: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_collector_role(current_user)

    # 1. Query with Joins to fetch User Name efficiently
    query = db.query(InventoryLog).options(
        joinedload(InventoryLog.pickup)
        .joinedload(Pickup.profile)
        .joinedload(Profile.user)
    )

    # 2. Filters
    if status != "all":
        query = query.filter(InventoryLog.status == status)

    if search:
        query = query.filter(InventoryLog.item_name.ilike(f"%{search}%"))

    logs = query.order_by(InventoryLog.created_at.desc()).all()

    # 3. Map to Schema (The Fix is inside this loop)
    results = []
    for log in logs:
        # Safe Navigation: Check if relations exist before accessing attributes
        customer_name = "Unknown"
        if log.pickup and log.pickup.profile and log.pickup.profile.user:
            customer_name = log.pickup.profile.user.full_name or "Unknown"

        results.append(InventoryItemResponse(
            id=log.id,
            formatted_id=f"INV-{log.id:04d}",
            name=log.item_name,
            category=log.category or "Electronics",
            status=log.status, 
            receivedDate=log.created_at.date(),
            value=log.value,
            condition="Assessed",
            
            # --- THIS FIELD WAS MISSING ---
            customer=customer_name 
            # ------------------------------
        ))

    return results

@router.put("/{inventory_id}/status")
def update_inventory_status(
    inventory_id: int,
    status_update: InventoryStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Warehouse Manager moves item: Received -> Refurbishing -> Recycled
    """
    ensure_collector_role(current_user)

    item = db.query(InventoryLog).filter(InventoryLog.id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Update Status
    item.status = status_update.status
    db.commit()

    return {"message": f"Item moved to {item.status}"}