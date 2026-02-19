/**
 * Role : Route API pour générer un PDF (CV ou Lettre) depuis une candidature
 *
 * Méthode : POST /api/application/[id]/export-pdf
 * Auth    : session Better Auth requise
 *
 * Body JSON (validé par Zod) :
 *   { type: "cv" | "letter", templateId: "modern" | "classic" | "minimalist" }
 *
 * Flux complet :
 *   1. Vérification de la session (401 si non connecté)
 *   2. Chargement de l'application depuis la BDD (404 si absente)
 *   3. Vérification que l'application appartient à l'utilisateur connecté (403)
 *   4. Sélection du contenu : cvContent ou letterContent selon `type`
 *   5. Guard : contenu vide → 400
 *   6. Construction du CvPdfData depuis l'application + l'offre liée
 *   7. Rendu react-pdf en buffer mémoire avec le template choisi
 *   8. Upload du buffer dans Supabase Storage (bucket "cvs", upsert)
 *   9. Mise à jour de cvPdfUrl ou letterPdfUrl dans la BDD
 *  10. Retour { data: { url }, message }
 *
 * Exemple de requête :
 *   POST /api/application/clxyz123/export-pdf
 *   { "type": "cv", "templateId": "modern" }
 *
 * Exemple de réponse :
 *   { data: { url: "https://supabase.../cvs/userId/clxyz123-cv-modern.pdf" },
 *     message: "PDF généré avec succès" }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import type { CvPdfData, TemplateId } from "@/lib/pdf/types";
import { ModernTemplate } from "@/lib/pdf/templates/ModernTemplate";
import { ClassicTemplate } from "@/lib/pdf/templates/ClassicTemplate";
import { MinimalistTemplate } from "@/lib/pdf/templates/MinimalistTemplate";

// Nécessaire pour désactiver l'Edge Runtime et forcer Node.js
// @react-pdf/renderer utilise des APIs Node natives (canvas, fontkit, etc.)
export const runtime = "nodejs";

// ─── Schéma de validation du body ────────────────────────────────────────────

const ExportPdfBodySchema = z.object({
  /** Type de document à générer */
  type: z.enum(["cv", "letter"]),
  /** Template visuel à utiliser */
  templateId: z.enum(["modern", "classic", "minimalist"]),
});

// ─── Sélecteur de template ────────────────────────────────────────────────────

/**
 * Retourne le composant react-pdf correspondant à l'identifiant de template.
 * Chaque composant accepte { data: CvPdfData } et retourne un <Document>.
 *
 * @param templateId - Identifiant du template choisi par l'utilisateur
 * @param data       - Données normalisées du document PDF
 * @returns Élément React prêt à être rendu par renderToBuffer
 */
function getTemplateElement(
  templateId: TemplateId,
  data: CvPdfData
): React.ReactElement<DocumentProps> {
  switch (templateId) {
    case "modern":
      return React.createElement(ModernTemplate, { data }) as React.ReactElement<DocumentProps>;
    case "classic":
      return React.createElement(ClassicTemplate, { data }) as React.ReactElement<DocumentProps>;
    case "minimalist":
      return React.createElement(MinimalistTemplate, { data }) as React.ReactElement<DocumentProps>;
  }
}

// ─── Handler POST ─────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérification de l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: applicationId } = await params;

    // 2. Validation du body avec Zod
    let body: z.infer<typeof ExportPdfBodySchema>;
    try {
      const raw = await request.json();
      body = ExportPdfBodySchema.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Body invalide. Attendu : { type, templateId }" },
        { status: 400 }
      );
    }

    const { type, templateId } = body;

    // 3. Chargement de l'application avec l'offre liée
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { offer: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Candidature introuvable" },
        { status: 404 }
      );
    }

    // 4. Vérification que l'application appartient à l'utilisateur connecté
    if (application.userId !== userId) {
      return NextResponse.json(
        { error: "Accès refusé à cette candidature" },
        { status: 403 }
      );
    }

    // 5. Sélection du contenu (cvContent ou letterContent)
    const content = type === "cv" ? application.cvContent : application.letterContent;

    if (!content) {
      return NextResponse.json(
        {
          error: `Contenu non disponible. Générez d'abord une candidature via "Postuler avec l'IA".`,
        },
        { status: 400 }
      );
    }

    // 6. Construction du CvPdfData depuis les données de la BDD
    const pdfData: CvPdfData = {
      content,
      type,
      // Utilise le nom de la session si disponible, sinon l'email
      candidateName: session.user.name ?? session.user.email ?? "Candidat",
      offerTitle: application.offer.title,
      offerCompany: application.offer.company,
    };

    console.log(
      `[PDF] Génération : user=${userId}, app=${applicationId}, type=${type}, template=${templateId}`
    );

    // 7. Rendu react-pdf en buffer mémoire
    const element = getTemplateElement(templateId, pdfData);
    const pdfBuffer = await renderToBuffer(element);

    // 8. Chemin de stockage dans Supabase Storage
    // Format : {userId}/{applicationId}-{type}-{templateId}.pdf
    // L'upsert remplace l'ancien fichier si le même template est regénéré
    const storagePath = `${userId}/${applicationId}-${type}-${templateId}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("cvs")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[PDF] Erreur upload Supabase :", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload du PDF" },
        { status: 500 }
      );
    }

    // Récupération de l'URL publique Supabase
    const { data: urlData } = supabaseAdmin.storage
      .from("cvs")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // 9. Mise à jour de l'URL dans la BDD selon le type
    if (type === "cv") {
      await prisma.application.update({
        where: { id: applicationId },
        data: { cvPdfUrl: publicUrl },
      });
    } else {
      await prisma.application.update({
        where: { id: applicationId },
        data: { letterPdfUrl: publicUrl },
      });
    }

    console.log(`[PDF] PDF généré et stocké : ${publicUrl}`);

    // 10. Réponse avec l'URL publique du PDF
    return NextResponse.json(
      {
        data: { url: publicUrl },
        message: "PDF généré avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PDF] Erreur interne :", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
