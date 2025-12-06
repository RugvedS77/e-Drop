# router/auth_routes.py
import os
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import HTMLResponse, RedirectResponse 
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
import uuid
import random
from datetime import datetime, timedelta

from database.postgresConn import get_db
from models.all_model import User as UserModel, UserRole
from schemas.all_schema import TokenWithUser, UserCreate, ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest
from auth import hashing, token
from utilis.email_otp import send_otp_email

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

# --- Configuration for Google OAuth ---
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@router.post("/login", response_model=TokenWithUser)
def login(
    request: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Use the UserModel for the query
    user = db.query(UserModel).filter(UserModel.email == request.username).first()

    if not user or not hashing.Hash.verify(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = token.create_access_token(data={"sub": user.email})
  
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user 
    }

# --- NEW ENDPOINT 1: Redirects the user to Google ---
@router.get("/login/google")
async def login_via_google(request: Request, role: str = Query("dropper", enum=["dropper", "collector"])):
    """Redirects the user to Google, passing the desired role in the 'state' parameter."""
    # --- ADD THIS DEBUG LINE ---
    print(f"--- Received Google login request for role: {role} ---")
    # ---------------------------

    redirect_uri = request.url_for('auth_google_callback')
    
    # Pass the role to the authorize_redirect function, which will put it in the 'state' parameter.
    return await oauth.google.authorize_redirect(request, redirect_uri, state=role)

# --- Update the '/google/callback' endpoint ---
@router.get("/google/callback", name="auth_google_callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        # Authlib automatically retrieves the 'state' we sent earlier.
        google_token = await oauth.google.authorize_access_token(request)
        user_info = google_token.get('userinfo')
        
        # --- THIS IS THE FIX ---
        assigned_role_str = request.query_params.get('state') # This is the string 'farmer'
        if assigned_role_str not in ["dropper", "collector"]:
            assigned_role_str = "dropper"
        print(f"--- Role received from state parameter: {assigned_role_str} ---")

    
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Could not validate Google credentials: {e}")

    user_email = user_info['email']
    user = db.query(UserModel).filter(UserModel.email == user_email).first()

    if not user:
        try:
            role_enum = UserRole(assigned_role_str)
        except ValueError:
            # A fallback in case an invalid string is somehow passed
            role_enum = UserRole.dropper

        # Now, we use the 'assigned_role' to create the user correctly.
        new_user = UserModel(
            email=user_email,
            full_name=user_info.get('name'),
            hashed_password=hashing.Hash.bcrypt(str(uuid.uuid4())),
            role=role_enum

        )
        
        # 3. Add the new user to the database.
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        user = new_user # Set the 'user' variable to our newly created user
    # --- END OF NEW LOGIC ---

    # The rest of the function proceeds as normal, creating a JWT for the (new or existing) user
    app_jwt = token.create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role.value}
    )

    # Return the token and user data to the frontend
    return HTMLResponse(f"""
        <script>
            window.opener.postMessage({{ "token": "{app_jwt}", "user": {user.to_json()} }}, "*");
            window.close();
        </script>
    """)

# Helper to add a to_json method to your user model for the script
def user_to_json(self):
    import json
    return json.dumps({
        "id": self.id,
        "email": self.email,
        "full_name": self.full_name,
        "role": self.role.value
    })
UserModel.to_json = user_to_json


# -------------------------------------------------------
# 1. FORGOT PASSWORD (Generate OTP & Send Email)
# -------------------------------------------------------
@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # A. Check if user exists
    user = db.query(UserModel).filter(UserModel.email == request.email).first()
    
    if not user:
        # Security: Fake success message to prevent email enumeration
        return {"message": "If your email is registered, you will receive an OTP."}

    # B. Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # C. Save OTP to Database (Valid for 10 minutes)
    user.reset_token = otp
    user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # D. Send Email
    email_status = send_otp_email(user.email, otp)
    
    if not email_status:
        raise HTTPException(status_code=500, detail="Failed to send email. Check server logs.")

    return {"message": "OTP sent successfully to your email."}


# -------------------------------------------------------
# 2. VERIFY OTP
# -------------------------------------------------------
@router.post("/verify-otp")
def verify_otp(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # A. Check if OTP matches
    if str(user.reset_token) != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # B. Check if OTP is expired
    if not datetime(user.reset_token_expiry) or datetime(user.reset_token_expiry) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    return {"message": "OTP Verified. Proceed to reset password."}


# -------------------------------------------------------
# 3. RESET PASSWORD
# -------------------------------------------------------
@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # A. Re-Verify OTP (Security Check)
    # We verify again to ensure no one bypasses step 2 directly to step 3
    if user.reset_token != request.otp:
        raise HTTPException(status_code=400, detail="Invalid request. OTP mismatch.")
        
    if user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # B. Hash New Password & Update
    user.hashed_password = hashing.Hash.bcrypt(request.new_password)
    
    # C. Clear OTP (One-time use only)
    user.reset_token = None
    user.reset_token_expiry = None
    
    db.commit()
    
    return {"message": "Password reset successfully. Please login with new password."}