import os
import httpx
import json
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

class EWasteDetector:
    def __init__(self):
        # Using the specific Router URL you provided
        self.api_url = "https://router.huggingface.co/hf-inference/models/facebook/detr-resnet-50"
        
        # Make sure your .env has HF_API_TOKEN (or change this to HF_TOKEN if you prefer)
        self.api_token = os.getenv("HF_API_TOKEN")

        if not self.api_token:
            print("❌ CRITICAL ERROR: HF_API_TOKEN is missing in .env")

    async def predict(self, image_bytes):
        """
        Receives raw image bytes and sends them to Hugging Face API.
        """
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "image/jpeg", # Explicitly set as per your snippet
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    content=image_bytes, # Send the bytes directly
                    timeout=20.0 # Give the API enough time to think
                )

                if response.status_code != 200:
                    return {"error": f"API Error {response.status_code}: {response.text}"}

                results = response.json()
                
                # Format the results to be cleaner for your frontend
                formatted_data = []
                for item in results:
                    # Filter low confidence items
                    if item.get('score', 0) < 0.25:
                        continue
                        
                    formatted_data.append({
                        "class": item.get('label'),
                        "confidence": round(item.get('score', 0), 2),
                        "box": item.get('box')
                    })

                return formatted_data

            except Exception as e:
                return {"error": f"Prediction Failed: {str(e)}"}

# Create the instance to be imported by scan_routes.py
detector = EWasteDetector()