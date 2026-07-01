# FounderOS AI

FounderOS AI is an AI-powered fundraising assistant that helps startup founders analyze investor meetings, manage relationships, generate follow-ups, and discover suitable investors.

---

## Architecture Diagram

Here is a detailed representation of the system architecture, detailing data flow from the Next.js frontend to FastAPI backend service layers, LangGraph AI agent execution, and isolated databases:

```mermaid
graph TD
    subgraph Frontend ["Next.js Frontend"]
        UI["User Interface (React / Tailwind)"]
        Hooks["React Hooks (useMeetingIntelligence, etc.)"]
        API["API Client (Axios client.ts)"]
        UI --> Hooks
        Hooks --> API
    end

    subgraph Backend ["FastAPI Backend API"]
        Router["API Router (/api/meetings/persist, /api/dashboard, etc.)"]
        Auth["Auth Dependency (JWT Bearer Token validation)"]
        Services["Service Layer (InvestorService, MemoryService, etc.)"]
        
        API --> Router
        Router --> Auth
        Router --> Services
    end

    subgraph LLM_Agent_Layer ["LangGraph & LLM Agent Layer"]
        Graph["LangGraph Orchestrator"]
        ExtractAgent["Extraction Agent (Gemini parsing)"]
        RecAgent["Recommendation Agent (Action generation)"]
        CommAgent["Communication Agent (Follow-up drafting)"]
        ExplainAgent["Explanation Agent (Recommendation breakdown)"]
        
        Services --> Graph
        Graph --> ExtractAgent
        Graph --> RecAgent
        Graph --> CommAgent
        Graph --> ExplainAgent
    end

    subgraph Data_Storage ["Data & Knowledge Storage"]
        PostgreSQL[("Supabase PostgreSQL DB")]
        Qdrant[("Qdrant Vector DB")]
        
        Services --> PostgreSQL
        Services --> Qdrant
        
        subgraph SQL_Tables ["Tenant-Isolated SQL Tables"]
            Users["users"]
            Investors["investors (owner_id filtered)"]
            Meetings["meetings (owner_id filtered)"]
            Memories["memories (owner_id filtered)"]
            Followups["followups (owner_id filtered)"]
            ActivityLogs["activity_logs (owner_id filtered)"]
            Emails["emails (owner_id filtered)"]
        end
        
        subgraph Vector_Collections ["Multi-Tenant Vector Collections"]
            MemoriesColl["investor_memories (owner_id payload key)"]
            NotesColl["investor_notes (owner_id payload key)"]
            TranscriptsColl["meeting_transcripts (owner_id payload key)"]
        end
        
        PostgreSQL --- SQL_Tables
        Qdrant --- Vector_Collections
    end

    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef primary fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef secondary fill:#efebe9,stroke:#5d4037,stroke-width:2px;
    classDef storage fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef agent fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    
    class UI,Hooks,API primary;
    class Router,Auth,Services secondary;
    class Graph,ExtractAgent,RecAgent,CommAgent,ExplainAgent agent;
    class PostgreSQL,Qdrant,SQL_Tables,Vector_Collections storage;
```

---

## Features

- **AI Meeting Intelligence**: Automatically parse and extract key summaries, objections, queries, and action items from uploaded investor meeting transcripts.
- **Investor Matchmaking**: Grade alignment and suitability scores using semantic vectors based on investor location, typical checks, preferences, and sectors.
- **Relationship Memory**: Save objection/concern histories, relationship status updates, and durable investor preferences.
- **Follow-up Email Generator**: Auto-compile professional follow-up draft responses using context gathered from meeting summaries.
- **Founder Dashboard**: Real-time insights, priority scores, upcoming meetings lists, and metrics detailing pending follow-ups.
- **Fundraising Readiness Insights**: Structured breakdown explaining matched recommendations to improve success.

---

## Tech Stack

### Frontend
- **Framework**: Next.js
- **UI Logic**: React
- **Type Safety**: TypeScript
- **Styling**: Tailwind CSS

### Backend
- **Framework**: FastAPI (Python)
- **Database ORM**: SQLAlchemy

### Database Layer
- **SQL DB**: Supabase (PostgreSQL)
- **Vector DB**: Qdrant Vector Cloud

### AI Models & Agents
- **Orchestration**: LangGraph
- **Language Models**: Google Gemini 2.5 Flash / Pro (via google-genai)

---

## Project Structure

```text
FounderOS/
├── frontend/     # Next.js Application and React UI Components
└── backend/      # FastAPI REST Application, Services and LangGraph Agents
```

---

## Installation

### Clone the repository
```bash
git clone <repository-url>
cd FounderOS
```

### Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Install Backend Dependencies
```bash
cd ../backend
pip install -r requirements.txt
```

---

## Environment Variables

Create `.env` files in both directories based on the templates below (do not expose private secrets).

### Frontend Configuration
Create `frontend/.env` with the following parameters:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Configuration
Create `backend/.env` with the following parameters:
```env
GEMINI_API_KEY=your-gemini-developer-api-key
SUPABASE_URL=your-supabase-db-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
QDRANT_URL=your-qdrant-cloud-cluster-endpoint
QDRANT_API_KEY=your-qdrant-read-write-api-key
```

---

## Running the Project

### Start Frontend Application
```bash
cd frontend
npm run dev
```

### Start Backend Service
```bash
cd backend
uvicorn main:app --reload
```
