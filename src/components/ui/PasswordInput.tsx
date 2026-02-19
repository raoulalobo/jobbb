"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Rôle : Champ mot de passe avec bouton toggle afficher/masquer
 * Utilise par : login/page.tsx, register/page.tsx, ProfileForm.tsx
 *
 * Étend Input (shadcn) en ajoutant :
 *   - un wrapper `relative` pour positionner le bouton
 *   - un état local `showPassword` (useState OK : isolé au composant)
 *   - `pr-10` automatique pour éviter que le texte passe sous l'icône
 *
 * Exemple :
 *   <PasswordInput
 *     id="password"
 *     value={password}
 *     onChange={(e) => setPassword(e.target.value)}
 *     placeholder="Minimum 8 caractères"
 *     autoComplete="new-password"
 *     className="focus-visible:ring-[#0057BA]"
 *   />
 *
 * Accessibilité :
 *   - aria-label dynamique sur le bouton ("Afficher" / "Masquer")
 *   - type switch entre "password" et "text"
 *   - tabIndex={-1} sur le bouton pour ne pas le mettre dans le flux tab
 */

// Réutilise toutes les props de Input sauf `type` (contrôlé en interne)
type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  // État local : visible/masqué — isolé à ce composant, useState est approprié
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      {/* Champ texte ou password selon l'état du toggle */}
      <Input
        type={showPassword ? "text" : "password"}
        // Padding droit suffisant pour ne pas chevaucher le bouton (40px = h-9 bouton)
        className={cn("pr-10", className)}
        {...props}
      />

      {/*
       * Bouton toggle — positionné en absolu à droite, centré verticalement
       * tabIndex={-1} : non accessible via Tab (le champ lui-même suffit)
       * type="button" : évite la soumission du formulaire parent
       */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        {showPassword
          ? <EyeOff size={16} aria-hidden />
          : <Eye size={16} aria-hidden />
        }
      </button>
    </div>
  );
}
