# Task 8 — File Upload System: Install Notes

## Backend dependencies

```bash
cd lagaao/backend
npm install multer sharp @types/multer @types/sharp
```

`sharp` is an optional peer dependency — the server degrades gracefully if it is absent (images are stored without optimization, a warning is logged).

## Environment variables

No new env vars required. Upload files are stored under `<cwd>/uploads/` (created automatically on startup).

## Static file serving

`/uploads/**` is served as public static files by Express. Ensure Nginx (or your reverse proxy) does NOT block this path in production.

## Orphan cleanup

A background job runs every 6 hours to delete files with no model association that are older than 24 hours. It self-unref()s so it does not prevent process exit.

## Collections

| Key           | Max size | Max count | Optimized | Public |
|---------------|----------|-----------|-----------|--------|
| avatar        | 2 MB     | 1         | Yes       | Yes    |
| listing_image | 5 MB     | 10        | Yes       | Yes    |
| document      | 10 MB    | 5         | No        | No     |
| general       | 8 MB     | 5         | Yes       | No     |

## Angular usage

```ts
// Upload with progress tracking
import { UploadZoneComponent } from 'app/features/files';

// Inline chip for forms
import { FileChipComponent } from 'app/features/files';

// Preview / lightbox grid
import { FilePreviewComponent } from 'app/features/files';
```
