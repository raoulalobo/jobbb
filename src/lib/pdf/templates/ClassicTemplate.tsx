/**
 * Role : Template PDF "Classique" pour react-pdf
 *
 * Design :
 *   - 1 colonne, noir et blanc, style professionnel traditionnel
 *   - Nom du candidat centré en grand en haut, séparé par une ligne horizontale
 *   - Titres h2 en majuscules gras avec filet noir sous-jacent
 *   - Texte corps sobre, taille 10, interligne 1.4
 *   - Aucune couleur vive : uniquement #000, #333, #666, #eee
 *
 * Police : Helvetica (intégrée react-pdf)
 *
 * Utilisé par : route API /api/application/[id]/export-pdf quand templateId === "classic"
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { CvPdfData } from "../types";
import { parseMarkdown, type TextSegment } from "../markdown-parser";

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingHorizontal: 48,
    paddingTop: 40,
    paddingBottom: 48,
  },

  // Bloc identité : centré en haut de page
  headerBlock: {
    alignItems: "center",
    marginBottom: 8,
  },
  headerName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  headerDocType: {
    fontSize: 10,
    color: "#444444",
    textAlign: "center",
    marginTop: 3,
  },
  headerMeta: {
    fontSize: 9,
    color: "#777777",
    textAlign: "center",
    marginTop: 2,
  },

  // Filet de séparation plein noir
  rule: {
    borderTopWidth: 1.5,
    borderTopColor: "#000000",
    marginVertical: 12,
  },

  // Titre h2 : section principale (ex : COMPÉTENCES)
  h2: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#999999",
    paddingBottom: 2,
  },

  // Titre h3 : sous-section (ex : nom d'employeur)
  h3: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#222222",
    marginTop: 8,
    marginBottom: 2,
  },

  // Paragraphe corps
  paragraph: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.4,
    marginBottom: 3,
  },

  // Ligne de liste
  listRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 8,
  },
  listBullet: {
    fontSize: 10,
    color: "#333333",
    width: 12,
  },
  listText: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.4,
    flex: 1,
  },

  // Texte gras inline
  bold: {
    fontFamily: "Helvetica-Bold",
  },

  // Pied de page
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
    paddingTop: 4,
  },
  footerText: {
    fontSize: 8,
    color: "#888888",
  },
});

// ─── Sous-composant : rendu d'un tableau de segments ─────────────────────────

function RenderSegments({
  segments,
  style,
}: {
  segments: TextSegment[];
  style?: Style | Style[];
}) {
  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.bold ? (
          <Text key={i} style={styles.bold}>
            {seg.text}
          </Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface ClassicTemplateProps {
  data: CvPdfData;
}

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  const blocks = parseMarkdown(data.content);
  const docLabel = data.type === "cv" ? "CV Adapté" : "Lettre de Motivation";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── En-tête centré ───────────────────────────────────────────── */}
        <View style={styles.headerBlock}>
          <Text style={styles.headerName}>{data.candidateName}</Text>
          <Text style={styles.headerDocType}>{docLabel}</Text>
          <Text style={styles.headerMeta}>
            {data.offerTitle} · {data.offerCompany}
          </Text>
        </View>

        {/* ── Filet de séparation ──────────────────────────────────────── */}
        <View style={styles.rule} />

        {/* ── Corps du document ────────────────────────────────────────── */}
        {blocks.map((block, index) => {
          switch (block.type) {
            case "h2":
              return (
                <RenderSegments
                  key={index}
                  segments={block.segments}
                  style={styles.h2}
                />
              );
            case "h3":
              return (
                <RenderSegments
                  key={index}
                  segments={block.segments}
                  style={styles.h3}
                />
              );
            case "list-item":
              return (
                <View key={index} style={styles.listRow}>
                  <Text style={styles.listBullet}>–</Text>
                  <RenderSegments
                    segments={block.segments}
                    style={styles.listText}
                  />
                </View>
              );
            case "paragraph":
            default:
              return (
                <RenderSegments
                  key={index}
                  segments={block.segments}
                  style={styles.paragraph}
                />
              );
          }
        })}

        {/* ── Pied de page ─────────────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          {/* Footer : uniquement le nom du candidat, sans label de type de document */}
          <Text style={styles.footerText}>{data.candidateName}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
