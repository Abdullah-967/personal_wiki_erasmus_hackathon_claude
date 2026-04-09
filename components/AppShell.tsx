"use client";

import { createClient } from "@/lib/supabase/client";
import type { WikiPage } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import AgentPanel from "./AgentPanel";
import RightPanel from "./RightPanel";
import WikiPageView from "./WikiPageView";

type RightPanelMode = "pages" | "related" | "referenced";
type SectionKey = "title" | "summary" | "body" | "key_points";

export default function AppShell() {
  const [activePage, setActivePage] = useState<WikiPage | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("pages");
  const [relatedPages, setRelatedPages] = useState<WikiPage[]>([]);
  const [referencedPages, setReferencedPages] = useState<WikiPage[]>([]);
  const [allPages, setAllPages] = useState<WikiPage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [navHistory, setNavHistory] = useState<WikiPage[]>([]);

  // F18: streaming UX state
  const [isSkeletonMode, setIsSkeletonMode] = useState(false);
  const [revealedSections, setRevealedSections] = useState<
    Set<SectionKey> | undefined
  >(undefined);
  const [changedSections, setChangedSections] = useState<Set<SectionKey>>(
    new Set(),
  );
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePageRef = useRef<WikiPage | null>(null);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const supabase = createClient();

  // Fetch user and all pages on mount
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("wiki_pages")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) {
        setAllPages(data);
        if (data.length > 0) setActivePage(data[0]);
      }
    }
    init();
  }, []);

  // Supabase Realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel | undefined;

    async function subscribe() {
      channel = supabase
        .channel("wiki-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "wiki_pages",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newPage = payload.new as WikiPage;
            setAllPages((prev) => {
              const filtered = prev.filter((p) => p.id !== newPage.id);
              return [newPage, ...filtered];
            });

            // Clear any in-flight reveal timers
            for (const t of revealTimers.current) clearTimeout(t);
            revealTimers.current = [];

            // page=null + isSkeletonMode=true triggers the full <Skeleton /> guard
            setActivePage(null);
            setIsSkeletonMode(true);
            setRevealedSections(new Set());

            // 0ms: set activePage + isSkeletonMode(false) only (no revealedSections update)
            const t0 = setTimeout(() => {
              setActivePage(newPage);
              setIsSkeletonMode(false);
            }, 0);
            revealTimers.current.push(t0);

            const schedule: [number, SectionKey][] = [
              [50, "title"],
              [150, "summary"],
              [300, "body"],
              [450, "key_points"],
            ];

            for (const [delay, key] of schedule) {
              const t = setTimeout(() => {
                setRevealedSections((prev) => {
                  const next = new Set(prev ?? []);
                  next.add(key);
                  return next;
                });
              }, delay);
              revealTimers.current.push(t);
            }

            // After all sections revealed, clear reveal state → normal rendering
            const done = setTimeout(() => {
              setRevealedSections(undefined);
            }, 650);
            revealTimers.current.push(done);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "wiki_pages",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updated = payload.new as WikiPage;
            const old = payload.old as Partial<WikiPage>;

            setAllPages((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p)),
            );
            setActivePage((prev) => (prev?.id === updated.id ? updated : prev));

            // Diff to find changed sections and flash them
            const changed = new Set<SectionKey>();
            if (old.title !== undefined && old.title !== updated.title)
              changed.add("title");
            if (old.summary !== undefined && old.summary !== updated.summary)
              changed.add("summary");
            if (old.body !== undefined && old.body !== updated.body)
              changed.add("body");
            if (
              old.key_points !== undefined &&
              JSON.stringify(old.key_points) !==
                JSON.stringify(updated.key_points)
            )
              changed.add("key_points");

            if (changed.size > 0) {
              if (flashTimer.current) clearTimeout(flashTimer.current);
              setChangedSections(changed);
              flashTimer.current = setTimeout(() => {
                setChangedSections(new Set());
              }, 800);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "page_links",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            // Re-fetch related pages for the active page when a new link is inserted
            if (!activePageRef.current) return;
            const { data: linksRaw } = await supabase
              .from("page_links")
              .select("target_page_id")
              .eq("source_page_id", activePageRef.current.id);

            const links = linksRaw as Array<{ target_page_id: string }> | null;
            if (!links?.length) return;

            const targetIds = links.map((l) => l.target_page_id);
            const { data: pages } = await supabase
              .from("wiki_pages")
              .select("*")
              .in("id", targetIds);

            if (pages) {
              setRelatedPages(pages);
              setRightPanelMode("related");
            }
          },
        )
        .subscribe();
    }

    subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
      // Clean up reveal/flash timers when effect re-runs or unmounts
      for (const t of revealTimers.current) clearTimeout(t);
      revealTimers.current = [];
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [userId]);

  function handleReferencedPageTitles(titles: string[]) {
    const referenced = allPages.filter((p) =>
      titles.some((t) => t.toLowerCase() === p.title.toLowerCase()),
    );
    if (referenced.length > 0) {
      setReferencedPages(referenced);
      setRightPanelMode("referenced");
    }
  }

  function handleRightPanel(mode: "related" | "referenced", pages: WikiPage[]) {
    if (mode === "related") {
      setRelatedPages(pages);
      setRightPanelMode("related");
    } else {
      setReferencedPages(pages);
      setRightPanelMode("referenced");
    }
  }

  async function handleNavigate(title: string) {
    const cached = allPages.find(
      (p) =>
        p.title.toLowerCase() === title.toLowerCase() ||
        p.aliases.some((a) => a.toLowerCase() === title.toLowerCase()),
    );

    let target: WikiPage | null = cached ?? null;

    if (!target) {
      // Page not in local cache (e.g. created after initial load, Realtime delay)
      const { data } = await supabase
        .from("wiki_pages")
        .select("*")
        .ilike("title", title)
        .maybeSingle();

      if (data) {
        const fetched = data as WikiPage;
        setAllPages((prev) =>
          prev.some((p) => p.id === fetched.id) ? prev : [fetched, ...prev],
        );
        target = fetched;
      }
    }

    if (!target || target.id === activePageRef.current?.id) return;

    // Push current page onto the back stack before navigating
    if (activePageRef.current) {
      setNavHistory((prev) => [...prev.slice(-19), activePageRef.current!]);
    }
    setActivePage(target);
  }

  function handleNavigateBack() {
    setNavHistory((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setActivePage(last);
      return prev.slice(0, -1);
    });
  }

  const rightPages =
    rightPanelMode === "related"
      ? relatedPages
      : rightPanelMode === "referenced"
        ? referencedPages
        : allPages;

  return (
    <div className="grid grid-cols-[320px_1fr_280px] grid-rows-[1fr] h-screen overflow-hidden">
      <AgentPanel
        onNavigateToTitle={handleNavigate}
        onRightPanelChange={handleRightPanel}
        onReferencedPageTitles={handleReferencedPageTitles}
      />
      <WikiPageView
        page={activePage}
        allPages={allPages}
        onNavigate={handleNavigate}
        canGoBack={navHistory.length > 0}
        onNavigateBack={handleNavigateBack}
        isSkeletonMode={isSkeletonMode}
        revealedSections={revealedSections}
        changedSections={changedSections}
      />
      <RightPanel
        mode={rightPanelMode}
        pages={rightPages}
        onPageSelect={setActivePage}
      />
    </div>
  );
}
