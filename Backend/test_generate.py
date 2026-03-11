import requests

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcxMDY1MTkxLCJpYXQiOjE3NzEwNjQ4OTEsImp0aSI6IjRlNjdhM2E2OWIxYzRhYTA4MWQyOGFlMGUzMGZmMWJhIiwidXNlcl9pZCI6IjUifQ.CsLWB1j6WxNBP-P2_5BvGQ0Plc4yVHDg4D4Gb1WZQW0"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# STEP 1: GENERATE
print("🚀 Phase 1: Requesting AI Suggestion...")
gen_resp = requests.post("http://127.0.0.1:8000/api/ai/suggest/", 
                         json={"business_name": "Gourmet Delight", "category": "Restaurant", "sentiment": "negative"}, 
                         headers=HEADERS)
suggestion = gen_resp.json().get('suggestion')
print(f"AI Suggestion: {suggestion}")

# STEP 2: SUBMIT & STORE
print("\n🚀 Phase 2: Submitting to DB & Blockchain...")
sub_resp = requests.post("http://127.0.0.1:8000/api/businesses/1/reviews/", 
                         json={"business": 1, "content": suggestion, "rating": 5}, 
                         headers=HEADERS)

if sub_resp.status_code == 201:
    print("✅ SUCCESS! Stored in DB and Blockchain.")
    print(f"Transaction ID: {sub_resp.json().get('transaction_id')}")
else:
    print(f"❌ FAILED: {sub_resp.text}")