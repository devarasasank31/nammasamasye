# Database Schema

## Tables

| Table | Purpose |
|-------|---------|
| `sessions` | Anonymous user sessions |
| `incidents` | Incident reports |
| `incident_answers` | Q&A for each incident |
| `evidence` | External evidence links |
| `status_history` | Status change audit trail |
| `admin_users` | Admin accounts |
| `admin_notes` | Private admin notes |
| `community_clusters` | Recurring issue detection |
| `official_resources` | Verified government contacts |
| `audit_logs` | Admin action audit |
| `notifications` | User notifications |
| `area_statistics` | Aggregated area data |
| `ai_interpretations` | AI classification results |

## Key Relationships

- `incidents.session_id` → `sessions.id`
- `incident_answers.incident_id` → `incidents.id`
- `evidence.incident_id` → `incidents.id`
- `status_history.incident_id` → `incidents.id`
- `admin_notes.incident_id` → `incidents.id`

## Incident ID Format

- Format: `NS-XXXXX` (5 alphanumeric characters)
- Generated via PostgreSQL trigger
- Never exposes internal UUIDs

## Status Flow

```
NEW → UNDER_REVIEW → PROCEEDING → CLOSED/RESOLVED
         ↓
    MISSING_INFORMATION → (user responds) → UNDER_REVIEW
         ↓
      ON_HOLD → (resumed) → UNDER_REVIEW
         ↓
      INVALID / CLOSED
```

## Setup

Run `src/database/schema.sql` in Supabase SQL Editor.
