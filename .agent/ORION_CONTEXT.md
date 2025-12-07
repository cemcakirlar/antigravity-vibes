# Orion Project Context

> **Son Güncelleme:** 2025-12-07

## 📋 Proje Özeti

Orion, **Zoho Creator benzeri Low-Code App Development platformu**. Metadata-driven mimari ile çalışıyor.

## ✅ Tamamlanan (Phase 1)

### Backend (`apps/orion-backend`)
- **Tech Stack:** Bun + Hono + Drizzle ORM + PostgreSQL
- **Auth:** JWT (jose) + Argon2 password hashing
- **Validation:** Zod + @hono/zod-validator

#### Metadata Entities
```
User → Workspace → Application → Form → Field
```

#### API Endpoints
| Module | Endpoints |
|--------|-----------|
| Auth | `/api/auth/register`, `/login`, `/me` |
| Workspace | CRUD at `/api/workspaces` |
| Application | CRUD at `/api/workspaces/:id/apps`, `/api/apps/:id` |
| Form | CRUD at `/api/apps/:id/forms`, `/api/forms/:id` |
| Field | CRUD at `/api/forms/:id/fields`, `/api/fields/:id` |

#### Key Files
- `src/db/schema.ts` - Drizzle ORM şeması
- `src/modules/*/` - Her entity için service + routes
- `drizzle.config.ts` - Migration config

### Frontend (`apps/orion-web`)
- **Tech Stack:** Vite + React + Tailwind v4
- **State Management:** MobX State Tree (planlandı)
- Henüz sadece boilerplate

## 🔜 Sonraki Adımlar (Phase 2)

1. **Dynamic Data Layer**
   - Form metadata'sına göre dinamik tablo oluşturma
   - Generic CRUD for user data
   - Field-based validation

2. **Frontend**
   - API client setup
   - MobX State Tree stores
   - Dashboard UI

## 🛠️ Çalıştırma

```bash
cd apps/orion-backend
cp .env.example .env
# DATABASE_URL düzenle
pnpm install
pnpm run db:push
pnpm run dev
```

## 📝 Notlar

- Veritabanı: PostgreSQL tercih edildi
- Auth: 3rd party yerine kendi JWT sistemi
- Field Types: text, number, email, date, datetime, boolean, select, multiselect, lookup, file, textarea, url, phone
