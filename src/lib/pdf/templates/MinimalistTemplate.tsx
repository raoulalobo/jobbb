/**
 * Role : Template PDF "Minimaliste" pour react-pdf
 *
 * Design :
 *   - Beaucoup d'espace blanc, marges généreuses (56pt)
 *   - Nom du candidat aligné à gauche en taille modeste
 *   - Titres h2 en petites lettres espacées + fine ligne gris clair
 *   - Accents très légers : ligne gris clair (#e5e7eb) et texte gris doux
 *   - Pas de fond coloré ni d'éléments graphiques lourds
 *   - Idéal pour les milieux créatifs ou tech modernes
 *
 * Police : Helvetica (intégrée react-pdf)
 *
 * Utilisé par : route API /api/application/[id]/export-pdf quand templateId === "minimalist"
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

// ─── Palette minimaliste ───────────────────────────────────────────────────────
const ACCENT = "#9ca3af";      // Gris doux pour les accents (règles, puces)
const TEXT_MAIN = "#111827";   // Corps principal
const TEXT_LIGHT = "#6b7280";  // Sous-titres, métadonnées
const RULE_COLOR = "#e5e7eb";  // Ligne séparatrice très légère

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingHorizontal: 56,
    paddingTop: 48,
    paddingBottom: 56,
  },

  // En-tête : nom + infos à gauche, sans fond
  header: {
    marginBottom: 28,
  },
  headerName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: TEXT_MAIN,
    letterSpacing: 0.2,
  },
  headerDocType: {
    fontSize: 9,
    color: TEXT_LIGHT,
    marginTop: 3,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerMeta: {
    fontSize: 9,
    color: ACCENT,
    marginTop: 2,
  },

  // Ligne horizontale très légère
  rule: {
    borderTopWidth: 0.5,
    borderTopColor: RULE_COLOR,
    marginBottom: 20,
  },

  // Titre h2 : très discret, texte gris léger, lettres espacées
  h2: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 8,
  },

  // Titre h3 : légèrement plus sombre
  h3: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: TEXT_MAIN,
    marginTop: 10,
    marginBottom: 4,
  },

  // Paragraphe : grande lisibilité grâce à l'interligne généreux
  paragraph: {
    fontSize: 10,
    color: TEXT_MAIN,
    lineHeight: 1.6,
    marginBottom: 5,
  },

  // Ligne de liste : puce très discrète (tiret fin)
  listRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 6,
  },
  listBullet: {
    fontSize: 10,
    color: ACCENT,
    width: 12,
  },
  listText: {
    fontSize: 10,
    color: TEXT_MAIN,
    lineHeight: 1.6,
    flex: 1,
  },

  // Texte gras inline
  bold: {
    fontFamily: "Helvetica-Bold",
  },

  // Pied de page très discret
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: ACCENT,
    letterSpacing: 0.5,
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

interface MinimalistTemplateProps {
  data: CvPdfData;
}

export function MinimalistTemplate({ data }: MinimalistTemplateProps) {
  const blocks = parseMarkdown(data.content);
  const docLabel = data.type === "cv" ? "CV Adapté" : "Lettre de Motivation";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── En-tête sobre ────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerName}>{data.candidateName}</Text>
          <Text style={styles.headerDocType}>{docLabel}</Text>
          <Text style={styles.headerMeta}>
            {data.offerTitle} · {data.offerCompany}
          </Text>
        </View>

        {/* ── Ligne de séparation légère ───────────────────────────────── */}
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
                  <Text style={styles.listBullet}>·</Text>
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
          <Text style={styles.footerText}>
            {data.candidateName.toUpperCase()}
          </Text>
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
