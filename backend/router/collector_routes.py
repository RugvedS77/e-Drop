import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, String 
from typing import List, Optional
from geoalchemy2.shape import to_shape
from geoalchemy2.elements import WKTElement
from datetime import datetime, time

from database.postgresConn import get_db
from models.all_model import Pickup, PickupItem, Profile, User, PickupStatus, UserRole, Certificate, InventoryLog, InventoryStatus, Transaction, TransactionType

from schemas.all_schema import PickupResponse, CertificateResponse, CertificateCreate, DetectedItem
from auth.oauth2 import get_current_user

router = APIRouter(
    prefix="/api/collector",
    tags=["Collector (Admin) Actions"]
)

# --- HELPER: Role Check ---
def ensure_collector_role(user: User):
    """Ensures only Collectors can access these routes."""
    if user.role != UserRole.collector:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Collectors can perform this action."
        )


# --- 1. VIEW PENDING PICKUPS (FIXED) ---
@router.get("/pending", response_model=List[PickupResponse])
def get_pending_pickups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_collector_role(current_user)
    
    # Fetch all SCHEDULED pickups
    pickups = db.query(Pickup).filter(
        cast(Pickup.status, String) == "SCHEDULED"
    ).all()
    
    response_list = []
    for p in pickups:
        # 1. Calculate Total Value
        total_val = sum(item.credit_value for item in p.items)
        
        # 2. Time Logic
        ref_date = p.pickup_date if p.pickup_date else p.created_at.date()
        hour = 9 
        if p.timeslot:
            if "Afternoon" in p.timeslot: hour = 13
            elif "Evening" in p.timeslot: hour = 17
        final_scheduled_time = datetime.combine(ref_date, time(hour, 0))

        # 3. Items Logic
        items_data = [
            DetectedItem(
                item=i.item_name,
                condition=i.detected_condition,
                estimated_value=i.credit_value,
                confidence=1.0
            ) for i in p.items
        ]

        response_list.append(
            PickupResponse(
                id=p.id,
                status=p.status,
                pickup_date=p.pickup_date,
                timeslot=p.timeslot,
                scheduled_time=final_scheduled_time, 
                total_credits=total_val,
                message="Ready for collection",
                image_url=p.image_url,
                
                # --- CRITICAL FIX: Pass address_text here ---
                address_text=p.address_text, 
                items=items_data
            )
        )
    return response_list


# --- 2. OPTIMIZE ROUTE (Local + Manual Override) ---
@router.get("/optimize-route")
async def get_osrm_route(
    latitude: float,
    longitude: float,
    radius_km: int = 50, # Default search radius
    # NEW: Accept list of IDs to force into the route (e.g., ?include_ids=1&include_ids=5)
    include_ids: List[int] = Query(default=[]), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_collector_role(current_user)

    # 1. Fetch ALL Scheduled Pickups
    all_pickups = db.query(Pickup).filter(
        cast(Pickup.status, String) == "SCHEDULED"
    ).all()
    
    route_pickups = []  # These will get the BLUE line
    other_pickups = []  # These will be GREY markers

    for p in all_pickups:
        if not p.location: continue
        
        try:
            point = to_shape(p.location)
            
            # Simple Distance Calc (1 deg lat ~= 111km)
            dist = ((point.y - latitude)**2 + (point.x - longitude)**2)**0.5 * 111
            
            # LOGIC: Include if nearby OR if user manually selected it
            if dist <= radius_km or p.id in include_ids:
                route_pickups.append(p)
            else:
                other_pickups.append(p)
        except Exception as e:
            print(f"Location parse error for pickup {p.id}: {e}")
            continue

    # If no local pickups and no manual overrides, return unoptimized map
    if not route_pickups:
        return build_response(stops=other_pickups, route_geo=None)

    # 2. Prepare Coordinates for OSRM (Only for route_pickups)
    coords_list = [f"{longitude},{latitude}"] # Start at Driver location
    
    # Map coordinates to Pickup objects (handling multiple pickups at same location)
    pickup_map = {} 
    
    for p in route_pickups:
        point = to_shape(p.location)
        coord_str = f"{point.x},{point.y}"
        
        coords_list.append(coord_str)
        
        if coord_str not in pickup_map: 
            pickup_map[coord_str] = []
        pickup_map[coord_str].append(p)

    coords_string = ";".join(coords_list)

    # 3. Call OSRM API
    url = f"http://router.project-osrm.org/trip/v1/driving/{coords_string}?source=first&overview=full&geometries=geojson"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=15.0)
            
            if response.status_code != 200:
                # Fallback if API fails
                return build_response(stops=route_pickups + other_pickups, route_geo=None)

            data = response.json()

        if data["code"] != "Ok":
             return build_response(stops=route_pickups + other_pickups, route_geo=None)

        trip = data["trips"][0]
        waypoints = data["waypoints"]
        
        # 4. Re-order Stops based on OSRM result
        ordered_stops = []
        
        # Process optimized stops
        for wp in waypoints:
            if wp["waypoint_index"] == 0: continue # Skip driver's start point
            
            original_coord_str = coords_list[wp["waypoint_index"]]
            
            if original_coord_str in pickup_map and len(pickup_map[original_coord_str]) > 0:
                p = pickup_map[original_coord_str].pop(0)
                ordered_stops.append(format_pickup(p, "optimized"))

        # Add remaining 'Far Away' stops (unoptimized)
        for p in other_pickups:
            ordered_stops.append(format_pickup(p, "far_away"))

        return {
            "route_geometry": trip["geometry"],
            "stops": ordered_stops,
            "total_distance": trip["distance"],
            "total_duration": trip["duration"]
        }
        
    except Exception as e:
        print(f"Routing Exception: {str(e)}")
        # Fallback: Return all markers without a route line
        return build_response(stops=all_pickups, route_geo=None)


# --- Helpers ---
def format_pickup(p, type_tag):
    point = to_shape(p.location)
    return {
        "id": p.id,
        "address": p.address_text,
        "lat": point.y,
        "lng": point.x,
        "image_url": p.image_url,
        "status": p.status,
        "tag": type_tag # 'optimized' or 'far_away'
    }

def build_response(stops, route_geo, dist=0, dur=0):
    formatted = [format_pickup(p, "raw") for p in stops]
    return {
        "route_geometry": route_geo,
        "stops": formatted,
        "total_distance": dist,
        "total_duration": dur
    }


# --- 3. COMPLETE PICKUP (Corrected) ---
@router.post("/pickup/{pickup_id}/complete")
def complete_pickup(
    pickup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_collector_role(current_user)

    # 1. Fetch Logistics Data
    pickup = db.query(Pickup).filter(Pickup.id == pickup_id).first()
    
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup request not found.")

    if pickup.status == PickupStatus.COLLECTED:
        raise HTTPException(status_code=400, detail="This pickup has already been collected.")

    # 2. TRIGGER: Move Items to Live Inventory (THIS WAS MISSING)
    # We loop through the user's manifest and create real inventory records
    new_inventory_items = []
    
    for item in pickup.items:
        # Simple category logic (optional: refine this as needed)
        cat = "Electronics"
        name_lower = item.item_name.lower()
        if "laptop" in name_lower: cat = "Laptop"
        elif "phone" in name_lower: cat = "Smartphone"
        elif "tv" in name_lower or "monitor" in name_lower: cat = "Display"

        log_entry = InventoryLog(
            pickup_id=pickup.id,
            item_name=item.item_name,
            category=cat,
            value=item.credit_value,
            status=InventoryStatus.RECEIVED # Initial Warehouse Status
        )
        db.add(log_entry)
        new_inventory_items.append(log_entry)

    ## Calculate Credits
    total_credits = sum(item.credit_value for item in pickup.items)
    pickup.status = PickupStatus.COLLECTED
    
    # Gamification & Ledger
    user_profile = db.query(Profile).filter(Profile.id == pickup.profile_id).first()
    if user_profile:
        # 1. Update Balance
        user_profile.carbon_balance += total_credits
        user_profile.co2_saved += (total_credits * 0.1)
        
        # 2. RECORD TRANSACTION (New Logic)
        new_txn = Transaction(
            profile_id=user_profile.id,
            amount=total_credits, # Positive for earning
            type=TransactionType.EARN,
            description=f"Recycled {len(pickup.items)} items (Pickup #{pickup.id})"
        )
        db.add(new_txn)

    db.commit()

    return {
        "message": "Pickup collected. Items moved to Warehouse Inventory.",
        "credits_awarded": total_credits,
        "items_added_to_inventory": len(new_inventory_items),
        "new_status": pickup.status
    }

# --- 4. LIST CERTIFICATES (GET) ---
@router.get("/certificates", response_model=List[CertificateResponse])
def get_certificates(
    search: str = "",
    type_filter: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_collector_role(current_user)

    query = db.query(Certificate)

    # Filter by Type
    if type_filter != "all":
        query = query.filter(Certificate.cert_type == type_filter)

    # Filter by Search (Name or ID)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Certificate.recipient_name.ilike(search_term)) |
            (Certificate.unique_code.ilike(search_term))
        )

    certs = query.order_by(Certificate.id.desc()).all()

    # Map to Schema
    results = []
    for c in certs:
        results.append(CertificateResponse(
            id=c.unique_code,
            orderId=f"PU-{c.pickup_id:03d}",
            customerName=c.recipient_name,
            issueDate=c.issue_date,
            carbonOffset=c.carbon_offset_snapshot,
            itemsRecycled=c.items_count_snapshot,
            type=c.cert_type
        ))

    return results

# --- 5. ISSUE CERTIFICATE (POST) ---
@router.post("/certificates", response_model=CertificateResponse)
def issue_certificate(
    payload: CertificateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_collector_role(current_user)

    # 1. Validate Pickup exists
    pickup = db.query(Pickup).filter(Pickup.id == payload.pickup_id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup ID not found")

    # 2. Check if Pickup is actually completed
    if pickup.status != PickupStatus.COLLECTED:
        raise HTTPException(status_code=400, detail="Cannot issue certificate for uncollected pickup.")

    # 3. Check for Duplicate (One cert per pickup)
    existing = db.query(Certificate).filter(Certificate.pickup_id == pickup.id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Certificate already issued: {existing.unique_code}")

    # 4. Calculate Data
    # Get user name from the pickup profile
    recipient = pickup.profile.user.full_name or "Valued Customer"
    
    # Calculate totals from items
    total_offset = 0.0
    items_count = 0
    for item in pickup.items:
        items_count += 1
        # Logic: 1 credit ~= 0.1kg CO2 (Same as complete_pickup logic)
        total_offset += (item.credit_value * 0.1)

    # 5. Create Certificate
    # Generate next ID for code
    last_cert = db.query(Certificate).order_by(Certificate.id.desc()).first()
    next_id = (last_cert.id + 1) if last_cert else 1
    new_code = f"CERT-{next_id:03d}"

    new_cert = Certificate(
        unique_code=new_code,
        pickup_id=pickup.id,
        recipient_name=recipient,
        cert_type=payload.cert_type,
        carbon_offset_snapshot=total_offset,
        items_count_snapshot=items_count,
        issue_date=datetime.now().date()
    )

    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)

    return CertificateResponse(
        id=new_cert.unique_code,
        orderId=f"PU-{pickup.id:03d}",
        customerName=new_cert.recipient_name,
        issueDate=new_cert.issue_date,
        carbonOffset=new_cert.carbon_offset_snapshot,
        itemsRecycled=new_cert.items_count_snapshot,
        type=new_cert.cert_type
    )