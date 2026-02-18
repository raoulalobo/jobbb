"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Role : Liste editable d'experiences professionnelles ou de formations
 * Permet d'ajouter, modifier et supprimer des entrees
 * Utilise par : ProfileForm (pour experiences et education)
 *
 * Exemple (experiences) :
 *   <ExperienceList
 *     type="experience"
 *     items={experiences}
 *     onChange={(items) => setExperiences(items)}
 *   />
 *
 * Exemple (formations) :
 *   <ExperienceList
 *     type="education"
 *     items={education}
 *     onChange={(items) => setEducation(items)}
 *   />
 */

// Type pour une experience professionnelle
export interface ExperienceItem {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

// Type pour une formation
export interface EducationItem {
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ExperienceListProps {
  type: "experience" | "education";
  items: ExperienceItem[] | EducationItem[];
  onChange: (items: any[]) => void;
}

// Valeurs par defaut pour un nouvel element
const EMPTY_EXPERIENCE: ExperienceItem = {
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  description: "",
};

const EMPTY_EDUCATION: EducationItem = {
  school: "",
  degree: "",
  startDate: "",
  endDate: "",
};

export function ExperienceList({ type, items, onChange }: ExperienceListProps) {
  // Index de l'element en cours d'edition (-1 = aucun, items.length = nouvel element)
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  // Donnees du formulaire d'edition en cours
  const [editForm, setEditForm] = useState<ExperienceItem | EducationItem>(
    type === "experience" ? { ...EMPTY_EXPERIENCE } : { ...EMPTY_EDUCATION }
  );

  const isExperience = type === "experience";
  const label = isExperience ? "Experience" : "Formation";

  // Ouvrir le formulaire d'ajout d'un nouvel element
  function handleAdd() {
    setEditForm(isExperience ? { ...EMPTY_EXPERIENCE } : { ...EMPTY_EDUCATION });
    setEditingIndex(items.length);
  }

  // Ouvrir le formulaire d'edition d'un element existant
  function handleEdit(index: number) {
    setEditForm({ ...items[index] });
    setEditingIndex(index);
  }

  // Sauvegarder l'element en cours d'edition
  function handleSave() {
    const newItems = [...items];
    if (editingIndex === items.length) {
      // Ajout d'un nouvel element
      newItems.push(editForm as never);
    } else {
      // Modification d'un element existant
      newItems[editingIndex] = editForm as never;
    }
    onChange(newItems);
    setEditingIndex(-1);
  }

  // Annuler l'edition en cours
  function handleCancel() {
    setEditingIndex(-1);
  }

  // Supprimer un element par son index
  function handleDelete(index: number) {
    onChange(items.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(-1);
  }

  // Mettre a jour un champ du formulaire d'edition
  function updateField(field: string, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{isExperience ? "Experiences professionnelles" : "Formations"}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={editingIndex !== -1}
        >
          <Plus className="mr-1 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Liste des elements existants */}
      {items.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            {editingIndex === index ? (
              // Formulaire d'edition inline
              <EditForm
                type={type}
                form={editForm}
                onUpdate={updateField}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              // Affichage en lecture
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {isExperience
                      ? (item as ExperienceItem).title
                      : (item as EducationItem).degree}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isExperience
                      ? (item as ExperienceItem).company
                      : (item as EducationItem).school}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.startDate} - {item.endDate || "Present"}
                  </p>
                  {isExperience && (item as ExperienceItem).description && (
                    <p className="mt-2 text-sm">
                      {(item as ExperienceItem).description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(index)}
                    disabled={editingIndex !== -1}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(index)}
                    disabled={editingIndex !== -1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Formulaire d'ajout (nouvel element) */}
      {editingIndex === items.length && (
        <Card>
          <CardContent className="p-4">
            <EditForm
              type={type}
              form={editForm}
              onUpdate={updateField}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      {/* Message si aucun element */}
      {items.length === 0 && editingIndex === -1 && (
        <p className="text-sm text-muted-foreground">
          Aucune {isExperience ? "experience" : "formation"} ajoutee.
        </p>
      )}
    </div>
  );
}

/**
 * Role : Formulaire d'edition inline pour une experience ou formation
 * Affiche les champs adaptes selon le type (experience ou education)
 */
interface EditFormProps {
  type: "experience" | "education";
  form: ExperienceItem | EducationItem;
  onUpdate: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function EditForm({ type, form, onUpdate, onSave, onCancel }: EditFormProps) {
  const isExperience = type === "experience";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Champ principal : titre du poste ou diplome */}
        <div className="space-y-1">
          <Label className="text-xs">
            {isExperience ? "Titre du poste" : "Diplome"}
          </Label>
          <Input
            value={isExperience ? (form as ExperienceItem).title : (form as EducationItem).degree}
            onChange={(e) =>
              onUpdate(isExperience ? "title" : "degree", e.target.value)
            }
            placeholder={isExperience ? "Ex: Developpeur React" : "Ex: Master Informatique"}
          />
        </div>

        {/* Champ secondaire : entreprise ou ecole */}
        <div className="space-y-1">
          <Label className="text-xs">
            {isExperience ? "Entreprise" : "Etablissement"}
          </Label>
          <Input
            value={isExperience ? (form as ExperienceItem).company : (form as EducationItem).school}
            onChange={(e) =>
              onUpdate(isExperience ? "company" : "school", e.target.value)
            }
            placeholder={isExperience ? "Ex: Google" : "Ex: Universite Paris-Saclay"}
          />
        </div>

        {/* Dates de debut et fin */}
        <div className="space-y-1">
          <Label className="text-xs">Date de debut</Label>
          <Input
            value={form.startDate}
            onChange={(e) => onUpdate("startDate", e.target.value)}
            placeholder="Ex: Jan 2022"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date de fin</Label>
          <Input
            value={form.endDate}
            onChange={(e) => onUpdate("endDate", e.target.value)}
            placeholder="Ex: Dec 2024 ou Present"
          />
        </div>
      </div>

      {/* Description (uniquement pour les experiences) */}
      {isExperience && (
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={(form as ExperienceItem).description}
            onChange={(e) => onUpdate("description", e.target.value)}
            placeholder="Decrivez vos responsabilites et realisations..."
            rows={3}
          />
        </div>
      )}

      {/* Boutons sauvegarder / annuler */}
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onSave}>
          <Check className="mr-1 h-4 w-4" />
          Sauvegarder
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" />
          Annuler
        </Button>
      </div>
    </div>
  );
}
