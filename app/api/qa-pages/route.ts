import { createClient } from "@supabase/supabase-js";

// QA-only endpoint: returns wiki pages for the QA test user.
// Only active when QA_BYPASS=1 — never exposed in production.
const QA_USER_ID = "5ae62cd7-24b7-474b-88c8-c90d83df0cc2";

export async function GET(): Promise<Response> {
  if (process.env.QA_BYPASS !== "1") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from("wiki_pages")
    .select("*")
    .eq("user_id", QA_USER_ID)
    .order("updated_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data ?? []);
}
