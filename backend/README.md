# Backend — AI Book-to-Study Assistant

FastAPI + SQLite demo API. The API includes authentication, roles, PDF text extraction, sample-book fallback, optional OpenAI-compatible generation, study materials, saving, quizzes, and admin overview.

## Run locally

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Windows PowerShell: Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000/docs and http://127.0.0.1:8000/api/health.

## Demo accounts

- Student: `student@example.com` / `Student123!`
- Admin: `admin@example.com` / `ChangeMe123!`

Set `APP_SECRET_KEY` and change `ADMIN_PASSWORD` before any shared deployment. These credentials are demo-only.

## Optional real AI

Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in the environment. When not configured, or when the model request fails, the generator returns sample/fallback content and labels it in the response. Do not present fallback content as AI-generated.

## Notes and limitations

- Text-based PDFs are supported. If the PDF has no extractable text, the demo explicitly uses its built-in Computer Networks sample text. OCR is not included.
- Upload cap: 15 MB and 300 pages. Extracted text is capped before storage and AI prompt use.
- SQLite and local file storage are suitable for a single-instance demo, not multi-instance production hosting.
- Configure `CORS_ORIGINS` for the deployed frontend. Persistent disk is required for SQLite and uploaded PDFs on hosting.
