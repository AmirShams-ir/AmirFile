# AmirFile

AmirFile is an independent Vue 3 + Vite + TypeScript file-manager frontend based on the UI and interaction patterns of AmirDrive. It is designed to deploy independently on Vercel.

## Included frontend features
- Folder navigation and breadcrumbs
- File and folder lists with modified timestamps
- Create, rename, delete, copy, cut and paste UI interactions
- Light/dark theme preference independent from AmirDrive
- File information dialog and URL-based virtual files
- VLC and MX Player context-menu actions on Android
- Responsive layout and independent PWA manifest

## Local development
```bash
npm install
npm run dev
npm run build
```

## Backend status
The frontend expects same-origin `/api/folders` and `/api/files` endpoints. At this initial stage, `/api/ping` verifies Vercel Function execution; folder/file persistence has not yet been integrated or tested. Do not treat storage features as production-ready until those endpoints and database/blob integration are complete.

Configure secrets in Vercel Project Settings and never commit production credentials. AmirDrive is used as a read-only reference; AmirFile has its own repository, app name, theme key, and manifest.
