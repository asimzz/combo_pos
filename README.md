# Combo POS — Restaurant Point-of-Sale System

A full-stack, production-ready restaurant POS system built for the Rwandan market. Currency is RWF, authentication is phone-based, and all amounts are formatted accordingly.

## Features

### POS / Sell
- Touch-optimized menu grid with category filtering and real-time stock badges
- Per-item notes ("no onions", "extra sauce") passed through to kitchen receipt
- Sides and skewer modals for item customization
- Cart with quantity control, item-level notes, discount, and service charge
- MoMo and cash payment flows
- Order confirmation with customer receipt and kitchen receipt printing
- Reprint customer or kitchen receipt after order completion

### Kitchen Display
- Dedicated full-screen kitchen view at `/kitchen` (no login required)
- Real-time pending order queue via Server-Sent Events (SSE)
- Ready / complete buttons per order

### Orders & Management
- Order list with status tracking (Pending → Preparing → Ready → Served → Completed)
- Order item void with manager accountability logging
- SSE-based order events for live updates

### Dashboard & Reports
- Dashboard with key metrics, recent orders, and quick stats
- **Sales chart** — daily revenue line chart and category bar chart (past 30 days)
- **Date-range report** — total orders, revenue, tax, service charge, discounts, by payment method and category; CSV export
- **Staff performance** — orders processed, revenue, and average order value per staff member
- **Food cost report** — theoretical cost vs. revenue per menu item using recipes
- **Waste analysis** — waste as % of opening stock per item, worst offenders surfaced
- **Inventory valuation** — total raw material stock value with trend

### Stock & Inventory
- Raw material management with daily stock snapshots
- **Shared pool stock**: raw materials (e.g. whole chickens, kofta ea) tracked per unit; opening pre-fills from previous day's closing stock
- **Convert flow**: one-click conversion of raw material quantities into per-item portion counts (e.g. 3.75 whole chicken → 15 quarters, 7 halves, 3 fulls) with editable opening values
- Per-item stock tracking for non-recipe items (Mandi, whole fish, etc.) with opening / sold / waste / closing columns
- **Full pool day-close**: editable Sold and Waste fields per raw material at closing; closing = opening − sold − waste
- Recipe management linking menu items to raw material usage
- Day-open / day-close workflow covering both pool and per-item stock; Edit Closing supported

### Catalog & Menu
- Category and menu item management (ADMIN/MANAGER)
- Featured item flags, sort order, active/inactive toggle

### Settings
- Business info, operating hours, payment methods, receipt customization
- Category management and promotion rules configuration

### Inbox (AI Agent)
- Real-time customer message inbox via SSE
- Agent handoff for special orders and support

### Books & Expenses
- Expense logging with categories
- Salary and debt tracking

### Staff
- Staff directory with role management (ADMIN, MANAGER, STAFF)
- Salary configuration per employee

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14, App Router |
| Language | TypeScript |
| Auth | NextAuth.js v4, JWT, phone + password |
| Database | PostgreSQL via Prisma ORM v5 |
| UI | TailwindCSS, Lucide icons, Sonner toasts |
| Charts | Recharts |
| Password hashing | bcryptjs |

## Prerequisites

- Node.js 18+
- PostgreSQL (local or hosted)
- yarn

## Quick Start

### 1. Clone and install

```bash
git clone <repository-url>
cd combo_pos
yarn install
```

### 2. Environment setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/combo_pos"

# NextAuth
NEXTAUTH_URL="http://localhost:3008"
NEXTAUTH_SECRET="your-secret-here"

# AI Agent integration (optional)
COMBO_POS_API_KEY="shared-secret-for-agent"
AI_AGENT_BASE_URL="http://localhost:8080"
```

### 3. Database setup

```bash
yarn db:generate   # generate Prisma client
yarn db:push       # push schema to database
yarn db:seed       # seed demo data
```

### 4. Run

```bash
yarn dev
```

Open [http://localhost:3008](http://localhost:3008). The dev server runs on port **3008**.

## Default Login

Authentication uses **phone number + password** (no email). Check `prisma/seed.ts` for the seeded demo credentials.

## App Routes & Access

| Route | Description | Roles |
|-------|-------------|-------|
| `/dashboard` | Sales overview and key metrics | ADMIN, MANAGER |
| `/sell` | POS sell screen | ALL |
| `/orders` | Order list and management | ALL |
| `/reports` | All report types | ADMIN, MANAGER |
| `/catalog` | Menu and category management | ADMIN, MANAGER |
| `/stock` | Raw material and stock management | ADMIN, MANAGER |
| `/settings` | Business settings | ADMIN |
| `/expenses` | Expense tracking | ADMIN |
| `/staff` | Staff directory | ADMIN |
| `/books` | Salary and debt ledger | ADMIN |
| `/inbox` | AI customer message inbox | ALL |
| `/kitchen` | Kitchen display (no auth) | — |

## Project Structure

```
combo_pos/
├── app/
│   ├── (app)/              # Main app (wrapped in AppShell)
│   │   ├── dashboard/
│   │   ├── sell/
│   │   ├── orders/
│   │   ├── reports/
│   │   ├── catalog/
│   │   ├── stock/
│   │   ├── settings/
│   │   ├── expenses/
│   │   ├── staff/
│   │   ├── books/
│   │   └── inbox/
│   ├── kitchen/            # Kitchen display (unauthenticated)
│   ├── api/                # API routes
│   └── auth/               # Login page
├── components/
│   ├── pos/                # Cart, menu grid, modals
│   ├── manage/             # Order, stock, material, recipe management
│   ├── reports/            # All report components
│   ├── settings/           # Settings panels
│   ├── receipts/           # Customer and kitchen receipts
│   ├── payments/           # MoMo payment flow
│   └── layout/             # Sidebar, AppShell
├── lib/                    # Auth config, Prisma client, utils, SSE helpers
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── types/                  # Shared TypeScript types
```

## Database Schema (key models)

- **User** — phone-based auth, roles (ADMIN/MANAGER/STAFF), salary config
- **Category / MenuItem** — menu structure with pricing and stock linkage
- **Order / OrderItem** — orders with status lifecycle, per-item notes, voids
- **OrderItemVoid** — audit log for voided items
- **Payment** — payment records linked to orders
- **RawMaterial / RawMaterialUsage** — inventory and recipe linkage
- **RawMaterialDailyStock** — daily pool stock per raw material (opening, current, waste, closing); one row per material per day
- **DailyItemStockSnapshot** — daily per-item stock for non-recipe items and converted recipe portions (opening, sold, waste, closing)
- **Promotion / PromotionItem** — time-bounded discount rules
- **BusinessSettings** — configurable business info, hours, and receipt content
- **Expense / SalaryPayment / CreditEntry / DebtEntry** — financial ledger

## Available Scripts

```bash
yarn dev           # Start dev server on port 3008
yarn build         # Build for production
yarn start         # Start production server
yarn lint          # Run ESLint

yarn db:generate   # Generate Prisma client
yarn db:push       # Push schema to database
yarn db:seed       # Seed demo data
yarn db:studio     # Open Prisma Studio GUI
yarn setup         # Full first-time setup (install + db:generate + db:push + db:seed)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL (use `http://localhost:3008` in dev) |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing |
| `COMBO_POS_API_KEY` | No | Shared secret for AI agent integration |
| `AI_AGENT_BASE_URL` | No | AI agent service URL (default `http://localhost:8080`) |

## Production Deployment

1. Set environment variables in your hosting platform
2. Run `yarn build`
3. Run `yarn db:generate && yarn db:push` against your production database
4. Start with `yarn start` or use PM2

Recommended platforms: Vercel (Next.js optimized), Railway (Postgres + Next.js), DigitalOcean App Platform.

## Troubleshooting

**Database connection error** — verify PostgreSQL is running and `DATABASE_URL` is correct.

**Auth issues** — confirm `NEXTAUTH_SECRET` is set and `NEXTAUTH_URL` matches the port you're running on (`3008` in dev).

**Build errors** — run `yarn db:generate` before building; ensure all required env vars are set.

**Prisma client out of sync** — run `yarn db:generate` after any schema change.
