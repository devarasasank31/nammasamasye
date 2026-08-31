# Testing

## Manual Testing Checklist

### Public User Flow
- [ ] Landing page loads correctly
- [ ] Language selection works
- [ ] Anonymous session is created
- [ ] Bot greeting appears
- [ ] Category selection works
- [ ] Free text input works
- [ ] AI scenario matching returns results
- [ ] Structured workflow questions appear
- [ ] Evidence links can be added
- [ ] Incident can be submitted
- [ ] Incident ID is generated (NS-XXXXX)
- [ ] Incident tracking works
- [ ] Community page loads with stats

### Admin Flow
- [ ] Admin dashboard loads
- [ ] KPI cards show correct numbers
- [ ] Reports table loads
- [ ] Filtering works
- [ ] Search by incident ID works
- [ ] Report detail page loads
- [ ] Status can be changed
- [ ] Admin notes can be added
- [ ] Evidence links accessible
- [ ] Export CSV works

### Language Support
- [ ] Kannada text renders correctly
- [ ] Hindi text renders correctly
- [ ] Telugu text renders correctly
- [ ] Language switching works mid-flow

### Edge Cases
- [ ] Empty submission prevented
- [ ] Very long text handled
- [ ] Invalid evidence URLs handled
- [ ] Network error shows friendly message
- [ ] AI unavailable fallback works

## Running Tests

```bash
npm test
npm run lint
npm run typecheck
```
