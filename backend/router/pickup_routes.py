# routers/pickup_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

# Import your setup
from database.postgresConn import get_db
from models import all_model
from schemas import all_schema
from ml_engine.detector import detector
# from oauth2 import get_current_user # Un-comment this when you have auth setup

router = APIRouter(
    prefix="/api/v1/pickups",
    tags=["Dropper (User) Actions"]
)

PRICE_LIST = {
    "laptop": 500,
    "phone": 300,
    "mouse": 50,
    "keyboard": 80,
    "monitor": 200,
    "apple": 5, # Just in case your model is detecting fruit while testing!
}
# --- 1. AI SCANNING ENDPOINT ---
# Corresponds to "The AI Detection Endpoint" in PDF [cite: 88]
@router.post("/scan", response_model=all_schema.ScanResponse)
async def predict_ewaste(file: UploadFile = File(...)):
    # 1. Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # 2. Read and Predict
        contents = await file.read()
        
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
            confidence = obj.get("confidence", 0.0)

            # Assign Value (Look up in dict, default to 10 if not found)
            value = PRICE_LIST.get(item_name.lower(), 10)
            
            # Assign Condition (Mock logic: High confidence = Good condition)
            # In the future, you can train a second model to detect 'scratches'
            condition = all_schema.ItemConditionEnum.WORKING
            if confidence < 0.6:
                condition = all_schema.ItemConditionEnum.SCRAP
            elif confidence < 0.8:
                condition = all_schema.ItemConditionEnum.REPAIRABLE

            # Create the Pydantic Object
            detected_item = all_schema.DetectedItem(
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
            "total_estimated_credits": total_credits
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# --- 2. BOOKING ENDPOINT ---
# Corresponds to "The Booking Endpoint" in PDF [cite: 96]
@router.post("/create", response_model=all_schema.PickupResponse, status_code=status.HTTP_201_CREATED)
def create_pickup(
    pickup_data: all_schema.PickupCreate,
    db: Session = Depends(get_db),
    # current_user: all_model.User = Depends(get_current_user)
):
    # For now, hardcode user_id until Auth is connected
    # profile = current_user.profile 
    # If no profile exists, handle error...
    
    # 1. Validate Data Wipe (PDF Requirement) [cite: 28]
    has_electronics = any(i.item_name.lower() in ['laptop', 'phone'] for i in pickup_data.items)
    if has_electronics and not pickup_data.data_wipe_confirmed:
        raise HTTPException(
            status_code=400, 
            detail="You must confirm data wipe for electronic items."
        )

    # 2. Mock Profile ID for testing (replace with real logic)
    # Ensure a profile exists for this user first!
    mock_profile_id = 1 

    # 3. Create Pickup Record with PostGIS Location
    # WKT Element: "POINT(longitude latitude)"
    location_wkt = f"POINT({pickup_data.longitude} {pickup_data.latitude})"

    new_pickup = all_model.Pickup(
        profile_id=mock_profile_id,
        scheduled_time=pickup_data.scheduled_time,
        location=location_wkt, # SQLAlchemy/GeoAlchemy handles the conversion
        address_text=pickup_data.address_text,
        status=all_model.PickupStatus.SCHEDULED
    )
    db.add(new_pickup)
    db.commit()
    db.refresh(new_pickup)

    # 4. Save Items to normalized table (Improved Database Schema)
    total_credits = 0
    for item in pickup_data.items:
        new_item = all_model.PickupItem(
            pickup_id=new_pickup.id,
            item_name=item.item_name,
            detected_condition=item.detected_condition,
            credit_value=item.credit_value
        )
        total_credits += item.credit_value
        db.add(new_item)
    
    db.commit()

    return all_schema.PickupResponse(
        id=new_pickup.id,
        status=new_pickup.status,
        scheduled_time=new_pickup.scheduled_time,
        total_credits=total_credits,
        message="Pickup scheduled successfully. A Collector will be assigned soon."
    )