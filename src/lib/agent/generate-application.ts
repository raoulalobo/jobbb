import Anthropic from "@anthropic-ai/sdk";

/**
 * Role : Generateur de CV et lettre de motivation adaptes a une offre via Claude
 * Utilise par : la route API POST /api/agent/apply
 *
 * UN SEUL appel Claude Sonnet 4.6 pour generer les deux documents en JSON.
 * Le prompt fournit le profil complet et l'offre, Claude adapte le contenu.
 *
 * Exemple :
 *   const result = await generateApplication(profile, offer);
 *   // result = { cvContent: "# CV...", letterContent: "# Lettre..." }
 */

/** Modele Claude utilise pour la generation (Sonnet 4.6 = meilleur rapport qualite/prix) */
const GENERATION_MODEL = "claude-sonnet-4-6";

/**
 * Role : Profil candidat transmis au generateur
 * Source : table Profile de la BDD (champs title, summary, skills, experiences, education)
 */
export interface ApplicationProfile {
  title: string;
  summary?: string | null;
  skills: string[];
  experiences: Array<{
    company: string;
    title: string;
    dates: string;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    dates: string;
  }>;
  location?: string | null;
}

/**
 * Role : Offre d'emploi transmise au generateur
 * Source : table Offer de la BDD
 */
export interface ApplicationOffer {
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string | null;
  contractType?: string | null;
}

/**
 * Role : Resultat de la generation (CV + lettre en markdown)
 * Stocke dans Application.cvContent et Application.letterContent
 */
export interface GeneratedApplication {
  cvContent: string;
  letterContent: string;
}

/**
 * Role : Generer un CV adapte et une lettre de motivation via Claude Sonnet
 * Parametre profile : donnees du profil candidat (competences, experiences, formation)
 * Parametre offer : offre d'emploi ciblee (titre, entreprise, description)
 * Retourne : { cvContent, letterContent } en markdown
 *
 * Cout estime : ~0.05$ par generation (1 appel Sonnet, ~4000 tokens)
 *
 * Erreurs possibles :
 *   - ANTHROPIC_API_KEY manquante
 *   - Format de reponse invalide (JSON mal forme)
 *   - Profil trop incomplet pour generer
 *
 * Exemple :
 *   const { cvContent, letterContent } = await generateApplication(
 *     { title: "Dev React", skills: ["React", "TypeScript"], experiences: [...], ... },
 *     { title: "Developpeur Frontend", company: "Doctolib", description: "..." }
 *   );
 */
export async function generateApplication(
  profile: ApplicationProfile,
  offer: ApplicationOffer
): Promise<GeneratedApplication> {
  // Verifier que la cle API Anthropic est configuree
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "sk-ant-...") {
    throw new Error(
      "ANTHROPIC_API_KEY non configuree. Ajoutez votre cle dans .env.local"
    );
  }

  const client = new Anthropic({ apiKey });

  // Construire un resume textuel du profil pour le prompt
  const experiencesText =
    profile.experiences.length > 0
      ? profile.experiences
          .map(
            (e) =>
              `  - ${e.title} chez ${e.company} (${e.dates})${
                e.description ? ` : ${e.description}` : ""
              }`
          )
          .join("\n")
      : "  Aucune experience renseignee";

  const educationText =
    profile.education.length > 0
      ? profile.education
          .map((e) => `  - ${e.degree} a ${e.school} (${e.dates})`)
          .join("\n")
      : "  Aucune formation renseignee";

  const profileContext = `
Titre professionnel : ${profile.title}
Localisation : ${profile.location ?? "Non renseignee"}
Resume : ${profile.summary ?? "Non renseigne"}
Competences : ${profile.skills.length > 0 ? profile.skills.join(", ") : "Non renseignees"}
Experiences professionnelles :
${experiencesText}
Formation :
${educationText}`.trim();

  // Construire le contexte de l'offre pour le prompt
  const offerContext = `
Poste : ${offer.title}
Entreprise : ${offer.company}
Localisation : ${offer.location}
Type de contrat : ${offer.contractType ?? "Non precise"}
Salaire : ${offer.salary ?? "Non precise"}
Description :
${offer.description}`.trim();

  console.log(
    `[Agent] Generation CV + lettre pour "${offer.title}" chez "${offer.company}"`
  );

  // Appel unique a Claude : genere CV + lettre en une seule requete
  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Tu es un expert en recrutement et redaction de candidatures professionnelles.
Genere un CV adapte ET une lettre de motivation personnalisee pour cette candidature.

PROFIL DU CANDIDAT :
${profileContext}

OFFRE D'EMPLOI CIBLEE :
${offerContext}

Reponds UNIQUEMENT en JSON avec exactement ce format (pas de texte avant ni apres) :
{
  "cvContent": "# CV en markdown...",
  "letterContent": "# Lettre de motivation en markdown..."
}

Regles pour le CV :
- Met en avant les competences et experiences les plus pertinentes pour CE poste
- Structure : Informations, Resume, Competences cles, Experiences, Formation
- Adapte le resume professionnel pour correspondre au poste vise
- Format markdown propre avec titres et listes

Regles pour la lettre de motivation :
- Personnalisee pour l'entreprise ET le poste (cite le nom de l'entreprise, le poste)
- Ton professionnel et enthousiaste
- 3 a 4 paragraphes : accroche, valeur apportee, motivation specifique, conclusion
- Met en avant 2-3 competences/experiences directement liees a l'offre
- Format markdown, longueur ideale : 250-350 mots

Les deux documents doivent etre en francais.`,
      },
    ],
  });

  // Extraire le contenu textuel de la reponse
  const textContent = response.content.find((b) => b.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Aucun contenu textuel dans la reponse Claude");
  }

  // Extraire le JSON de la reponse (peut contenir du texte parasite)
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(
      "[Agent] Reponse brute Claude :",
      textContent.text.substring(0, 500)
    );
    throw new Error("Format de reponse invalide : pas de JSON trouve");
  }

  let result: GeneratedApplication;
  try {
    result = JSON.parse(jsonMatch[0]) as GeneratedApplication;
  } catch {
    throw new Error("Erreur de parsing JSON dans la reponse Claude");
  }

  // Valider que les deux champs sont presents
  if (!result.cvContent || !result.letterContent) {
    throw new Error(
      "Reponse incomplete : CV ou lettre de motivation manquant"
    );
  }

  console.log(
    `[Agent] Generation terminee : CV ${result.cvContent.length} chars, lettre ${result.letterContent.length} chars`
  );

  return result;
}
