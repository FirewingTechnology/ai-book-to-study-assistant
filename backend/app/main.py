import os, re, json, sqlite3, hashlib, secrets, shutil
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import fitz
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "study_assistant.db"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SECRET_KEY = os.getenv("APP_SECRET_KEY", "dev-only-change-this-secret-before-deploying")
ALGORITHM = "HS256"
TOKEN_HOURS = 24

app = FastAPI(title="AI Book-to-Study Assistant API", version="1.0.0", description="College demo API for converting PDFs into study material")
cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").strip()
if cors_raw == "*":
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
else:
    origins = [x.strip() for x in cors_raw.split(",") if x.strip()]
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def connect():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    return con


def hash_password(password: str, salt: Optional[str] = None):
    salt = salt or secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 200_000).hex()
    return f"{salt}${hashed}"


def verify_password(password: str, stored: str):
    try:
        salt, expected = stored.split("$", 1)
        return secrets.compare_digest(hash_password(password, salt).split("$", 1)[1], expected)
    except Exception:
        return False


def init_db():
    with connect() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS books(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, filename TEXT NOT NULL, extracted_text TEXT NOT NULL DEFAULT '', topics_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'completed', source_type TEXT NOT NULL DEFAULT 'pdf', created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS materials(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE, topic TEXT NOT NULL, kind TEXT NOT NULL, content_json TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'sample', created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS saved_materials(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE, created_at TEXT NOT NULL, UNIQUE(user_id, material_id));
        CREATE TABLE IF NOT EXISTS quiz_attempts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE, topic TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, answers_json TEXT NOT NULL, created_at TEXT NOT NULL);
        """)
        admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com").lower().strip()
        admin_password = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")
        if not con.execute("SELECT id FROM users WHERE email=?", (admin_email,)).fetchone():
            con.execute("INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)", ("Demo Admin", admin_email, hash_password(admin_password), "admin", now()))
        if not con.execute("SELECT id FROM users WHERE email='student@example.com'").fetchone():
            con.execute("INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)", ("Demo Student", "student@example.com", hash_password("Student123!"), "student", now()))


def now(): return datetime.now(timezone.utc).isoformat()
init_db()

class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str
class LoginInput(BaseModel):
    email: EmailStr
    password: str
class GenerateInput(BaseModel):
    book_id: int
    topic: str
    kind: str
    language: str = "English"
class QuizInput(BaseModel):
    book_id: int
    topic: str
    answers: list[int]
    questions: list[dict]


def token_for(user):
    payload = {"sub": str(user["id"]), "role": user["role"], "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def current_user(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Please sign in to continue")
    try:
        payload = jwt.decode(authorization.split(" ", 1)[1], SECRET_KEY, algorithms=[ALGORITHM])
        uid = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(401, "Session expired or invalid. Please sign in again.")
    with connect() as con: user = con.execute("SELECT id,name,email,role,created_at FROM users WHERE id=?", (uid,)).fetchone()
    if not user: raise HTTPException(401, "User not found")
    return dict(user)


def require_admin(user=Depends(current_user)):
    if user["role"] != "admin": raise HTTPException(403, "Admin access required")
    return user


def safe_book(book_id, user):
    with connect() as con:
        book = con.execute("SELECT * FROM books WHERE id=? AND user_id=?", (book_id, user["id"])).fetchone()
    if not book: raise HTTPException(404, "Book not found")
    return dict(book)

SAMPLE_TEXT = """Computer Networks — Sample Study Book\n\nIPv4 Header\nThe IPv4 header contains fields that help route a packet across networks. Version identifies the IP version. Internet Header Length (IHL) gives the header length. Total Length describes the full packet size. Identification, Flags and Fragment Offset support fragmentation. Time To Live (TTL) limits packet lifetime. Protocol identifies the next-layer protocol. Header Checksum checks header integrity. Source and Destination Address identify sender and receiver.\n\nTCP and UDP\nTCP is connection-oriented and provides reliable, ordered delivery using acknowledgements and retransmission. UDP is connectionless and has lower overhead, but does not guarantee delivery or ordering. Common uses of UDP include streaming and real-time applications.\n\nOSI Model\nThe OSI model has seven layers: Physical, Data Link, Network, Transport, Session, Presentation and Application. Each layer describes a set of networking responsibilities."""


def extract_topics(text):
    lines = [re.sub(r"\s+", " ", x).strip(" #-•\t") for x in text.splitlines() if x.strip()]
    topics = []
    for line in lines:
        if len(line) > 90 or len(line) < 3: continue
        if re.match(r"^(chapter|unit|module)\s+\d+", line, re.I) or (len(line.split()) <= 8 and (line.istitle() or line.isupper() or line.endswith(":"))):
            clean = re.sub(r"^(chapter|unit|module)\s+\d+[:.\- ]*", "", line, flags=re.I).strip()
            if clean and clean.lower() not in {x.lower() for x in topics}: topics.append(clean.rstrip(":"))
    if not topics: topics = ["Overview", "Key Concepts", "Revision Summary"]
    return topics[:30]


def sample_material(text, topic, kind, language="English"):
    topic_text = topic.strip() or "Overview"
    lang = (language or "English").lower()
    snippets = [re.sub(r"\s+", " ", s).strip() for s in re.split(r"(?<=[.!?])\s+|\n+", text) if len(s.strip()) > 25]
    related = [s for s in snippets if any(w.lower() in s.lower() for w in topic_text.split() if len(w) > 3)]
    facts = (related or snippets)[:8]

    if kind == "video":
        if "hindi" in lang:
            return {
                "title": f"वीडियो पाठ पटकथा (Video Lesson): {topic_text}",
                "duration": "2–3 मिनट",
                "language": "Hindi",
                "scenes": [
                    {"scene": 1, "visual": f"शीर्षक कार्ड (Title Card): {topic_text}", "narration": f"नमस्ते और स्वागत है। इस वीडियो पाठ में, हम {topic_text} को सरल और स्पष्ट तरीके से समझेंगे।"},
                    {"scene": 2, "visual": "प्रमुख शब्दावली और परिभाषाएं (Key Terms & Definitions)", "narration": "आइए सबसे पहले मूल परिभाषा और यह विषय परीक्षा तथा वास्तविक दुनिया के लिए क्यों महत्वपूर्ण है, इससे शुरुआत करते हैं।"},
                    {"scene": 3, "visual": "प्रणाली आरेख और घटक प्रवाह (Architecture & Component Flow)", "narration": "इस आरेख पर ध्यान दें। डेटा प्रेषक (Sender) से विभिन्न प्रोटोकॉल परतों के माध्यम से प्राप्तकर्ता (Receiver) तक कैसे पहुँचता है, इसे देखें।"},
                    {"scene": 4, "visual": "निष्कर्ष और परीक्षा अभ्यास (Recap & Quiz)", "narration": "संक्षेप में, इन मुख्य बिंदुओं को याद रखें। अब अपनी समझ की जांच के लिए अभ्यास प्रश्न (MCQs) हल करें।"}
                ],
                "source_note": "हिंदी वीडियो पटकथा टेम्पलेट।"
            }
        elif "marathi" in lang:
            return {
                "title": f"व्हिडिओ धडा स्क्रिप्ट (Video Lesson): {topic_text}",
                "duration": "2–3 मिनिटे",
                "language": "Marathi",
                "scenes": [
                    {"scene": 1, "visual": f"शीर्षक कार्ड (Title Card): {topic_text}", "narration": f"नमस्कार आणि स्वागत. या व्हिडिओ धड्यात, आपण {topic_text} सोप्या आणि प्रभावी भाषेत समजून घेऊया."},
                    {"scene": 2, "visual": "महत्त्वाच्या व्याख्या आणि संकल्पना (Key Concepts)", "narration": "सुरुवातीला या संकल्पनेची मुख्य व्याख्या आणि परीक्षेच्या दृष्टीने याचे महत्त्व समजून घेऊया."},
                    {"scene": 3, "visual": "प्रणाली आकृती आणि रचना (System Architecture Flow)", "narration": "या आकृतीमध्ये डेटा एका घटकाकडून दुसऱ्या घटकाकडे कसा वाहतो ते काळजीपूर्वक पहा."},
                    {"scene": 4, "visual": "पुनरावलोकन आणि सराव (Recap & Quiz)", "narration": "थोडक्यात, हे तीन मुख्य मुद्दे लक्षात ठेवा आणि पुढील MCQ सराव सोडवा."}
                ],
                "source_note": "मराठी व्हिडिओ स्क्रिप्ट टेम्पलेट."
            }
        elif "spanish" in lang:
            return {
                "title": f"Guion de Lección en Video: {topic_text}",
                "duration": "2–3 minutos",
                "language": "Spanish",
                "scenes": [
                    {"scene": 1, "visual": f"Tarjeta de título: {topic_text}", "narration": f"Bienvenidos. En esta video lección, comprenderemos {topic_text} paso a paso."},
                    {"scene": 2, "visual": "Términos clave y definiciones fundamentales", "narration": "Comencemos con la definición central y por qué este concepto es fundamental."},
                    {"scene": 3, "visual": "Diagrama de flujo de arquitectura del sistema", "narration": "Observe cómo fluyen los datos entre el emisor y el receptor a través de los componentes de la red."},
                    {"scene": 4, "visual": "Resumen y puntos clave de repaso", "narration": "Para resumir, recuerde estos puntos esenciales y luego pruebe las preguntas de práctica."}
                ],
                "source_note": "Plantilla de video en español."
            }
        elif "french" in lang:
            return {
                "title": f"Scénario de Leçon Vidéo: {topic_text}",
                "duration": "2–3 minutes",
                "language": "French",
                "scenes": [
                    {"scene": 1, "visual": f"Titre: {topic_text}", "narration": f"Bienvenue. Dans cette leçon vidéo, nous allons comprendre {topic_text} étape par étape."},
                    {"scene": 2, "visual": "Termes clés et définitions essentielles", "narration": "Commençons par la définition principale et l'importance de ce concept."},
                    {"scene": 3, "visual": "Schéma d'architecture et flux des données", "narration": "Regardez comment les paquets de données transitent entre l'émetteur et le récepteur."},
                    {"scene": 4, "visual": "Récapitulatif et points à retenir", "narration": "Pour résumer, retenez ces points clés puis passez au quiz d'entraînement."}
                ],
                "source_note": "Modèle de vidéo en français."
            }
        elif "german" in lang:
            return {
                "title": f"Videolektions-Skript: {topic_text}",
                "duration": "2–3 Minuten",
                "language": "German",
                "scenes": [
                    {"scene": 1, "visual": f"Titelkarte: {topic_text}", "narration": f"Willkommen. In dieser Videolektion lernen wir {topic_text} schrittweise kennen."},
                    {"scene": 2, "visual": "Schlüsselbegriffe und Grundlagen", "narration": "Beginnen wir mit der Definition und warum dieses Konzept wichtig ist."},
                    {"scene": 3, "visual": "Systemarchitektur und Datenfluss-Diagramm", "narration": "Sehen Sie, wie die Daten zwischen Sender und Empfänger fließen."},
                    {"scene": 4, "visual": "Zusammenfassung und Prüfungstipps", "narration": "Zusammenfassend merken Sie sich diese Kernpunkte und üben Sie mit den Testfragen."}
                ],
                "source_note": "Deutsche Video-Vorlage."
            }
        else:
            return {
                "title": f"Video Lesson Script: {topic_text}",
                "duration": "2–3 minutes",
                "language": "English",
                "scenes": [
                    {"scene": 1, "visual": f"Title card: {topic_text}", "narration": f"Welcome. In this lesson, we will understand {topic_text}."},
                    {"scene": 2, "visual": "Show key terms as animated labels", "narration": "Begin with the definition and why the concept matters."},
                    {"scene": 3, "visual": "Show a simple diagram and highlight components", "narration": "Explain each key component using the textbook points."},
                    {"scene": 4, "visual": "Recap card with three key takeaways", "narration": "Review the main ideas, then try the practice questions."}
                ],
                "source_note": "Script template; review against the source book before presenting."
            }

    if kind == "notes":
        return {"title": f"Smart Notes: {topic_text}", "intro": f"Revision notes based on the available book text for {topic_text}.", "points": facts or [f"Review the key ideas in {topic_text}.", "Connect each term with its definition and practical use."], "exam_tip": "Use these notes as a revision aid and verify important details against your textbook."}
    if kind == "questions":
        return {"title": f"Important Questions: {topic_text}", "questions": [f"Explain {topic_text} in your own words.", f"Describe the key concepts and components of {topic_text}.", f"Write a short note on {topic_text} with a suitable example.", f"What are the advantages, limitations or applications of {topic_text}?"] , "note": "These are practice questions, not predictions of the actual exam paper."}
    if kind == "explanation":
        return {"title": f"Easy Explanation: {topic_text}", "level": "Beginner-friendly", "explanation": "Start with the main idea, then connect each term to its role. " + " ".join(facts[:4]) if facts else f"Think of {topic_text} as a group of related ideas. Learn the definition, purpose, key parts and one real-world example.", "analogy": f"A useful way to study {topic_text} is to identify its purpose, its parts, and how those parts work together.", "key_terms": topic_text.split()[:8]}
    if kind == "mcqs":
        return {"title": f"Practice MCQs: {topic_text}", "questions": make_mcqs(text, topic_text)}
    raise HTTPException(400, "Unsupported material type")


def make_mcqs(text, topic):
    lower = text.lower()
    if "ipv4" in topic.lower() or "header" in topic.lower():
        return [
          {"question":"Which IPv4 field limits a packet's lifetime?","options":["TTL","IHL","Source Address","Total Length"],"answer":0,"explanation":"Time To Live (TTL) limits how long a packet can remain in the network."},
          {"question":"Which field identifies the upper-layer protocol?","options":["Flags","Protocol","Identification","Checksum"],"answer":1,"explanation":"The Protocol field identifies the next-layer protocol carried by the IP packet."},
          {"question":"What does IHL describe?","options":["Packet destination","Header length","Transport protocol","Packet lifetime"],"answer":1,"explanation":"IHL stands for Internet Header Length."},
          {"question":"Which fields help with fragmentation?","options":["Version and TTL","Source and Destination","Identification, Flags and Fragment Offset","Protocol and Checksum"],"answer":2,"explanation":"These fields support identifying and reassembling fragmented packets."}
        ]
    if "tcp" in topic.lower() or "udp" in topic.lower():
        return [
          {"question":"Which protocol provides reliable, ordered delivery?","options":["UDP","TCP","IP only","ARP"],"answer":1,"explanation":"TCP uses mechanisms such as acknowledgements and retransmission."},
          {"question":"Which is generally connectionless?","options":["TCP","HTTP","UDP","TLS"],"answer":2,"explanation":"UDP sends datagrams without establishing a connection."},
          {"question":"Which can be a common UDP use case?","options":["Real-time streaming","Guaranteed ordered delivery","Disk formatting","Address assignment only"],"answer":0,"explanation":"UDP's low overhead can suit real-time traffic where latency matters."}
        ]
    if "osi" in topic.lower():
        return [
          {"question":"How many layers are in the OSI model?","options":["4","5","6","7"],"answer":3,"explanation":"The OSI reference model contains seven layers."},
          {"question":"Which OSI layer handles routing?","options":["Physical","Network","Session","Presentation"],"answer":1,"explanation":"Routing is associated with the Network layer."},
          {"question":"Which layer is closest to the end user?","options":["Application","Data Link","Physical","Network"],"answer":0,"explanation":"The Application layer provides network services to applications."}
        ]
    return [
      {"question":f"What is the best first step when studying {topic}?","options":["Memorize without context","Understand its definition and purpose","Skip key terms","Ignore examples"],"answer":1,"explanation":"Understanding the definition and purpose provides a foundation for deeper learning."},
      {"question":f"Which method best supports revision of {topic}?","options":["Self-testing and reviewing errors","Reading only the title","Avoiding practice","Guessing all answers"],"answer":0,"explanation":"Retrieval practice and reviewing mistakes help identify knowledge gaps."},
      {"question":f"What should you do with AI-generated notes on {topic}?","options":["Treat all content as guaranteed","Verify against the source book","Ignore the textbook","Assume exam prediction"],"answer":1,"explanation":"AI-generated material should be checked against the original source."}
    ]


def real_ai(text, topic, kind, language):
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if not key: return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key)
        prompt = f"Create {kind} for topic '{topic}' in {language}. Use only facts supported by the supplied source text; if insufficient, state that. Return valid JSON only, appropriate for a student. For notes use title,intro,points,exam_tip. For questions use title,questions,note. For explanation use title,level,explanation,analogy,key_terms. For video use title,duration,scenes (scene,visual,narration),source_note. For mcqs use title,questions (question,options array of 4,answer zero-based index,explanation). Mark questions as practice, not exam predictions.\nSOURCE TEXT:\n{text[:18000]}"
        response = client.chat.completions.create(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), messages=[{"role":"system","content":"You create careful educational material grounded in source text. Return only valid JSON."},{"role":"user","content":prompt}], response_format={"type":"json_object"}, temperature=0.3)
        data = json.loads(response.choices[0].message.content)
        if isinstance(data, dict):
            # Unwrap if model wrapped under kind e.g. {"explanation": {...}}
            if kind in data and isinstance(data[kind], dict):
                data = data[kind]
            elif len(data) == 1 and isinstance(next(iter(data.values())), dict):
                data = next(iter(data.values()))

            # Sanitize explanation
            if kind == "explanation":
                if isinstance(data.get("explanation"), dict):
                    exp = data["explanation"]
                    data["explanation"] = exp.get("explanation") or exp.get("text") or exp.get("summary") or str(exp)
                if isinstance(data.get("analogy"), dict):
                    an = data["analogy"]
                    data["analogy"] = an.get("analogy") or an.get("text") or an.get("metaphor") or str(an)
                if isinstance(data.get("key_terms"), list):
                    data["key_terms"] = [
                        (t.get("term") or t.get("name") or str(t)) if isinstance(t, dict) else str(t)
                        for t in data["key_terms"]
                    ]

            # Sanitize notes
            if kind == "notes":
                if isinstance(data.get("points"), list):
                    data["points"] = [
                        (p.get("point") or p.get("text") or p.get("note") or str(p)) if isinstance(p, dict) else str(p)
                        for p in data["points"]
                    ]
                if isinstance(data.get("exam_tip"), dict):
                    data["exam_tip"] = data["exam_tip"].get("tip") or data["exam_tip"].get("text") or str(data["exam_tip"])

            # Sanitize questions
            if kind == "questions":
                if isinstance(data.get("questions"), list):
                    data["questions"] = [
                        (q.get("question") or q.get("text") or str(q)) if isinstance(q, dict) else str(q)
                        for q in data["questions"]
                    ]

        return data
    except Exception:
        return None

@app.get("/api/health")
def health(): return {"status":"ok", "service":"AI Book-to-Study Assistant API", "ai_configured":bool(os.getenv("OPENAI_API_KEY", "").strip())}

@app.post("/api/auth/register")
def register(payload: RegisterInput):
    if len(payload.name.strip()) < 2: raise HTTPException(400, "Please enter your full name")
    if len(payload.password) < 8: raise HTTPException(400, "Password must be at least 8 characters")
    email = payload.email.lower().strip()
    try:
        with connect() as con:
            cur = con.execute("INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)", (payload.name.strip(), email, hash_password(payload.password), "student", now()))
            user = con.execute("SELECT id,name,email,role,created_at FROM users WHERE id=?", (cur.lastrowid,)).fetchone()
    except sqlite3.IntegrityError: raise HTTPException(409, "An account with this email already exists")
    return {"token":token_for(user), "user":dict(user)}

@app.post("/api/auth/login")
def login(payload: LoginInput):
    with connect() as con: user = con.execute("SELECT * FROM users WHERE email=?", (payload.email.lower().strip(),)).fetchone()
    if not user or not verify_password(payload.password, user["password_hash"]): raise HTTPException(401, "Incorrect email or password")
    return {"token":token_for(user), "user":{"id":user["id"],"name":user["name"],"email":user["email"],"role":user["role"],"created_at":user["created_at"]}}

@app.get("/api/auth/me")
def me(user=Depends(current_user)): return user

@app.get("/api/dashboard")
def dashboard(user=Depends(current_user)):
    with connect() as con:
        books = con.execute("SELECT id,title,filename,status,source_type,created_at,topics_json FROM books WHERE user_id=? ORDER BY id DESC", (user["id"],)).fetchall()
        materials = con.execute("SELECT COUNT(*) n FROM materials WHERE user_id=?", (user["id"],)).fetchone()["n"]
        quizzes = con.execute("SELECT COUNT(*) n, COALESCE(AVG(100.0*score/NULLIF(total,0)),0) avg FROM quiz_attempts WHERE user_id=?", (user["id"],)).fetchone()
        saved = con.execute("SELECT COUNT(*) n FROM saved_materials WHERE user_id=?", (user["id"],)).fetchone()["n"]
    return {"user":user,"books":[{**dict(b),"topics":json.loads(b["topics_json"])} for b in books],"stats":{"books":len(books),"materials":materials,"quiz_attempts":quizzes["n"],"average_score":round(quizzes["avg"]),"saved":saved}}

@app.post("/api/books/upload")
async def upload_book(file: UploadFile = File(...), user=Depends(current_user)):
    if not file.filename or not file.filename.lower().endswith(".pdf"): raise HTTPException(400, "Please upload a PDF file")
    raw = await file.read()
    if len(raw) > 15 * 1024 * 1024: raise HTTPException(413, "PDF must be 15 MB or smaller for this demo")
    if not raw.startswith(b"%PDF"): raise HTTPException(400, "This file does not appear to be a valid PDF")
    filename = f"u{user['id']}_{secrets.token_hex(8)}.pdf"
    path = UPLOAD_DIR / filename
    path.write_bytes(raw)
    text = ""
    try:
        with fitz.open(path) as doc:
            if len(doc) > 300: raise HTTPException(400, "PDF has more than 300 pages; please upload a smaller excerpt")
            text = "\n\n".join(page.get_text("text") for page in doc).strip()
    except HTTPException:
        path.unlink(missing_ok=True); raise
    except Exception:
        path.unlink(missing_ok=True); raise HTTPException(400, "Could not read this PDF. Please try another file.")
    source_type = "pdf"
    if len(text) < 40:
        text = SAMPLE_TEXT
        source_type = "sample_fallback"
        status = "completed_sample_fallback"
    else: status = "completed"
    title = Path(file.filename).stem[:120]
    topics = extract_topics(text)
    with connect() as con:
        cur = con.execute("INSERT INTO books(user_id,title,filename,extracted_text,topics_json,status,source_type,created_at) VALUES(?,?,?,?,?,?,?,?)", (user["id"], title, filename, text[:500000], json.dumps(topics), status, source_type, now()))
        book_id = cur.lastrowid
    return {"id":book_id,"title":title,"filename":file.filename,"status":status,"source_type":source_type,"text_characters":len(text),"topics":topics,"message":"PDF text extracted successfully" if source_type=="pdf" else "No readable text was found; sample study content was loaded. OCR is not included in this demo."}

@app.post("/api/books/sample")
def sample_book(user=Depends(current_user)):
    topics = extract_topics(SAMPLE_TEXT)
    with connect() as con:
        cur = con.execute("INSERT INTO books(user_id,title,filename,extracted_text,topics_json,status,source_type,created_at) VALUES(?,?,?,?,?,?,?,?)", (user["id"], "Computer Networks — Demo Book", "built-in-sample", SAMPLE_TEXT, json.dumps(topics), "completed", "sample", now()))
        bid = cur.lastrowid
    return {"id":bid,"title":"Computer Networks — Demo Book","status":"completed","source_type":"sample","text_characters":len(SAMPLE_TEXT),"topics":topics,"message":"Sample book added"}

@app.get("/api/books/{book_id}")
def get_book(book_id: int, user=Depends(current_user)):
    book = safe_book(book_id, user)
    return {"id":book["id"],"title":book["title"],"filename":book["filename"],"status":book["status"],"source_type":book["source_type"],"created_at":book["created_at"],"topics":json.loads(book["topics_json"]),"text_characters":len(book["extracted_text"])}

@app.delete("/api/books/{book_id}")
def delete_book(book_id: int, user=Depends(current_user)):
    book = safe_book(book_id, user)
    with connect() as con: con.execute("DELETE FROM books WHERE id=? AND user_id=?", (book_id,user["id"]))
    (UPLOAD_DIR / book["filename"]).unlink(missing_ok=True)
    return {"ok":True,"message":"Book and related study data deleted"}

@app.post("/api/materials/generate")
def generate(payload: GenerateInput, user=Depends(current_user)):
    book = safe_book(payload.book_id, user)
    allowed = {"notes","questions","explanation","mcqs","video"}
    if payload.kind not in allowed: raise HTTPException(400, "Unsupported material type")
    topic = payload.topic.strip()
    if not topic or len(topic) > 160: raise HTTPException(400, "Please choose a valid topic")
    data = real_ai(book["extracted_text"], topic, payload.kind, payload.language)
    mode = "real_ai" if data else "sample_fallback"
    if data is None: data = sample_material(book["extracted_text"], topic, payload.kind, payload.language)
    with connect() as con:
        cur = con.execute("INSERT INTO materials(user_id,book_id,topic,kind,content_json,mode,created_at) VALUES(?,?,?,?,?,?,?)", (user["id"],book["id"],topic,payload.kind,json.dumps(data,ensure_ascii=False),mode,now()))
        mid = cur.lastrowid
    return {"id":mid,"book_id":book["id"],"topic":topic,"kind":payload.kind,"mode":mode,"content":data,"created_at":now(),"notice":"Generated with the configured AI model." if mode=="real_ai" else "Sample/fallback content: real AI was not configured or the request failed. Verify study content against your textbook."}

@app.get("/api/materials")
def list_materials(book_id: Optional[int] = None, user=Depends(current_user)):
    query = "SELECT m.id,m.book_id,m.topic,m.kind,m.mode,m.created_at,m.content_json,b.title book_title FROM materials m JOIN books b ON b.id=m.book_id WHERE m.user_id=?"
    params = [user["id"]]
    if book_id is not None: query += " AND m.book_id=?"; params.append(book_id)
    query += " ORDER BY m.id DESC LIMIT 100"
    with connect() as con: rows = con.execute(query,params).fetchall()
    return [{**{k:v for k,v in dict(r).items() if k!="content_json"},"content":json.loads(r["content_json"])} for r in rows]

@app.get("/api/materials/saved")
def saved_materials(user=Depends(current_user)):
    with connect() as con:
        rows = con.execute("SELECT m.id,m.book_id,m.topic,m.kind,m.mode,m.created_at,m.content_json,b.title book_title FROM saved_materials s JOIN materials m ON m.id=s.material_id JOIN books b ON b.id=m.book_id WHERE s.user_id=? ORDER BY s.id DESC", (user["id"],)).fetchall()
    return [{**{k:v for k,v in dict(r).items() if k!="content_json"},"content":json.loads(r["content_json"])} for r in rows]

@app.post("/api/materials/{material_id}/save")
def save_material(material_id: int, user=Depends(current_user)):
    with connect() as con:
        material = con.execute("SELECT id FROM materials WHERE id=? AND user_id=?", (material_id,user["id"])).fetchone()
        if not material: raise HTTPException(404,"Material not found")
        con.execute("INSERT OR IGNORE INTO saved_materials(user_id,material_id,created_at) VALUES(?,?,?)",(user["id"],material_id,now()))
    return {"ok":True,"message":"Material saved"}

@app.delete("/api/materials/{material_id}/save")
def unsave_material(material_id: int, user=Depends(current_user)):
    with connect() as con: con.execute("DELETE FROM saved_materials WHERE user_id=? AND material_id=?",(user["id"],material_id))
    return {"ok":True,"message":"Material removed from saved list"}

@app.post("/api/quizzes/submit")
def submit_quiz(payload: QuizInput, user=Depends(current_user)):
    safe_book(payload.book_id,user)
    if not payload.questions or len(payload.questions)>50: raise HTTPException(400,"Quiz must contain 1–50 questions")
    score=0; results=[]
    for i,q in enumerate(payload.questions):
        answer = payload.answers[i] if i < len(payload.answers) else -1
        correct = int(q.get("answer",-2))
        is_correct = answer == correct
        score += int(is_correct)
        results.append({"question":q.get("question",""),"selected":answer,"correct_answer":correct,"correct":is_correct,"explanation":q.get("explanation","")})
    with connect() as con:
        cur=con.execute("INSERT INTO quiz_attempts(user_id,book_id,topic,score,total,answers_json,created_at) VALUES(?,?,?,?,?,?,?)",(user["id"],payload.book_id,payload.topic,score,len(payload.questions),json.dumps(results),now()))
    return {"id":cur.lastrowid,"score":score,"total":len(payload.questions),"percentage":round(score*100/len(payload.questions)),"results":results,"created_at":now()}

@app.get("/api/quizzes/history")
def quiz_history(user=Depends(current_user)):
    with connect() as con: rows=con.execute("SELECT id,book_id,topic,score,total,created_at FROM quiz_attempts WHERE user_id=? ORDER BY id DESC LIMIT 50",(user["id"],)).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/admin/overview")
def admin_overview(user=Depends(require_admin)):
    with connect() as con:
        users=con.execute("SELECT id,name,email,role,created_at FROM users ORDER BY id DESC").fetchall()
        books=con.execute("SELECT b.id,b.title,b.status,b.source_type,b.created_at,u.name owner,u.email FROM books b JOIN users u ON u.id=b.user_id ORDER BY b.id DESC LIMIT 100").fetchall()
        material_count=con.execute("SELECT COUNT(*) n FROM materials").fetchone()["n"]
        quiz_count=con.execute("SELECT COUNT(*) n FROM quiz_attempts").fetchone()["n"]
    return {"stats":{"users":len(users),"books":len(books),"materials":material_count,"quiz_attempts":quiz_count},"users":[dict(x) for x in users],"books":[dict(x) for x in books]}

@app.get("/")
def root(): return {"message":"AI Book-to-Study Assistant API", "docs":"/docs", "health":"/api/health"}
