# TIBELE

PWA éducative destinée aux étudiants en médecine, infirmiers et médecins en Côte d'Ivoire : fiches pathologies, forum et auto-évaluation (QCM / QCD).

> ⚠️ TIBELE est un support pédagogique, **pas un outil de conseil médical**.

## Structure

- `backend/` : API REST Express + TypeScript, Prisma, Zod, Supabase (vérification des jetons)
- `frontend/` : React + TypeScript, Vite, TailwindCSS, TanStack Query, PWA
- `docs/` : documentation (architecture, API, base de données, déploiement, guides)
- `.github/workflows/` : intégration continue

Les décisions techniques sont décrites dans [`Contexte.MD`](./Contexte.MD).

## Installation et démarrage

Prérequis : Node.js ≥ 22.12 (voir `.nvmrc`), npm.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # puis renseigner les valeurs Supabase
```

Scripts principaux : `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`.

Données de démonstration (après les migrations) : `npm run db:seed` — 3 pathologies, 30 questions QCM/QCD et quelques sujets de forum. Idempotent ; refusé en production sauf `SEED_ALLOW_PRODUCTION=true`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # URL de l'API, URL et clé publique « anon » de Supabase
npm run dev            # http://localhost:5173
```

Scripts : `npm run build` (build de production avec service worker), `npm run preview`, `npm run typecheck`, `npm run lint`, `npm test`. Les icônes PWA se régénèrent depuis `public/logo.svg` avec `npm run pwa:assets`.
