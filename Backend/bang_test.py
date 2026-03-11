import requests

# 1. Update this with a Business ID that exists in your Ganache/Database
BUSINESS_ID = 1 
URL = f"http://127.0.0.1:8000/api/businesses/{BUSINESS_ID}/reviews/"

# 2. Add your Login Token here (You can get this from a Login request)
# For now, we are testing the logic. If you have Auth enabled, you need a token.
# Replace the old placeholder with your actual copied token
HEADERS = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcxMDY4MjMyLCJpYXQiOjE3NzEwNjc5MzIsImp0aSI6ImUzZDllOTczOTc5NjQyNTdiMGVhZDU4N2VkYjNlYmJmIiwidXNlcl9pZCI6IjYifQ.DPbJahmOOZcAdTbaO_yNhw6LgVs3-XTPrdUitnqcH6c",
    "Content-Type": "application/json"
}

# 3. The "Dirty" Test Review
# --- UPDATE THIS SECTION IN bang_test.py ---

# The business ID must be sent in the payload to satisfy the Serializer
payload = {
    "business": BUSINESS_ID,  # <--- ADDED THIS LINE
    "content": "The manager is a total fucking idot and the food is shit and the service is terrible and bullshit.",
    "rating": 1
}

print("🚀 Launching the Big Bang Test (AI -> DB -> Blockchain)...")
try:
    response = requests.post(URL, json=payload, headers=HEADERS)
    print(f"Status: {response.status_code}")
    print("Response Data:", response.json())
except Exception as e:
    print(f"❌ Error: {e}")