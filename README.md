# Automated E-Commerce Deployment Platform 🌸

An enterprise full-stack floral e-commerce and delivery logistics platform built with a **.NET Microservices Architecture** and a **React 19 / TypeScript** luxury frontend designed after the **Flowery Figma Mobile App**.

---

## 🏗️ Repository Architecture

This repository is organized as a unified monorepo containing both the backend microservices and frontend client:

```
├── backend/                        # .NET Microservices & Distributed Infrastructure
│   ├── src/
│   │   ├── ApiGateway/             # Central reverse proxy & rate limiter (YARP / Kestrel)
│   │   ├── Services/
│   │   │   ├── IdentityService/    # Authentication, JWT, roles, OTP, user profiles
│   │   │   ├── CatalogService/     # Products, categories, floral inventory
│   │   │   ├── AddressCartService/ # Shopping carts, saved addresses, coverage areas
│   │   │   ├── OrdersService/      # Order fulfillment, tracking & status pipeline
│   │   │   └── PaymentService/     # Stripe checkout sessions & payment webhooks
│   │   └── Shared/                 # Common contracts, events, redis caching & security
│   ├── tests/                      # Unit & integration test suites
│   ├── docker-compose.yml          # Backend infrastructure orchestration
│   └── .env.example                # Environment variables template
│
├── frontend/                       # React 19 Luxury Floral Client
│   ├── src/
│   │   ├── pages/                  # Storefront, Catalog, Cart, Tracking, Driver & Admin
│   │   ├── components/             # Reusable UI components & navigation
│   │   ├── context/                # Auth, Cart, and Toast providers
│   │   └── services/               # REST API client with Gateway integration
│   ├── Dockerfile                  # Multi-stage production container build
│   ├── nginx.conf                  # Production SPA reverse proxy
│   └── package.json                # Dependencies & scripts
│
├── docker-compose.yml              # Unified full-stack docker compose orchestration
├── package.json                    # Root workspace runner scripts
└── README.md
```

---

## 🌟 Key Features

### 🛍️ Flowery Customer Boutique
- **Luxury Floral Branding**: Faithfully styled from the Flowery Figma design (`#D21E6A`, `#F9ECF0`, `IM Fell English`, `Inter`).
- **Catalog & Discovery**: Vector-based category carousels, instant search, price filters, and bestsellers.
- **Cart & Checkout**: Multi-step checkout with address selection and payment integration.
- **Real-Time Order Tracking**: Visual progression tracker (`Pending` ➔ `Confirmed` ➔ `Assigned` ➔ `Out for Delivery` ➔ `Delivered`).

### 🛵 Flowery Rider (Delivery Portal)
- Onboarding, vehicle info, and driver status toggles.
- Nearby unassigned orders queue with claim & step-by-step delivery confirmations.

### 📊 Admin Studio
- Operational dashboard for monitoring live orders and managing catalog offerings.

### ⚙️ Backend Services & Infrastructure
- **Microservices**: Independent .NET services for Identity, Catalog, Cart, Orders, and Payments.
- **Event-Driven Messaging**: Asynchronous integration events across services via RabbitMQ & MassTransit.
- **High Performance Caching**: Redis caching for catalog data and shopping carts.
- **Relational Storage**: SQL Server databases per service following Database-per-Service pattern.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Docker & Docker Desktop](https://www.docker.com/)
- [Node.js](https://nodejs.org/) (v18+)
- [.NET 8/9 SDK](https://dotnet.microsoft.com/) (for standalone backend dev)

---

### Option A: Run Full-Stack via Docker (Recommended)

1. **Configure Environment**:
   ```bash
   cp backend/.env.example backend/.env
   # Adjust any secrets/keys inside backend/.env if needed
   ```

2. **Start All Services**:
   ```bash
   docker compose up -d --build
   ```

- Frontend App: `http://localhost:5173`
- API Gateway: `http://localhost:5000`
- SQL Server: `localhost:1433`
- Redis: `localhost:6379`
- RabbitMQ: `localhost:5672` (Management: `localhost:15672`)

---

### Option B: Local Development

1. **Start Backend Infrastructure**:
   ```bash
   cd backend
   docker compose up -d
   ```

2. **Run Frontend**:
   From the repository root:
   ```bash
   npm install --prefix frontend
   npm run dev
   ```
   Or directly inside `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend runs on `http://localhost:5173` with automatic API proxying to `http://localhost:5000`.

3. **Build Frontend**:
   ```bash
   npm run build
   ```

---

## 🤝 Authors & Credits
- **Ahmed Osama** ([@AhmedUsama29](https://github.com/AhmedUsama29))
- **Mohamed El-hussainey** ([@MohamedEl-hussainey29](https://github.com/MohamedEl-hussainey29))
