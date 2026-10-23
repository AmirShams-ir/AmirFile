# AmirFile

Independent continuation of the AmirDrive frontend, intended to run on Vercel with a separate backend and storage layer.

> Initial repository bootstrap. The Vue frontend and Vercel-compatible API are being migrated in subsequent commits.

## Stack
- Vue 3 + Vite + TypeScript
- Vercel Functions
- PostgreSQL (Neon) metadata and Vercel Blob storage

## Local development

```bash
npm install
npm run dev
```

See `.env.example` for required backend environment variables. Do not commit secrets.
