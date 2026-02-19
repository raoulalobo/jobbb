"use client";

import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

/**
 * Role : Input de competences sous forme de tags/badges
 * Permet d'ajouter des competences en tapant du texte et en appuyant sur Entree ou virgule
 * Chaque competence est affichee comme un badge supprimable
 * Utilise par : ProfileForm
 *
 * Exemple :
 *   <SkillsInput skills={["React", "Node.js"]} onChange={(skills) => setSkills(skills)} />
 */
interface SkillsInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  /** Label affiché au-dessus du champ. Par défaut : "Compétences" */
  label?: string;
  /** Placeholder affiché quand la liste est vide */
  placeholder?: string;
}

export function SkillsInput({ skills, onChange, label = "Compétences", placeholder }: SkillsInputProps) {
  const [inputValue, setInputValue] = useState("");

  // Ajouter une competence a la liste (si elle n'existe pas deja)
  const addSkill = useCallback(
    (skill: string) => {
      const trimmed = skill.trim();
      if (trimmed && !skills.includes(trimmed)) {
        onChange([...skills, trimmed]);
      }
      setInputValue("");
    },
    [skills, onChange]
  );

  // Supprimer une competence par son index
  const removeSkill = useCallback(
    (index: number) => {
      onChange(skills.filter((_, i) => i !== index));
    },
    [skills, onChange]
  );

  // Gestion des touches clavier : Entree et virgule pour ajouter, Backspace pour supprimer le dernier
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && skills.length > 0) {
      // Supprimer le dernier tag si le champ est vide et on appuie sur Backspace
      removeSkill(skills.length - 1);
    }
  }

  // Gestion du collage : separer par virgules
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const newSkills = pastedText
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter((s) => s && !skills.includes(s));
    if (newSkills.length > 0) {
      onChange([...skills, ...newSkills]);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Zone d'affichage des tags + input */}
      <div className="flex min-h-10 flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {/* Liste des competences sous forme de badges */}
        {skills.map((skill, index) => (
          <Badge
            key={`${skill}-${index}`}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              aria-label={`Supprimer ${skill}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Champ de saisie pour ajouter une competence */}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            // Ajouter le texte en cours si on quitte le champ
            if (inputValue.trim()) addSkill(inputValue);
          }}
          placeholder={skills.length === 0 ? (placeholder ?? "Ex: React, Node.js, TypeScript...") : "Ajouter..."}
          className="h-7 min-w-[120px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Appuyez sur Entree ou virgule pour ajouter une competence
      </p>
    </div>
  );
}
