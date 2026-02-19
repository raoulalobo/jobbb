import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Role : Route API POST /api/cv/parse
 * Parse un CV PDF via Claude Haiku et retourne les données structurées
 * pour pré-remplir le formulaire de profil candidat.
 *
 * Workflow :
 *   1. Vérifie l'authentification (Better Auth)
 *   2. Récupère le fichier PDF depuis le FormData
 *   3. Valide le type (PDF) et la taille (≤ 5 Mo)
 *   4. Encode le PDF en base64 et l'envoie à Claude Haiku
 *   5. Parse la réponse JSON et la retourne au client
 *
 * Méthode : POST multipart/form-data
 * Champ attendu : "file" (application/pdf, max 5 Mo)
 * Retour : { data: ParsedProfile, message: string }
 */

// Taille maximale du PDF : 5 Mo
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Prompt envoyé à Claude Haiku pour extraire les données structurées du CV.
 * Retourne du JSON brut (sans bloc markdown) pour faciliter le parsing.
 */
const PARSE_PROMPT = `Analyse ce CV et extrais les informations dans ce format JSON exact (sans markdown, juste le JSON brut) :
{
  "title": "Titre du poste actuel ou recherché",
  "location": "Ville, Pays ou chaîne vide",
  "phone": "Numéro de téléphone ou chaîne vide",
  "summary": "Résumé professionnel en 3-5 phrases",
  "skills": ["compétence1", "compétence2"],
  "softSkills": ["qualité humaine1", "qualité humaine2"],
  "experiences": [{ "company": "...", "title": "...", "startDate": "Jan 2022", "endDate": "Présent", "description": "..." }],
  "education": [{ "school": "...", "degree": "...", "startDate": "Sep 2018", "endDate": "Jun 2021" }],
  "certifications": [{ "name": "...", "issuer": "...", "date": "..." }]
}
Règles : dates format "MMM YYYY". endDate="Présent" si poste actuel. softSkills = qualités humaines uniquement (pas de compétences techniques).`;

/**
 * Type représentant le profil extrait du CV par Claude Haiku.
 * Correspond exactement aux champs du formulaire ProfileForm.tsx.
 */
export interface ParsedProfile {
  title: string;
  location: string;
  phone: string;
  summary: string;
  skills: string[];
  softSkills: string[];
  experiences: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Vérification de l'authentification via Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 2. Extraction du fichier depuis le formulaire multipart
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // 3. Validation du type MIME — PDF uniquement
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Seuls les fichiers PDF sont acceptés" },
        { status: 400 }
      );
    }

    // 4. Validation de la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Le CV ne doit pas dépasser 5 Mo" },
        { status: 400 }
      );
    }

    // 5. Conversion du PDF en base64 pour l'envoi à l'API Anthropic
    // Le SDK Anthropic 0.75.0+ supporte les PDFs natifs via type: "document"
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    // 6. Appel à Claude Haiku avec le PDF encodé en base64
    // Modèle économique et rapide, déjà utilisé dans orchestrator.ts
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              // Envoi du PDF natif — aucune lib de conversion nécessaire
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: PARSE_PROMPT,
            },
          ],
        },
      ],
    });

    // 7. Extraction du texte de la réponse
    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // 8. Nettoyage éventuel de blocs markdown (```json ... ```) si Haiku en ajoute
    const cleanedText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // 9. Parsing du JSON retourné par Claude
    let parsed: ParsedProfile;
    try {
      parsed = JSON.parse(cleanedText) as ParsedProfile;
    } catch {
      console.error("CV parse: JSON invalide reçu de Claude :", cleanedText);
      return NextResponse.json(
        { error: "L'analyse du CV a échoué — format de réponse inattendu" },
        { status: 500 }
      );
    }

    // 10. Retour des données structurées au client
    return NextResponse.json(
      {
        data: parsed,
        message: "CV analysé avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CV parse route error:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de l'analyse du CV" },
      { status: 500 }
    );
  }
}
