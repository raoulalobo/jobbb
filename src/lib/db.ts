import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";

/**
 * Role : Client Prisma singleton et factory de client ZenStack enhanced
 * Utilise par : toutes les API routes et server actions
 * Le client enhanced applique les policies d'acces definies dans le schema.zmodel
 *
 * Exemple :
 *   const db = getEnhancedPrisma(session?.user)
 *   const offers = await db.offer.findMany()
 *   // -> retourne uniquement les offres de l'utilisateur connecte
 */

// Singleton Prisma pour eviter les connexions multiples en dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Role : Creer un client Prisma enhanced avec les policies ZenStack
 * Parametre user : l'utilisateur authentifie (ou undefined pour acces anonyme)
 * Le client filtre automatiquement les donnees selon les @@allow du schema
 */
export function getEnhancedPrisma(user?: { id: string; role?: string }) {
  return enhance(prisma, {
    user: user ? { id: user.id, role: user.role ?? "candidate" } : undefined,
  });
}
