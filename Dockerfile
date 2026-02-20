# ============================================================
# Dockerfile — JobAgent (Next.js + Playwright)
#
# Basé sur l'image officielle Microsoft Playwright pour Ubuntu Noble.
# Cette image embarque déjà toutes les libs système nécessaires à
# Chromium (libgtk-4, libgraphene, GStreamer, libGLESv2, etc.)
# sans avoir besoin de sudo/su pendant le build.
#
# Déploiement : Render Web Service (env: docker)
# ============================================================

# ── Étape 1 : build ─────────────────────────────────────────
FROM mcr.microsoft.com/playwright:v1.58.2-noble AS builder

WORKDIR /app

# Copie des fichiers de dépendances en premier (cache Docker optimal)
COPY package.json package-lock.json ./

# Copie des fichiers nécessaires à zenstack generate (postinstall)
COPY schema.zmodel ./
COPY prisma ./prisma/

# Installation des dépendances Node (déclenche postinstall → zenstack generate)
# PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 : le navigateur est déjà présent
# dans l'image de base, inutile de le re-télécharger
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

# Copie du reste du code source
COPY . .

# ── Variables placeholder pour next build ──────────────────
# Next.js importe tous les modules pendant le build pour les analyser.
# Sans ces vars, supabaseAdmin (createClient) et PrismaClient plantent
# à l'initialisation car les env vars sont undefined.
# Ces valeurs sont FACTICES — elles ne sont jamais utilisées en production
# (les vraies valeurs sont injectées par Render au runtime).
ENV NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder_anon_key"
ENV SUPABASE_SERVICE_ROLE_KEY="placeholder_service_role_key"
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV AUTH_SECRET="placeholder_secret_minimum_32_characters_long"
ENV BETTER_AUTH_URL="https://placeholder.onrender.com"
ENV NEXT_PUBLIC_BETTER_AUTH_URL="https://placeholder.onrender.com"
ENV ANTHROPIC_API_KEY="placeholder_anthropic_key"
ENV INNGEST_EVENT_KEY="placeholder_inngest_event_key"
ENV INNGEST_SIGNING_KEY="placeholder_inngest_signing_key"
ENV RESEND_API_KEY="placeholder_resend_key"

# Build Next.js
RUN npm run build

# ── Étape 2 : runtime ────────────────────────────────────────
# On réutilise la même image Playwright (libs système déjà présentes)
FROM mcr.microsoft.com/playwright:v1.58.2-noble AS runner

WORKDIR /app

ENV NODE_ENV=production
# Indique à Playwright où trouver les navigateurs installés dans l'image de base
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Copie uniquement ce qui est nécessaire au runtime
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Render expose le port 10000 par défaut pour les web services
EXPOSE 10000
ENV PORT=10000
ENV HOSTNAME=0.0.0.0

# Démarrage du serveur Next.js standalone
CMD ["node", "server.js"]
