from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database.postgresConn import get_db
from models.all_model import Profile, User, UserRole
from auth.oauth2 import get_current_user

router = APIRouter(
    prefix="/api/wallet",
    tags=["Wallet & Gamification"]
)       

# --- SCHEMAS ---

class WalletStats(BaseModel):
    user_id: int    
    carbon_balance: int
    co2_saved: float
    badge_level: str

class WalletUpdate(BaseModel):
    """Used by Admins to manually adjust balances"""
    carbon_balance: Optional[int] = None
    co2_saved: Optional[float] = None

class RedeemRequest(BaseModel):
    reward_title: str
    points_cost: int

# --- HELPER: Role Check ---
def ensure_collector_role(user: User):
    if user.role != UserRole.collector:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Collectors (Admins) can manage wallets."
        )

# --- HELPER: Calculate Badge ---
def calculate_badge(co2_saved: float) -> str:
    # Logic based on gamification requirements 
    if co2_saved > 100: return "Earth Guardian"
    if co2_saved > 50: return "Eco Warrior"
    if co2_saved > 20: return "Recycling Rookie"
    return "Green Starter"

# ==========================================
# USER ROUTES (Read & Redeem)
# ==========================================

@router.get("/me", response_model=WalletStats)
def get_my_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    READ: Get the logged-in user's carbon wallet stats[cite: 9].
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if not profile:
        # Lazy creation if missing
        profile = Profile(user_id=current_user.id, carbon_balance=0, co2_saved=0.0)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "user_id": profile.user_id,
        "carbon_balance": profile.carbon_balance,
        "co2_saved": profile.co2_saved,
        "badge_level": calculate_badge(profile.co2_saved)
    }

@router.post("/redeem")
def redeem_reward(
    request: RedeemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    UPDATE (User): Redeem points for a reward.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Wallet not found")

    if profile.carbon_balance < request.points_cost:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient funds. You have {profile.carbon_balance} credits."
        )

    # Deduct Points
    profile.carbon_balance -= request.points_cost
    db.commit()

    return {
        "message": f"Successfully redeemed {request.reward_title}",
        "remaining_balance": profile.carbon_balance,
        "badge_level": calculate_badge(profile.co2_saved)
    }

# ==========================================
# ADMIN ROUTES (Full CRUD)
# ==========================================

@router.post("/admin/init/{target_user_id}", response_model=WalletStats)
def admin_create_wallet(
    target_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    CREATE: Manually create a wallet for a specific user ID.
    Useful for fixing legacy users who lack a profile.
    """
    ensure_collector_role(current_user)

    # Check if user exists
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check if profile already exists
    existing_profile = db.query(Profile).filter(Profile.user_id == target_user_id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Wallet already exists for this user")

    new_profile = Profile(user_id=target_user_id, carbon_balance=0, co2_saved=0.0)
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return {
        "user_id": new_profile.user_id,
        "carbon_balance": new_profile.carbon_balance,
        "co2_saved": new_profile.co2_saved,
        "badge_level": calculate_badge(new_profile.co2_saved)
    }

@router.get("/admin/{target_user_id}", response_model=WalletStats)
def admin_get_wallet(
    target_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    READ (Admin): View any user's wallet details.
    """
    ensure_collector_role(current_user)

    profile = db.query(Profile).filter(Profile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Wallet not found")

    return {
        "user_id": profile.user_id,
        "carbon_balance": profile.carbon_balance,
        "co2_saved": profile.co2_saved,
        "badge_level": calculate_badge(profile.co2_saved)
    }

@router.put("/admin/{target_user_id}", response_model=WalletStats)
def admin_update_wallet(
    target_user_id: int,
    update_data: WalletUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    UPDATE (Admin): Manually adjust credits or CO2 stats.
    """
    ensure_collector_role(current_user)

    profile = db.query(Profile).filter(Profile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Wallet not found")

    if update_data.carbon_balance is not None:
        profile.carbon_balance = update_data.carbon_balance
    
    if update_data.co2_saved is not None:
        profile.co2_saved = update_data.co2_saved

    db.commit()
    db.refresh(profile)

    return {
        "user_id": profile.user_id,
        "carbon_balance": profile.carbon_balance,
        "co2_saved": profile.co2_saved,
        "badge_level": calculate_badge(profile.co2_saved)
    }

@router.delete("/admin/{target_user_id}")
def admin_reset_wallet(
    target_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    DELETE (Soft): Resets the wallet balance to 0. 
    (We don't actually delete the row to keep the user relation valid).
    """
    ensure_collector_role(current_user)

    profile = db.query(Profile).filter(Profile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Wallet not found")

    profile.carbon_balance = 0
    profile.co2_saved = 0.0
    db.commit()

    return {"message": f"Wallet for User {target_user_id} has been reset to 0."}