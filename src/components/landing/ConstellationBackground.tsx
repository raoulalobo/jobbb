"use client";

import { useEffect, useRef } from "react";

/**
 * Role : Fond animé "constellation" pour la landing page
 * Dessine des étoiles reliées par des lignes sur un canvas HTML,
 * chaque étoile dérivant imperceptiblement lentement.
 *
 * Technique :
 *   - Canvas 2D redimensionnable (ResizeObserver)
 *   - Densité d'étoiles adaptative (1 étoile / ~10 000px²)
 *   - Lignes tracées entre étoiles distantes de moins de MAX_DIST px
 *   - Opacité des lignes inversement proportionnelle à la distance
 *   - Couleurs brand : bleu #0057BA, violet #9C52F2, lavande #BFABCC
 *   - Vitesses très faibles (±0.2 px/frame) → mouvement imperceptible
 *   - Rebond sur les bords (pas de téléportation)
 *
 * Rendu :
 *   - ~60 étoiles sur desktop, ~30 sur mobile
 *   - requestAnimationFrame → fluide, GPU-friendly
 *   - Nettoyage propre via le return du useEffect
 *
 * Exemple :
 *   <ConstellationBackground />
 */

/** Couleurs brand pour les étoiles (format "r,g,b") */
const STAR_COLORS = [
  "0,87,186",    // bleu royal  #0057BA
  "156,82,242",  // violet      #9C52F2
  "191,171,204", // lavande     #BFABCC
];

/** Distance maximale (px) entre deux étoiles pour tracer une ligne */
const MAX_DIST = 150;

/** Vitesse maximale par frame (px) — plus petit = plus lent */
const MAX_SPEED = 0.2;

interface Star {
  x: number;
  y: number;
  vx: number;      // vélocité horizontale
  vy: number;      // vélocité verticale
  radius: number;  // rayon du point
  color: string;   // couleur "r,g,b" (sans rgba())
  opacity: number; // opacité du point [0.3 – 0.85]
}

export function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let stars: Star[] = [];

    /** Initialise les étoiles en fonction de la taille du canvas */
    const initStars = () => {
      // 1 étoile pour ~10 000px² de surface — densité équilibrée
      const count = Math.max(
        20,
        Math.floor((canvas.width * canvas.height) / 10000)
      );

      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        // Vitesse aléatoire faible, direction quelconque
        vx: (Math.random() - 0.5) * MAX_SPEED * 2,
        vy: (Math.random() - 0.5) * MAX_SPEED * 2,
        radius: Math.random() * 1.8 + 0.8,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        opacity: Math.random() * 0.55 + 0.3,
      }));
    };

    /** Redimensionne le canvas et réinitialise les étoiles */
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initStars();
    };

    /** Boucle principale : déplace + dessine chaque frame */
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── 1. Déplacer les étoiles ──────────────────────────────────────
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;

        // Rebond souple sur les bords (inversion de vélocité)
        if (s.x < 0)              { s.x  = 0;              s.vx *= -1; }
        if (s.x > canvas.width)   { s.x  = canvas.width;   s.vx *= -1; }
        if (s.y < 0)              { s.y  = 0;              s.vy *= -1; }
        if (s.y > canvas.height)  { s.y  = canvas.height;  s.vy *= -1; }
      }

      // ── 2. Tracer les lignes entre étoiles proches ────────────────────
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx   = stars[i].x - stars[j].x;
          const dy   = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            // Opacité proportionnelle à la proximité (plus proches = plus visibles)
            const alpha = (1 - dist / MAX_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            // Couleur de la ligne = moyenne des deux étoiles → bleu neutre
            ctx.strokeStyle = `rgba(0,87,186,${alpha})`;
            ctx.lineWidth   = 0.7;
            ctx.stroke();
          }
        }
      }

      // ── 3. Dessiner les étoiles par-dessus les lignes ─────────────────
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color},${s.opacity})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    };

    // Démarrage
    resize();
    draw();

    // Adapter le canvas quand le conteneur est redimensionné
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Nettoyage : annuler la boucle et l'observer au démontage
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
