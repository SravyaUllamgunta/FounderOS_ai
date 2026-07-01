# Project Brief

## FounderOS AI – Your AI Chief of Staff for Fundraising

FounderOS AI is an AI-powered fundraising assistant designed to help startup founders manage investor relationships and fundraising workflows more effectively. The platform acts as an intelligent co-pilot that remembers investor interactions, analyzes meetings, recommends next actions, and generates personalized follow-ups.

The system combines Large Language Models, long-term memory, semantic search, and agent orchestration to provide founders with actionable insights throughout their fundraising journey.

The platform is built around five core capabilities:

1. **Founder Daily Dashboard**

   * Displays fundraising priorities, pending follow-ups, investor insights, and readiness scores.

2. **Investor Matchmaking**

   * Recommends and ranks investors based on startup profile, industry, stage, and preferences.

3. **Meeting Intelligence**

   * Extracts structured information from meeting transcripts, identifies investor concerns, and records action items.

4. **Follow-up Generator**

   * Generates personalized investor emails, summaries, and communication drafts.

5. **Relationship Memory**

   * Maintains long-term memory of investor preferences, previous interactions, concerns, and historical context.

The system follows an agentic architecture powered by LangGraph, where specialized AI agents collaborate to retrieve information, maintain memory, generate recommendations, and assist founders in making informed fundraising decisions.

As the **Intelligence & Data Lead**, my responsibility is to design and implement the backend infrastructure, knowledge layer, memory systems, and orchestration framework that power all five product features and provide a stable foundation for future extensions and integrations.


# FounderOS AI – Person 1 Implementation Plan

## Role: Intelligence & Data Lead

---

# Responsibilities

I am responsible for:

### Infrastructure

* FastAPI Backend
* Supabase PostgreSQL Database
* SQLAlchemy ORM
* Pydantic Schemas
* Qdrant Integration
* Authentication

### Knowledge Layer Agents

1. Planner Agent
2. Retrieval Agent
3. Memory Agent
4. Scoring Agent

### APIs

* /api/dashboard
* /api/memory
* /api/investors
* /api/matchmaking

---

# Main Objective

Build the backend in a way that:

* Person 2 can add agents without modifying my code.
* Frontend can directly consume APIs.
* New agents can be plugged into LangGraph later.
* Memory and retrieval work independently of the frontend.

The backend should become the "brain and data layer" of the system.

---

# Architecture

Frontend
↓
FastAPI APIs
↓
LangGraph Orchestrator
↓
Planner Agent
↓
Knowledge Layer
↓
Supabase PostgreSQL + Qdrant

---

# Technology Stack

## Backend

* FastAPI
* LangGraph
* SQLAlchemy
* Pydantic

## AI

* Gemini 2.5 Flash
* sentence-transformers
* Qdrant

## Storage

* Supabase PostgreSQL
* Qdrant

## Utilities

* Pandas
* NumPy
* NetworkX

---

# Project Structure

backend/
│
├── agents/
│   ├── planner/
│   ├── retrieval/
│   ├── memory/
│   └── scoring/
│
├── graphs/
│   └── founder_graph.py
│
├── api/
│   ├── dashboard.py
│   ├── investors.py
│   ├── memory.py
│   └── matchmaking.py
│
├── database/
│   ├── session.py
│   └── base.py
│
├── models/
│
├── schemas/
│
├── services/
│
├── tools/
│   ├── qdrant_tool.py
│   └── embedding_tool.py
│
├── utils/
│
└── main.py

---

# Database Design

## users

id
name
email
password_hash

---

## investors

id
name
firm
focus
stage
preferences

---

## meetings

id
investor_id
transcript
summary
date

---

## memories

id
investor_id
memory
memory_type
created_at

---

## recommendations

id
investor_id
action
reason
status

---

## followups

id
meeting_id
email
status

---

# Qdrant Collections

## investor_memories

Stores:

* preferences
* concerns
* interests

---

## meeting_transcripts

Stores:

* summaries
* transcripts

---

## investor_notes

Stores:

* miscellaneous notes

---

# sentence-transformers

Model:

all-MiniLM-L6-v2

Used for:

* vector embeddings
* semantic search
* memory retrieval

---

# Authentication

Simple JWT authentication.

Tables:

users

Endpoints:

POST /register

POST /login

Dependencies:

get_current_user()

---

# Planner Agent

## Purpose

Brain of the system.

Decides:

* which agents to call
* in what order
* what state to maintain

---

# Input

{
"query":
"I met XL Ventures yesterday"
}

---

# Output

{
"workflow":
[
"extract",
"memory",
"recommend",
"communicate"
]
}

---

# Technology

LangGraph
Gemini 2.5 Flash API

---

# Planner State

class FounderState:

```python
query
workflow
extracted_data
memories
scores
recommendations
explanation
communication
```

This state object should be extensible so future agents can add fields.

---

# LangGraph Design

START
↓
Planner
↓
Conditional Routing
↓
Knowledge Layer
↓
Action Layer
↓
END

Person 2 agents should be simple nodes that can later be plugged in.

---

# Retrieval Agent

## Purpose

Retrieve context.

Sources:

Supabase PostgreSQL
Qdrant

---

# Functions

get_investor()

get_meetings()

get_memories()

semantic_search()

---

# Inputs

investor name
meeting id
memory query

---

# Outputs

structured context

---

# Flow

Request
↓
PostgreSQL retrieval
↓
Qdrant semantic search
↓
Combined context

---

# Memory Agent

## Purpose

Store and update memories.

---

# Functions

create_memory()

update_memory()

search_memory()

delete_memory()

---

# Memory Types

preference

concern

meeting_note

action_item

relationship_note

---

# Memory Flow

Meeting information
↓
Embedding generation
↓
Store in Qdrant
↓
Store metadata in PostgreSQL

---

# Why use both?

PostgreSQL:

structured filtering, relationships, joins and transactional storage.

Qdrant:

semantic search and vector similarity retrieval.

---

# Scoring Agent

## Purpose

Compute scores.

---

# Scores

Investor Match Score

Fundraising Readiness Score

Priority Score

---

# Technology

NumPy
Pandas

No LLM.

---

# Functions

calculate_match_score()

calculate_priority_score()

calculate_readiness_score()

---

# Example

Input:

industry
stage
preferences

Output:

{
"score": 89
}

---

# APIs

# Dashboard

GET /api/dashboard

Returns:

pending actions
scores
upcoming meetings

---

# Investors

GET /api/investors

GET /api/investors/{id}

POST /api/investors

---

# Memory

GET /api/memory

POST /api/memory

PUT /api/memory/{id}

DELETE /api/memory/{id}

---

# Matchmaking

POST /api/matchmaking

Returns:

investor rankings
match scores

---

# Service Layer

Never call database directly from agents.

Create services:

InvestorService

MemoryService

MeetingService

ScoreService

This makes future changes easier.

---

# API Contracts For Person 2

Planner Input:

{
"query": ""
}

Extraction Agent Output:

{
"investor_name": "",
"concerns": [],
"next_steps": [],
"interest_level": ""
}

Recommendation Input:

{
"memories": [],
"scores": [],
"meeting_data": {}
}

Communication Input:

{
"investor": {},
"recommendations": []
}

---

# Development Order

Phase 1
Project setup

Phase 2
Database models

Phase 3
Authentication

Phase 4
Qdrant integration

Phase 5
Retrieval Agent

Phase 6
Memory Agent

Phase 7
Scoring Agent

Phase 8
Planner Agent

Phase 9
LangGraph orchestration

Phase 10
APIs

Phase 11
Testing

Phase 12
Integration with Person 2

---

# Integration Rules

Person 2 should never:

modify database models

modify LangGraph core

modify authentication

modify Qdrant services

They only add:

new agent nodes
frontend
new API consumers

---

# Final Workflow

User Request
↓
Planner Agent
↓
Retrieval Agent
↓
Memory Agent
↓
Scoring Agent
↓
Person 2 Agents
↓
Response
↓
Dashboard Update

---

# Deliverables

✅ Working FastAPI backend

✅ Supabase PostgreSQL database

✅ Qdrant memory system

✅ LangGraph orchestration

✅ Planner Agent

✅ Retrieval Agent

✅ Memory Agent

✅ Scoring Agent

✅ REST APIs

✅ Documentation for frontend integration
