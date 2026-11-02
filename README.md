# Evölingo Connector

A standalone QR connection and file transfer app. A receiving device opens the app, creates a 30-minute session and shows a QR link. A second device scans it to join. Either side can send files; received files appear on the opposite side and can be downloaded while the session is active.

The Vercel deployment uses Upstash Redis for short-lived sessions and private Vercel Blob storage for transferred files. Session tokens are 256-bit random secrets, and only their SHA-256 hashes are used as Redis lookup keys. A QR link is a bearer secret: anyone holding it can join that session, so share it only with the intended device. Tokens are removed from the address bar after joining. The service limits each file to 20 MiB and each connection to 100 files. Do not use this as a permanent file archive.

The site is initially private: users need access to the Site on each device. HTTPS is required for access outside a local preview. The project does not integrate with the separate Evolingo Library database; the phone image is the visual reference, and transfers are stored in this connector's own storage.

## Local development

Install dependencies with `npm install`, then run `npm run dev`.

## Vercel setup

Connect the repository to Vercel, then add the Marketplace integrations for **Upstash Redis** and a **private Vercel Blob** store. Vercel injects `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and the Blob store credentials into the project. Once connected, redeploy; no build-command or output-directory override is needed.
