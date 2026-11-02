# Evölingo Connector

A standalone QR connection and file transfer app. A receiving device opens the app, creates a 30-minute session and shows a QR link. A second device scans it to join. Either side can send files; received files appear on the opposite side and can be downloaded while the session is active.

The application uses Cloudflare D1 for sessions and metadata and R2 for file content, provided by Sites. Session tokens are 256-bit random secrets. Only their SHA-256 hashes are stored in D1. A QR link is a bearer secret: anyone holding it can join that session, so share it only with the intended device. Tokens are removed from the address bar after joining. Opening a new connection revokes the previous one. The service limits each file to 20 MiB and each connection to 100 files. Expired or revoked session records and stored objects are removed in bounded batches when new sessions are created; access to them is denied immediately on expiry or revocation. Do not use this as a permanent file archive.

The site is initially private: users need access to the Site on each device. HTTPS is required for access outside a local preview. The project does not integrate with the separate Evolingo Library database; the phone image is the visual reference, and transfers are stored in this connector's own storage.

## Local development

Install dependencies with `npm install`, then build once with `npm run build`. Apply `drizzle/0000_worthless_karen_page.sql` to the local D1 database with Wrangler using the generated `dist/server/wrangler.json`, then use `npm start`. See the Sites Vinext starter documentation for the complete local D1 command. Preview storage is separate from hosted storage.
