# Deploy to Render (one public URL)

This repo is prepared so that **Express serves the built Vite client**.

## Prereqs
- Push this project to GitHub (private or public).

## Deploy (recommended: Blueprint)
1. Go to Render Dashboard → **New** → **Blueprint**.
2. Connect the GitHub repo.
3. Render will detect `render.yaml` and show a preview of what will be created.
4. Click **Deploy Blueprint**.

After the first deploy finishes, your app will be available at the generated `.onrender.com` URL.

## Notes
- Free instances spin down after ~15 minutes of inactivity; first request after that can be slow.
- Local filesystem is ephemeral on Free: data in `/data/db.json` and uploads reset after redeploy/spin-down.
