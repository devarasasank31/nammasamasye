# Security

## Measures

### Authentication
- Anonymous sessions (no PII required)
- Admin authentication via Supabase Auth
- Session tokens stored in localStorage

### Authorization
- Admin roles: SUPER_ADMIN, ADMIN, REVIEWER, VIEW_ONLY
- Row-level security on Supabase tables
- Protected admin routes

### Data Protection
- No personal information collected from public users
- Evidence stored as external links only (MVP)
- Private admin notes never exposed to public users
- Community aggregation uses area-level data only

### Rate Limiting
- Incident creation: Limited per session
- AI requests: Rate limited
- Public analytics: Cached and rate limited

### Input Validation
- Zod schemas for API validation
- SQL injection protection via Supabase
- XSS protection via React escaping
- CSRF protection via SameSite cookies

### Audit Logging
- All admin actions logged
- Status changes recorded with admin ID and timestamp
- Evidence access logged

## Security Checklist

- [x] No API keys in frontend code
- [x] Row-level security enabled
- [x] Admin routes protected
- [x] Input validation on all endpoints
- [x] Rate limiting implemented
- [x] Audit logging for sensitive actions
- [x] Secure session handling
- [x] No PII collection from public users
