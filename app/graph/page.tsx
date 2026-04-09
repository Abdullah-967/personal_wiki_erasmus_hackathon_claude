import KnowledgeGraph from "@/components/KnowledgeGraph";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function GraphPage() {
  if (process.env.QA_BYPASS !== "1") {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      redirect("/login");
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-950 text-sm text-gray-400">
          Loading graph...
        </div>
      }
    >
      <KnowledgeGraph />
    </Suspense>
  );
}
