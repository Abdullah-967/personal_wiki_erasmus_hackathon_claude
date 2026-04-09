import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function HomePage() {
  // QA_BYPASS: skip auth for browser testing — revert before shipping
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
          Loading workspace...
        </div>
      }
    >
      <AppShell />
    </Suspense>
  );
}
