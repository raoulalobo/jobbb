-- AlterTable : ajouter les colonnes LinkedIn au profil utilisateur
-- Ces colonnes stockent les identifiants de connexion LinkedIn pour le scraping authentifie
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "linkedinEmail" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "linkedinPassword" TEXT;

-- AlterTable : mettre a jour la valeur par defaut de sites dans SearchConfig
-- Passage de ["wttj"] a ["linkedin"] comme site par defaut
ALTER TABLE "SearchConfig" ALTER COLUMN "sites" SET DEFAULT '["linkedin"]';
