import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import {
  generateApplication,
  type ApplicationProfile,
} from "@/lib/agent/generate-application";

/**
 * Role : API route pour generer une candidature IA (CV + lettre) et la sauvegarder
 * Methode : POST
 * Body : { offerId: string }
 * Auth : requiert une session active
 *
 * Flux :
 *   1. Verifie l'authentification
 *   2. Charge l'offre ciblee (verifie ownership)
 *   3. Charge le profil candidat (requis pour la generation)
 *   4. Verifie que le profil est suffisamment rempli (titre obligatoire)
 *   5. Cree un AgentRun "pending" pour le feedback header en temps reel
 *   6. Genere CV + lettre via Claude Sonnet (generateApplication)
 *   7. Cree ou remplace l'Application en BDD (upsert sur userId + offerId)
 *   8. Met a jour l'AgentRun en "success" ou "error"
 *   9. Retourne { data: { applicationId }, message: "..." }
 *
 * Exemple d'appel :
 *   POST /api/agent/apply
 *   Body: { "offerId": "clxyz..." }
 *   Response: { data: { applicationId: "clabc..." }, message: "Candidature generee" }
 *
 * Interactions :
 *   - prisma.offer.findUnique : charge l'offre + verifie ownership
 *   - prisma.profile.findUnique : charge le profil du candidat
 *   - prisma.agentRun.create/update : suivi en temps reel pour l'indicateur header
 *   - generateApplication() : appel Claude Sonnet pour generer CV + lettre
 *   - prisma.application.upsert : sauvegarde en BDD (evite les doublons)
 */
export async function POST(request: NextRequest) {
  // Declare agentRun hors du try pour pouvoir y acceder dans le catch
  let agentRun: { id: string } | null = null;

  try {
    // 1. Verification de l'authentification via Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Extraction et validation du body
    const body = await request.json();
    const { offerId } = body as { offerId?: string };

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId requis" },
        { status: 400 }
      );
    }

    // 3. Charger l'offre et verifier qu'elle appartient a l'utilisateur
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    if (offer.userId !== userId) {
      return NextResponse.json(
        { error: "Acces refuse a cette offre" },
        { status: 403 }
      );
    }

    // 4. Charger le profil du candidat
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    // Verifier que le profil est suffisamment rempli pour generer
    if (!profile?.title) {
      return NextResponse.json(
        {
          error:
            "Profil incomplet. Renseignez au minimum votre titre professionnel dans votre profil (/profile) avant de postuler.",
        },
        { status: 400 }
      );
    }

    // 5. Creer un AgentRun "pending" pour l'indicateur en temps reel dans le header
    // Label format : "Candidature — {titre offre} chez {entreprise}"
    agentRun = await prisma.agentRun.create({
      data: {
        userId,
        type: "application",
        status: "pending",
        label: `Candidature — ${offer.title} chez ${offer.company}`,
      },
    });

    // Construire le profil dans le format attendu par generateApplication
    // Les champs JSON (skills, experiences, education) sont stockes en JSON dans Prisma
    const applicationProfile: ApplicationProfile = {
      title: profile.title,
      summary: profile.summary,
      location: profile.location,
      skills: Array.isArray(profile.skills) ? (profile.skills as string[]) : [],
      softSkills: Array.isArray(profile.softSkills) ? (profile.softSkills as string[]) : [],
      experiences: Array.isArray(profile.experiences)
        ? (profile.experiences as ApplicationProfile["experiences"])
        : [],
      education: Array.isArray(profile.education)
        ? (profile.education as ApplicationProfile["education"])
        : [],
      certifications: Array.isArray(profile.certifications)
        ? (profile.certifications as ApplicationProfile["certifications"])
        : [],
    };

    console.log(
      `[API] Generation candidature pour user=${userId}, offre="${offer.title}" chez "${offer.company}"`
    );

    // 6. Generer CV + lettre de motivation via Claude Sonnet
    const { cvContent, letterContent } = await generateApplication(
      applicationProfile,
      {
        title: offer.title,
        company: offer.company,
        location: offer.location,
        description: offer.description,
        salary: offer.salary,
        contractType: offer.contractType,
      }
    );

    // 7. Sauvegarder la candidature en BDD
    // Upsert : si une candidature existe deja pour cette offre, on la remplace
    const application = await prisma.application.upsert({
      where: {
        // Contrainte d'unicite composite : un utilisateur ne peut postuler qu'une fois par offre
        userId_offerId: {
          userId,
          offerId,
        },
      },
      create: {
        userId,
        offerId,
        cvContent,
        letterContent,
        status: "draft",
      },
      update: {
        // Mise a jour des documents generes et remise en statut draft
        cvContent,
        letterContent,
        status: "draft",
      },
    });

    console.log(
      `[API] Candidature sauvegardee : applicationId=${application.id}`
    );

    // 8. Marquer l'AgentRun comme termine avec succes
    // Le client verra le badge vert "Candidature generee" pendant 30s
    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "success",
        result: { applicationId: application.id },
      },
    });

    return NextResponse.json({
      data: { applicationId: application.id },
      message: "Candidature generee avec succes. Consultez vos candidatures pour la voir.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[API] Erreur generation candidature :", err.message);

    // Marquer l'AgentRun comme erreur si il a ete cree
    // Le client affichera un badge rouge persistant dans le header
    if (agentRun?.id) {
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: { status: "error", error: err.message },
      });
    }

    // Erreur de cle API Anthropic
    if (err.message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Erreur de profil incomplet
    if (err.message.includes("Profil") || err.message.includes("profil")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la generation de la candidature" },
      { status: 500 }
    );
  }
}
