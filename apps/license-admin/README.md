# 3DSMOOD license and catalog admin

This admin app lives in `moimoi05/save_catalog_drive_3dsmood`, separate from the customer plugin repository. Vercel serves its static admin page and Node.js API functions from `apps/license-admin`. The browser never receives the license signing key or GitHub token.

## Deploy to Vercel

The Vercel project is named `3dsmood-license-admin` and its root directory is `apps/license-admin`. Use Node.js 24. Keep Vercel deployment protection enabled and use the admin password as a second authentication layer.

Set these **Production** environment variables before deploying:

| Variable | Value |
| --- | --- |
| `ADMIN_PASSWORD` | A unique password with at least 16 UTF-8 bytes. |
| `ADMIN_SESSION_SECRET` | At least 32 random bytes; do not reuse the admin password. |
| `LICENSE_PRIVATE_KEY_B64` | Base64 encoding of the owner private PEM. Store only in Vercel's encrypted server environment. |
| `LICENSE_PUBLIC_KEY_B64` | Base64 encoding of the matching `library-public.xml`; the server checks that the pair matches. |
| `GITHUB_ACTIONS_TOKEN` | Fine-grained token limited to `moimoi05/save_catalog_drive_3dsmood`, with Actions: write. Used to dispatch scans and read run status. |
| `DRIVE_WORKFLOW_REPOSITORY` | `moimoi05/save_catalog_drive_3dsmood` (optional; this is the default). |
| `DRIVE_WORKFLOW_ID` | `weekly-drive-catalog.yml` (optional; this is the default). |

Generate a session secret locally with Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

To prepare each signing key for Vercel, run one command at a time, paste that value into its matching Vercel environment variable, save it, then prepare the next value. Never put a key value in a command argument, repository file, chat, or build output:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\LibraryOwnerKeys\library-private.pem')) | Set-Clipboard
Set-Clipboard -Value ''
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\LibraryOwnerKeys\library-public.xml')) | Set-Clipboard
Set-Clipboard -Value ''
```

Configure the Vercel Firewall rate-limit rule `admin-session-login` at 10 requests per minute per client IP before deploying Production. The Production login handler fails closed with `503` if the platform rate-limit service is unavailable. The process-local limit is an additional guard; Vercel counters are per region. A private URL is not authentication.

## Configure the GitHub scanner

Add this **Actions secret** to `moimoi05/save_catalog_drive_3dsmood`:

| Secret | Permissions and purpose |
| --- | --- |
| `GOOGLE_DRIVE_API_KEY` | Google API key restricted to the Drive API, used to list Drive metadata. |

The scanner runs every Sunday at 18:00 UTC (Monday 01:00 in Bangkok) and can also be dispatched manually from this admin page or the GitHub Actions tab. It scans the configured Drive root and its subfolders, validates the result, then commits the catalog and previews in this repository using the workflow's `GITHUB_TOKEN`. No cross-repository write token is needed.

The live Drive root currently has 360 model pairs in 126 folders. The workflow keeps a minimum of 360 so an incomplete listing cannot replace the catalog. If the repository variable `CATALOG_MINIMUM_MODEL_COUNT` is set below 360, raise it or remove it to use the default.

Change the root with the repository variable `DRIVE_FOLDER_ID`. To add a model, put one supported model/archive file and one raster preview with the same base name in the same Drive folder, such as `chair.zip` and `chair.jpg`. New category labels come from the folder path. Existing catalog IDs, names, categories, and `entryFile` overrides are preserved by Drive file ID. The app does not need a plugin rebuild.

Keep Drive Editor access limited to the admin account. The scanner publishes each supported model/preview pair it finds. If customers need to submit files, use a separate inbox and review its contents before moving them into the scanned tree.

## Local checks

```powershell
npm test
node --test ..\..\tools\catalog-import\*.test.mjs ..\..\library\catalog.test.mjs
```
