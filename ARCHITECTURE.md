# Architecture

## Overview

Namma Samasye follows an **AI-assisted, workflow-controlled** architecture.

```
USER → BOT → LANGUAGE UNDERSTANDING → PREDEFINED SCENARIO ENGINE → STRUCTURED INCIDENT → RULES + VERIFIED INFORMATION → USER OPTIONS
```

## Key Principles

1. **AI is advisory, not authoritative** - AI classifies and suggests, humans decide
2. **Deterministic workflows** - Predefined question flows for each scenario
3. **Free-first** - Minimize paid API calls
4. **Privacy-preserving** - Anonymous by default
5. **Graceful degradation** - Works without AI

## Data Flow

### Incident Creation
1. User selects category OR types natural language
2. If free text → AI classifier matches to predefined scenarios
3. User confirms scenario
4. Structured workflow collects information step-by-step
5. User reviews and submits
6. Incident created with unique ID (NS-XXXXX)
7. Status tracking begins

### Admin Review
1. Admin views incident with AI interpretation
2. Original user statement preserved separately
3. Admin makes decisions independently of AI
4. Status changes logged with audit trail
5. Information requests sent to user if needed

## Security Model

- Anonymous sessions (no PII required)
- Row-level security on Supabase
- Admin role-based access control
- Audit logging for all sensitive actions
- Rate limiting on public endpoints
