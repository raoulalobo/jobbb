import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/db";

/**
 * Role : API route pour uploader une photo de profil vers Supabase Storage
 * Methode : POST (multipart/form-data avec champ "file")
 * Auth : requiert une session active
 * Stocke l'image dans le bucket "avatars" avec le chemin : {userId}/{timestamp}.{ext}
 * Met a jour le champ image du User en BDD
 * Retourne l'URL publique de l'image
 */

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 Mo maximum
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_NAME = "avatars";

export async function POST(request: NextRequest) {
  try {
    // Verification de l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorise" },
        { status: 401 }
      );
    }

    // Extraction du fichier depuis le formulaire
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formats acceptes : JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    // Validation de la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "L'image ne doit pas depasser 2 Mo" },
        { status: 400 }
      );
    }

    // Conversion du fichier en buffer pour l'upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split("/")[1]; // jpeg, png, webp
    const fileName = `${session.user.id}/${Date.now()}.${ext}`;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage avatar upload error:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload de l'image" },
        { status: 500 }
      );
    }

    // Recuperation de l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    // Mise a jour du champ image dans le modele User
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: urlData.publicUrl },
    });

    return NextResponse.json(
      {
        data: { url: urlData.publicUrl },
        message: "Photo de profil mise a jour",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
