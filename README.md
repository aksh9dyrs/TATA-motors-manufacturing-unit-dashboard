
---

# 🏭 Smart Manufacturing Dashboard – TATA Motors Limited

A full-stack, AI-powered analytics dashboard for smart manufacturing, combining real-time event tracking, advanced vector search, interactive AI chatbot, and rich data visualizations. Built for modern industrial operations, this project leverages FastAPI, PostgreSQL (with pgvector), and a modern JavaScript frontend.

---

## 🚀 Features

- *Real-Time Event Logging:* Track manufacturing events, machine usage, and city-wise operations.
- *Similarity & Cosine Search:* Find similar events using vector embeddings and cosine similarity for root-cause analysis.
- *AI Chatbot:* Ask questions about your manufacturing data and get AI-powered answers, including downloadable reports.
- *UMAP Visualization:* Visualize high-dimensional event embeddings in 2D.
- *Dynamic Dashboards:* Animated, responsive UI with modern charts (bar, pie, etc.) and beautiful dark mode.
- *User Authentication:* Login/Signup modal with email/password, persistent navbar with user initials.
- *Suggestions & Feedback:* Users can submit suggestions, which are stored and viewable by admins.
- *Logs & Monitoring:* View API failure logs and system events.
- *Dockerized Deployment:* Easy to run with Docker Compose, including backend, frontend, and PostgreSQL database.

---

## 🗂 Project Structure


MCP(Mnufacturing events)/
│
├── backend/
│   ├── main.py              # FastAPI backend with all API routes
│   ├── db.py                # Database access and queries
│   ├── ai_agent.py          # AI summarization and agent logic
│   ├── rag_utils.py         # RAG and search utilities
│   ├── umap_utils.py        # UMAP projection for embeddings
│   ├── schemas.py           # Pydantic schemas for API
│   ├── config.py            # Configuration (DB URL, etc.)
│   ├── requirements.txt     # Python dependencies
│   ├── payload.json         # Example payloads
│   ├── suggestions.txt      # Stores user suggestions
│   ├── login_data.txt       # Stores login/signup data
│   ├── logs/
│   │   └── api_failures.log # API failure logs
│   └── images/              # Manufacturing-related images
│
├── frontend/
│   ├── index.html           # Main HTML file with modals and layout
│   ├── app.js               # All frontend logic (tabs, charts, chatbot, etc.)
│   ├── style.css            # Custom styles and animations
│
├── db/
│   └── schema.sql           # PostgreSQL schema for manufacturing_events
│
├── compose.yaml             # Docker Compose configuration
├── README.md                # (This file)
└── .dockerignore            # Docker ignore rules


---

## 🖥 Screenshots

- *Dashboard:* Animated title with Tata logo, persistent navbar, and beautiful section headers.
- *Events Page:* Multiple charts (event type, city, machine usage, duration periods, automobile industry), dynamic news, and toggleable event table.
- *Similarity & Cosine Tabs:* Modern search UI, use-case explanations, and results.
- *AI Chatbot:* Centered, full-width, with logo, animated border, colored chat bubbles, and report download.
- *Login/Signup:* Modal with email/password, user initials in navbar after login.
- *Suggestions:* Modal for user feedback, stored in backend.

---

## 🐳 Running the Project with Docker

This project is containerized using Docker and Docker Compose, with separate services for the Python backend (FastAPI), JavaScript frontend (served by Nginx), and a PostgreSQL database.

### *Quick Start*

1. *Ensure Docker and Docker Compose are installed.*
2. *From the project root, run:*
   sh
   docker compose up --build
   
   This will build and start all services: backend, frontend, and database.

### *Ports*

- *Backend (FastAPI):* [http://localhost:8000](http://localhost:8000)
- *Frontend (Nginx):* [http://localhost:80](http://localhost:80)

### *Environment Variables*

- *PostgreSQL* (set in docker-compose.yml):
  - POSTGRES_USER=postgres
  - POSTGRES_PASSWORD=postgres
  - POSTGRES_DB=appdb
- *Backend/Frontend:* No required environment variables by default. To add any, use a .env file and uncomment the env_file lines in the compose file.

---

## 📝 Database Schema

sql
CREATE TABLE IF NOT EXISTS manufacturing_events (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    machine_name TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP NOT NULL,
    duration_minutes FLOAT,
    embedding VECTOR(1536)
);


---

## 🛠 Tech Stack

- *Frontend:* HTML, CSS, JavaScript, Chart.js, Plotly, Nginx
- *Backend:* Python 3.11, FastAPI, SQLAlchemy, pgvector, UMAP, custom AI agent
- *Database:* PostgreSQL (with vector extension)
- *DevOps:* Docker, Docker Compose

---

## 🤝 Contributing

Pull requests and suggestions are welcome! Please use the Suggestion modal in the app or open an issue.

---

## 📄 License

This project is for educational and demonstration purposes.

---

## 📬 Contact

Created and maintained by *Aksh Kumar Singh*  
[GitHub](https://github.com/aksh9dyrs) | [LinkedIn](https://www.linkedin.com/in/aksh-kumar-singh-89168822b/)

---

