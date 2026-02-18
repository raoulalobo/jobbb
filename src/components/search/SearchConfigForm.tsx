"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, Loader2, X } from "lucide-react";
import {
  useSearchConfigStore,
  CONTRACT_TYPES,
} from "@/lib/stores/search-config-store";
import { useState } from "react";

/**
 * Role : Formulaire modal pour creer ou editer un critere de recherche
 * Champs : nom, requete, localisation, sites (checkboxes), remote, salaire min,
 *          types de contrat (checkboxes), mots-cles exclus (tags)
 * Etat : gere par useSearchConfigStore (Zustand)
 * Utilise par : page /searches
 *
 * Exemple :
 *   <SearchConfigForm
 *     isPending={mutation.isPending}
 *     onSubmit={(data) => mutation.mutate(data)}
 *   />
 */
interface SearchConfigFormProps {
  isPending: boolean;
  onSubmit: () => void;
}

export function SearchConfigForm({ isPending, onSubmit }: SearchConfigFormProps) {
  // Etat Zustand du formulaire
  const isFormOpen = useSearchConfigStore((s) => s.isFormOpen);
  const formData = useSearchConfigStore((s) => s.formData);
  const closeForm = useSearchConfigStore((s) => s.actions.closeForm);
  const updateField = useSearchConfigStore((s) => s.actions.updateFormField);

  // Etat local pour l'input des mots-cles exclus (isole a ce composant)
  const [excludeInput, setExcludeInput] = useState("");

  const isEditing = !!formData.id;

  // Toggle un type de contrat
  function toggleContractType(type: string) {
    const current = formData.contractTypes;
    if (current.includes(type)) {
      if (current.length === 1) return;
      updateField("contractTypes", current.filter((t) => t !== type));
    } else {
      updateField("contractTypes", [...current, type]);
    }
  }

  // Ajouter un mot-cle exclu
  function addExcludeKeyword(keyword: string) {
    const trimmed = keyword.trim();
    if (trimmed && !formData.excludeKeywords.includes(trimmed)) {
      updateField("excludeKeywords", [...formData.excludeKeywords, trimmed]);
    }
    setExcludeInput("");
  }

  // Supprimer un mot-cle exclu
  function removeExcludeKeyword(keyword: string) {
    updateField(
      "excludeKeywords",
      formData.excludeKeywords.filter((kw) => kw !== keyword)
    );
  }

  // Gestion de la soumission
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la recherche" : "Nouvelle recherche"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de la recherche */}
          <div className="space-y-2">
            <Label htmlFor="config-name">Nom de la recherche *</Label>
            <Input
              id="config-name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ex: Ma recherche React Paris"
              required
            />
          </div>

          {/* Requete de recherche */}
          <div className="space-y-2">
            <Label htmlFor="config-query">Mots-cles de recherche *</Label>
            <Input
              id="config-query"
              value={formData.query}
              onChange={(e) => updateField("query", e.target.value)}
              placeholder="Ex: developpeur React"
              required
            />
          </div>

          {/* Localisation */}
          <div className="space-y-2">
            <Label htmlFor="config-location">Localisation *</Label>
            <Input
              id="config-location"
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Ex: Paris"
              required
            />
          </div>

          {/* Site de recherche : LinkedIn uniquement (force dans le store) */}

          {/* Types de contrat (checkboxes) */}
          <div className="space-y-2">
            <Label>Types de contrat</Label>
            <div className="flex flex-wrap gap-2">
              {CONTRACT_TYPES.map((type) => {
                const isSelected = formData.contractTypes.includes(type.value);
                return (
                  <Badge
                    key={type.value}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleContractType(type.value)}
                  >
                    {type.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Teletravail */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="config-remote"
              checked={formData.remote}
              onChange={(e) => updateField("remote", e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="config-remote" className="cursor-pointer">
              Teletravail accepte
            </Label>
          </div>

          {/* Salaire minimum */}
          <div className="space-y-2">
            <Label htmlFor="config-salary">Salaire minimum annuel (EUR)</Label>
            <Input
              id="config-salary"
              type="number"
              value={formData.salaryMin ?? ""}
              onChange={(e) =>
                updateField(
                  "salaryMin",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              placeholder="Ex: 45000"
            />
          </div>

          {/* Mots-cles exclus */}
          <div className="space-y-2">
            <Label>Mots-cles a exclure</Label>
            {/* Tags existants */}
            {formData.excludeKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.excludeKeywords.map((kw) => (
                  <Badge key={kw} variant="destructive" className="gap-1 pr-1">
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeExcludeKeyword(kw)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-destructive-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {/* Input pour ajouter */}
            <Input
              value={excludeInput}
              onChange={(e) => setExcludeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addExcludeKeyword(excludeInput);
                }
              }}
              onBlur={() => {
                if (excludeInput.trim()) addExcludeKeyword(excludeInput);
              }}
              placeholder="Ex: junior, stage (Entree pour ajouter)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeForm}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditing ? "Modifier" : "Creer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
