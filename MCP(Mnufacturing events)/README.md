## Running the Project with Docker

This project is containerized using Docker and Docker Compose, with separate services for the Python backend (FastAPI), JavaScript frontend (served by Nginx), and a PostgreSQL database. Below are the project-specific instructions and requirements for running the application.

### Project-Specific Docker Requirements

- **Backend**
  - Python 3.11 (slim image)
  - System dependencies: `gcc`, `libpq-dev`, `build-essential` (for `psycopg2` and other packages)
  - All Python dependencies are installed from `requirements.txt` in a virtual environment
  - Runs as a non-root user (`appuser`)
  - Exposes port **8000** (FastAPI)

- **Frontend**
  - Node.js 20 (alpine) for build stage
  - Nginx 1.25 (alpine) for serving static files
  - Runs as a non-root user (`appuser`)
  - Exposes port **80** (Nginx)

- **Database**
  - PostgreSQL (latest official image)
  - Initializes schema from `./db/schema.sql`
  - Exposes default PostgreSQL port internally (not mapped to host)
  - Uses a named volume `postgres-data` for persistent storage

### Environment Variables

- **PostgreSQL** (set in `docker-compose.yml`):
  - `POSTGRES_USER=postgres`
  - `POSTGRES_PASSWORD=postgres`
  - `POSTGRES_DB=appdb`
- **Backend/Frontend**: No required environment variables are specified by default. If you need to add any, uncomment the `env_file` lines in the compose file and provide a `.env` file in the respective directory.

### Build and Run Instructions

1. **Ensure Docker and Docker Compose are installed.**
2. **From the project root, run:**
   ```sh
   docker compose up --build
   ```
   This will build and start all services: backend, frontend, and database.

### Ports Exposed

- **Backend (FastAPI):** [http://localhost:8000](http://localhost:8000)
- **Frontend (Nginx):** [http://localhost:80](http://localhost:80)

### Special Configuration

- The backend and frontend services are built from their respective directories using custom Dockerfiles.
- The database schema is automatically initialized from `./db/schema.sql` on first run.
- All services are connected via a custom Docker network (`app-network`).
- Persistent database storage is handled via the `postgres-data` Docker volume.

**Note:** If you need to provide environment variables to the backend or frontend, create a `.env` file in the respective directory and uncomment the `env_file` line in the compose file.
