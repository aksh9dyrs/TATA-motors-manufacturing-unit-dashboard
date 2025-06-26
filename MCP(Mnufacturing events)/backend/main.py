from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from db import get_events, get_event_by_id, get_similar_events, get_all_embeddings, get_cosine_similarity
from ai_agent import summarize_events, log_api_failure
from rag_utils import search_wikipedia, search_google
from umap_utils import project_embeddings
from schemas import Event, SimilarityRequest, AskRequest, UMAPResponse, APIResponse
from pydantic import BaseModel
import time
import os
from fastapi import status

class CosineSimilarityRequest(BaseModel):
    event_id1: int
    event_id2: int

app = FastAPI(title="Smart Manufacturing MCP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# Mount static files from the frontend directory
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("../frontend/index.html")

@app.get("/style.css")
async def get_css():
    return FileResponse("../frontend/style.css")

@app.get("/app.js")
async def get_js():
    return FileResponse("../frontend/app.js")

@app.get("/events", response_model=APIResponse)
def list_events():
    events = get_events()
    return {"data": events, "meta": {"count": len(events), "timestamp": time.time()}}

@app.get("/events/{event_id}", response_model=APIResponse)
def get_event(event_id: int):
    event = get_event_by_id(event_id)
    return {"data": event, "meta": {"found": bool(event), "timestamp": time.time()}}

@app.post("/similarity", response_model=APIResponse)
def similarity_search(req: SimilarityRequest):
    similar = get_similar_events(req.event_id)
    return {"data": similar, "meta": {"count": len(similar), "timestamp": time.time()}}

@app.post("/cosine-similarity", response_model=APIResponse)
def cosine_similarity(req: CosineSimilarityRequest):
    result = get_cosine_similarity(req.event_id1, req.event_id2)
    if not result:
        return {"data": None, "meta": {"error": "Events not found", "timestamp": time.time()}}
    return {"data": result, "meta": {"timestamp": time.time()}}

@app.post("/ask-ai", response_model=APIResponse)
def ask_ai(req: AskRequest):
    events = get_events()
    summary = summarize_events(events, req.question)
    wiki = search_wikipedia(req.question)
    google = search_google(req.question)
    meta = {
        "confidence": summary.get("confidence"),
        "source": summary.get("source"),
        "timestamp": summary.get("timestamp")
    }
    if summary.get("rag_recall") is not None:
        meta["rag_recall"] = summary["rag_recall"]
    if summary.get("rag_latency") is not None:
        meta["rag_latency"] = summary["rag_latency"]
    return {
        "data": {
            "answer": summary["summary"],
            "external": {"wikipedia": wiki, "google": google}
        },
        "meta": meta
    }

@app.get("/umap", response_model=UMAPResponse)
def umap_projection():
    embeddings = get_all_embeddings()
    points, labels = project_embeddings(embeddings)
    return {"points": points, "labels": labels}

@app.get("/logs", response_model=APIResponse)
def get_logs():
    try:
        with open("logs/api_failures.log") as f:
            lines = f.readlines()
        return {"data": lines, "meta": {"count": len(lines)}}
    except Exception:
        return {"data": [], "meta": {"count": 0}}

@app.post("/suggestion")
async def submit_suggestion(request: Request):
    data = await request.json()
    suggestion = data.get("suggestion", "").strip()
    if not suggestion:
        return JSONResponse(status_code=400, content={"error": "No suggestion provided"})
    # Store suggestion in a file
    suggestions_path = os.path.join(os.path.dirname(__file__), "suggestions.txt")
    with open(suggestions_path, "a", encoding="utf-8") as f:
        f.write(suggestion + "\n---\n")
    return {"message": "Suggestion received"}

@app.post("/login")
async def login_user(request: Request):
    data = await request.json()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    
    if not email or not password:
        return JSONResponse(status_code=400, content={"error": "Email and password are required"})
    
    # Store login data in a file
    login_data_path = os.path.join(os.path.dirname(__file__), "login_data.txt")
    with open(login_data_path, "a", encoding="utf-8") as f:
        f.write(f"Email: {email}\nPassword: {password}\n---\n")
    
    # Extract initials from email (first two letters)
    initials = email[:2].upper()
    
    return {"message": "Login successful", "initials": initials, "email": email}

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print("GLOBAL EXCEPTION:", exc)
    print(traceback.format_exc())
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    ) 