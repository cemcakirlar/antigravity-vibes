# Orion Backend

Modern backend API built with Bun and Hono.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

## 📚 Tech Stack

- **Runtime:** Bun
- **Framework:** Hono
- **Language:** TypeScript

## 🛠️ Development

The server runs on `http://localhost:3000` by default.

### Available Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/users` - Get users
- `POST /api/users` - Create user

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=3000
NODE_ENV=development
```
