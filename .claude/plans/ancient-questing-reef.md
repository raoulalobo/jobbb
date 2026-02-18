# CI/CD GitHub + Vercel pour JobAgent

## Contexte

Le projet n'a pas de CI/CD. Le repo GitHub existe (`raoulalobo/jobbb`) mais le remote n'est pas connecte au repo local. Les hooks ZenStack (`src/lib/hooks/`) sont dans `.gitignore`, donc il faut les regenerer en CI et sur Vercel avant le build.

## Fichiers a creer (2)

### 1. `.github/workflows/ci.yml`

Workflow GitHub Actions declenche sur push et PR vers `main` :

- **Checkout** + **Setup Node 22** + **cache npm**
- **Install** : `npm ci`
- **ZenStack generate** : regenere Prisma client + hooks (variable `DATABASE_URL` factice car `prisma generate` n'a pas besoin de connexion reelle)
- **Lint** : `npm run lint`
- **Type-check** : `npx tsc --noEmit`
- **Build** : `npm run build`

### 2. `.env.example`

Documente toutes les variables d'environnement requises (Supabase, Better Auth, Anthropic, Inngest, Resend) avec commentaires, sans valeurs sensibles.

## Fichiers a modifier (1)

### 3. `package.json`

- Ajouter script `"postinstall": "npx zenstack generate"` pour que les hooks soient generes automatiquement apres `npm install` (fonctionne en CI et sur Vercel)

## Actions manuelles (post-implementation)

### 4. Connecter le remote GitHub + push initial

```bash
git remote add origin https://github.com/raoulalobo/jobbb.git
git push -u origin main
```

### 5. Connecter Vercel

L'utilisateur importe le projet depuis le dashboard Vercel et configure les variables d'environnement de production.

## Verification

1. Le workflow CI passe au vert sur GitHub apres push
2. Vercel deploie automatiquement a chaque push sur `main`
3. Les PR affichent un preview deploy Vercel + status CI
