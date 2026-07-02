# Len&Em - Yarn Shop (Replit Setup)

## Overview

Len&Em is a React-based e-commerce application for a yarn shop. This document covers how to run and deploy the project on Replit.

## Quick Start

1. Open the project in Replit.
2. The dev server will start automatically on port **5000**.
3. Open the Webview tab to see the application.

## Environment Variables

| Variable           | Description          | Default Value                                                     |
| ------------------ | -------------------- | ----------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Backend API base URL | `https://yarn-shop-be.onrender.com/api/v1` |

> **Note:** On Replit, you can override `VITE_API_BASE_URL` via **Secrets** (Tools → Secrets) if you need to point to a different backend.

## Available Scripts

| Command             | Description                |
| ------------------- | -------------------------- |
| `npm run dev`       | Start dev server (port 5000) |
| `npm run build`     | Build for production       |
| `npm run preview`   | Preview production build   |
| `npm run lint`      | Run ESLint                 |

## Vite Configuration

- **Port:** `5000`
- **allowedHosts:** `true` (required for Replit proxy)
- The dev server is configured to accept connections from any host, which is necessary for Replit's network setup.

## Project Structure

```
├── src/
│   ├── api/          # API client & endpoints
│   ├── app/          # App entry & layout
│   ├── components/   # Shared UI components (shadcn/ui)
│   ├── constants/    # App constants
│   ├── context/      # React context providers
│   ├── features/     # Feature-based modules
│   ├── hooks/        # Custom hooks
│   ├── pages/        # Route pages
│   ├── routes/       # Route definitions
│   ├── services/     # Business logic services
│   ├── shared/       # Shared utilities
│   ├── store/        # Zustand stores
│   ├── styles/       # Global styles
│   ├── types/        # TypeScript types
│   └── main.tsx      # App entry point
├── public/           # Static assets
├── .env              # Environment variables (tracked)
├── .env.local        # Local overrides (gitignored)
├── .replit           # Replit config
├── replit.md         # This file
└── vite.config.ts    # Vite configuration
```

## Deployment

The app is deployed on **Vercel** at: [https://yarn-shop-len-em.vercel.app](https://yarn-shop-len-em.vercel.app)

For Replit deployment, use the "Deploy" button in the Replit interface. The `.replit` file is already configured with a deployment build step (`npm run build && npm run preview`).