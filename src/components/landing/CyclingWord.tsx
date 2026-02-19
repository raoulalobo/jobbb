"use client";

import { useEffect, useState } from "react";

/**
 * Rôle : Composant client qui anime un mot cyclique dans le hero headline
 * Chaque mot s'estompe en remontant légèrement avec un flou, puis le suivant
 * apparaît en descendant — effet de rouleau vertical élégant.
 *
 * Cycle : dormez → lisez → mangez → bref → … → (retour dormez)
 * Timing : 2 200 ms d'affichage, 320 ms de transition fade/blur/slide
 *
 * Usage :
 *   <CyclingWord />
 *   → affiche "dormez." puis cicle automatiquement
 */

/** Séquence des mots à afficher (point ou ellipse inclus) */
const WORDS = ["dormez.", "lisez.", "mangez.", "..."];

/** Durée d'affichage de chaque mot (ms) */
const HOLD_MS = 2800;

/** Durée de la transition fade-out / fade-in (ms) */
const FADE_MS = 320;

export function CyclingWord() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"visible" | "hidden">("visible");

  useEffect(() => {
    const timer = setInterval(() => {
      // Phase 1 : fade-out (mot monte + flou + transparence)
      setPhase("hidden");

      // Phase 2 : après le fade-out, changer de mot et fade-in
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setPhase("visible");
      }, FADE_MS);

      // Nettoyage du timeout interne si l'interval est annulé
      return () => clearTimeout(swap);
    }, HOLD_MS + FADE_MS);

    return () => clearInterval(timer);
  }, []);

  const isVisible = phase === "visible";

  return (
    <em
      style={{
        fontStyle: "italic",
        color: "#475569",
        display: "inline-block",
        /* Transition simultanée : opacité + déplacement vertical + flou */
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease, filter ${FADE_MS}ms ease`,
        opacity: isVisible ? 1 : 0,
        /* Mot entrant : descend légèrement depuis le haut */
        transform: isVisible ? "translateY(0)" : "translateY(-10px)",
        filter: isVisible ? "blur(0px)" : "blur(6px)",
        /* Évite le layout shift pendant la transition */
        willChange: "opacity, transform, filter",
      }}
    >
      {WORDS[index]}
    </em>
  );
}
