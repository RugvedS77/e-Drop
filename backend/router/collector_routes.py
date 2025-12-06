# router/collector_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func

from database.postgresConn import get_db
from models import all_model
from schemas import all_schema
from auth.oauth2 import get_current_user

router = APIRouter(
    prefix="/api/collector",
    tags=["Collector (Admin) Actions"]
)

# --- HELPER: Role Check ---
def ensure_collector_role(user: all_model.User):
    """Ensures only Collectors can access these routes."""
    if user.role != all_model.UserRole.collector:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Collectors can perform this action."
        )

# --- 1. VIEW PENDING PICKUPS (The Map Data) ---
@router.get("/pending", response_model=List[all_schema.PickupResponse])
def get_pending_pickups(
    db: Session = Depends(get_db),
    current_user: all_model.User = Depends(get_current_user)
):
    """
    Returns all 'scheduled' pickups with calculated credit totals.
    """
    ensure_collector_role(current_user)
    
    # 1. Fetch from DB
    pickups = db.query(all_model.Pickup).filter(
        all_model.Pickup.status == all_model.PickupStatus.SCHEDULED
    ).all()
    
    # 2. Map DB Objects to Pydantic Schema manually
    response_list = []
    
    for p in pickups:
        # Calculate total value from related items
        total_val = sum(item.credit_value for item in p.items)
        
        response_list.append(
            all_schema.PickupResponse(
                id=p.id,
                status=p.status,
                scheduled_time=p.scheduled_time,
                total_credits=total_val,  # <--- calculated field
                message="Ready for collection" # <--- required field
            )
        )
    
    return response_list

# --- 2. COMPLETE PICKUP (The 'Pick It Up' Action) ---
@router.post("/pickup/{pickup_id}/complete")
def complete_pickup(
    pickup_id: int,
    db: Session = Depends(get_db),
    current_user: all_model.User = Depends(get_current_user)
):
    """
    1. Marks pickup as COLLECTED.
    2. Calculates total value of items.
    3. Transfers credits to the User's Carbon Wallet.
    Source: [cite: 111, 112, 113, 114, 115]
    """
    ensure_collector_role(current_user)

    # A. Find the Pickup
    pickup = db.query(all_model.Pickup).filter(all_model.Pickup.id == pickup_id).first()
    
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup request not found.")

    if pickup.status == all_model.PickupStatus.COLLECTED:
        raise HTTPException(status_code=400, detail="This pickup has already been collected.")

    # B. Calculate Total Credits from the items in this pickup
    # We sum the 'credit_value' column of all related PickupItems
    total_credits = 0
    for item in pickup.items:
        total_credits += item.credit_value

    # C. Update Pickup Status
    pickup.status = all_model.PickupStatus.COLLECTED
    
    # D. Credit the User (Gamification)
    # We find the profile linked to this pickup
    user_profile = db.query(all_model.Profile).filter(all_model.Profile.id == pickup.profile_id).first()
    
    if user_profile:
        # 1. Add Credits (Carbon Balance)
        user_profile.carbon_balance += total_credits
        
        # 2. Update CO2 Stats (Assumption: 1 credit = 0.1kg CO2 saved, or arbitrary logic)
        # In a real app, each item type would have a specific CO2 multiplier.
        estimated_co2 = total_credits * 0.1 
        user_profile.co2_saved += estimated_co2
        
    db.commit()
    
    return {
        "message": "Pickup completed successfully",
        "credits_awarded": total_credits,
        "new_status": pickup.status
    }