/**
 * Role : Parser markdown léger pour react-pdf
 *
 * react-pdf ne gère pas HTML ni markdown natif — tout est rendu via <Text>.
 * Ce module décompose le markdown en blocs structurés, chaque bloc
 * étant rendu par les templates avec les styles appropriés.
 *
 * Syntaxe supportée :
 *   ## Titre niveau 2       → bloc type "h2"
 *   ### Titre niveau 3      → bloc type "h3"
 *   - Élément de liste      → bloc type "list-item"
 *   **texte gras**          → segment type "bold" dans un paragraphe
 *   Texte normal            → bloc type "paragraph"
 *   (ligne vide)            → séparateur ignoré
 */

/** Un segment de texte dans un paragraphe (normal ou gras) */
export interface TextSegment {
  text: string;
  bold: boolean;
}

/**
 * Un bloc de contenu markdown parsé.
 * Les titres et list-items ont des segments plats (sans bold imbriqué complexe).
 * Les paragraphes supportent les segments bold/normal mélangés.
 */
export type ParsedBlock =
  | { type: "h2"; segments: TextSegment[] }
  | { type: "h3"; segments: TextSegment[] }
  | { type: "list-item"; segments: TextSegment[] }
  | { type: "paragraph"; segments: TextSegment[] };

/**
 * Décompose une chaîne en segments texte/bold selon la syntaxe **bold**.
 *
 * Exemple :
 *   parseSegments("Bonjour **monde** !")
 *   → [{ text: "Bonjour ", bold: false }, { text: "monde", bold: true }, { text: " !", bold: false }]
 */
export function parseSegments(line: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Regex : capture les parties avant/entre/après **...**
  const parts = line.split(/\*\*(.+?)\*\*/g);

  parts.forEach((part, index) => {
    if (part === "") return;
    // Les indices pairs sont du texte normal, les impairs sont entre **
    segments.push({ text: part, bold: index % 2 === 1 });
  });

  return segments.length > 0 ? segments : [{ text: line, bold: false }];
}

/**
 * Parse un contenu markdown complet en tableau de blocs structurés.
 *
 * Exemple d'entrée :
 *   "## Jean Dupont\n\n### Développeur\n\n- React\n- Node.js\n\nTexte normal"
 *
 * Exemple de sortie :
 *   [
 *     { type: "h2", segments: [{ text: "Jean Dupont", bold: false }] },
 *     { type: "h3", segments: [{ text: "Développeur", bold: false }] },
 *     { type: "list-item", segments: [{ text: "React", bold: false }] },
 *     { type: "list-item", segments: [{ text: "Node.js", bold: false }] },
 *     { type: "paragraph", segments: [{ text: "Texte normal", bold: false }] },
 *   ]
 */
export function parseMarkdown(content: string): ParsedBlock[] {
  const lines = content.split("\n");
  const blocks: ParsedBlock[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Ligne vide → séparateur ignoré
    if (line.trim() === "") continue;

    // Titre ## (h2)
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", segments: parseSegments(line.slice(3)) });
      continue;
    }

    // Titre ### (h3)
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", segments: parseSegments(line.slice(4)) });
      continue;
    }

    // Élément de liste (- ou * en début de ligne)
    if (/^[-*]\s/.test(line)) {
      blocks.push({ type: "list-item", segments: parseSegments(line.slice(2)) });
      continue;
    }

    // Séparateur horizontal (--- ou ***) → ignoré (non supporté par react-pdf)
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) continue;

    // Paragraphe normal (avec support bold inline)
    blocks.push({ type: "paragraph", segments: parseSegments(line) });
  }

  return blocks;
}
