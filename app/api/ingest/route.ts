import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const maxDuration = 30;

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["application/pdf", "text/plain", "text/markdown"];

// QA test user — matches an existing row in auth.users
const QA_USER_ID = "5ae62cd7-24b7-474b-88c8-c90d83df0cc2";

export async function POST(request: Request): Promise<Response> {
  let userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: ReturnType<typeof createAdminClient>;

  if (process.env.QA_BYPASS === "1") {
    userId = QA_USER_ID;
    supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  } else {
    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;
    supabase = sessionClient as unknown as ReturnType<typeof createAdminClient>;
  }

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
      const { extractText } = await import("unpdf");
      const arrayBuffer = await file.arrayBuffer();
      const parsed = await extractText(new Uint8Array(arrayBuffer));
      text = parsed.text.join("\n");
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
      user_id: userId,
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
