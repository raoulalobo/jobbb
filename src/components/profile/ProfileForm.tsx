"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useUiStore } from "@/lib/stores/ui-store";
import { SkillsInput } from "./SkillsInput";
import {
  ExperienceList,
  type ExperienceItem,
  type EducationItem,
} from "./ExperienceList";

/**
 * Role : Formulaire complet du profil candidat
 * Gere la saisie et la sauvegarde de toutes les informations du profil :
 * titre, telephone, localisation, resume, competences, experiences, formations, CV
 * Utilise par : page /profile
 * Interactions : API ZenStack (GET/PUT /api/model/profile), Supabase Storage (upload CV)
 */

// Type du profil tel que retourne par l'API
interface ProfileData {
  id?: string;
  title: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experiences: ExperienceItem[];
  education: EducationItem[];
  cvUrl: string | null;
  linkedinEmail: string;
  linkedinPassword: string;
}

// Valeurs par defaut pour un nouveau profil
const DEFAULT_PROFILE: ProfileData = {
  title: "",
  phone: "",
  location: "",
  summary: "",
  skills: [],
  experiences: [],
  education: [],
  cvUrl: null,
  linkedinEmail: "",
  linkedinPassword: "",
};

export function ProfileForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Etat local du formulaire (isole a ce composant, useState acceptable)
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [cvFile, setCvFile] = useState<File | null>(null);

  // Etat partage via Zustand : avatar preview et loading (utilise aussi par Header)
  const avatarPreview = useUiStore((s) => s.avatarPreview);
  const isUploadingAvatar = useUiStore((s) => s.isUploadingAvatar);
  const setAvatarPreview = useUiStore((s) => s.actions.setAvatarPreview);
  const setUploadingAvatar = useUiStore((s) => s.actions.setUploadingAvatar);

  // Session utilisateur pour afficher l'avatar actuel
  const { data: session } = authClient.useSession();

  // Recuperer le profil existant via l'API ZenStack
  const { data: existingProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/model/profile/findFirst");
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Erreur lors du chargement du profil");
      }
      const json = await res.json();
      return json.data as ProfileData | null;
    },
  });

  // Remplir le formulaire avec les donnees existantes
  // eslint-disable-next-line react-hooks/rules-of-hooks -- setProfile synchrone necessaire pour hydrater le form depuis le cache
  useEffect(() => {
    if (existingProfile) {
      setProfile({
        id: existingProfile.id,
        title: existingProfile.title || "",
        phone: existingProfile.phone || "",
        location: existingProfile.location || "",
        summary: existingProfile.summary || "",
        skills: Array.isArray(existingProfile.skills) ? existingProfile.skills : [],
        experiences: Array.isArray(existingProfile.experiences)
          ? existingProfile.experiences
          : [],
        education: Array.isArray(existingProfile.education)
          ? existingProfile.education
          : [],
        cvUrl: existingProfile.cvUrl || null,
        linkedinEmail: existingProfile.linkedinEmail || "",
        linkedinPassword: existingProfile.linkedinPassword || "",
      });
    }
  }, [existingProfile]);

  // Mutation pour sauvegarder le profil (creation ou mise a jour)
  const saveMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      // Upload du CV si un fichier est selectionne (via cvMutation)
      let cvUrl = data.cvUrl;
      if (cvFile) {
        cvUrl = await cvMutation.mutateAsync(cvFile);
      }

      // Champs communs du profil
      const profileFields = {
        title: data.title,
        phone: data.phone || null,
        location: data.location || null,
        summary: data.summary || null,
        skills: data.skills,
        experiences: data.experiences,
        education: data.education,
        cvUrl,
        linkedinEmail: data.linkedinEmail || null,
        linkedinPassword: data.linkedinPassword || null,
      };

      if (data.id) {
        // Mise a jour du profil existant
        const res = await fetch(`/api/model/profile/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            where: { id: data.id },
            data: profileFields,
          }),
        });
        if (!res.ok) throw new Error("Erreur lors de la mise a jour");
        return res.json();
      } else {
        // Creation d'un nouveau profil : connecter l'utilisateur via la relation user
        if (!session?.user?.id) throw new Error("Utilisateur non connecte");
        const res = await fetch("/api/model/profile/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              ...profileFields,
              user: { connect: { id: session.user.id } },
            },
          }),
        });
        if (!res.ok) throw new Error("Erreur lors de la creation");
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success("Profil sauvegarde avec succes");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setCvFile(null);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    },
  });

  // Mutation : upload de la photo de profil vers Supabase Storage
  // Utilise isPending via le store Zustand (isUploadingAvatar) pour l'indicateur visuel
  // car le Header partage cet etat
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erreur lors de l'upload");
      }

      const json = await res.json();
      return json.data.url as string;
    },
    onSuccess: (url) => {
      // Remplacer l'apercu local par l'URL definitive du serveur
      setAvatarPreview(url);
      setUploadingAvatar(false);
      toast.success("Photo de profil mise a jour");
    },
    onError: (error: Error) => {
      // Retirer l'apercu en cas d'erreur
      setAvatarPreview(null);
      setUploadingAvatar(false);
      toast.error(error.message);
    },
  });

  // Handler : validation cote client + lancement de la mutation avatar
  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation cote client
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formats acceptes : JPEG, PNG, WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas depasser 2 Mo");
      return;
    }

    // Afficher un apercu local immediat avant meme l'upload
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setUploadingAvatar(true);

    avatarMutation.mutate(file);

    // Reset l'input file pour permettre de re-selectionner le meme fichier
    e.target.value = "";
  }

  // Mutation : upload du fichier CV vers Supabase Storage
  // Retourne l'URL du CV uploade, utilisee par saveMutation
  const cvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/cv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur lors de l'upload du CV");
      const json = await res.json();
      return json.data.url as string;
    },
  });

  // Gestion de la soumission du formulaire
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation minimale
    if (!profile.title.trim()) {
      toast.error("Le titre professionnel est obligatoire");
      return;
    }

    saveMutation.mutate(profile);
  }

  // Mettre a jour un champ simple du profil
  function updateField(field: keyof ProfileData, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section : Photo de profil */}
      <Card>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Avatar actuel */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatarPreview ?? session?.user?.image ?? undefined}
                  alt={session?.user?.name ?? "Photo de profil"}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {session?.user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) ?? "?"}
                </AvatarFallback>
              </Avatar>

              {/* Indicateur de chargement pendant l'upload */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Bouton et infos d'upload */}
            <div className="space-y-2">
              <Label
                htmlFor="avatar"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Camera className="h-4 w-4" />
                {session?.user?.image ? "Changer la photo" : "Ajouter une photo"}
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploadingAvatar}
              />
              <p className="text-xs text-muted-foreground">
                JPEG, PNG ou WebP. 2 Mo maximum.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section : Informations generales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations generales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Titre professionnel */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre professionnel *</Label>
            <Input
              id="title"
              value={profile.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Ex: Developpeur React Senior"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Telephone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telephone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Ex: 06 12 34 56 78"
              />
            </div>

            {/* Localisation */}
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Ex: Paris, France"
              />
            </div>
          </div>

          {/* Resume professionnel */}
          <div className="space-y-2">
            <Label htmlFor="summary">Resume professionnel</Label>
            <Textarea
              id="summary"
              value={profile.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              placeholder="Decrivez votre parcours et vos objectifs en quelques lignes..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section : Identifiants LinkedIn (pour le scraping authentifie) */}
      <Card>
        <CardHeader>
          <CardTitle>Identifiants LinkedIn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vos identifiants LinkedIn sont utilises pour le scraping authentifie
            des offres d&apos;emploi. Ils sont stockes de maniere securisee et
            ne sont jamais partages.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedinEmail">Email LinkedIn</Label>
              <Input
                id="linkedinEmail"
                type="email"
                value={profile.linkedinEmail}
                onChange={(e) => updateField("linkedinEmail", e.target.value)}
                placeholder="Email LinkedIn"
              />
            </div>

            {/* Mot de passe LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedinPassword">Mot de passe LinkedIn</Label>
              <Input
                id="linkedinPassword"
                type="password"
                value={profile.linkedinPassword}
                onChange={(e) => updateField("linkedinPassword", e.target.value)}
                placeholder="Mot de passe LinkedIn"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section : Competences */}
      <Card>
        <CardHeader>
          <CardTitle>Competences</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsInput
            skills={profile.skills}
            onChange={(skills) =>
              setProfile((prev) => ({ ...prev, skills }))
            }
          />
        </CardContent>
      </Card>

      {/* Section : Experiences professionnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Experiences professionnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <ExperienceList
            type="experience"
            items={profile.experiences}
            onChange={(items) =>
              setProfile((prev) => ({
                ...prev,
                experiences: items as ExperienceItem[],
              }))
            }
          />
        </CardContent>
      </Card>

      {/* Section : Formations */}
      <Card>
        <CardHeader>
          <CardTitle>Formations</CardTitle>
        </CardHeader>
        <CardContent>
          <ExperienceList
            type="education"
            items={profile.education}
            onChange={(items) =>
              setProfile((prev) => ({
                ...prev,
                education: items as EducationItem[],
              }))
            }
          />
        </CardContent>
      </Card>

      {/* Section : CV */}
      <Card>
        <CardHeader>
          <CardTitle>Curriculum Vitae</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Affichage du CV actuel */}
          {profile.cvUrl && !cvFile && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">CV actuel :</span>
              <a
                href={profile.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Voir le CV
              </a>
            </div>
          )}

          {/* Input pour uploader un nouveau CV */}
          <div className="space-y-2">
            <Label htmlFor="cv">
              {profile.cvUrl ? "Remplacer le CV" : "Uploader votre CV"} (PDF)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="cv"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setCvFile(file);
                }}
                className="max-w-sm"
              />
              {cvFile && (
                <span className="text-sm text-muted-foreground">
                  {cvFile.name} ({(cvFile.size / 1024).toFixed(0)} Ko)
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saveMutation.isPending} size="lg">
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde en cours...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder le profil
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
