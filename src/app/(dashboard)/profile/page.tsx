import { ProfileForm } from "@/components/profile/ProfileForm";

/**
 * Role : Page de gestion du profil candidat
 * Affiche le formulaire complet avec infos generales, competences,
 * experiences, formations et upload de CV
 * Utilise par : route /profile
 */
export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground">
          Completez votre profil pour que l&apos;agent puisse adapter vos
          candidatures automatiquement.
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}
