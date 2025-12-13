# Orion Backend

Metadata-driven Low-Code Platform backend built with Bun and Hono.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Generate and run migrations
pnpm run db:generate
pnpm run db:push

# Run development server
pnpm run dev
```

## 📚 Tech Stack

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** JWT (jose) + Argon2
- **Validation:** Zod

## 🛠️ Database Commands

```bash
pnpm run db:generate  # Generate migrations
pnpm run db:migrate   # Run migrations
pnpm run db:push      # Push schema (dev mode)
pnpm run db:studio    # Open Drizzle Studio
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces` | List workspaces |
| GET | `/api/workspaces/:id` | Get workspace |
| PATCH | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workspaces/:id/apps` | Create app |
| GET | `/api/workspaces/:id/apps` | List apps |
| GET | `/api/apps/:id` | Get app with forms |
| PATCH | `/api/apps/:id` | Update app |
| DELETE | `/api/apps/:id` | Delete app |

### Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/apps/:id/forms` | Create form |
| GET | `/api/apps/:id/forms` | List forms |
| GET | `/api/forms/:id` | Get form with fields |
| PATCH | `/api/forms/:id` | Update form |
| DELETE | `/api/forms/:id` | Delete form |

### Fields
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/forms/:id/fields` | Create field |
| GET | `/api/forms/:id/fields` | List fields |
| PATCH | `/api/fields/:id` | Update field |
| DELETE | `/api/fields/:id` | Delete field |
| POST | `/api/forms/:id/fields/reorder` | Reorder fields |

## 📝 Environment Variables

```env
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/orion
JWT_SECRET=your-super-secret-key-min-32-chars
```

## 🏗️ Project Structure

```
src/
├── db/
│   ├── index.ts      # Database connection
│   └── schema.ts     # Drizzle schema
├── middleware/
│   └── auth.middleware.ts
├── modules/
│   ├── auth/
│   ├── workspace/
│   ├── application/
│   ├── form/
│   └── field/
└── index.ts          # Entry point
```
