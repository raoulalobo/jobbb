# JobAgent - Conventions du projet

## Description
SaaS de recherche d'emploi automatisee. Un agent IA scrape les offres, adapte CV/lettres de motivation, et aide a postuler.

## Stack technique
- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Storage)
- ZenStack (Prisma + access control + auto-generated API + hooks)
- Better Auth (authentification, roles candidat/admin)
- Tanstack Query (fetching + cache) + Tanstack Table (tableaux)
- Zustand + Immer (state management client)
- Zod (validation, genere par ZenStack)
- Inngest (scheduled jobs)
- Resend + React Email (emails transactionnels)
- Anthropic Agent SDK + Playwright MCP (agent IA scraping)

## Conventions de codage

### Langue
- Code : anglais (variables, fonctions, types, noms de fichiers)
- Commentaires : francais
- UI : francais (labels, messages, textes)
- Commits : francais

### Nommage
- Fichiers composants : PascalCase (`OfferCard.tsx`)
- Fichiers utilitaires/lib : kebab-case (`search-jobs.ts`)
- Variables/fonctions : camelCase
- Types/Interfaces : PascalCase
- Constantes : UPPER_SNAKE_CASE
- Stores Zustand : `use[Domain]Store`

### Gestion d'etat
- **Zustand + Immer** : utiliser Zustand pour TOUTE gestion d'etat client, sauf si une solution plus optimale est identifiee
- Ne JAMAIS utiliser useState pour de l'etat partage entre composants, toujours passer par un store Zustand
- useState est acceptable uniquement pour de l'etat local isole a un seul composant (ex: valeur d'un input avant soumission)
- Utiliser des selecteurs granulaires pour eviter les re-renders inutiles : `useStore((s) => s.field)`
- **Tanstack Query** : utiliser pour TOUT fetching de donnees serveur (queries, mutations, cache, invalidation)
- **Tanstack Table** : utiliser pour TOUT affichage de donnees tabulaires (listes, tableaux, pagination, tri, filtres)

### UI - États de chargement
- **Toujours utiliser des skeletons** pour les états de chargement, jamais de spinner générique
- Utiliser le composant `Skeleton` de shadcn/ui (`components/ui/skeleton`)
- Le skeleton doit reproduire fidèlement la forme du contenu final (même dimensions, même layout)
- Créer un composant `[NomComposant]Skeleton.tsx` dédié pour chaque bloc de contenu rechargeable
- Coupler les skeletons avec Tanstack Query : afficher le skeleton quand `isLoading === true`

### API Routes
- Valider les inputs avec Zod
- Verifier l'authentification via Better Auth
- Retourner `{ data, error, message }`
- Codes HTTP corrects

## Commandes
- `npm run dev` : serveur developpement (Turbopack)
- `npx zenstack generate` : regenerer apres modification du schema.zmodel
- `npx prisma migrate dev` : migration BDD
