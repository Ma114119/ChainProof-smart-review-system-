# ChainProof - Quick Evaluation Cheat Sheet
## One-Page Reference for Mid-Term Evaluation

---

## 🎯 PROJECT OVERVIEW

**Name:** ChainProof - AI + Blockchain Review System  
**Tech Stack:** Django REST (Backend) + React (Frontend) + Solidity (Blockchain)  
**Status:** 65-70% Complete  
**Purpose:** Transparent, tamper-proof review platform with AI moderation and token rewards

---

## 🔧 BACKEND CONCEPTS (Django REST Framework)

### **What is a Serializer?**
- **Translator** between Database Models ↔ JSON
- **Serialization:** Model → JSON (sending to frontend)
- **Deserialization:** JSON → Model (saving to database)
- **Why:** Frontend speaks JSON, Database speaks Python objects

### **Our Serializers:**
- `UserSerializer` - Handles user registration/login
- `BusinessSerializer` - Converts business data
- `ReviewSerializer` - Converts review data

### **What is a View?**
- Handles HTTP requests (GET, POST, PUT, DELETE)
- Processes data and returns JSON responses
- Example: `RegisterView` handles `POST /api/register/`

### **What is a Model?**
- Python class = Database table
- `CustomUser` → `api_customuser` table
- `Business` → `api_business` table
- `Review` → `api_review` table

### **Authentication Flow:**
1. User registers → Account created
2. User logs in → Gets JWT tokens (access + refresh)
3. Frontend sends token in header: `Authorization: Bearer <token>`
4. Backend validates token → Processes request

---

## ⛓️ SMART CONTRACTS

### **ReviewLedger.sol:**
- **Purpose:** Store review hashes on blockchain (immutable)
- **Function:** `addReviewHash(reviewId, hash)` - Stores hash
- **Function:** `getReviewHash(reviewId)` - Retrieves hash
- **Why:** Proves reviews haven't been tampered with

### **SmartReviewToken.sol:**
- **Purpose:** ERC-20 token for rewards
- **Function:** `mint(to, amount)` - Creates tokens (admin only)
- **Function:** `transfer(to, amount)` - Sends tokens
- **Why:** Incentivizes quality reviews

### **How Blockchain Works:**
1. Review created → Backend generates SHA-256 hash
2. Backend calls smart contract → Hash stored on blockchain
3. Hash is immutable → Cannot be changed
4. Anyone can verify → Compare current hash with blockchain hash

---

## 🎨 FRONTEND STRUCTURE

### **Organization:**
```
pages/
├── public/      → Home, Explore, Login, Register
├── customer/    → Dashboard, Write Review, Wallet
├── owner/       → Business Dashboard, Manage Business
├── admin/       → Moderation, User Management, Analytics
└── footer/      → About, Contact, Privacy
```

### **Key Technologies:**
- **React** - Component-based UI library
- **React Router** - Client-side routing
- **Material-UI** - UI components
- **React Hooks** - State management (useState, useEffect)

---

## 🔄 HOW EVERYTHING CONNECTS

```
User Action (Frontend)
    ↓
HTTP Request (JSON + JWT Token)
    ↓
Django Backend (Validates & Processes)
    ↓
PostgreSQL Database (Saves Data)
    ↓
Blockchain Service (Stores Hash)
    ↓
AI Service (Analyzes Content)
    ↓
Response Back to Frontend (JSON)
```

---

## 📊 DATABASE SCHEMA

### **Three Main Tables:**

1. **CustomUser**
   - id, username, email, password, role, cnic, wallet_address
   - Can have: Many businesses, Many reviews

2. **Business**
   - id, owner_id, name, description, category, address, phone, website, status
   - Belongs to: One owner
   - Can have: Many reviews

3. **Review**
   - id, user_id, business_id, rating, content, status, blockchain_hash, created_at
   - Belongs to: One user, One business

---

## 🚀 CURRENT STATUS

### ✅ **Completed:**
- React frontend (all pages)
- Database schema
- Smart contracts (tested)
- Basic APIs (auth, business, review)
- JWT authentication

### ⏳ **In Progress:**
- Frontend-Backend connection
- Blockchain integration
- AI integration

### ❌ **Remaining:**
- Admin APIs
- Wallet APIs
- End-to-end testing

---

## 💡 KEY POINTS TO EMPHASIZE

1. **Security:** JWT tokens, password hashing, CORS protection
2. **Immutability:** Blockchain ensures reviews can't be tampered
3. **AI Moderation:** Prevents spam and fake reviews
4. **Token Rewards:** Incentivizes quality contributions
5. **Scalability:** RESTful APIs, normalized database
6. **User Roles:** Customer, Owner, Admin (different permissions)

---

## 🎤 COMMON QUESTIONS - QUICK ANSWERS

**Q: What is a serializer?**  
A: Translator between Python objects and JSON. Converts database models to JSON for frontend.

**Q: How does authentication work?**  
A: JWT tokens. User logs in → Gets tokens → Sends token with each request → Backend validates.

**Q: Why blockchain?**  
A: Immutability. Review hashes stored on blockchain prove reviews haven't been tampered with.

**Q: How is frontend organized?**  
A: By user roles - public/, customer/, owner/, admin/ folders.

**Q: What's your current status?**  
A: 65-70% complete. Frontend done, basic backend APIs done, integration in progress.

**Q: What are your next steps?**  
A: Connect frontend to backend, integrate blockchain, integrate AI, complete admin APIs.

---

## 📁 FILE LOCATIONS (For Demo)

**Backend:**
- Models: `Backend/api/models.py`
- Serializers: `Backend/api/serializers.py`
- Views: `Backend/api/views.py`
- URLs: `Backend/api/urls.py`

**Smart Contracts:**
- ReviewLedger: `Smart Contracts/ReviewLedger.sol`
- Token: `Smart Contracts/SmartReviewToken.sol`

**Frontend:**
- Routes: `Frontend/review-system/src/routes/AppRoutes.jsx`
- Pages: `Frontend/review-system/src/pages/`
- Components: `Frontend/review-system/src/components/`

---

## 🎯 DEMO FLOW (If Asked)

1. **Show Database:** Open `models.py` → Explain tables
2. **Show API:** Open `views.py` → Explain endpoints
3. **Show Frontend:** Open `AppRoutes.jsx` → Show structure
4. **Show Contracts:** Open `.sol` files → Explain functions
5. **Explain Flow:** User action → Frontend → Backend → Database → Blockchain

---

## ⚠️ REMEMBER

- **Be confident** - You've built a lot!
- **Explain simply** - Use analogies (serializer = translator)
- **Show code** - Point to actual files
- **Admit limitations** - "Currently using mock data, will connect in Phase 5"
- **Emphasize architecture** - Well-structured, scalable design

---

**You've got this! 🚀**

