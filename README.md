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
| **Auth** | JWT (Simple JWT) |

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
python manage.py migrate
python manage.py runserver     # → http://127.0.0.1:8000
```

> ⚠️ **AI Weights:** Place PEFT adapter in `Backend/ai_weights/`. Base model (Llama 3.2 1B) downloads from Hugging Face on first run.

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

## 📁 Project Structure

```
ChainProof/
├── Backend/                   # Django REST API
│   ├── api/                   # Models, views, serializers
│   │   ├── ai_service.py      # Llama 3.2 integration
│   │   └── blockchain_service.py
│   ├── smartreview_backend/   # Django config
│   └── requirements.txt
├── Frontend/review-system/    # React app
├── Smart Contracts/           # Solidity (ReviewLedger, SmartReviewToken)
└── Documentation/
```

---

## 📋 Core Features

| Feature | Description |
|---------|-------------|
| **Sentiment Sanitization** | AI rewrites profanity → constructive feedback |
| **Smart Contract Rewards** | RTC earned per verified review |
| **Role Dashboards** | Customer • Owner • Admin interfaces |
| **Support Inbox** | In-app messaging with attachments |
| **Contact Us** | Public form for visitors |
| **Exchange Rate** | 1 RTC = 120 PKR (configurable) |

---

## 🚢 Deployment Checklist

- [ ] `DEBUG = False` in Django settings
- [ ] Configure `ALLOWED_HOSTS` & `CORS_ALLOWED_ORIGINS`
- [ ] Use env vars for `SECRET_KEY` & DB credentials
- [ ] `python manage.py collectstatic`
- [ ] `npm run build` (React)
- [ ] Serve via Nginx or similar

---

## 👨‍💻 Contributors

| Name | Role |
|------|------|
| **Muhammad Anas** | Developer |
| **Malaika Mushtaq** | Developer |
| **Dr. Yaser Ali Shah** | Supervisor — COMSATS University Islamabad, Attock Campus |

---

<div align="center">

**ChainProof** — *Final Year Project @ COMSATS University Islamabad, Attock Campus*

</div>
