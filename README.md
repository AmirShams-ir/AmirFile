# AmirFile

AmirFile is a personal file manager built with Vue 3, Vite and TypeScript. It is deployed as a Vercel project and uses Vercel Blob as its only persistence service.

## How it stores data

AmirFile stores **virtual files only**: each file entry contains a name and an HTTP(S) URL. The actual remote file is never uploaded to AmirFile or Vercel Blob.

Folder records and virtual-file records are serialized into one small JSON Blob. The JSON content is encrypted with AES-GCM on the server before being written to the existing Blob store. The read/write token and encryption key never go to the browser. The Blob store used by this project is configured as public, so the stored object is ciphertext rather than plaintext; the application itself reads and updates it only through authenticated Vercel Functions. Conditional ETag writes help avoid losing simultaneous updates.

**Keep `AMIRFILE_SESSION_SECRET` stable.** It is also used to derive the metadata encryption key. Changing it without migrating the stored metadata makes existing metadata unreadable.

## Features

- Folder navigation and breadcrumbs
- Create, rename, delete, copy, cut and paste folders and virtual-file entries
- Add a virtual file with a name and an HTTP(S) URL
- File information dialog, modified timestamps and URL copy
- Android context-menu actions for VLC and MX Player
- Light/dark theme preference
- Password gate with an HTTP-only signed session cookie
- No binary-file upload feature and no external database dependency

## Required Vercel environment variables

In **Vercel → Project → Settings → Environment Variables** for the `amirfile` project, configure these for Production and Preview:

- `BLOB_READ_WRITE_TOKEN`: read/write token connected to the Vercel Blob store.
- `AMIRFILE_ACCESS_PASSWORD`: a strong, private password used to unlock AmirFile.
- `AMIRFILE_SESSION_SECRET`: a long, randomly generated secret used to sign sessions and derive the metadata encryption key. Keep it private and stable.

Redeploy after changing environment variables. Do not commit secrets or share them in chat. `DATABASE_URL` is not used.

## Local development

```bash
npm install
npm run dev
npm run build
```

For local development, configure the same environment variables in a local `.env` file. Do not commit it.

## API

All API routes are same-origin Vercel Functions under `/api`. Folder/file metadata routes require an authenticated session. `/api/ping` reports which required settings are present.

Deleting a virtual-file entry removes only its AmirFile record; it does not delete the remote resource behind the URL.

AmirDrive is a read-only reference for the frontend. The AmirDrive repository is not modified by AmirFile work.
