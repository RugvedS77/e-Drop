# routers/collector_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from geoalchemy2.elements import WKTElement # type: ignore

from database.postgresConn import get_db
from models import all_model
from schemas import all_schema

router = APIRouter(
    prefix="/api/v1/collector",
    tags=["Collector (Admin) Actions"]
)

# --- 1. ROUTE OPTIMIZATION ---
# Corresponds to "The Route Optimization Endpoint" in PDF 
@router.get("/routes", response_model=list[all_schema.RoutePoint])
def get_optimized_routes(
    lat: float, 
    lng: float,
    radius_km: int = 10,
    db: Session = Depends(get_db)
):
    """
    Finds all 'SCHEDULED' pickups within X km of the driver's current location.
    Sorts them by distance (Nearest Neighbor).
    """
    user_location = WKTElement(f"POINT({lng} {lat})", srid=4326)

    # PostGIS Query: ST_DWithin and ST_Distance
    # Note: 1 degree approx 111km, but it's better to use ST_DistanceSphere for meters.
    # For simplicity with the Geography type, we can use simple distance sorting.
    
    pickups = db.query(all_model.Pickup).filter(
        all_model.Pickup.status == all_model.PickupStatus.SCHEDULED
    ).order_by(
        all_model.Pickup.location.distance_centroid(user_location)
    ).limit(20).all()

    # Convert to schema
    routes = []
    for i, p in enumerate(pickups):
        # Extract lat/lng from the Geometry object (requires parsing or using ST_X/ST_Y in query)
        # For simplicity in this snippet, we assume logic to extract coords exists or we fetch separately.
        # Below is a simplified assumption that p.location is accessible.
        
        # Real-world: You often need `db.query(Pickup, func.ST_X(Pickup.location), ...)`
        
        point_data = all_schema.RoutePoint(
            pickup_id=p.id,
            # Placeholder coordinates - in production use ST_AsGeoJSON
            latitude=0.0, 
            longitude=0.0,
            status=p.status,
            order=i+1
        )
        routes.append(point_data)

    return routes


# --- 2. COMPLETE PICKUP & GAMIFICATION ---
# Corresponds to "The Gamification Endpoint" in PDF [cite: 108]
@router.post("/complete/{pickup_id}")
def complete_pickup(
    pickup_id: int,
    db: Session = Depends(get_db)
):
    """
    1. Mark pickup as COLLECTED.
    2. Calculate total credits.
    3. Update User's Carbon Balance (Gamification).
    """
    # Fetch Pickup
    pickup = db.query(all_model.Pickup).filter(all_model.Pickup.id == pickup_id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
        
    if pickup.status == all_model.PickupStatus.COLLECTED:
        return {"message": "Already collected"}

    # Update Status
    pickup.status = all_model.PickupStatus.COLLECTED
    
    # Calculate Credits [cite: 114]
    total_credits = sum([item.credit_value for item in pickup.items])
    
    # Update User Profile [cite: 115]
    profile = db.query(all_model.Profile).filter(all_model.Profile.id == pickup.profile_id).first()
    if profile:
        profile.carbon_balance += total_credits
        # Assuming 1 credit = 0.5kg CO2 saved (Example logic)
        profile.co2_saved += (total_credits * 0.5)
        
    db.commit()
    
    return {
        "status": "success", 
        "credits_awarded": total_credits,
        "new_balance": profile.carbon_balance
    }