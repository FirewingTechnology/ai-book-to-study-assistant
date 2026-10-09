# 🚀 1-Click Render Deployment Guide

This project is fully configured for automated **Render Blueprint** deployment using `render.yaml`. It automatically provisions both the **FastAPI Backend Web Service** and the **React + Vite Frontend Static Site** in a single operation.

---

## 📋 What the Blueprint Configures

| Service | Type | Plan | Root Directory | Build & Start |
| :--- | :--- | :--- | :--- | :--- |
| **`studyflow-backend`** | Web Service (Python 3.11) | Free | `backend` | `pip install -r requirements.txt`<br/>`uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **`studyflow-frontend`** | Static Site | Free | `frontend` | `npm install && npm run build`<br/>Publish path: `dist` |

* **Automated Secrets**: Generates strong, cryptographically secure `APP_SECRET_KEY` and `ADMIN_PASSWORD` automatically.
* **Auto-Wiring**: Connects the frontend to the backend's live URL using Render's `fromService: host` property.
* **CORS Configured**: Allows frontend API requests out of the box.
* **SPA Routing**: Single Page Application rewrite rule (`/* -> /index.html`) so refreshing any page never results in a 404 error.

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Push your project to GitHub or GitLab
1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Add StudyFlow AI and Render Blueprint"
   ```
2. Create a new repository on [GitHub](https://github.com/new) and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Deploy on Render via Blueprint
1. Go to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top right corner and choose **Blueprints**.
3. Select your GitHub repository.
4. Render will automatically read [`render.yaml`](file:///d:/Downloads/AI_Book_to_Study_Assistant_Demo/ai-book-to-study-assistant/render.yaml) and show the two services to create:
   - `studyflow-backend` (Web Service)
   - `studyflow-frontend` (Static Site)
5. *(Optional)* If you have an OpenAI API key for real AI generation, Render will prompt you for `OPENAI_API_KEY`. If left blank, the app runs smoothly with clearly labeled sample/fallback content!
6. Click **Apply**.

---

### Step 3: Access your Live App!
* Render will build both services in parallel (~2–3 minutes).
* Once the build completes, click on the **`studyflow-frontend`** URL (e.g., `https://studyflow-frontend.onrender.com`).
* Your full-stack **StudyFlow AI — Book-to-Study Assistant** is now live on the internet with:
  * Student & Admin Demo login
  * Real PDF upload & Computer Networks demo book
  * Visual Infographics & 3D Flip Flashcards
  * Interactive Question Reveals
  * 3D Architectural Blueprint diagrams
  * Multilingual AI Video Lessons with Voiceover & Subtitles in 6 languages!

---

## 💾 Persistent Storage Note (SQLite)
* **Render Free Tier**: The backend runs on Render's free tier with ephemeral disk storage (resets on service restarts/redeploys).
* **Render Starter Tier ($7/mo)**: If you want persistent SQLite storage across restarts, simply uncomment the `disk:` block inside `render.yaml`:
  ```yaml
  disk:
    name: studyflow-data
    mountPath: /opt/render/project/src/data
    sizeGB: 1
  ```
