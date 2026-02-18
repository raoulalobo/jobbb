import { createClient } from "@supabase/supabase-js";

/**
 * Role : Client Supabase server-side avec la cle service_role
 * Utilisé pour les operations privilegiees : upload Storage, acces admin
 * Ne jamais exposer ce client cote client (pas de NEXT_PUBLIC)
 *
 * Exemple :
 *   const { data, error } = await supabaseAdmin.storage.from("cvs").upload(path, file)
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
