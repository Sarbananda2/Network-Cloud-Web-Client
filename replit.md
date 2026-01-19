# NetworkCloud Web Application

## Overview

NetworkCloud is a read-only web application for viewing and monitoring network devices. It provides authenticated users with a dashboard to view registered devices, their status (online/offline/away), Wi-Fi IP addresses, and availability timestamps. The application is strictly a display interface—it does not detect network changes, trigger IP fetching, or mutate device state.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for page transitions and hover effects
- **Build Tool**: Vite with custom Replit plugins for development

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/` (Login, DeviceList, DeviceDetail, AgentTokens)
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Custom hooks in `client/src/hooks/` for auth and data fetching
- Protected routes that redirect unauthenticated users to login

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions via `connect-pg-simple`

The backend is intentionally minimal—it only serves device data and handles authentication. All device state mutations happen externally (via a local agent not part of this codebase).

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Tables**:
  - `users` - User accounts from Replit Auth
  - `sessions` - Session storage for authentication
  - `devices` - Device registry with name, status, macAddress, timestamps
  - `device_network_states` - IP addresses and network state per device
  - `agent_tokens` - API tokens for local agents (SHA-256 hashed)

### API Contract
Defined in `shared/routes.ts` using Zod schemas:

**User-facing endpoints (session auth):**
- `GET /api/auth/user` - Current authenticated user
- `GET /api/devices` - List user's devices
- `GET /api/devices/:id` - Single device details
- `GET /api/devices/:id/network-state` - Device network information
- `DELETE /api/account` - Permanently delete user account and all associated data

**Agent token management (session auth):**
- `GET /api/agent-tokens` - List user's agent tokens
- `POST /api/agent-tokens` - Create new agent token (returns plain token once)
- `DELETE /api/agent-tokens/:id` - Revoke an agent token

**Agent API (Bearer token auth):**
- `POST /api/agent/heartbeat` - Agent health check
- `POST /api/agent/devices` - Register or update device (by MAC)
- `PATCH /api/agent/devices/:id` - Update device status/name
- `DELETE /api/agent/devices/:id` - Delete a device
- `PUT /api/agent/devices/sync` - Bulk sync devices (creates/updates/deletes)

### Key Constraints
The web app must never:
- Detect network changes
- Trigger IP fetching
- Mutate device state
- Communicate with local agents
- Contain OS-level logic

## External Dependencies

### Database
- **PostgreSQL**: Required for data persistence
- **Connection**: Via `DATABASE_URL` environment variable
- **ORM**: Drizzle with `drizzle-kit` for migrations (`npm run db:push`)

### Authentication
- **Replit Auth**: OpenID Connect provider (Google and Email/magic link only)
- **HTML-based Redirects**: Callback uses HTML page with title to hide auth code URL; other redirects use fast HTTP 302
- **Auth Endpoints**:
  - `/api/login` - Initiates OIDC authentication
  - `/api/callback` - Processes auth response with HTML redirect to `/` (hides ugly callback URL with auth code)
  - `/api/logout` - Ends session with HTTP redirect to OIDC end-session URL
- **Required Environment Variables**:
  - `ISSUER_URL` (defaults to `https://replit.com/oidc`)
  - `REPL_ID` (automatically set by Replit)
  - `SESSION_SECRET` (for session encryption)
  - `DATABASE_URL` (for session storage)

### Third-Party Libraries
- **UI**: Radix UI primitives, shadcn/ui components, Lucide icons
- **Data**: TanStack React Query, Zod for validation
- **Dates**: date-fns for timestamp formatting
- **Styling**: Tailwind CSS, class-variance-authority, clsx, tailwind-merge
- **Typography**: Google Sans Flex (primary, for modern browsers), Roboto (fallback)

## Documentation

- **Agent API Documentation**: See `docs/AGENT_API.md` for complete API reference, including authentication, endpoints, request/response formats, and Go code examples for building the local agent.