# AmirFile

AmirFile is an independent Vue 3 + Vite + TypeScript file manager, using AmirDrive as a read-only UI reference. It is designed for Vercel, Neon PostgreSQL metadata, and Vercel Blob file storage.

## Features

- Folder navigation and breadcrumbs
- File and folder lists with modified timestamps
- Create, rename, delete, copy, cut and paste operations
- Light/dark theme preference independent from AmirDrive
- File information dialog and URL-based virtual files
- VLC and MX Player actions on Android
- Password gate with an HTTP-only signed session cookie
- Direct browser-to-Vercel-Blob uploads (up to the configured 2 GB per file)
- Auto-initialization of the PostgreSQL tables on first authenticated API request

## Required Vercel setup

Create a Neon PostgreSQL database and a Vercel Blob store, then open **Vercel → Project → Settings → Environment Variables** for the `amirfile` project and add these values for Production and Preview:

- `DATABASE_URL`: Neon PostgreSQL connection string.
- `BLOB_READ_WRITE_TOKEN`: read/write token for your Vercel Blob store.
- `AMIRFILE_ACCESS_PASSWORD`: a strong, private password of your choice for opening AmirFile.
- `AMIRFILE_SESSION_SECRET`: a long, randomly generated secret used to sign sessions. Use a different value from the access password.

After adding the values, redeploy the project. Never put actual credentials in this repository or share them in chat. The API will return a JSON configuration error until required values are set; it will not silently pretend database writes succeeded.

The tables are created automatically when the first authenticated database request is made. A matching SQL file is also provided at `db/schema.sql`.

## Local development

```bash
npm install
npm run dev
npm run build
```

Set the same environment variables in a local `.env` file (excluded by `.gitignore`). Do not commit it.

## Deployment and security

The application uses same-origin Vercel Functions under `/api`, so the UI and API deploy together. File/folder APIs require an authenticated session. Uploaded objects use Vercel Blob; virtual files can point to HTTP(S) URLs. Use this app for trusted personal file management and avoid sharing Blob URLs for sensitive files.

AmirDrive is used as a read-only reference. No files are written to or deployed from the AmirDrive repository.
