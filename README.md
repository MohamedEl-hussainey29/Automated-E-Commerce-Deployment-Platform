# Flowery: Automated E-Commerce & Delivery Platform 🌸

A luxury floral e-commerce and delivery logistics web application built with **React 19**, **TypeScript**, and **Tailwind CSS**, designed in accordance with the **Flowery Figma Mobile App** specifications and integrated with backend microservices via Docker.

---

## 🌟 Highlights & Features

- **🌸 Flowery Boutique Experience**:
  - Figma-perfect luxury floral branding with custom typography (`IM Fell English` & `Inter`).
  - Signature Flowery color palette (`#D21E6A`, `#F9ECF0`, `#F9F9F9`, `#0C1015`, `#535353`).
  - Interactive hero banners, category carousels with ready vector icons, and curated bestseller showcases.
  - Multi-category filtering, real-time search, price ranges, and sorting.

- **🛍️ Complete Customer Journey**:
  - Detailed product view with high-res imagery, flower care guides, and stock availability.
  - Seamless cart drawer & checkout process with address selection and payment methods.
  - Live order tracking with visual progress steps (`Pending` ➔ `Confirmed` ➔ `Assigned` ➔ `Out for Delivery` ➔ `Delivered`).
  - User profiles with saved addresses, preferences, and order history.

- **🛵 Flowery Rider (Driver App)**:
  - Driver onboarding, vehicle registration, and status toggle (Active / Inactive).
  - Nearby orders feed with one-click claim & accept actions.
  - Step-by-step delivery updates (`Pick Up Package`, `Mark as Delivered`) directly syncing with customer tracking.

- **📊 Admin Studio**:
  - Centralized operations dashboard for order management and fulfillment status oversight.
  - Catalog inventory controls: Create, update, and manage luxury floral arrangements.

- **🔄 Multi-Role App Mode Switch**:
  - Clean top navigation switcher allowing seamless toggling between Customer Boutique, Driver App, and Admin Studio.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend Services**: .NET / Kestrel Microservices running via Docker Compose on port `5000`
- **State & Networking**: REST API client with automatic gateway fallback & caching (`src/services/api.ts`)
- **Linting & Quality**: Oxlint, TypeScript strict mode

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [Docker & Docker Compose](https://www.docker.com/) (to run backend microservices)

### 2. Backend Services
Start the backend microservices using Docker Compose from your backend directory:
```bash
docker compose up -d
```
The API Gateway will be listening at `http://localhost:5000`.

### 3. Frontend Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/MohamedEl-hussainey29/Automated-E-Commerce-Deployment-Platform.git
cd Automated-E-Commerce-Deployment-Platform

npm install
```

### 4. Run Development Server
```bash
npm run dev
```
The app will start at `http://localhost:5173`. Vite proxies `/api` requests directly to `http://localhost:5000`.

### 5. Production Build
```bash
npm run build
```
Generates production assets in the `dist` directory with full TypeScript type checks.

---

## 📁 Project Structure

```
├── public/                 # Static assets & brand media
├── src/
│   ├── assets/             # Brand icons & illustrations
│   ├── components/         # Reusable UI components (Navbar, Footer, Modals, Cards)
│   ├── pages/              # Application pages:
│   │   ├── HomePage.tsx            # Curated storefront & hero banners
│   │   ├── CatalogPage.tsx         # Filterable floral catalog
│   │   ├── ProductDetailsPage.tsx  # Product specs & care advice
│   │   ├── CartCheckoutPage.tsx    # Cart & order placement
│   │   ├── OrdersPage.tsx          # Real-time tracking & order history
│   │   ├── ProfilePage.tsx         # Account management & saved addresses
│   │   ├── AuthPage.tsx            # Sign in & registration
│   │   ├── DriverPortalPage.tsx    # Rider delivery dashboard
│   │   └── AdminDashboardPage.tsx  # Operations & inventory management
│   ├── services/           # API client & backend integrations
│   ├── types/              # Domain models & TypeScript interfaces
│   ├── App.tsx             # Root component & view router
│   └── main.tsx            # Application entry point
├── package.json
└── vite.config.ts
```

---

## 🤝 Collaboration & Contributors
Developed by [Ahmed Osama](https://github.com/AhmedUsama29) in collaboration with [Mohamed El-hussainey](https://github.com/MohamedEl-hussainey29).
