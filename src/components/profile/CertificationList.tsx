"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Role : Liste éditable de certifications professionnelles
 * Permet d'ajouter, modifier et supprimer des certifications
 * Utilisé par : ProfileForm
 *
 * Chaque certification contient :
 *   - name   : nom de la certification (ex: "AWS Solutions Architect")
 *   - issuer : organisme émetteur (ex: "Amazon Web Services")
 *   - date   : date d'obtention (ex: "Mars 2024")
 *
 * Exemple :
 *   <CertificationList
 *     items={certifications}
 *     onChange={(items) => setCertifications(items)}
 *   />
 */

export interface CertificationItem {
  name: string;
  issuer: string;
  date: string;
}

interface CertificationListProps {
  items: CertificationItem[];
  onChange: (items: CertificationItem[]) => void;
}

const EMPTY_CERTIFICATION: CertificationItem = {
  name: "",
  issuer: "",
  date: "",
};

export function CertificationList({ items, onChange }: CertificationListProps) {
  // Index de l'élément en cours d'édition (-1 = aucun, items.length = nouvel élément)
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editForm, setEditForm] = useState<CertificationItem>({ ...EMPTY_CERTIFICATION });

  // Ouvrir le formulaire d'ajout
  function handleAdd() {
    setEditForm({ ...EMPTY_CERTIFICATION });
    setEditingIndex(items.length);
  }

  // Ouvrir le formulaire d'édition d'un élément existant
  function handleEdit(index: number) {
    setEditForm({ ...items[index] });
    setEditingIndex(index);
  }

  // Sauvegarder l'élément en cours d'édition
  function handleSave() {
    const newItems = [...items];
    if (editingIndex === items.length) {
      newItems.push(editForm);
    } else {
      newItems[editingIndex] = editForm;
    }
    onChange(newItems);
    setEditingIndex(-1);
  }

  function handleCancel() {
    setEditingIndex(-1);
  }

  function handleDelete(index: number) {
    onChange(items.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(-1);
  }

  function updateField(field: keyof CertificationItem, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Certifications</Label>
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

      {/* Liste des certifications existantes */}
      {items.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            {editingIndex === index ? (
              // Formulaire d'édition inline
              <CertificationEditForm
                form={editForm}
                onUpdate={updateField}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              // Affichage en lecture
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.issuer && (
                    <p className="text-sm text-muted-foreground">{item.issuer}</p>
                  )}
                  {item.date && (
                    <p className="text-xs text-muted-foreground">{item.date}</p>
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

      {/* Formulaire d'ajout (nouvel élément) */}
      {editingIndex === items.length && (
        <Card>
          <CardContent className="p-4">
            <CertificationEditForm
              form={editForm}
              onUpdate={updateField}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      {/* Message si aucune certification */}
      {items.length === 0 && editingIndex === -1 && (
        <p className="text-sm text-muted-foreground">
          Aucune certification ajoutée.
        </p>
      )}
    </div>
  );
}

/**
 * Role : Formulaire d'édition inline pour une certification
 */
interface CertificationEditFormProps {
  form: CertificationItem;
  onUpdate: (field: keyof CertificationItem, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function CertificationEditForm({ form, onUpdate, onSave, onCancel }: CertificationEditFormProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Nom de la certification */}
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Nom de la certification *</Label>
          <Input
            value={form.name}
            onChange={(e) => onUpdate("name", e.target.value)}
            placeholder="Ex: AWS Solutions Architect Associate"
          />
        </div>

        {/* Organisme émetteur */}
        <div className="space-y-1">
          <Label className="text-xs">Organisme</Label>
          <Input
            value={form.issuer}
            onChange={(e) => onUpdate("issuer", e.target.value)}
            placeholder="Ex: Amazon Web Services"
          />
        </div>

        {/* Date d'obtention */}
        <div className="space-y-1">
          <Label className="text-xs">Date d&apos;obtention</Label>
          <Input
            value={form.date}
            onChange={(e) => onUpdate("date", e.target.value)}
            placeholder="Ex: Mars 2024"
          />
        </div>
      </div>

      {/* Boutons sauvegarder / annuler */}
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onSave} disabled={!form.name.trim()}>
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
