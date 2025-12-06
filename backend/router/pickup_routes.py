# routers/pickup_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

# Import your setup
from database.postgresConn import get_db
from models.all_model import Pickup, PickupItem, Profile, User, PickupStatus, UserRole
from schemas.all_schema import ScanResponse, DetectedItem, PickupCreate, PickupResponse, ItemConditionEnum
from auth.oauth2 import get_current_user
from ml_engine.detector import detector
# from oauth2 import get_current_user # Un-comment this when you have auth setup
from utils.supabase_storage import upload_file_to_supabase

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
    """Ensures only Collectors can access these routes."""
    if user.role != UserRole.dropper:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only dropper can perform this action."
        )
    
# --- 1. AI SCANNING ENDPOINT ---
# Corresponds to "The AI Detection Endpoint" in PDF 
@router.post("/scan", response_model=ScanResponse)
async def predict_ewaste(file: UploadFile = File(...),
                         db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    # 1. Validate file type
    ensure_dropper_role(current_user)
    user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if not user_profile:
        # If profile missing (rare edge case), create one or raise error
        # For now, we raise error to keep data clean
        raise HTTPException(
            status_code=404, 
            detail="User profile not found. Please contact support."
        )
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # 2. Read and Predict
        contents = await file.read()

        # --- NEW: Upload to Supabase ---
        # We upload immediately so we can show the user what they scanned 
        # and keep the URL for the next step.
        uploaded_url = upload_file_to_supabase(
            file_bytes=contents, 
            file_name=file.filename, 
            content_type=file.content_type
        )
        
        # --- YOUR AI PREDICTION CALL ---
        detections = await detector.predict(contents)
    
        
        # 3. Handle AI Errors
        if isinstance(detections, dict) and "error" in detections:
             raise HTTPException(status_code=502, detail=detections["error"])
            
        # 4. MAP RAW DATA TO SCHEMA (The Fix)
        mapped_items = []
        total_credits = 0

        for obj in detections:
            # Extract data from YOLO format
            item_name = obj.get("class", "unknown")

            if item_name not in ALLOWED_E_WASTE:
                continue

            confidence = obj.get("confidence", 0.0)

            # Assign Value (Look up in dict, default to 10 if not found)
            value = PRICE_LIST.get(item_name.lower(), 10)
            
            # Assign Condition (Mock logic: High confidence = Good condition)
            # In the future, you can train a second model to detect 'scratches'
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

        # 5. Return the exact structure defined in ScanResponse
        return {
            "detected_items": mapped_items,
            "total_estimated_credits": total_credits,
            "image_url": uploaded_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# --- THE BOOKING ENDPOINT ---
@router.post("/create", response_model= PickupResponse, status_code=status.HTTP_201_CREATED)
def create_pickup(
    pickup_data: PickupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Now requires Auth
):
    """
    Finalizes the booking.
    Takes the list of items (originally from /scan) and saves them to the DB.
    """
    
    # 1. Get the Profile ID from the Current User
    ensure_dropper_role(current_user)
    user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=404, 
            detail="User profile not found. Please contact support."
        )

    # 2. Validate Data Wipe (Security Rule)
    # If any item is an electronic device, the user MUST confirm data wipe.
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

    # 3. Create the Pickup Record (The 'Header')
    # Converting Lat/Lng to PostGIS format: "POINT(longitude latitude)"
    location_wkt = f"POINT({pickup_data.longitude} {pickup_data.latitude})"

    new_pickup = Pickup(
        profile_id=user_profile.id,
        pickup_date=pickup_data.pickup_date,
        timeslot=pickup_data.timeslot,
        location=location_wkt, # SQLAlchemy/GeoAlchemy handles the WKT conversion
        address_text=pickup_data.address_text,
        status=PickupStatus.SCHEDULED,
        image_url=pickup_data.image_url
    )
    
    db.add(new_pickup)
    db.commit()
    db.refresh(new_pickup) # Fetch the new ID (new_pickup.id)

    # 4. Save the Items (The 'Details')
    final_credit_total = 0
    
    for item in pickup_data.items:
        new_item = PickupItem(
            pickup_id=new_pickup.id,
            item_name=item.item_name,
            detected_condition=item.detected_condition,
            credit_value=item.credit_value # Value agreed upon at booking
        )
        db.add(new_item)
        final_credit_total += item.credit_value

    db.commit()

    # 5. Return Success Response
    return PickupResponse(
        id=new_pickup.id,
        status=new_pickup.status,
        scheduled_time=new_pickup.scheduled_time,
        total_credits=final_credit_total,
        message="Pickup scheduled! A Collector has been notified.",
        image_url=new_pickup.image_url
    )