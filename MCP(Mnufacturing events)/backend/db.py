from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL
from datetime import datetime
from decimal import Decimal

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def convert_row_to_dict(row):
    result = {}
    for key, value in row._mapping.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, Decimal):
            result[key] = float(value)
        else:
            result[key] = value
    return result

def get_events():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM manufacturing_events ORDER BY id ASC"))
        return [convert_row_to_dict(row) for row in result]

def get_event_by_id(event_id):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM manufacturing_events WHERE id = :id"), {"id": event_id})
        row = result.fetchone()
        return convert_row_to_dict(row) if row else None

def get_all_embeddings():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, embedding, event_type FROM manufacturing_events WHERE embedding IS NOT NULL"))
        return [convert_row_to_dict(row) for row in result]

def get_similar_events(event_id, top_k=5):
    with engine.connect() as conn:
        emb_row = conn.execute(text("SELECT embedding FROM manufacturing_events WHERE id = :id"), {"id": event_id}).fetchone()
        if not emb_row:
            return []
        embedding = emb_row[0]
        result = conn.execute(text("""
            SELECT *, 1 - (embedding <=> :embedding) AS similarity
            FROM manufacturing_events
            WHERE id != :id
            ORDER BY embedding <=> :embedding
            LIMIT :top_k
        """), {"embedding": embedding, "id": event_id, "top_k": top_k})
        return [convert_row_to_dict(row) for row in result]

def get_cosine_similarity(event_id1, event_id2):
    with engine.connect() as conn:
        # Get embeddings for both events
        result = conn.execute(text("""
            WITH event_embeddings AS (
                SELECT id, embedding
                FROM manufacturing_events
                WHERE id IN (:id1, :id2)
            )
            SELECT 
                e1.id as event1_id,
                e2.id as event2_id,
                e1.embedding as embedding1,
                e2.embedding as embedding2,
                (e1.embedding <#> e2.embedding) as cosine_similarity
            FROM event_embeddings e1
            CROSS JOIN event_embeddings e2
            WHERE e1.id = :id1 AND e2.id = :id2
        """), {"id1": event_id1, "id2": event_id2})
        
        row = result.fetchone()
        if not row:
            return None
            
        # Get full event details
        event1 = get_event_by_id(event_id1)
        event2 = get_event_by_id(event_id2)
        
        return {
            "event1": event1,
            "event2": event2,
            "cosine_similarity": float(row._mapping.get('cosine_similarity', 0))
        } 