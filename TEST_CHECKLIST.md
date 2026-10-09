# Test Checklist — AI Book-to-Study Assistant

Use this checklist before presenting the project. Tick items only after manually verifying them in the running app.

## Setup and API
- [ ] `pip install -r requirements.txt` completes successfully.
- [ ] Backend starts with `uvicorn app.main:app --reload --port 8000`.
- [ ] `GET /api/health` returns status `ok`.
- [ ] Frontend `npm install` and `npm run dev` work.
- [ ] Frontend can reach the configured API URL.

## Authentication and roles
- [ ] Student demo account can sign in.
- [ ] Admin demo account can sign in.
- [ ] New student registration works.
- [ ] Invalid credentials are rejected with a useful message.
- [ ] Refresh retains a valid login session.
- [ ] Student cannot access `GET /api/admin/overview`.
- [ ] Logout returns to the sign-in screen.

## Books and PDF extraction
- [ ] Add built-in sample book.
- [ ] Upload a valid text-based PDF and confirm extracted text/topics.
- [ ] Reject a non-PDF file.
- [ ] Reject a file larger than 15 MB.
- [ ] Try a scanned/image-only PDF and confirm the sample-fallback notice is shown.
- [ ] Delete a book and confirm related materials are removed.
- [ ] Confirm a user cannot access another user's book by changing its ID.

## Study materials
- [ ] Generate Smart Notes.
- [ ] Generate Important Questions.
- [ ] Generate Easy Explanation.
- [ ] Generate MCQ Practice.
- [ ] Generate a video script/storyboard.
- [ ] Confirm fallback output is clearly labeled when AI is not configured.
- [ ] If using a real API key, verify generated output and confirm API key is never sent to the frontend.
- [ ] Save material and find it in Saved Items.
- [ ] Reopen a saved/generated item after page refresh.

## Quiz
- [ ] Select answers and submit a quiz.
- [ ] Verify score and correct answers.
- [ ] Verify explanations appear after submission.
- [ ] Verify quiz attempt appears in history and dashboard stats update.

## UI and hosting
- [ ] Check desktop width and narrow mobile width.
- [ ] Check sidebar/mobile navigation.
- [ ] Check empty, loading, error and success states.
- [ ] Check copy button behavior in a secure browser context.
- [ ] On hosting, verify backend has persistent storage and HTTPS.
- [ ] Set a unique secret, change demo admin password, and restrict CORS to the deployed frontend origin.
- [ ] Confirm uploaded PDF data and SQLite records survive a service restart.

## Test evidence
Record date, browser, OS, test result, and any defect. Do not mark a test as passed without running it.
