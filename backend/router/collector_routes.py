# import os
# import httpx
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from sqlalchemy import cast, String 
# from typing import List
# from geoalchemy2.shape import to_shape

# from database.postgresConn import get_db
# from models.all_model import Pickup, PickupItem, Profile, User, PickupStatus, UserRole
# from schemas.all_schema import PickupResponse
# from auth.oauth2 import get_current_user

# router = APIRouter(
#     prefix="/api/collector",
#     tags=["Collector (Admin) Actions"]
# )

# # --- HELPER: Role Check ---
# def ensure_collector_role(user: User):
#     if user.role != UserRole.collector:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Access denied. Only Collectors can perform this action."
#         )

# # --- 1. VIEW PENDING PICKUPS ---
# @router.get("/pending", response_model=List[PickupResponse])
# def get_pending_pickups(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     ensure_collector_role(current_user)
    
#     pickups = db.query(Pickup).filter(
#         cast(Pickup.status, String) == "SCHEDULED"
#     ).all()
    
#     response_list = []
#     for p in pickups:
#         total_val = sum(item.credit_value for item in p.items)
#         response_list.append(
#             PickupResponse(
#                 id=p.id,
#                 status=p.status,
#                 pickup_date=p.pickup_date,
#                 timeslot=p.timeslot,
#                 total_credits=total_val,
#                 message="Ready for collection",
#                 image_url=p.image_url
#             )
#         )
#     return response_list


# # --- 2. OPTIMIZE ROUTE (Fixed for Duplicate Locations) ---
# @router.get("/optimize-route")
# async def get_osrm_route(
#     latitude: float,
#     longitude: float,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     ensure_collector_role(current_user)

#     # 1. Fetch Pickups
#     pickups = db.query(Pickup).filter(
#         cast(Pickup.status, String) == "SCHEDULED"
#     ).all()
    
#     if not pickups:
#         return {
#             "message": "No scheduled pickups found.", 
#             "route_geometry": None, 
#             "stops": [],
#             "total_distance": 0,
#             "total_duration": 0
#         }

#     # 2. Prepare Coordinates
#     coords_list = [f"{longitude},{latitude}"] 
    
#     # FIX: Use a Dictionary of LISTS to handle multiple pickups at same location
#     pickup_map = {} 
    
#     valid_pickups_count = 0

#     for p in pickups:
#         if p.location is None: continue
            
#         try:
#             point = to_shape(p.location)
#             coord_str = f"{point.x},{point.y}"
#             coords_list.append(coord_str)
            
#             # FIX: If key exists, append to list. If not, create list.
#             if coord_str not in pickup_map:
#                 pickup_map[coord_str] = []
            
#             pickup_map[coord_str].append(p)
            
#             valid_pickups_count += 1
#         except Exception as e:
#             print(f"Error parsing location for pickup {p.id}: {e}")
#             continue

#     if valid_pickups_count == 0:
#          return {"message": "No valid locations found", "stops": []}

#     coords_string = ";".join(coords_list)

#     # 3. Call OSRM
#     url = f"http://router.project-osrm.org/trip/v1/driving/{coords_string}?source=first&overview=full&geometries=geojson"
    
#     try:
#         async with httpx.AsyncClient() as client:
#             response = await client.get(url, timeout=15.0)
            
#             if response.status_code != 200:
#                 print(f"OSRM API Error: {response.status_code}")
#                 return build_fallback_response(pickups)

#             data = response.json()

#         if data["code"] != "Ok":
#             return build_fallback_response(pickups)

#         trip = data["trips"][0]
#         waypoints = data["waypoints"]
        
#         # 4. Re-order Stops (FIXED LOGIC)
#         ordered_pickups = []
        
#         for wp in waypoints:
#             original_index = wp["waypoint_index"]
#             if original_index == 0: continue 
                
#             original_coord_string = coords_list[original_index]
            
#             # FIX: Check if list exists and has items
#             if original_coord_string in pickup_map and len(pickup_map[original_coord_string]) > 0:
#                 # POP the first item from the list so we don't reuse it
#                 p = pickup_map[original_coord_string].pop(0)
                
#                 point = to_shape(p.location)
#                 ordered_pickups.append({
#                     "id": p.id,
#                     "address": p.address_text,
#                     "lat": point.y,
#                     "lng": point.x,
#                     "image_url": p.image_url,
#                     "status": p.status
#                 })

#         return {
#             "route_geometry": trip["geometry"],
#             "stops": ordered_pickups,
#             "total_distance": trip["distance"],
#             "total_duration": trip["duration"]
#         }
        
#     except Exception as e:
#         print(f"Routing Exception: {str(e)}")
#         return build_fallback_response(pickups)


# def build_fallback_response(pickups):
#     stops = []
#     for p in pickups:
#         if p.location is None: continue
#         try:
#             point = to_shape(p.location)
#             stops.append({
#                 "id": p.id,
#                 "address": p.address_text,
#                 "lat": point.y,
#                 "lng": point.x,
#                 "image_url": p.image_url,
#                 "status": p.status
#             })
#         except:
#             continue
#     return {
#         "message": "Routing service busy. Showing locations without path.",
#         "route_geometry": None,
#         "stops": stops,
#         "total_distance": 0,
#         "total_duration": 0
#     }


# # --- 3. COMPLETE PICKUP ---
# @router.post("/pickup/{pickup_id}/complete")
# def complete_pickup(
#     pickup_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     ensure_collector_role(current_user)

#     pickup = db.query(Pickup).filter(Pickup.id == pickup_id).first()
    
#     if not pickup:
#         raise HTTPException(status_code=404, detail="Pickup request not found.")

#     if pickup.status == PickupStatus.COLLECTED:
#         raise HTTPException(status_code=400, detail="This pickup has already been collected.")

#     total_credits = sum(item.credit_value for item in pickup.items)

#     pickup.status = PickupStatus.COLLECTED
    
#     user_profile = db.query(Profile).filter(Profile.id == pickup.profile_id).first()
#     if user_profile:
#         user_profile.carbon_balance += total_credits
#         user_profile.co2_saved += (total_credits * 0.1) 
        
#     db.commit()
    
#     return {
#         "message": "Pickup completed successfully",
#         "credits_awarded": total_credits,
#         "new_status": pickup.status
#     }

# backend/router/collector_routes.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, String 
from typing import List, Optional
import httpx
from geoalchemy2.shape import to_shape
from geoalchemy2.elements import WKTElement

from database.postgresConn import get_db
from models.all_model import Pickup, PickupItem, Profile, User, PickupStatus, UserRole
from schemas.all_schema import PickupResponse
from auth.oauth2 import get_current_user

router = APIRouter(
    prefix="/api/collector",
    tags=["Collector (Admin) Actions"]
)

# --- HELPER: Role Check ---
def ensure_collector_role(user: User):
    if user.role != UserRole.collector:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Collectors can perform this action."
        )

# --- 1. VIEW PENDING PICKUPS ---
@router.get("/pending", response_model=List[PickupResponse])
def get_pending_pickups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_collector_role(current_user)
    
    pickups = db.query(Pickup).filter(
        cast(Pickup.status, String) == "SCHEDULED"
    ).all()
    
    response_list = []
    for p in pickups:
        total_val = sum(item.credit_value for item in p.items)
        response_list.append(
            PickupResponse(
                id=p.id,
                status=p.status,
                scheduled_time=p.scheduled_time,
                total_credits=total_val,
                message="Ready for collection",
                image_url=p.image_url
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


# --- 3. COMPLETE PICKUP ---
@router.post("/pickup/{pickup_id}/complete")
def complete_pickup(
    pickup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_collector_role(current_user)

    pickup = db.query(Pickup).filter(Pickup.id == pickup_id).first()
    
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup request not found.")

    if pickup.status == PickupStatus.COLLECTED:
        raise HTTPException(status_code=400, detail="This pickup has already been collected.")

    total_credits = sum(item.credit_value for item in pickup.items)

    pickup.status = PickupStatus.COLLECTED
    
    user_profile = db.query(Profile).filter(Profile.id == pickup.profile_id).first()
    if user_profile:
        user_profile.carbon_balance += total_credits
        user_profile.co2_saved += (total_credits * 0.1) 
        
    db.commit()
    
    return {
        "message": "Pickup completed successfully",
        "credits_awarded": total_credits,
        "new_status": pickup.status
    }