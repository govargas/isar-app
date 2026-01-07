# ISAR – Stockholm Ice Discovery

A real-time web application for discovering safe, high-quality natural ice for long-distance skating around Stockholm. ISAR combines technical data visualization with a sleek "Nordic Noir meets High-Tech" aesthetic.

![ISAR Screenshot](./docs/screenshot.png)

## Features

- **Interactive 3D Map**: Visualize Stockholm's lakes and coastal ice surfaces using Deck.gl + MapLibre
- **Ice Status System**: Four-tier status (Safe/Plogad, Uncertain, Warning, No Ice)
- **Real-time Updates**: Live data from Stockholm municipality via automated scraping
- **Community Reports**: User-submitted ice condition observations
- **Smart Filtering**: Filter by status, distance, and recent updates

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| 3D Map | Deck.gl + MapLibre GL JS |
| State | Zustand |
| Backend | Supabase (Auth, PostgreSQL + PostGIS, Realtime) |
| Scraping | Supabase Edge Functions (Deno) |
| Scheduling | pg_cron |
| Hosting | Netlify (frontend) + Supabase (backend) |

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### Setup

1. **Clone and install dependencies**

```bash
git clone https://github.com/yourusername/isar-app.git
cd isar-app
npm install
```

2. **Set up Supabase**

   - Create a new Supabase project
   - Enable the PostGIS extension in Database > Extensions
   - Run the migrations in `supabase/migrations/` via the SQL Editor
   - Run `supabase/seed.sql` to populate lakes data

3. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. **Start development server**

```bash
npm run dev
```

Visit `http://localhost:5173`

## Project Structure

```
isar-app/
├── src/
│   ├── components/
│   │   ├── map/          # Deck.gl/MapLibre components
│   │   ├── ui/           # Reusable UI components
│   │   └── layout/       # Layout components
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand stores
│   ├── lib/              # Utilities and Supabase client
│   └── types/            # TypeScript type definitions
├── supabase/
│   ├── functions/        # Edge Functions (scrapers)
│   ├── migrations/       # Database schema
│   └── seed.sql          # Initial data
└── public/
```

## Data Architecture

### Data Sources

1. **Official (Primary)**: Stockholm municipality ice reports via web scraping
2. **Forecast**: Weather data from Open-Meteo API
3. **Community**: User-submitted reports (24-hour expiry)

### Scraping Pipeline

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Data Sources   │────▶│  Edge Functions  │────▶│   PostgreSQL    │
│  (Google Sites) │     │  (Deno runtime)  │     │   + PostGIS     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
       ┌─────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────┐     ┌──────────────────┐
│  pg_cron        │────▶│  Realtime        │────▶ Frontend
│  (Scheduler)    │     │  (WebSocket)     │
└─────────────────┘     └──────────────────┘
```

## Database Schema

- `lakes` - Reference data for Stockholm area lakes with PostGIS geometry
- `ice_reports` - Official ice condition reports from scrapers
- `user_reports` - Community-submitted observations (24h expiry)
- `scrape_logs` - Audit log for monitoring data ingestion

## Deployment

### Frontend (Netlify)

```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Backend (Supabase)

Edge Functions are deployed via Supabase CLI:

```bash
supabase functions deploy scrape-isarna
supabase functions deploy fetch-forecast
```

### Cron Jobs

Set up in Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'scrape-isarna-official',
  '*/15 * * * *',
  $$SELECT net.http_post(...)$$
);
```

## Design System

### Color Palette

| Role | HEX | Usage |
|------|-----|-------|
| Background Deep | `#0A0E14` | Primary background |
| Ice Blue Primary | `#00D4FF` | Safe status, accents |
| Frost White | `#E8F4F8` | Primary text |
| Safe Green | `#00E676` | Safe/Plogad status |
| Warning Amber | `#FFAA00` | Uncertain status |
| Danger Red | `#FF4757` | Warning status |

### Typography

- **Display**: Instrument Sans
- **Monospace**: JetBrains Mono (data values)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Ice data from [Stockholm Municipality](https://sites.google.com/view/isarna)
- Weather data from [Open-Meteo](https://open-meteo.com/)
- Map tiles from [CARTO](https://carto.com/)
