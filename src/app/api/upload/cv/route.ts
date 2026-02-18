import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Role : API route pour uploader un CV (PDF) vers Supabase Storage
 * Methode : POST (multipart/form-data avec champ "file")
 * Auth : requiert une session active
 * Stocke le fichier dans le bucket "cvs" avec le chemin : {userId}/{timestamp}.pdf
 * Retourne l'URL publique du fichier uploade
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo maximum
const ALLOWED_TYPES = ["application/pdf"];
const BUCKET_NAME = "cvs";

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
        { error: "Seuls les fichiers PDF sont acceptes" },
        { status: 400 }
      );
    }

    // Validation de la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas depasser 5 Mo" },
        { status: 400 }
      );
    }

    // Conversion du fichier en buffer pour l'upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${session.user.id}/${Date.now()}.pdf`;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload du fichier" },
        { status: 500 }
      );
    }

    // Recuperation de l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return NextResponse.json(
      {
        data: { url: urlData.publicUrl },
        message: "CV uploade avec succes",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CV upload error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
