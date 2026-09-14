import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin, ensureBucket, SUPABASE_BUCKET, SUPABASE_PDF_BUCKET } from "@/lib/supabase";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500MB
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

// Fallback MIME types keyed by extension — some browsers (especially on
// mobile) leave `file.type` blank for video/PDF uploads. Without this, the
// file still uploads but gets stored with the wrong Content-Type, which is
// a common reason an uploaded video looks "not playing": the browser can't
// tell what codec/container it's looking at.
const EXT_CONTENT_TYPE: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

const TEXT_FIELDS = [
  "title",
  "tagline",
  "about",
  "learnFrom",
  "learnFromBio",
  "contactPhone",
  "whatsappUrl",
  "youtubeUrl",
  "instagramUrl",
] as const;

function extOf(originalName: string): string {
  const match = /\.[a-zA-Z0-9]+$/.exec(originalName);
  return match ? match[0].toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
}

function safeName(originalName: string): string {
  return `${crypto.randomUUID()}${extOf(originalName)}`;
}

function resolveContentType(file: File): string {
  if (file.type) return file.type;
  return EXT_CONTENT_TYPE[extOf(file.name)] || "application/octet-stream";
}

// Public files (logo, hero image, showcase video) go to the public bucket
// and are returned as a permanent public URL — fine, since none of these
// need to be gated behind payment.
async function savePublicFile(prefix: string, file: File): Promise<string> {
  await ensureBucket(SUPABASE_BUCKET, true);
  const filename = `${prefix}-${safeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filename, buffer, {
      contentType: resolveContentType(file),
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

// The ebook PDF goes to a *private* bucket. We only ever return/store the
// storage path (not a public URL) — the file is only ever readable by the
// server, via /api/download, which checks payment + the download limit
// first. This is what keeps the paid file from becoming a permanently
// shareable link.
async function savePrivatePdf(file: File): Promise<string> {
  await ensureBucket(SUPABASE_PDF_BUCKET, false);
  const filename = `ebook-${safeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(SUPABASE_PDF_BUCKET)
    .upload(filename, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  return filename;
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  try {
    const formData = await req.formData();

    const fields: Record<string, string | number> = {};
    for (const key of TEXT_FIELDS) {
      const value = formData.get(key);
      if (typeof value === "string" && value.length > 0) fields[key] = value;
    }

    const logo = formData.get("logo") as File | null;
    const heroImage = formData.get("heroImage") as File | null;
    const pdfFile = formData.get("pdf") as File | null;
    const videoFile = formData.get("video") as File | null;

    for (const [file, label] of [
      [logo, "Logo"],
      [heroImage, "Hero image"],
    ] as const) {
      if (file && file.size > 0) {
        if (!ALLOWED_IMAGE_TYPES.has(resolveContentType(file))) {
          return NextResponse.json({ error: `${label}: only PNG, JPEG, WEBP, or GIF images are allowed.` }, { status: 400 });
        }
        if (file.size > MAX_IMAGE_BYTES) {
          return NextResponse.json({ error: `${label} is too large (max 5MB).` }, { status: 400 });
        }
      }
    }
    if (pdfFile && pdfFile.size > 0) {
      if (resolveContentType(pdfFile) !== "application/pdf") {
        return NextResponse.json({ error: "Ebook file must be a PDF." }, { status: 400 });
      }
      if (pdfFile.size > MAX_PDF_BYTES) {
        return NextResponse.json({ error: "PDF is too large (max 25MB)." }, { status: 400 });
      }
    }
    if (videoFile && videoFile.size > 0) {
      if (!ALLOWED_VIDEO_TYPES.has(resolveContentType(videoFile))) {
        return NextResponse.json({ error: "Video must be MP4, WebM, or MOV." }, { status: 400 });
      }
      if (videoFile.size > MAX_VIDEO_BYTES) {
        return NextResponse.json({ error: "Video is too large (max 500MB)." }, { status: 400 });
      }
    }

    if (logo && logo.size > 0) fields.logoUrl = await savePublicFile("logo", logo);
    if (heroImage && heroImage.size > 0) fields.heroImageUrl = await savePublicFile("hero", heroImage);
    if (pdfFile && pdfFile.size > 0) {
      fields.pdfUrl = await savePrivatePdf(pdfFile);
      fields.pdfSizeKb = Math.round(pdfFile.size / 1024);
    }
    if (videoFile && videoFile.size > 0) {
      fields.videoUrl = await savePublicFile("video", videoFile);
    }

    const existing = await prisma.product.findFirst();
    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data: fields })
      : await prisma.product.create({ data: fields });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("Admin upload error:", err);
    const message = err instanceof Error ? err.message : "";

    let hint = "Upload failed. Check the server logs for details.";
    if (/does not exist|relation .* not found|P2021|P1001/i.test(message)) {
      hint = "Database isn't set up yet — run `npx prisma db push` against your DATABASE_URL, or double-check DATABASE_URL/DIRECT_URL are set.";
    } else if (/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      hint = "Supabase Storage isn't configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.";
    } else if (/Supabase upload failed|Could not (check|create) Supabase bucket/i.test(message)) {
      hint = `${message} Check that the service role key is correct and has Storage access.`;
    } else if (/EROFS|read-only file system/i.test(message)) {
      hint = "This host's filesystem is read-only. Uploads should be going through Supabase Storage — check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.";
    }

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
