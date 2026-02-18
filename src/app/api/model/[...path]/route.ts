import { NextRequestHandler } from "@zenstackhq/server/next";
import { getEnhancedPrisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Role : API route auto-generee par ZenStack
 * Gere toutes les operations CRUD sur les modeles via REST
 * Les policies d'acces du schema.zmodel sont appliquees automatiquement
 *
 * Endpoints generes :
 *   GET    /api/model/user       -> liste les users (filtre par policy)
 *   GET    /api/model/offer?q=.. -> liste les offres avec filtres
 *   POST   /api/model/offer      -> creer une offre
 *   PUT    /api/model/offer/:id  -> modifier une offre
 *   DELETE /api/model/offer/:id  -> supprimer une offre
 *   etc. pour tous les modeles
 */

// Fonction qui cree le client enhanced pour chaque requete
async function getPrisma() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return getEnhancedPrisma(
    session?.user
      ? { id: session.user.id, role: (session.user as { role?: string }).role }
      : undefined
  );
}

// Handler ZenStack qui gere GET, POST, PUT, PATCH, DELETE automatiquement
const handler = NextRequestHandler({ getPrisma, useAppDir: true });

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
