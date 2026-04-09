import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["application/pdf", "text/plain", "text/markdown"];

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file)
    return Response.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".md")) {
    return Response.json(
      { error: "Unsupported file type. Try PDF, .txt, or .md." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return Response.json(
      { error: "File exceeds 10 MB limit." },
      { status: 400 },
    );
  }

  let text: string;

  try {
    if (file.type === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      text = await file.text();
    }
  } catch {
    return Response.json(
      { error: "Could not extract text. Try pasting the content manually." },
      { status: 422 },
    );
  }

  if (!text.trim()) {
    return Response.json(
      { error: "Could not extract text. Try pasting the content manually." },
      { status: 422 },
    );
  }

  // Store source metadata — page_id linked later when Claude creates the page
  try {
    await supabase.from("sources").insert({
      user_id: user.id,
      source_type: file.type,
      source_name: file.name,
      excerpt: text.slice(0, 500),
      file_reference: "", // storage upload deferred
    });
  } catch {
    // Non-fatal: proceed even if metadata insert fails
  }

  return Response.json({ text, source_name: file.name });
}
