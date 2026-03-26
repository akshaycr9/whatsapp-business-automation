# Qwertees WhatsApp Automation

A personal WhatsApp Business automation tool for the [Qwertees](https://qwertees.in) Shopify store. Automatically sends WhatsApp template messages on Shopify events, provides a real-time WhatsApp-like conversation UI, and manages templates, automations, and customers — all from a single dashboard.

---

## Features

- **Automated Messaging** — Triggers WhatsApp template messages on Shopify events:
  - Prepaid order confirmed
  - COD order confirmation
  - Order fulfilled / shipped
  - Abandoned cart (60-minute delay via cron)
- **Real-time Conversations** — WhatsApp-style chat UI with live message delivery & read receipts via Socket.io
- **Template Management** — Create, sync, and track Meta approval status of WhatsApp message templates
- **Customer Management** — Sync customers from Shopify or add manually; E.164 phone number handling
- **Dashboard** — Live stats (messages sent, delivered, automations run) and activity feed
- **24-hour Window Enforcement** — UI warns when messaging window has expired, enforcing template-only sending
- **Media Proxy** — Server-side proxying of WhatsApp media via `/api/media/:mediaId`
- **Dark Mode** — Full dark mode support with Emerald primary accent

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + TypeScript |
| **UI** | Tailwind CSS + shadcn/ui |
| **Routing** | React Router v6 |
| **Real-time** | Socket.io (client) |
| **HTTP Client** | Axios |
| **Backend** | Node.js + Express + TypeScript |
| **Real-time** | Socket.io (server) |
| **Database** | PostgreSQL + Prisma ORM |
| **Validation** | Zod |
| **Scheduling** | node-cron |
| **WhatsApp API** | Meta WhatsApp Cloud API (v21.0) |
| **Shopify API** | Shopify Admin API + Webhooks |

---

## Project Structure

```
qwertees-whatsapp-automation/
├── server/                    # Express backend
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema (7 models)
│   │   └── seed.ts            # Dev seed data
│   └── src/
│       ├── config/env.ts      # Zod-validated env vars
│       ├── lib/               # Prisma client, logger, AppError
│       ├── middleware/        # Error handler, raw body capture
│       ├── routes/            # REST API routes
│       │   └── webhooks/      # Shopify + Meta webhook handlers
│       ├── services/          # Business logic layer
│       ├── socket/            # Socket.io typed emitters
│       └── index.ts           # Express app entry point
├── client/                    # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── layout/        # AppShell, Sidebar
│       │   └── ui/            # shadcn/ui primitives
│       ├── hooks/             # Custom data-fetching hooks
│       ├── lib/               # Axios instance, Socket.io singleton, utils
│       ├── pages/             # Dashboard, Conversations, Templates, Automations, Customers
│       └── types/             # Shared TypeScript interfaces
├── .claude/                   # Claude Code config (rules, skills, agents)
├── .env.example               # Required environment variables
├── package.json               # Root scripts (runs both servers concurrently)
└── docker-compose.yml         # Optional: PostgreSQL via Docker
```

---

## Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+ (local installation or Docker)
- **Meta WhatsApp Business** account with Cloud API access
- **Shopify** custom app with Admin API access

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/akshaycr9/whatsapp-business-automation.git
cd whatsapp-business-automation
```

### 2. Install dependencies

```bash
npm install                  # Root (concurrently)
npm install --prefix server  # Backend
npm install --prefix client  # Frontend
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env` with your real values:

```env
# Database
DATABASE_URL=postgresql://YOUR_SYSTEM_USER@localhost:5432/qwertees_whatsapp

# Meta WhatsApp Cloud API
META_ACCESS_TOKEN=your_permanent_access_token
META_PHONE_NUMBER_ID=your_phone_number_id
META_WABA_ID=your_whatsapp_business_account_id
META_APP_SECRET=your_app_secret
META_VERIFY_TOKEN=your_custom_webhook_verify_token

# Shopify
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_admin_api_access_token
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_signing_secret
```

### 4. Set up the database

```bash
# Create the database
createdb qwertees_whatsapp

# Run migrations
npm run db:migrate

# (Optional) Seed dev data
npm run db:seed
```

### 5. Start the development servers

```bash
npm run dev
```

This starts both servers concurrently:
- **Backend** → `http://localhost:3000`
- **Frontend** → `http://localhost:5173`

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both servers in dev mode |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database with dev data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |

---

## Database Schema

| Model | Purpose |
|---|---|
| `Customer` | Shopify-synced or manually added contacts |
| `Conversation` | One conversation per customer (identified by phone) |
| `Message` | Individual WhatsApp messages with status tracking |
| `Template` | WhatsApp message templates with Meta approval lifecycle |
| `Automation` | Links a Shopify event → Template with variable mappings |
| `AutomationLog` | Audit log of every automation execution |
| `CheckoutTracker` | Tracks Shopify checkouts for abandoned cart detection |

---

## Webhook Setup

### Shopify

Register these topics in your Shopify custom app pointing to `https://your-domain.com/api/webhooks/shopify`:

| Topic | Trigger |
|---|---|
| `orders/create` | Prepaid + COD order confirmation |
| `fulfillments/create` | Order shipped notification |
| `checkouts/create` | Abandoned cart tracking |

All webhooks are HMAC-SHA256 verified.

### Meta WhatsApp

Set your webhook URL to `https://your-domain.com/api/webhooks/meta` in the Meta Developer Console.

- **GET** — Verify token challenge
- **POST** — Inbound messages + message status updates (X-Hub-Signature-256 verified)

---

## Key Design Decisions

- **Single-user tool** — No authentication by design; restrict access at the network level if deploying publicly
- **No local media storage** — Uses Meta's Media API with a server-side proxy; accepts Meta's 30-day retention limit
- **Respond-then-process** — All webhook handlers return `200 OK` immediately, process asynchronously
- **E.164 phone numbers** — Stored without `+` prefix (e.g., `919876543210`)
- **24-hour messaging window** — UI enforces WhatsApp policy; free-form replies blocked after window expiry

---

## Environment Variables Reference

See [`.env.example`](.env.example) for the full list of required variables with descriptions.

---

## License

Private — for personal use with the Qwertees store.
