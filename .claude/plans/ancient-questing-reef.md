# Ajouter la pagination LinkedIn au scraping

## Contexte

Actuellement, `scrapeSite()` ne scrape que la première page de résultats LinkedIn (~25 offres). LinkedIn pagine avec le paramètre `&start=25` (page 2), `&start=50` (page 3), etc. L'utilisateur veut scraper jusqu'à 3 pages max (~75 offres).

## Fichier à modifier : `src/lib/agent/orchestrator.ts`

### Constantes à ajouter/modifier
- `MAX_PAGES = 3` — nombre max de pages à scraper
- `LINKEDIN_RESULTS_PER_PAGE = 25` — offres par page LinkedIn
- `MAX_OFFERS_PER_SITE` : 15 → 75

### Modifier `scrapeSite()` — boucle de pagination

Après le login réussi, au lieu de naviguer une seule fois :

```
Pour page = 0, 1, 2 :
  1. URL = buildSearchUrl(...) + "&start=" + (page * 25)
  2. playwrightNavigate(sessionName, url)
  3. Vérifier pas de blocage (captcha/checkpoint)
  4. playwrightScroll(sessionName)
  5. snapshot = playwrightSnapshot(sessionName)
  6. links = playwrightExtractLinks(sessionName, jobLinkSelector)
  7. Accumuler snapshots[] + allLinks[]
  8. Si snapshot < 500 chars ou 0 nouveaux liens → break
  9. Log: "[Agent] Page X/3 : Y liens extraits"
Fermer navigateur une seule fois à la fin
Retourner { snapshot: concaténé, links: tous }
```

### Modifier `extractOffersFromSnapshot()`
- Troncature snapshot : 10000 → 30000 chars (3 pages)
- `max_tokens` : 2048 → 4096
- Le prompt reste identique

## Vérification

1. Lancer une recherche depuis `/searches`
2. Logs serveur : `[Agent] Page 1/3`, `[Agent] Page 2/3`, etc.
3. Plus d'offres retournées qu'avant (>25 si disponibles)
4. Si <3 pages de résultats, la boucle s'arrête proprement
