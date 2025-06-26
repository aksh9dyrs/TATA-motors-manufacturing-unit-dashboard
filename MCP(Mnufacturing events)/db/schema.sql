CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS manufacturing_events (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    machine_name TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP NOT NULL,
    duration_minutes FLOAT,
    embedding VECTOR(1536)
); 