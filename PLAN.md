# Plan d'implementation - JobAgent

## Contexte
SaaS Next.js permettant a des candidats de configurer leurs criteres de recherche d'emploi via une interface, puis un agent IA (Anthropic Agent SDK + Playwright) scrape automatiquement les offres, adapte CV/lettres, et aide a postuler. La recherche est planifiee quotidiennement via Inngest.

## Stack technique
- **Framework** : Next.js (App Router, TypeScript, Tailwind CSS)
- **BDD** : Supabase (PostgreSQL cloud + Storage pour images/PDF)
- **ORM + Access Control** : ZenStack (Prisma + policies + auto-generated API + hooks)
- **Auth** : Better Auth (email/password, roles candidat/admin)
- **State** : Zustand + Immer (etat client)
- **Data Fetching** : Tanstack Query + Tanstack Table
- **Validation** : Zod (genere par ZenStack)
- **Scheduler** : Inngest (cron jobs)
- **Emails** : Resend + React Email (notifications)
- **Agent IA** : Anthropic Agent SDK + Playwright MCP (scraping adaptatif)
- **UI** : shadcn/ui
- **Deploiement** : Vercel

---

## Phases d'implementation

### Phase 0 : Installation des Skills Claude Code [TERMINEE]
- [x] Installer les skills pour guider le developpement
- [x] vercel-react-best-practices
- [x] frontend-design
- [x] vercel-composition-patterns
- [x] agent-browser
- [x] supabase-postgres-best-practices
- [x] better-auth-best-practices
- [x] next-best-practices
- [x] web-design-guidelines
- [x] code-simplifier

### Phase 1 : Fondations (Setup projet + Auth + DB) [TERMINEE]
- [x] Initialiser Next.js avec App Router, TypeScript, Tailwind, ESLint
- [x] Installer et configurer shadcn/ui (16 composants)
- [x] Configurer Supabase (connexion via pooler eu-west-1)
- [x] Configurer ZenStack + Prisma avec le schema complet (9 modeles)
- [x] Configurer Better Auth (login/register email+password, roles)
- [x] Creer les pages auth : login, register
- [x] Creer le layout dashboard avec sidebar
- [x] Installer Tanstack Query + Tanstack Table + Zustand/Immer
- [x] Creer les stores Zustand (ui-store, search-store)
- [x] Migration BDD reussie vers Supabase
- [ ] **Test** : register -> login -> acces dashboard -> redirect si non connecte

### Phase 2 : Profil candidat [TERMINEE]
1. [x] Creer l'API route ZenStack auto-generated (`/api/model/[...path]`)
2. [x] Creer la page profil avec formulaire complet (competences en tags, experiences editables)
3. [x] Upload photo de profil vers Supabase Storage
4. [x] Configurer Zustand store pour l'etat UI
5. [ ] **Test** : creer/modifier profil -> verifier persistance en BDD

### Phase 3 : Criteres de recherche [TERMINEE]
1. [x] Creer la page `/searches` avec liste de SearchConfig (cards)
2. [x] Formulaire modal pour ajouter/editer un critere
3. [x] Toggle actif/inactif par critere
4. [x] Bouton "Lancer cette recherche maintenant" (appelle `/api/agent/search`)
5. [x] Store Zustand `search-config-store` pour l'etat du formulaire
6. [ ] **Test** : CRUD criteres -> verifier en BDD

### Phase 4 : Agent de scraping [TERMINEE]
- [x] Installer `@anthropic-ai/claude-agent-sdk` + Playwright MCP
- [x] Creer l'orchestrateur agent (`lib/agent/orchestrator.ts`)
- [x] Creer l'API route `/api/agent/search` (lance l'agent avec les criteres)
- [x] Stocker les offres en BDD (dedoublonnees par userId + url)
- [x] Scraping detail de l'offre (description complete via heuristique DOM)
- [x] Nettoyage description via Claude Haiku (post-processing)

### Phase 5 : Liste et detail des offres [TERMINEE]
- [x] Page `/offers` : liste paginee avec filtres (source, contrat, nouveau, favori, recherche texte)
- [x] Page `/offers/[id]` : detail complet de l'offre avec skeleton
- [x] Marquer comme lu (isNew -> false) a l'ouverture
- [x] Toggle bookmark
- [x] Skeletons (OfferCardSkeleton, OfferDetailSkeleton)

### Phase 6 : Generation CV + Lettre de motivation [TERMINEE]
- [x] `lib/agent/generate-application.ts` : generation via Claude Sonnet 4.6
- [x] Bouton "Postuler avec l'IA" sur la page detail offre
- [x] POST `/api/agent/apply` : endpoint de generation + sauvegarde Application
- [x] Contrainte unique [userId, offerId] sur Application (upsert)
- [x] Redirection vers `/applications` apres generation

### Phase 7 : Candidature assistee [REPORTEE]
- [ ] Remplissage automatique de formulaire (Playwright + Sonnet)
- Reporte apres Phase 9 — complexite elevee, necessite test en environnement stable

### Phase 8 : Suivi des candidatures [TERMINEE]
- [x] Page `/applications` : tableau Tanstack Table avec tri et filtre par statut
- [x] `ApplicationStatusBadge` : 6 statuts (draft/ready/sent/interview/rejected/accepted)
- [x] Page `/applications/[id]` : modification statut + notes + onglets CV/Lettre
- [x] Skeletons (ApplicationsTableSkeleton, ApplicationDetailSkeleton)

### Phase 9 : Scheduler Inngest [TERMINEE]
- [x] Installer Inngest v3
- [x] `src/lib/inngest/client.ts` : client + schema typesafe des evenements
- [x] `src/lib/inngest/functions/scheduled-search.ts` : cron toutes les minutes, detecte les users a lancer
- [x] `src/lib/inngest/functions/run-user-search.ts` : handler event, scraping + upsert offres par user
- [x] `src/app/api/inngest/route.ts` : serve GET/POST/PUT pour Inngest Cloud
- [x] `src/components/settings/ScheduleConfigForm.tsx` : formulaire isActive/heure/minute/timezone
- [x] `src/components/settings/ScheduleConfigSkeleton.tsx` : skeleton du formulaire
- [x] `src/app/(dashboard)/settings/page.tsx` : page parametres complete
- [ ] **Activation requise** : configurer INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY + enregistrer l'URL dans le dashboard Inngest

### Phase 10 : Notifications email
1. Configurer Resend + React Email
2. Creer le template `new-offers.tsx` (notification nouvelles offres)
3. Creer le template `welcome.tsx` (bienvenue apres inscription)
4. Inngest function `send-notifications` apres chaque recherche
5. **Test** : trigger recherche -> verifier email recu

### Phase 11 : Admin
1. Page `/admin/users` : liste des utilisateurs, ban, stats
2. Page `/admin/stats` : stats globales (users, offres, candidatures)
3. Middleware de protection par role admin
4. **Test** : acces admin -> gestion users -> verifier restrictions candidat

### Phase 12 : Deploiement Vercel
1. Configurer variables d'environnement Vercel
2. Configurer Inngest pour Vercel
3. Verifier Supabase en production
4. Deployer
5. **Test** : flow complet en production

---

## Architecture des fichiers

```
jobbb/
├── prisma/
│   └── schema.prisma                    # Genere par ZenStack
│
├── schema.zmodel                        # Schema ZenStack (source de verite)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Layout principal + providers
│   │   ├── page.tsx                     # Landing page
│   │   │
│   │   ├── (auth)/                      # Groupe routes auth
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (dashboard)/                 # Groupe routes authentifiees
│   │   │   ├── layout.tsx               # Sidebar + header
│   │   │   ├── dashboard/page.tsx       # Stats, nouvelles offres
│   │   │   ├── profile/page.tsx         # Formulaire profil candidat
│   │   │   ├── searches/page.tsx        # CRUD criteres de recherche
│   │   │   ├── offers/
│   │   │   │   ├── page.tsx             # Liste offres paginee + filtres
│   │   │   │   └── [id]/page.tsx        # Detail offre + adapter CV/lettre
│   │   │   ├── applications/page.tsx    # Suivi candidatures
│   │   │   └── settings/page.tsx        # Scheduler toggle, notifications
│   │   │
│   │   ├── (admin)/                     # Groupe routes admin
│   │   │   ├── layout.tsx
│   │   │   └── admin/
│   │   │       ├── users/page.tsx
│   │   │       └── stats/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/[...all]/route.ts   # Better Auth handler
│   │       ├── inngest/route.ts         # Inngest serve endpoint
│   │       ├── model/[...path]/route.ts # ZenStack auto-generated CRUD
│   │       ├── agent/
│   │       │   ├── search/route.ts      # Declencher recherche agent
│   │       │   └── apply/route.ts       # Adapter CV/lettre + postuler
│   │       └── email/
│   │           └── notify/route.ts      # Envoyer notification email
│   │
│   ├── lib/
│   │   ├── auth.ts                      # Config Better Auth (server)
│   │   ├── auth-client.ts              # Better Auth client hooks
│   │   ├── db.ts                        # Client Prisma enhanced (ZenStack)
│   │   ├── utils.ts                     # Utilitaire cn() pour classes CSS
│   │   ├── inngest/
│   │   │   ├── client.ts
│   │   │   └── functions/
│   │   │       ├── daily-search.ts
│   │   │       └── send-notifications.ts
│   │   ├── agent/
│   │   │   ├── orchestrator.ts
│   │   │   └── tools/
│   │   │       ├── search-jobs.ts
│   │   │       ├── scrape-offer.ts
│   │   │       ├── adapt-cv.ts
│   │   │       ├── adapt-letter.ts
│   │   │       └── fill-form.ts
│   │   ├── stores/
│   │   │   ├── ui-store.ts
│   │   │   └── search-store.ts
│   │   ├── hooks/                       # Auto-genere par ZenStack (tanstack-query)
│   │   └── email/
│   │       └── templates/
│   │           ├── new-offers.tsx
│   │           └── welcome.tsx
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui (auto-genere)
│   │   ├── providers/
│   │   │   └── QueryProvider.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── profile/
│   │   ├── search/
│   │   ├── offers/
│   │   ├── applications/
│   │   └── dashboard/
│   │
│   └── config/
│       └── templates/
│           ├── cv-template.md
│           └── letter-template.md
│
├── emails/                              # React Email templates (preview dev)
├── CLAUDE.md                            # Conventions du projet
├── PLAN.md                              # Ce fichier
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── components.json                      # Config shadcn/ui
├── .env.local                           # Variables d'environnement
└── .env                                 # DATABASE_URL pour Prisma CLI
```

---

## Variables d'environnement requises

| Variable | Description | Statut |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (pooler) | Configure |
| `DIRECT_URL` | Connection directe PostgreSQL (migrations) | Configure |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Configure |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cle publique Supabase | Configure |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service role Supabase | Configure |
| `AUTH_SECRET` | Secret Better Auth | Configure |
| `BETTER_AUTH_URL` | URL de base Better Auth | Configure |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | URL publique Better Auth | Configure |
| `ANTHROPIC_API_KEY` | Cle API Anthropic | A configurer |
| `INNGEST_EVENT_KEY` | Cle Inngest | A configurer |
| `INNGEST_SIGNING_KEY` | Cle de signature Inngest | A configurer |
| `RESEND_API_KEY` | Cle API Resend | A configurer |

---

## Workflow principal
1. Candidat s'inscrit -> cree son profil -> configure ses criteres de recherche
2. Clic "Rechercher" ou scheduler automatique -> agent scrape les offres
3. Candidat consulte les offres -> adapte CV/lettre -> postule
4. Suivi des candidatures avec statuts
