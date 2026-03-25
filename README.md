# 🏨 Hostel Pro — Multi-Tenant Hostel Management SaaS

A production-ready SaaS platform built to help hostel owners manage operations intelligently — including student lifecycle, room occupancy tracking, and rent analytics.

🔗 **Live App:** https://hostel-saas.vercel.app
💻 **GitHub Repo:** https://github.com/yourusername/hostel-saas

---

## 🚀 Product Vision

Traditional hostel management is manual, error-prone, and lacks visibility into occupancy and revenue.

**Hostel Pro** aims to digitize hostel operations through a clean, analytics-driven dashboard experience.

This project is designed with **real SaaS architecture thinking**, not just CRUD functionality.

---

## ✨ Core Features

### 👨‍🎓 Student Lifecycle Management

* Enroll new students
* Assign rooms intelligently
* Archive inactive residents
* Search & manage student records

### 🛏️ Smart Room Occupancy System

* Bed-level capacity tracking
* Prevent over-allocation
* Real-time occupancy percentage
* Visual availability indicators

### 💰 Rent Management Engine

* Monthly rent tracking per student
* Mark payments as collected
* Revenue insights dashboard
* Pending vs collected analytics

### 📊 Operational Dashboard

* Active students overview
* Vacant beds intelligence
* Hostel health indicators
* Activity signal feed (event logging)

### 🔐 Secure Authentication

* Supabase email authentication
* Protected dashboard routes
* Session-based access control

### 🌙 Modern SaaS UI

* Enterprise dark mode design
* Responsive dashboard layout
* Clean data-dense interface
* Mobile-friendly navigation

---

## 🧠 System Architecture

Frontend

* Next.js 16 (App Router)
* TypeScript
* TailwindCSS + shadcn UI

Backend / Data Layer

* Supabase (PostgreSQL + Auth + RLS)

Deployment

* Vercel Production Hosting

---

## 🗄️ Database Design (Core Tables)

* `students` → resident lifecycle records
* `rooms` → capacity & occupancy tracking
* `rent_records` → monthly payment data
* `activity_logs` → operational event feed

This schema is designed to support **future multi-tenant scaling.**

---

## 📈 Future Roadmap

* Automated monthly rent generation engine
* Advanced revenue analytics charts
* Multi-hostel tenant onboarding
* Role-based access (manager / owner)
* Payment gateway integration
* AI occupancy forecasting

---

## 🧪 Running Locally

```bash
git clone https://github.com/yourusername/hostel-saas.git
cd hostel-saas
npm install
npm run dev
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## 🎯 Why This Project Matters

This is not just a UI demo.
It demonstrates:

* SaaS product architecture thinking
* Real database schema design
* Authentication & deployment workflow
* Operational analytics UX
* System scalability mindset

---

## 👤 Author

**Srikar Akula**
Aspiring Product Engineer & SaaS Builder

If you find this interesting, feel free to connect or share feedback.
