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
