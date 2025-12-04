# Vercel CLI Guide

This guide provides common commands for managing your Vercel deployments directly from the terminal.

## Prerequisites

Ensure you have the Vercel CLI installed or use `npx`:

```bash
npm i -g vercel
# or use npx vercel [command]
```

## Authentication

Login to your Vercel account:

```bash
npx vercel login
```

## Deployment

### Deploy to Preview (Staging)
Deploys the current directory to a preview URL.

```bash
npx vercel
```

### Deploy to Production
Deploys the current directory to the production domain.

```bash
npx vercel --prod
```

> **Note:** When you run `vercel deploy`, the CLI uploads your **source code** to Vercel. Vercel then installs dependencies and builds your project on their servers (Remote Build). This ensures the environment matches production exactly.

## Monorepo & Package Managers

### How Vercel knows what to deploy
When you run `vercel deploy` inside a specific directory (e.g., `apps/pee-meter`), Vercel treats that directory as the **Project Root**. It only deploys the code within that folder (and any necessary shared dependencies if configured).

### Using pnpm
Vercel automatically detects your package manager by looking for a lockfile.
- If it finds `pnpm-lock.yaml`, it uses **pnpm**.
- If it finds `package-lock.json`, it uses **npm**.
- If it finds `yarn.lock`, it uses **yarn**.

You don't need to configure this manually; it's automatic.



## Domain Management

### Assign a Custom Domain (Alias)
Assigns a specific domain to your latest deployment.

```bash
npx vercel alias set your-app-name.vercel.app
```

### List Domains
Lists all domains associated with the project.

```bash
npx vercel domains ls
```

## Environment Variables

### List Environment Variables
```bash
npx vercel env ls
```

### Add Environment Variable
```bash
npx vercel env add VARIABLE_NAME
```

### Pull Environment Variables
Downloads development environment variables to `.env.local`.

```bash
npx vercel env pull .env.local
```

## Project Management

### Link Project
Link the current directory to a Vercel project.

```bash
npx vercel link
```

### Project Info
Show details about the current project.

```bash
npx vercel project ls
```

## Logs

### View Logs
View logs for a specific deployment.

```bash
npx vercel logs [deployment-url]
```
