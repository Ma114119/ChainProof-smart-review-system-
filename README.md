<div align="center">

# 🔗 ChainProof

### *Trust, Verified by Technology*

<p align="center">
  <img src="Frontend/review-system/public/chainproof-logo.png" alt="ChainProof Logo" width="120" />
</p>

**A Decentralized AI-Powered Review Ecosystem**

[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Llama](https://img.shields.io/badge/Llama-3.2-FF6B35?style=for-the-badge)](https://ai.meta.com/llama/)
[![Ganache](https://img.shields.io/badge/Ganache-Ethereum-627EEA?style=for-the-badge)](https://trufflesuite.com/ganache/)

*Llama 3.2 sentiment sanitization • Real-time PostgreSQL analytics • Immutable blockchain reward verification*

---

</div>

## ✨ Overview

**ChainProof** revolutionizes online reviews by combining **AI-powered sentiment sanitization** with **blockchain immutability**. Every review is filtered for ethics, verified on-chain, and rewarded with tokens — creating a transparent, trustworthy ecosystem.

<table>
<tr>
<td width="50%">

### 🧠 AI Sentiment Sanitization
Llama 3.2 detects and rewrites profane or unethical content while preserving the reviewer's intent. Fallback rule-based filtering ensures reliability.

</td>
<td width="50%">

### ⛓️ Blockchain Verification
Reviews are hashed and stored on Ganache. Tamper-proof, transparent, and verifiable by anyone.

</td>
</tr>
<tr>
<td width="50%">

### 🪙 Smart Contract Rewards
RTC (Review Token Coins) distributed via Solidity. Customers earn, sell, or redeem — owners purchase for business incentives.

</td>
<td width="50%">

### 👥 Role-Based Dashboards
Dedicated interfaces for **Customers**, **Business Owners**, and **Admins** — each with tailored workflows.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology |
|:-----:|------------|
| **Backend** | Django 5.2 • Django REST Framework |
| **Database** | PostgreSQL |
| **AI / NLP** | Llama 3.2 (1B-Instruct) • Hugging Face Transformers • PEFT |
| **Frontend** | React 19 • React Router |
| **Blockchain** | Ganache • Solidity • Web3 |
| **Auth** | JWT (Simple JWT) • Email OTP Verification |
| **Email** | Gmail SMTP (python-dotenv) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ • Node.js 18+ • PostgreSQL • Ganache • Hugging Face account

### 1️⃣ Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt

# Create .env from example (REQUIRED for OTP emails)
copy .env.example .env         # Windows
# cp .env.example .env         # Linux/Mac
# Edit .env with your Gmail App Password (see Environment Setup below)

python manage.py migrate
python manage.py runserver     # → http://127.0.0.1:8000
```

> ⚠️ **AI Weights:** Place PEFT adapter in `Backend/ai_weights/`. Base model (Llama 3.2 1B) downloads from Hugging Face on first run.

> 🔒 **`.env` is gitignored** — Your secrets stay local. Never commit `.env` to GitHub.

### 2️⃣ Ganache

1. Download [Ganache](https://trufflesuite.com/ganache/)
2. Start workspace → Note RPC URL (`http://127.0.0.1:7545`)
3. Deploy contracts from `Smart Contracts/`
4. Update `blockchain_service.py` with contract address & RPC URL

### 3️⃣ Frontend

```bash
cd Frontend/review-system
npm install
npm start                      # → http://localhost:3000
```

---

## ⚙️ Environment Setup (Backend)

Create `Backend/.env` from the example:

```bash
cd Backend
copy .env.example .env         # Windows
```

Edit `.env` with your values:

| Variable | Description |
|----------|-------------|
| `EMAIL_HOST_USER` | Gmail address (e.g. `yourapp@gmail.com`) |
| `EMAIL_HOST_PASSWORD` | [Gmail App Password](https://myaccount.google.com/apppasswords) (requires 2FA) |
| `OTP_EXPIRY_MINUTES` | OTP validity (default: 2) |
| `USE_CONSOLE_EMAIL` | Set to `1` if you get "getaddrinfo failed" — OTP prints in terminal |

> 📧 **Gmail App Password:** Enable 2-Step Verification → App passwords → Generate for "Mail"

---

## 📁 Project Structure

```
ChainProof/
├── Backend/                   # Django REST API
│   ├── api/                   # Models, views, serializers
│   │   ├── ai_service.py      # Llama 3.2 integration
│   │   ├── blockchain_service.py
│   │   └── models.py          # CustomUser, PendingUser, Business, Review...
│   ├── smartreview_backend/   # Django config
│   ├── .env.example           # Template (copy to .env)
│   ├── requirements.txt
│   └── EMAIL_OTP_TROUBLESHOOTING.md
├── Frontend/review-system/    # React app
├── Smart Contracts/           # Solidity (ReviewLedger, SmartReviewToken)
└── Documentation/
    └── Technical_Reference/   # Gold-standard docs (Backend, AI, Blockchain, Frontend, System Flow)
```

---

## 📋 Core Features

| Feature | Description |
|---------|-------------|
| **Email OTP Verification** | 6-digit OTP sent via Gmail; 2-min expiry; Resend OTP button |
| **Sentiment Sanitization** | AI rewrites profanity → constructive feedback |
| **Smart Contract Rewards** | RTC earned per verified review |
| **Role Dashboards** | Customer • Owner • Admin interfaces |
| **Support Inbox** | In-app messaging with attachments |
| **Contact Us** | Public form for visitors |
| **Exchange Rate** | 1 RTC = 120 PKR (configurable) |

### Registration Flow (Safe-Connect)
1. User fills form (name, email, CNIC, password, role)
2. Backend creates `PendingUser`, sends OTP to email
3. User enters 6-digit code (2-min countdown timer)
4. Resend OTP available if code expires
5. On verify → `CustomUser` created; business created if owner

---

## 📚 Technical Reference

**Gold-standard documentation** for evaluators and technical partners:

| Document | Location | Contents |
|----------|----------|----------|
| Backend Architecture | `Documentation/Technical_Reference/Backend_Architecture.md` | Models, API, serializers, examiner Q&A, DB schema |
| AI System | `Documentation/Technical_Reference/AI_System.md` | Llama 3.2, LoRA, sentiment sanitization |
| Blockchain Logic | `Documentation/Technical_Reference/Blockchain_Logic.md` | Ganache, ReviewLedger, SRT, Web3 |
| Frontend Guide | `Documentation/Technical_Reference/Frontend_Guide.md` | JWT, roles, protected routes |
| System Flow | `Documentation/Technical_Reference/System_Flow.md` | Master flow: OTP → AI review → blockchain reward |

---

## 🚢 Deployment Checklist

- [ ] `DEBUG = False` in Django settings
- [ ] Configure `ALLOWED_HOSTS` & `CORS_ALLOWED_ORIGINS`
- [ ] Use env vars for `SECRET_KEY` & DB credentials
- [ ] Create `Backend/.env` from `.env.example` (never commit `.env`)
- [ ] `python manage.py collectstatic`
- [ ] `npm run build` (React)
- [ ] Serve via Nginx or similar

---

## 🔒 Security Notes

- **`.env`** — Contains secrets (Gmail App Password). **Never commit to Git.** Already in `.gitignore`.
- **`.env.example`** — Safe template with placeholders. Safe to commit.

---

## 👨‍💻 Contributors

| Name | Role |
|------|------|
| **Muhammad Anas** | Developer |
| **Malaika Mushtaq** | Co-Partner |
| **Dr. Yaser Ali Shah** | Supervisor — COMSATS University Islamabad, Attock Campus |

---

<div align="center">

**ChainProof** — *Final Year Project @ COMSATS University Islamabad, Attock Campus*

</div>
