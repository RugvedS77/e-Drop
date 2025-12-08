# routers/pickup_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, time
import os
from typing import List, Optional

# Import your setup
from database.postgresConn import get_db
from models.all_model import Pickup, PickupItem, Profile, User, PickupStatus, UserRole
# Updated imports: PickupHistoryDetail/HistoryItem might not be needed anymore, 
# but I kept them just in case. The key imports here are ScanResponse, PickupResponse, DetectedItem
from schemas.all_schema import (
    ScanResponse, 
    DetectedItem, 
    PickupCreate, 
    PickupResponse, 
    ItemConditionEnum, 
    PickupHistoryDetail, 
    HistoryItem
)
from auth.oauth2 import get_current_user
from ml_engine.detector import detector
from utils.supabase_storage import upload_file_to_supabase
from utils.sms_utils import send_sms_alert

router = APIRouter(
    prefix="/api/pickups",
    tags=["Dropper (User) Actions"]
)

ALLOWED_E_WASTE = {
    "laptop", 
    "cell phone", 
    "mouse", 
    "keyboard", 
    "tv", 
    "monitor", 
    "remote",
    "tablet"
}

PRICE_LIST = {
    "laptop": 500,
    "cell phone": 300,
    "mouse": 50,
    "keyboard": 80,
    "tv": 400,
    "monitor": 200,
    "remote": 30,
    "tablet": 250
}

def ensure_dropper_role(user: User):
    """Ensures only Droppers (Users) can access these routes."""
    if user.role != UserRole.dropper:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only dropper can perform this action."
        )

# --- 1. AI SCANNING ENDPOINT ---
@router.post("/scan", response_model=ScanResponse)
async def predict_ewaste(file: UploadFile = File(...),
                         db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    # 1. Validate file type
    ensure_dropper_role(current_user)
    user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=404, 
            detail="User profile not found. Please contact support."
        )
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # 2. Read and Predict
        contents = await file.read()

        # --- Upload to Supabase ---
        uploaded_url = upload_file_to_supabase(
            file_bytes=contents, 
            file_name=file.filename, 
            content_type=file.content_type
        )
        
        # --- AI PREDICTION CALL ---
        detections = await detector.predict(contents)
    
        # 3. Handle AI Errors
        if isinstance(detections, dict) and "error" in detections:
             raise HTTPException(status_code=502, detail=detections["error"])
            
        # 4. MAP RAW DATA TO SCHEMA
        mapped_items = []
        total_credits = 0

        for obj in detections:
            # Extract data from YOLO format
            item_name = obj.get("class", "unknown")

            if item_name not in ALLOWED_E_WASTE:
                continue

            confidence = obj.get("confidence", 0.0)

            # Assign Value
            value = PRICE_LIST.get(item_name.lower(), 10)
            
            # Assign Condition
            condition = ItemConditionEnum.WORKING
            if confidence < 0.6:
                condition = ItemConditionEnum.SCRAP
            elif confidence < 0.8:
                condition = ItemConditionEnum.REPAIRABLE

            # Create the Pydantic Object
            detected_item = DetectedItem(
                item=item_name,
                condition=condition,
                estimated_value=value,
                confidence=confidence
            )
            
            mapped_items.append(detected_item)
            total_credits += value

        # 5. Return Response
        return {
            "detected_items": mapped_items,
            "total_estimated_credits": total_credits,
            "image_url": uploaded_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# --- 2. BOOKING ENDPOINT ---
@router.post("/create", response_model=PickupResponse, status_code=status.HTTP_201_CREATED)
def create_pickup(
    pickup_data: PickupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Finalizes the booking and sends SMS notification to the Master Collector.
    """
    
    # 1. Get the Profile
    ensure_dropper_role(current_user)
    user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=404, 
            detail="User profile not found. Please contact support."
        )

    # 2. Validate Data Wipe
    electronic_keywords = ["laptop", "phone", "tablet", "computer", "tv"]
    has_electronics = any(
        any(keyword in item.item_name.lower() for keyword in electronic_keywords)
        for item in pickup_data.items
    )
    
    if has_electronics and not pickup_data.data_wipe_confirmed:
        raise HTTPException(
            status_code=400, 
            detail="Data wipe confirmation is required for electronic items."
        )

    # 3. Create the Pickup Record
    location_wkt = f"POINT({pickup_data.longitude} {pickup_data.latitude})"

    new_pickup = Pickup(
        profile_id=user_profile.id,
        pickup_date=pickup_data.pickup_date,
        timeslot=pickup_data.timeslot,
        location=location_wkt, 
        address_text=pickup_data.address_text,
        status=PickupStatus.SCHEDULED,
        image_url=pickup_data.image_url
    )
    
    db.add(new_pickup)
    db.commit()
    db.refresh(new_pickup)

    # 4. Save the Items
    final_credit_total = 0
    item_summary_list = [] # For SMS text
    
    for item in pickup_data.items:
        new_item = PickupItem(
            pickup_id=new_pickup.id,
            item_name=item.item_name,
            detected_condition=item.detected_condition,
            credit_value=item.credit_value,
            description=item.description, 
            years_used=item.years_used
        )
        db.add(new_item)
        final_credit_total += item.credit_value
        item_summary_list.append(f"{item.item_name} ({item.detected_condition.value})")

    db.commit()

    # --- 5. TWILIO NOTIFICATION ---
    try:
        # Construct message components
        items_str = ", ".join(item_summary_list)
        formatted_time = pickup_data.pickup_date.strftime("%d %b, %I:%M %p")
        
        # Create the message body
        msg_body = (
            f"📢 *New E-Drop Request!* \n"
            f"📍 Location: {pickup_data.address_text or 'Unknown Location'} \n"
            f"📦 Items: {items_str} \n"
            f"⏰ Time: {formatted_time} \n"
            f"💰 Est. Credits: {final_credit_total}"
        )

        # Get the Master Collector number from .env
        master_phone = os.getenv("MASTER_COLLECTOR_PHONE")
        
        if master_phone:
            # Send the SMS
            sms_result = send_sms_alert(master_phone, msg_body)
            print(f"✅ Notification Status: {sms_result}")
        else:
            print("⚠️ Skipping SMS: MASTER_COLLECTOR_PHONE not set in .env")
            
    except Exception as e:
        print(f"❌ SMS Notification Failed: {str(e)}")

    # 6. Return Success Response
    return PickupResponse(
        id=new_pickup.id,
        status=new_pickup.status,
        pickup_date=new_pickup.pickup_date,
        timeslot=new_pickup.timeslot,
        total_credits=final_credit_total,
        message="Pickup scheduled! A Collector has been notified.",
        image_url=new_pickup.image_url
    )


# --- 3. UPDATED HISTORY ENDPOINT ---
# Replaces the old PickupHistoryDetail logic with PickupResponse logic
@router.get("/history", response_model=List[PickupResponse])
def get_pickup_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch history with eager loading to ensure credits and items are calculated.
    Returns the standard PickupResponse format used in other parts of the app.
    """
    ensure_dropper_role(current_user)
    
    user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not user_profile:
        return []

    # FIX: Use .options(joinedload(Pickup.items)) to actually get the items for credit calculation
    pickups = db.query(Pickup).options(joinedload(Pickup.items)).filter(
        Pickup.profile_id == user_profile.id
    ).order_by(Pickup.id.desc()).limit(10).all()

    response_list = []
    for p in pickups:
        # Calculate total value
        total_val = sum(item.credit_value for item in p.items)
        
        # Determine the best date to show
        display_date = p.pickup_date if p.pickup_date else p.created_at.date()

        response_list.append(PickupResponse(
            id=p.id,
            status=p.status,
            pickup_date=display_date,
            timeslot=p.timeslot,
            total_credits=total_val,
            message="History Record",
            image_url=p.image_url,
            items=[
                DetectedItem(
                    item=i.item_name, 
                    condition=i.detected_condition, 
                    estimated_value=i.credit_value,
                    confidence=1.0 
                ) for i in p.items
            ]
        ))
        
    return response_list