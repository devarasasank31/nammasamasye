# Namma Samasye - ನಮ್ಮ ಸಮಸ್ಯೆ

An anonymous, multilingual citizen-assistance and incident-reporting platform for Bengaluru.

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/devarasasank31/nammasamasye.git
cd nammasamasye

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Set up Supabase
# - Create a project at https://supabase.com
# - Run the SQL in src/database/schema.sql in the SQL Editor
# - Copy the URL and keys to .env.local

# 5. Run the development server
npm run dev

# 6. (Optional) Seed demo data
npx tsx src/database/seed.ts
```

## Features

- **Anonymous by default** - No personal information required
- **Multilingual** - Kannada, English, Hindi, Telugu
- **Voice input** - Talk to report issues
- **AI-assisted** - Scenario matching and classification
- **Bot-first UI** - Conversational reporting experience
- **Evidence support** - Attach Google Drive links
- **Incident tracking** - Track your report status
- **Admin dashboard** - Review and manage reports
- **Community analytics** - Area-level aggregated insights
- **Mobile-first** - Responsive design, PWA-ready

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase anonymous sessions
- **AI**: Keyword-based classification (deterministic, no paid API needed)
- **Deployment**: Vercel / Cloudflare Pages

## Architecture

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable UI components
├── lib/              # Shared utilities (Supabase, translations)
├── services/         # Business logic (session, incidents)
├── ai/               # AI classification engine
├── data/             # Static data (scenarios, resources)
├── database/         # SQL schema and seed data
├── types/            # TypeScript type definitions
└── public/           # Static assets, PWA manifest
```

## Environment Variables

See `.env.example` for required variables.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Database Schema](DATABASE.md)
- [Security](SECURITY.md)
- [Privacy](PRIVACY.md)
- [AI Safety](AI_SAFETY.md)
- [Deployment](DEPLOYMENT.md)
- [Testing](TESTING.md)

## License

MIT
