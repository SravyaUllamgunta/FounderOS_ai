You are a senior Full Stack engineer working on a Next.js + FastAPI application called FounderOS AI.

## Problem

The **Meeting Intelligence** feature successfully analyzes uploaded meeting transcripts using Gemini and correctly displays the analysis on the Meeting Intelligence page.

However, **none of the downstream application data is being updated**.

### Current Behavior

After a successful transcript analysis:

* ✅ Meeting Intelligence page displays the extracted summary.
* ✅ Questions asked are displayed.
* ✅ Investor concerns are displayed.
* ✅ Action items are displayed.
* ✅ Match analysis is generated.

But:

* ❌ No new follow-up appears in the Follow-up Generator.
* ❌ Dashboard statistics are not updated.
* ❌ Pending follow-up count does not increase.
* ❌ Investor information is not added or updated.
* ❌ Relationship Memory does not contain the new meeting.
* ❌ Investor Matchmaking page is not updated.
* ❌ Activity Timeline does not show the meeting.

## Important Context

We already have an End-to-End persistence test that passes successfully.

The E2E test confirms that when `/api/meetings/persist` is called, it correctly:

* Saves the meeting
* Saves investor memories
* Saves recommendations
* Creates follow-ups
* Updates dashboard counts
* Updates activity logs
* Updates follow-up status

Therefore, the persistence pipeline itself is working.

The issue is likely that **the Meeting Intelligence workflow is not triggering the persistence pipeline after analysis**, or it is failing before persistence completes.

## Your Tasks

### 1. Trace the complete Meeting Intelligence flow

Starting from:

* Transcript upload
* Gemini analysis
* Frontend rendering

Identify exactly what happens after analysis completes.

Determine whether `/api/meetings/persist` is ever called.

---

### 2. Verify persistence execution

Check whether the frontend sends a request to:

```text
POST /api/meetings/persist
```

If not, identify where it should be called.

If yes, inspect:

* payload
* response
* errors
* whether it is awaited correctly

---

### 3. Verify backend persistence

Ensure the persist endpoint successfully:

* stores the meeting
* creates/updates the investor
* stores investor memories
* stores recommendations
* creates follow-ups
* updates dashboard statistics
* creates activity log entries

Report which step fails if any.

---

### 4. Verify frontend refresh

After persistence succeeds, ensure the frontend refreshes the relevant data sources.

Pages that should immediately reflect the new meeting:

* Dashboard
* Follow-up Generator
* Relationship Memory
* Investor Matchmaking
* Investor Profile (if applicable)

Invalidate or refresh any cached queries if required.

---

### 5. Add logging

Add logs to identify where execution stops.

Example:

```python
logger.info("Meeting analysis completed")
logger.info("Calling persistence API")
logger.info("Meeting persisted successfully")
logger.info("Creating follow-up")
logger.info("Updating dashboard")
```

Frontend:

```typescript
console.log("Analysis completed");
console.log("Calling /api/meetings/persist");
console.log("Persist response:", response);
```

---

### 6. Verify Network Requests

Confirm that after analysis the browser performs:

```
Upload Transcript
        ↓
Gemini Analysis
        ↓
POST /api/meetings/persist
        ↓
GET Dashboard
GET Follow-ups
GET Memories
GET Investors
```

If any request is missing, explain why.

---

## Expected Final Behavior

After uploading and analyzing a transcript:

1. Analysis appears on the Meeting Intelligence page.
2. The meeting is automatically persisted.
3. Investor information is created or updated.
4. Relationship Memory is updated.
5. Follow-up tasks are created.
6. Dashboard pending follow-up count increases.
7. Activity timeline shows the new meeting.
8. Investor Matchmaking reflects the latest interaction.
9. No manual refresh should be required.

Your goal is to identify exactly where the workflow stops and implement the missing integration so the analysis automatically propagates to the rest of the application.
