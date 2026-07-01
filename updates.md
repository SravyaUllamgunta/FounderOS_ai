1. Project Title
# FounderOS AI

One-line description:

FounderOS AI is an AI-powered fundraising assistant that helps startup founders analyze investor meetings, manage relationships, generate follow-ups, and discover suitable investors.
2. Features
## Features

- AI Meeting Intelligence
- Investor Matchmaking
- Relationship Memory
- Follow-up Email Generator
- Founder Dashboard
- Fundraising Readiness Insights
3. Tech Stack
## Tech Stack

Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

Backend
- FastAPI
- Python

Database
- Supabase (PostgreSQL)

Vector Database
- Qdrant

AI
- Google Gemini API
4. Project Structure
## Project Structure

frontend/
backend/
5. Installation
## Installation

Clone the repository

git clone <repository-url>

Install frontend dependencies

cd frontend
npm install

Install backend dependencies

cd ../backend
pip install -r requirements.txt
6. Environment Variables

Example:

## Environment Variables

Frontend

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL

Backend

GEMINI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
QDRANT_URL
QDRANT_API_KEY

Don't include the actual values.

7. Running the Project
## Run Frontend

cd frontend
npm run dev

## Run Backend

cd backend
uvicorn main:app --reload