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
  location?: string | null;
  /** Numéro de téléphone du candidat (optionnel, affiché dans l'en-tête du CV) */
  phone?: string | null;
  /** Email du candidat (depuis session.user.email, affiché dans l'en-tête du CV) */
  email?: string | null;
  skills: string[];
  /** Compétences comportementales : leadership, travail d'équipe, etc. */
  softSkills: string[];
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
  /** Certifications professionnelles : AWS, PMP, etc. */
  certifications: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
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

  // Formatage des certifications pour le prompt
  const certificationsText =
    profile.certifications.length > 0
      ? profile.certifications
          .map((c) => {
            let line = `  - ${c.name}`;
            if (c.issuer) line += ` (${c.issuer}`;
            if (c.date) line += c.issuer ? `, ${c.date})` : ` (${c.date})`;
            else if (c.issuer) line += ")";
            return line;
          })
          .join("\n")
      : "  Aucune certification renseignee";

  const profileContext = `
Titre professionnel : ${profile.title}
Localisation : ${profile.location ?? "Non renseignee"}
Telephone : ${profile.phone ?? "Non renseigne"}
Email : ${profile.email ?? "Non renseigne"}
Resume : ${profile.summary ?? "Non renseigne"}
Competences techniques : ${profile.skills.length > 0 ? profile.skills.join(", ") : "Non renseignees"}
Competences comportementales : ${profile.softSkills.length > 0 ? profile.softSkills.join(", ") : "Non renseignees"}
Certifications :
${certificationsText}
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
  // Le system message definit le role ADAPTATIF (pas creatif) et les regles anti-hallucination
  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 4096,
    // Message systeme : role adaptatif strict + regles absolues anti-invention
    system: `Tu es un expert en adaptation de candidatures professionnelles.

Ton role est d'adapter (PAS creer) le CV et la lettre de motivation d'un candidat
pour maximiser ses chances sur une offre specifique.

REGLE ABSOLUE — Tu ne dois JAMAIS :
- Inventer des competences techniques ou comportementales absentes du profil
- Ajouter des certifications, formations ou experiences non mentionnees
- Creer des projets, realisations ou chiffres qui n'y figurent pas
- Embellir les descriptions au-dela de ce que le profil indique

Tu dois UNIQUEMENT :
- Identifier les exigences cles de l'offre et les comparer aux competences reelles du candidat
- Selectionner et reordonner les elements du profil selon leur pertinence pour CE poste
- Adapter le vocabulaire pour qu'il resonne avec la description de l'offre
- Rediger le resume en restant strictement fidele aux informations du profil

Si une competence requise par l'offre n'est pas dans le profil du candidat,
ne l'invente pas — mets en avant ce qui est reellement la et qui s'en approche le plus.`,
    messages: [
      {
        role: "user",
        content: `Genere un CV adapte ET une lettre de motivation personnalisee pour cette candidature.

PROFIL DU CANDIDAT :
${profileContext}

OFFRE D'EMPLOI CIBLEE :
${offerContext}

ETAPE 1 — ANALYSE (avant de generer) :
1. Identifie les 3 a 5 exigences cles de l'offre (competences, experiences, contexte)
2. Trouve dans le profil les elements qui y correspondent REELLEMENT
3. Note les ecarts : si une exigence est absente du profil, ne l'invente pas

ETAPE 2 — GENERATION :
Reponds UNIQUEMENT en JSON avec exactement ce format (pas de texte avant ni apres) :
{
  "cvContent": "# CV en markdown...",
  "letterContent": "# Lettre de motivation en markdown..."
}

Regles pour le CV :
- Selectionne UNIQUEMENT les competences presentes dans le profil, ordonnees par pertinence pour l'offre
- Structure : Informations, Resume, Competences cles, Experiences, Formation, Certifications (si presentes)
- Redige le resume en restant fidele au profil existant — pas de reformulation inventee
- Inclus les certifications UNIQUEMENT si elles figurent dans le profil ET sont pertinentes
- Format markdown propre avec titres et listes

Regles pour la lettre de motivation :
- Personnalisee pour l'entreprise ET le poste (cite le nom de l'entreprise, le poste)
- Ton professionnel et enthousiaste
- 3 a 4 paragraphes : accroche, valeur apportee, motivation specifique, conclusion
- Justifie la candidature avec des elements concrets et reels du profil (experiences, competences, certifications)
- N'affirme jamais que le candidat maitrise quelque chose qui n'est pas dans son profil
- Integre naturellement 1 a 2 soft skills du profil si pertinentes
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
