# backend/utilis/sms_utils.py
import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Load Config from .env
SID = os.getenv("TWILIO_ACCOUNT_SID")
TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
SENDER_NUM = os.getenv("TWILIO_PHONE_NUMBER")

def send_sms_alert(to_number: str, message_body: str):
    """
    Sends an SMS/WhatsApp via Twilio.
    """
    if not SID or not TOKEN:
        print("❌ Twilio Credentials missing in .env")
        return {"status": "failed", "error": "Server Config Error"}

    try:
        client = Client(SID, TOKEN)
        
        # If using WhatsApp Sandbox, prefix with 'whatsapp:'
        # from_ = f"whatsapp:{SENDER_NUM}"
        # to_ = f"whatsapp:{to_number}"
        
        # If using standard SMS (Verified numbers only on free tier)
        message = client.messages.create(
            body=message_body,
            from_=SENDER_NUM,
            to=to_number
        )
        return {"status": "success", "sid": message.sid}
    except Exception as e:
        print(f"❌ Twilio Error: {e}")
        return {"status": "failed", "error": str(e)}