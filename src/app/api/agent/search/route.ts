import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import {
  runSearchAgent,
  type SearchCriteria,
} from "@/lib/agent/orchestrator";

/**
 * Role : API route pour declencher une recherche d'offres LinkedIn via l'agent IA
 * Methode : POST
 * Body : { searchConfigId: string }
 * Auth : requiert une session active
 *
 * Flux :
 *   1. Verifie l'authentification
 *   2. Charge la SearchConfig depuis la BDD
 *   3. Charge le Profile pour recuperer les identifiants LinkedIn
 *   4. Verifie que les identifiants LinkedIn sont renseignes (erreur 400 sinon)
 *   5. Lance l'agent de scraping LinkedIn authentifie
 *   6. Stocke les offres en BDD avec deduplication (upsert sur userId + url)
 *   7. Retourne le nombre d'offres trouvees et nouvelles
 *
 * Exemple d'appel :
 *   POST /api/agent/search
 *   Body: { "searchConfigId": "clxyz..." }
 *   Response: { data: { total: 15, new: 8, updated: 7 }, message: "..." }
 *
 * Interactions :
 *   - prisma.profile.findUnique : pour charger les identifiants LinkedIn
 *   - prisma.searchConfig.findUnique : pour charger la configuration de recherche
 *   - runSearchAgent() : lance le scraping LinkedIn authentifie
 *   - prisma.offer.upsert : deduplication par userId + url
 */
export async function POST(request: NextRequest) {
  try {
    // Verification de l'authentification via Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorise" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Extraction et validation du body
    const body = await request.json();
    const { searchConfigId } = body;

    if (!searchConfigId) {
      return NextResponse.json(
        { error: "searchConfigId requis" },
        { status: 400 }
      );
    }

    // Charger la SearchConfig depuis la BDD
    // Verification que la config appartient a l'utilisateur
    const searchConfig = await prisma.searchConfig.findUnique({
      where: { id: searchConfigId },
    });

    if (!searchConfig) {
      return NextResponse.json(
        { error: "Configuration de recherche introuvable" },
        { status: 404 }
      );
    }

    if (searchConfig.userId !== userId) {
      return NextResponse.json(
        { error: "Acces refuse a cette configuration" },
        { status: 403 }
      );
    }

    // Charger le profil de l'utilisateur pour recuperer les identifiants LinkedIn
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    // Verifier que les identifiants LinkedIn sont renseignes
    if (!profile?.linkedinEmail || !profile?.linkedinPassword) {
      return NextResponse.json(
        {
          error: "Identifiants LinkedIn manquants. Renseignez votre email et mot de passe LinkedIn dans votre profil (/profile) avant de lancer une recherche.",
        },
        { status: 400 }
      );
    }

    // Construire les criteres de recherche avec les identifiants LinkedIn
    const criteria: SearchCriteria = {
      query: searchConfig.query,
      location: searchConfig.location,
      sites: searchConfig.sites as string[],
      contractTypes: searchConfig.contractTypes as string[],
      remote: searchConfig.remote,
      salaryMin: searchConfig.salaryMin,
      excludeKeywords: (searchConfig.excludeKeywords as string[]) || [],
      linkedinEmail: profile.linkedinEmail,
      linkedinPassword: profile.linkedinPassword,
    };

    console.log(
      `[API] Lancement recherche LinkedIn pour user=${userId}, config="${searchConfig.name}"`
    );

    // Lancer l'agent de scraping LinkedIn authentifie
    const scrapedOffers = await runSearchAgent(criteria, userId);

    console.log(
      `[API] Agent termine : ${scrapedOffers.length} offres trouvees`
    );

    // Stocker les offres en BDD avec deduplication
    // Utilise upsert : si l'offre existe deja (meme userId + url), on met a jour
    let newCount = 0;
    let updatedCount = 0;

    for (const offer of scrapedOffers) {
      // Ignorer les offres sans URL valide
      if (!offer.url) continue;

      try {
        const result = await prisma.offer.upsert({
          where: {
            // Contrainte unique : @@unique([userId, url]) dans le schema
            userId_url: {
              userId,
              url: offer.url,
            },
          },
          create: {
            userId,
            title: offer.title,
            company: offer.company,
            location: offer.location,
            url: offer.url,
            description: offer.description,
            salary: offer.salary,
            contractType: offer.contractType,
            source: offer.source,
            // Marquage "sandbox" : offre creee par un declenchement manuel via /searches
            // N'est defini QUE dans create → l'origine initiale est preservee si l'offre existait deja
            origin: "sandbox",
            isNew: true,
            isBookmarked: false,
          },
          update: {
            // Mettre a jour les champs qui peuvent avoir change
            title: offer.title,
            company: offer.company,
            location: offer.location,
            description: offer.description,
            salary: offer.salary,
            contractType: offer.contractType,
            // origin intentionnellement absent → preserve l'origine de la premiere decouverte
          },
        });

        // Determiner si c'est une creation ou une mise a jour
        // Si createdAt est recent (< 5s), c'est une nouvelle offre
        const isNewOffer =
          Date.now() - result.createdAt.getTime() < 5000;

        if (isNewOffer) {
          newCount++;
        } else {
          updatedCount++;
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error(
          `[API] Erreur upsert offre "${offer.title}":`,
          err.message
        );
        // Continuer avec les autres offres meme si une echoue
      }
    }

    console.log(
      `[API] Stockage termine : ${newCount} nouvelles, ${updatedCount} mises a jour`
    );

    return NextResponse.json({
      data: {
        total: scrapedOffers.length,
        new: newCount,
        updated: updatedCount,
        searchConfigId,
      },
      message: `Recherche terminee : ${newCount} nouvelle(s) offre(s) trouvee(s), ${updatedCount} mise(s) a jour`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Agent search error:", err.message);

    // Message d'erreur specifique si la cle API n'est pas configuree
    if (err.message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      );
    }

    // Erreurs liees au login LinkedIn (2FA, identifiants invalides, blocage)
    if (
      err.message.includes("LinkedIn") ||
      err.message.includes("2 etapes") ||
      err.message.includes("identifiants")
    ) {
      return NextResponse.json(
        { error: err.message },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la recherche d'offres" },
      { status: 500 }
    );
  }
}
