# routers/profile_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.postgresConn import get_db
from models import all_model
from schemas import all_schema
from auth.oauth2 import get_current_user # Assuming you have this auth dependency

router = APIRouter(
    prefix="/api/profiles",
    tags=["Profiles & Gamification"]
)

# --- CREATE (Internal Helper) ---
def create_profile_for_user(db: Session, user_id: int):
    """
    Utility function to be called inside your Auth/Register route.
    """
    new_profile = all_model.Profile(user_id=user_id, carbon_balance=0, co2_saved=0.0)
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

# --- READ (Get Current User's Profile) ---
@router.get("/me", response_model=all_schema.ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: all_model.User = Depends(get_current_user)
):
    """
    Get the logged-in user's carbon wallet and stats.
    If profile doesn't exist (legacy user), create it lazily.
    """
    profile = db.query(all_model.Profile).filter(all_model.Profile.user_id == current_user.id).first()
    
    if not profile:
        # Lazy creation: If user exists but profile doesn't, create one now
        profile = create_profile_for_user(db, current_user.id)
        
    return profile

# --- READ (Admin: Get All Profiles) ---
@router.get("/", response_model=List[all_schema.ProfileResponse])
def get_all_profiles(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: all_model.User = Depends(get_current_user)
):
    """
    Admin only: View leaderboard or all user stats.
    """
    # TODO: Add check like `if current_user.role != "Collector": raise Forbidden`
    profiles = db.query(all_model.Profile).offset(skip).limit(limit).all()
    return profiles

# --- UPDATE (System/Admin: Adjust Balance) ---
@router.put("/{user_id}", response_model=all_schema.ProfileResponse)
def update_profile_stats(
    user_id: int,
    profile_update: all_schema.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: all_model.User = Depends(get_current_user)
):
    """
    Manually adjust credits/CO2 (Admin use only).
    """
    # Security check (ensure only admin can access)
    if current_user.role != all_model.UserRole.collector: # Assuming 'collector' is admin-like
         raise HTTPException(status_code=403, detail="Not authorized to edit profiles")

    profile = db.query(all_model.Profile).filter(all_model.Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Update fields if provided
    if profile_update.carbon_balance is not None:
        profile.carbon_balance = profile_update.carbon_balance
    if profile_update.co2_saved is not None:
        profile.co2_saved = profile_update.co2_saved

    db.commit()
    db.refresh(profile)
    return profile

# --- DELETE ---
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: all_model.User = Depends(get_current_user)
):
    """
    Delete a profile (Cascading delete usually handles this via User deletion, 
    but this is specific cleanup).
    """
    if current_user.role != all_model.UserRole.collector:
         raise HTTPException(status_code=403, detail="Not authorized")

    profile = db.query(all_model.Profile).filter(all_model.Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    db.delete(profile)
    db.commit()
    return None