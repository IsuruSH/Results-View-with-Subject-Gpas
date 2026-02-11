# ResultView Client

Student Results Portal — React frontend for viewing University of Ruhuna results and calculating subject-wise GPAs.

## Project Structure

```
Results-View-with-Subject-Gpas/
├── src/
│   ├── __tests__/          # Test files
│   │   ├── setup.ts        # Test setup (jest-dom)
│   │   ├── api.test.ts     # API service tests
│   │   └── grades.test.ts  # Grade constants tests
│   ├── components/
│   │   └── ProtectedRoute.tsx  # Auth guard for routes
│   ├── constants/
│   │   └── grades.ts       # Grade scale, options, GPA labels
│   ├── context/
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── pages/
│   │   ├── Login.tsx       # Login page
│   │   └── Results.tsx     # Results viewer + GPA calculator
│   ├── services/
│   │   └── api.ts          # Backend API client
│   ├── types/
│   │   └── index.ts        # Shared TypeScript interfaces
│   ├── App.tsx             # Root component with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles + Tailwind
├── .env                    # Development env (git-ignored)
├── .env.production         # Production env (git-ignored)
├── .env.example            # Template for env variables
├── vitest.config.ts        # Vitest configuration
├── vercel.json             # Vercel deployment config
└── package.json
```

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. The .env file points to localhost:4000 by default
#    Make sure the backend (res_proxy) is running locally

# 3. Start dev server
npm run dev
```

Opens at `http://localhost:5173`.

### Production Build

```bash
npm run build     # Build for production (uses .env.production)
npm run preview   # Preview the production build locally
```

## Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_SERVER_URL` | `http://localhost:4000` | `https://res-proxy.onrender.com` |

Vite automatically loads `.env` for dev and `.env.production` for `vite build`.

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

## Deployment

Deployed on **Vercel**. The `vercel.json` rewrites all routes to `index.html` for SPA routing.

## Tech Stack

- **React 18** + TypeScript
- **Vite** — build tool
- **Tailwind CSS** — styling
- **Framer Motion** — animations
- **React Router** — client-side routing
- **Vitest** — testing
