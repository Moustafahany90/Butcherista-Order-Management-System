# Butcherista — Order Management System

A SaaS order management system for butcher/meat delivery customer service teams. Built with React + TypeScript + Firebase.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **State**: Zustand, React Context (auth), TanStack React Query
- **Forms**: React Hook Form + Zod v4
- **Charts**: Recharts
- **Excel**: SheetJS (xlsx)
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Notifications**: Firebase in-app + Telegram Bot API
- **Auth**: Synthetic email pattern (`{employeeId}@{companyDomain}.system`)

## Features

### 🔐 Authentication
- Login with Company Domain + Employee ID + Password
- Session per tab (browserSessionPersistence)
- Role-based access (Admin / Employee / Super Admin)

### 📦 Order Management
- Create, edit, delete orders
- Real-time order list with client-side filtering (status, zone, employee, date)
- Sequential order numbers (`#001`, `#002`...)
- Delivery zone auto-calc (zone → delivery fee)
- Payment tracking (cash, visa, InstaPay, e-wallet)
- Order sources (phone, WhatsApp, Instagram, website, email)
- Excel export

### 📊 Dashboards
- **Admin Dashboard**: Today's orders, revenue, active employees, pending payments, recent orders
- **Employee Dashboard**: Personal today stats, completed orders, pending payments, pre-booked alerts

### 👥 Employee Management
- Create employees (Firebase Auth via REST API)
- Activate / deactivate employees
- Delete employees
- Employee performance in analytics

### 📍 Delivery Zones
- Add / remove zones with custom delivery fees
- Save to company settings

### 🚚 Delivery Employees
- Manage delivery staff (name + mobile number)
- Assign orders to delivery employees
- **Delivery View Page** (`/delivery`) — delivery staff enter their phone to see today's assigned orders
- **Telegram Alerts** — when an order is assigned to a delivery employee, order details are sent via Telegram bot

### 📈 Analytics
- Monthly sales chart (last 6 months)
- Revenue by delivery zone
- Payment method breakdown (pie chart)
- Employee performance table

### 🔔 Notifications
- In-app notifications on order create / update
- Unread badge in sidebar
- Mark as read / mark all read

### ⚙️ Settings
- Company settings (name, currency, order sources)
- Profile page (edit name, change password)

### 🚀 Onboarding Wizard
- 3-step first-time setup: Company Info → Delivery Zones → Order Sources

### 🛡️ Super Admin
- View all companies, plans, and statuses

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Firebase project

### Environment Variables

Copy `.env` and fill in your Firebase config:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_TELEGRAM_BOT_TOKEN=       # For delivery alerts (optional)
VITE_TELEGRAM_CHAT_ID=         # For delivery alerts (optional)
```

### Install & Run

```bash
npm install
npm run dev       # Development server
npm run build     # Production build
```

### Seed Data

To bootstrap a company with an admin user:

1. Download your Firebase service account key from **Project Settings → Service accounts → Generate new private key**
2. Save it as `serviceAccountKey.json` in the project root
3. Run:

```bash
node scripts/seed.js
```

## Demo Credentials

| Field | Value |
|-------|-------|
| Company Domain | `butcherista-co` |
| Employee ID | `ADMIN-001` |
| Password | `123456` |

## Project Structure

```
src/
├── components/ui/          # Shared UI (Button, Card, Badge, Sidebar...)
├── features/
│   ├── analytics/          # Charts & performance
│   ├── auth/               # Login, AuthContext, route guards
│   ├── dashboard/          # Admin & Employee dashboards
│   ├── delivery/           # Delivery employee management + view page
│   ├── employees/          # Employee CRUD
│   ├── notifications/      # In-app notification bell + list
│   ├── orders/             # Order form, list, edit, Excel export
│   ├── saas/               # Onboarding wizard, super admin
│   ├── settings/           # Company settings, profile
│   └── zones/              # Delivery zone management
├── hooks/                  # useOrders, useCompany, useEmployees, useNotifications
├── layouts/                # AppLayout (sidebar + main)
├── lib/                    # Firebase config, utils, constants, telegram
├── stores/                 # Zustand stores (theme, order filters)
└── types/                  # TypeScript interfaces
```

## Firebase Resources

- **Firestore**: `orders`, `users`, `companies`, `companies/{id}/notifications`
- **Auth**: Synthetic email pattern for multi-company isolation
- **Hosting**: Deploy via `firebase deploy --only hosting`
- **Functions**: Optional — employee creation falls back to Firebase Auth REST API
