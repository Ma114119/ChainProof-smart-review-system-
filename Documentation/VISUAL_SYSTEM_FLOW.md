# ChainProof - Visual System Flow Diagrams
## Visual Explanations for Evaluation

---

## 📊 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Customer   │  │    Owner     │  │    Admin     │     │
│  │   Dashboard  │  │  Dashboard   │  │  Dashboard   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│              React Frontend (Port 3000)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP Requests (JSON)
                        │ JWT Authentication
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   API SERVER LAYER                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Django REST Framework (Port 8000)            │   │
│  │                                                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Views   │→ │Serializers│→ │  Models  │          │   │
│  │  │(Endpoints)│  │(Convert) │  │(Database)│          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │         Authentication (JWT Tokens)          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└───────┬───────────────────┬───────────────────┬───────────┘
        │                   │                   │
        │                   │                   │
┌───────▼───────┐  ┌────────▼────────┐  ┌─────▼──────────┐
│   PostgreSQL  │  │   Blockchain    │  │   AI Service   │
│   Database    │  │  (Smart         │  │  (Hugging Face/ │
│               │  │   Contracts)   │  │   OpenAI)      │
│ - Users       │  │                 │  │                │
│ - Businesses  │  │ - ReviewLedger │  │ - Analysis     │
│ - Reviews     │  │ - Token         │  │ - Moderation   │
└───────────────┘  └─────────────────┘  └────────────────┘
```

---

## 🔄 COMPLETE REQUEST FLOW

### **Scenario: Customer Writes a Review**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: USER ACTION (Frontend)                               │
│                                                               │
│  User fills form:                                            │
│  - Rating: ⭐⭐⭐⭐⭐ (5 stars)                                │
│  - Content: "Great food, excellent service!"                  │
│  - Clicks "Submit Review"                                    │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ JavaScript: fetch() or axios
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 2: HTTP REQUEST                                          │
│                                                               │
│  POST http://localhost:8000/api/businesses/1/reviews/        │
│                                                               │
│  Headers:                                                     │
│  {                                                            │
│    "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGc...",    │
│    "Content-Type": "application/json"                        │
│  }                                                            │
│                                                               │
│  Body:                                                        │
│  {                                                            │
│    "rating": 5,                                               │
│    "content": "Great food, excellent service!"                │
│  }                                                            │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Django receives request
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 3: URL ROUTING                                           │
│                                                               │
│  urls.py matches:                                             │
│  /api/businesses/<int:business_id>/reviews/                 │
│                                                               │
│  → Routes to: ReviewView                                     │
│  → Extracts: business_id = 1                                  │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ View processes request
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 4: AUTHENTICATION CHECK                                  │
│                                                               │
│  Django checks JWT token:                                     │
│  ✓ Token valid?                                              │
│  ✓ User exists?                                               │
│  ✓ User has permission?                                       │
│                                                               │
│  → Sets request.user = logged_in_user                        │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Token validated
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 5: SERIALIZATION                                         │
│                                                               │
│  ReviewSerializer validates:                                  │
│  ✓ Rating is 1-5?                                             │
│  ✓ Content length > 20 chars?                                │
│  ✓ Business exists?                                           │
│                                                               │
│  → Converts JSON to Review object                            │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Data validated
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 6: DATABASE SAVE                                         │
│                                                               │
│  perform_create() executes:                                   │
│  - Links review to current user                              │
│  - Links review to business (ID=1)                           │
│  - Saves to PostgreSQL                                       │
│                                                               │
│  SQL: INSERT INTO api_review (...)                           │
│  → Review saved with ID = 10                                  │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Review saved
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 7: BLOCKCHAIN INTEGRATION                                │
│                                                               │
│  Backend generates hash:                                      │
│  SHA-256("Great food, excellent service!")                    │
│  → Hash: "0xabc123def456..."                                 │
│                                                               │
│  Backend calls smart contract:                                │
│  ReviewLedger.addReviewHash(                                  │
│    reviewId = 10,                                             │
│    hash = "0xabc123..."                                       │
│  )                                                            │
│                                                               │
│  → Transaction sent to blockchain                             │
│  → Hash stored immutably                                      │
│  → Backend saves hash to Review.blockchain_hash             │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Hash stored on blockchain
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 8: AI ANALYSIS                                           │
│                                                               │
│  Backend calls AI service:                                    │
│  POST /api/reviews/analyze                                    │
│  Body: "Great food, excellent service!"                      │
│                                                               │
│  AI returns:                                                  │
│  {                                                            │
│    "spam_score": 5,                                           │
│    "toxicity": 2,                                             │
│    "risk_score": 10,                                          │
│    "status": "approved"                                        │
│  }                                                            │
│                                                               │
│  → Review status set to "Approved"                           │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Review approved
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 9: TOKEN REWARD                                          │
│                                                               │
│  Backend calls smart contract:                                │
│  SmartReviewToken.transfer(                                    │
│    to = user_wallet_address,                                  │
│    amount = 1 * 10**18  // 1 token                           │
│  )                                                            │
│                                                               │
│  → 1 token transferred to user's wallet                        │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ User rewarded
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 10: RESPONSE TO FRONTEND                                 │
│                                                               │
│  Django returns JSON:                                         │
│  {                                                            │
│    "id": 10,                                                  │
│    "user": "john_doe",                                        │
│    "business": 1,                                             │
│    "business_name": "Gourmet Delight",                       │
│    "rating": 5,                                               │
│    "content": "Great food, excellent service!",               │
│    "status": "Approved",                                      │
│    "blockchain_hash": "0xabc123...",                          │
│    "created_at": "2025-01-15T10:30:00Z"                      │
│  }                                                            │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ JSON response
                        │
┌───────────────────────▼───────────────────────────────────────┐
│ STEP 11: FRONTEND UPDATE                                      │
│                                                               │
│  React component receives response:                           │
│  - Shows success message                                      │
│  - Displays new review in list                               │
│  - Updates user's token balance                              │
│  - Shows blockchain hash link                                │
│                                                               │
│  → User sees their review published                          │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                          │
└─────────────────────────────────────────────────────────────┘

User fills registration form
        │
        ▼
POST /api/register/
        │
        ▼
UserSerializer validates data
        │
        ▼
CustomUser.objects.create_user()
        │
        ▼
Password hashed (Django's PBKDF2)
        │
        ▼
User saved to database
        │
        ▼
Response: {id, username, email} (NO PASSWORD)
        │
        ▼
Frontend shows success message


┌─────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────┘

User enters username/password
        │
        ▼
POST /api/login/
        │
        ▼
Django validates credentials
        │
        ├─ Invalid → Error 401
        │
        └─ Valid → Generate JWT tokens
                │
                ▼
        Response: {
            "access": "eyJ0eXAi...",  // 15 min expiry
            "refresh": "eyJ0eXAi..."  // 7 days expiry
        }
                │
                ▼
        Frontend stores tokens (localStorage)
                │
                ▼
        User logged in


┌─────────────────────────────────────────────────────────────┐
│                 AUTHENTICATED REQUEST FLOW                    │
└─────────────────────────────────────────────────────────────┘

User makes request (e.g., GET /api/businesses/)
        │
        ▼
Frontend adds header:
Authorization: Bearer <access_token>
        │
        ▼
Django receives request
        │
        ▼
JWT Authentication Middleware:
        │
        ├─ Token invalid/expired → Error 401
        │
        └─ Token valid → Extract user info
                │
                ▼
        Set request.user = User object
                │
                ▼
        View processes request
                │
                ▼
        Returns response with user's data
```

---

## 💾 DATABASE RELATIONSHIPS

```
┌─────────────────┐
│   CustomUser    │
│─────────────────│
│ id              │◄────┐
│ username        │     │
│ email           │     │
│ password        │     │
│ role            │     │
│ cnic            │     │
│ wallet_address  │     │
└─────────────────┘     │
                        │
        ┌───────────────┘
        │
        │ Foreign Key: owner_id
        │
┌───────▼──────────┐
│    Business      │
│──────────────────│
│ id               │◄────┐
│ owner_id (FK)    │     │
│ name             │     │
│ description      │     │
│ category         │     │
│ address          │     │
│ phone_number     │     │
│ website_url      │     │
│ status           │     │
│ created_at       │     │
└──────────────────┘     │
                        │
        ┌────────────────┼──────────────┐
        │                │              │
        │ Foreign Key:   │ Foreign Key: │
        │ business_id   │ user_id      │
        │                │              │
┌───────▼───────────────▼──────────────▼──────┐
│              Review                         │
│──────────────────────────────────────────────│
│ id                                           │
│ user_id (FK) ────────────┐                  │
│ business_id (FK) ────────┼──────────────────┘
│ rating                   │
│ content                  │
│ status                   │
│ blockchain_hash          │
│ created_at               │
└──────────────────────────┘

RELATIONSHIPS:
- One User → Many Businesses (1:N)
- One User → Many Reviews (1:N)
- One Business → Many Reviews (1:N)
- One Review → One User (N:1)
- One Review → One Business (N:1)
```

---

## ⛓️ BLOCKCHAIN INTEGRATION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│              REVIEW HASH STORAGE PROCESS                      │
└─────────────────────────────────────────────────────────────┘

Review created in database
        │
        ▼
Backend generates SHA-256 hash:
hashlib.sha256(review_content.encode()).hexdigest()
        │
        ▼
Hash: "0xabc123def456..."
        │
        ▼
Backend connects to blockchain (Web3.py)
        │
        ▼
Backend calls smart contract:
ReviewLedger.addReviewHash(
    reviewId = 10,
    reviewHash = "0xabc123..."
)
        │
        ▼
Transaction sent to blockchain network
        │
        ▼
Transaction confirmed (mined)
        │
        ▼
Hash stored in contract's mapping:
reviewHashes[10] = "0xabc123..."
        │
        ▼
Backend saves hash to database:
Review.blockchain_hash = "0xabc123..."
        │
        ▼
Review is now immutable!
Anyone can verify by calling:
getReviewHash(10) → Returns "0xabc123..."
```

---

## 🎨 FRONTEND COMPONENT HIERARCHY

```
App.js
  │
  └─ AppRoutes.jsx (Router)
       │
       ├─ Navbar.jsx (Always visible)
       │
       ├─ Routes
       │   │
       │   ├─ Public Routes
       │   │   ├─ Home.jsx
       │   │   ├─ ExploreBusinesses.jsx
       │   │   ├─ BusinessProfile.jsx
       │   │   ├─ Login.jsx
       │   │   └─ Register.jsx
       │   │
       │   ├─ Customer Routes
       │   │   ├─ CustomerDashboard.jsx
       │   │   ├─ Profile.jsx
       │   │   ├─ writeReview.jsx
       │   │   └─ RewardWallet.jsx
       │   │
       │   ├─ Owner Routes
       │   │   ├─ BusinessDashboard.jsx
       │   │   ├─ BusinessProfile.jsx
       │   │   ├─ BusinessWallet.jsx
       │   │   ├─ ReviewsFeedback.jsx
       │   │   └─ ManageBusiness.jsx
       │   │
       │   └─ Admin Routes
       │       ├─ AdminDashboard.jsx
       │       ├─ UserManagement.jsx
       │       ├─ BusinessManagement.jsx
       │       ├─ ReviewModeration.jsx
       │       ├─ FinancialTransactions.jsx
       │       ├─ Inbox.jsx
       │       ├─ SiteSettings.jsx
       │       └─ AnalyticsReports.jsx
       │
       └─ Footer.jsx (Always visible)
```

---

## 🔄 STATE MANAGEMENT FLOW

```
Component (e.g., ExploreBusinesses.jsx)
        │
        │ useState([])
        ▼
Initial State: businesses = []
        │
        │ useEffect(() => { fetchBusinesses() }, [])
        ▼
Component Mounts
        │
        │ API Call: GET /api/businesses/
        ▼
Backend Returns: [{id:1, name:"..."}, {id:2, name:"..."}]
        │
        │ setBusinesses(data)
        ▼
State Updated: businesses = [{...}, {...}]
        │
        │ React Re-renders
        ▼
UI Updates: Shows business cards
```

---

## 📱 USER ROLE PERMISSIONS

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION MATRIX                          │
└─────────────────────────────────────────────────────────────┘

                    Customer    Owner      Admin
─────────────────────────────────────────────────────
View Businesses      ✓          ✓          ✓
Create Business      ✗          ✓          ✓
Edit Business        ✗          ✓ (own)    ✓ (all)
Delete Business      ✗          ✓ (own)    ✓ (all)
─────────────────────────────────────────────────────
Write Review         ✓          ✗          ✗
View Reviews         ✓          ✓          ✓
Edit Review          ✗          ✗          ✓
Delete Review        ✗          ✗          ✓
Moderate Review      ✗          ✗          ✓
─────────────────────────────────────────────────────
View Own Wallet      ✓          ✓          ✗
View All Wallets     ✗          ✗          ✓
Process Payouts      ✗          ✗          ✓
─────────────────────────────────────────────────────
Manage Users         ✗          ✗          ✓
Manage Settings      ✗          ✗          ✓
View Analytics       ✗          ✓ (own)    ✓ (all)
```

---

## 🎯 KEY TAKEAWAYS FOR EVALUATION

1. **Backend:** Django REST Framework → API Server → Database
2. **Serializers:** Translate Python ↔ JSON
3. **Authentication:** JWT tokens (stateless, secure)
4. **Blockchain:** Immutable hash storage
5. **Frontend:** React organized by user roles
6. **Flow:** User → Frontend → Backend → Database → Blockchain → AI
7. **Status:** 65-70% complete, integration in progress

---

**Use these diagrams to explain your system visually during evaluation! 📊**

