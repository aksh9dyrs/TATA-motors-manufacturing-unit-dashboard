from pydantic import BaseModel
from typing import List, Optional, Any

class Event(BaseModel):
    id: int
    event_type: str
    machine_name: str
    notes: Optional[str]
    timestamp: str
    city : str
    duration_minutes: float
    embedding: Optional[list]

class SimilarityRequest(BaseModel):
    event_id: int

class AskRequest(BaseModel):
    question: str

class UMAPResponse(BaseModel):
    points: list
    labels: list

class APIResponse(BaseModel):
    data: Any
    meta: dict 