# Hosted demo deployment (Render example)

The ZIP is prepared for deployment but has **not** been deployed to a public URL. You need your own hosting account to publish it.

## Backend web service

1. Create a new Web Service from the repository or upload the project to a Git repository first.
2. Set Root Directory to `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Use a Python runtime compatible with Python 3.10+.
6. Add a persistent disk mounted at `/opt/render/project/src/data` (the app stores SQLite and uploads in `backend/data` relative to the backend directory; confirm the absolute mount path for your host's working directory). On a host that runs the service from `backend`, the expected application data directory is `<backend-root>/data`.
7. Configure environment variables:
   - `APP_SECRET_KEY`: long, unique, random value
   - `ADMIN_EMAIL`: your chosen admin email
   - `ADMIN_PASSWORD`: strong, unique password
   - `CORS_ORIGINS`: exact HTTPS URL of the frontend, comma-separated if needed
   - `OPENAI_API_KEY`: optional; configure only if using real AI
   - `OPENAI_MODEL`: optional, defaults to `gpt-4o-mini`
8. Verify `/api/health` and `/docs` on the deployed API.

## Frontend static site

1. Create a Static Site with Root Directory `frontend`.
2. Build command: `npm install && npm run build`.
3. Publish directory: `dist`.
4. Add build environment variable `VITE_API_URL` with the deployed backend HTTPS URL (for example, `https://your-api-service.onrender.com`).
5. Redeploy after setting the variable. Update backend `CORS_ORIGINS` to the exact frontend HTTPS URL and restart/redeploy the API.

## Before sharing the demo

- Change the demo admin password; do not use the seeded demo credentials for public deployment.
- Set a secure `APP_SECRET_KEY`.
- Ensure persistent storage actually survives restarts. Ephemeral file systems will lose SQLite records and uploads.
- Keep API keys in backend environment variables only.
- Test register/login, PDF upload, sample fallback, AI generation, quiz submission, saved items, and admin role in the deployed environment.

### Hosting caveat

Some hosts execute a service from a different working directory than expected. The app's database and uploads are placed under `backend/data` based on `main.py`'s location. Configure persistent storage to that resolved directory and verify the actual mount path in the host console before treating the demo as persistent.
