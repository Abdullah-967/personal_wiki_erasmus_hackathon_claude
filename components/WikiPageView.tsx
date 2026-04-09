"use client";

import { createClient } from "@/lib/supabase/client";
import type { RelationshipType, Source, WikiPage } from "@/types/database";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SectionKey = "title" | "summary" | "body" | "key_points";

interface RelatedTopic {
  title: string;
  relationshipType: RelationshipType;
}

interface RelatedData {
  relatedTopics: RelatedTopic[];
  sources: Source[];
  backlinks: string[];
}

interface Props {
  page: WikiPage | null;
  allPages: WikiPage[];
  onNavigate: (title: string) => void;
  canGoBack?: boolean;
  onNavigateBack?: () => void;
  isSkeletonMode?: boolean;
  revealedSections?: Set<SectionKey>;
  changedSections?: Set<SectionKey>;
}

// Maps relationship types to badge labels + colors.
// "related_to" is omitted — it's the generic fallback, no badge needed.
const REL_BADGE: Partial<Record<RelationshipType, { label: string; className: string }>> = {
  prerequisite_for: { label: "prereq", className: "bg-amber-900/60 text-amber-300" },
  extends: { label: "extends", className: "bg-blue-900/60 text-blue-300" },
  contradicts: { label: "contradicts", className: "bg-red-900/60 text-red-400" },
  example_of: { label: "example", className: "bg-green-900/60 text-green-300" },
  similar_to: { label: "similar", className: "bg-purple-900/60 text-purple-300" },
};

// Defined at module scope so ReactMarkdown never remounts between renders
interface WikiLinkProps {
  title: string;
  allPages: WikiPage[];
  onNavigate: (title: string) => void;
  children: React.ReactNode;
}

function WikiLink({ title, allPages, onNavigate, children }: WikiLinkProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Case-insensitive title/alias match for the hover preview
  const preview = useMemo(
    () =>
      allPages?.find(
        (p) =>
          p.title.toLowerCase() === title.toLowerCase() ||
          p.aliases.some((a) => a.toLowerCase() === title.toLowerCase()),
      ),
    [allPages, title],
  );

  function show() {
    if (!preview || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // 300ms delay prevents flashing on casual mouse passes
    timer.current = setTimeout(() => {
      setPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 272),
      });
      setVisible(true);
    }, 300);
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => onNavigate(title)}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
      >
        {children}
      </button>
      {visible && preview && (
        <div
          // fixed + getBoundingClientRect coords = correct inside scrollable containers
          className="fixed z-50 w-64 bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-2xl pointer-events-none"
          style={{ top: pos.top, left: pos.left }}
        >
          <p className="text-sm font-semibold text-gray-100">{preview.title}</p>
          {preview.summary && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-3 leading-relaxed">
              {preview.summary}
            </p>
          )}
          <p className="text-xs text-blue-400/60 mt-2">click to open →</p>
        </div>
      )}
    </>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CollapsibleSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-800 pt-4 mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-400 cursor-pointer"
      >
        <ChevronIcon open={open} />
        {label}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-700 rounded w-2/3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-5/6" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-4/5" />
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-3/4" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-700 rounded w-24" />
        <div className="h-4 bg-gray-800 rounded w-11/12" />
        <div className="h-4 bg-gray-800 rounded w-4/5" />
        <div className="h-4 bg-gray-800 rounded w-10/12" />
      </div>
      <div className="border-t border-gray-800 pt-4 mt-4 flex gap-2">
        <div className="h-7 bg-gray-700 rounded-full w-20" />
        <div className="h-7 bg-gray-700 rounded-full w-24" />
        <div className="h-7 bg-gray-700 rounded-full w-16" />
      </div>
      <div className="border-t border-gray-800 pt-4 h-4 bg-gray-700 rounded w-28" />
      <div className="border-t border-gray-800 pt-4 h-4 bg-gray-700 rounded w-24" />
    </div>
  );
}

// Module-scope skeleton avoids remounting between reveal timer ticks
function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse space-y-2 ${className ?? ""}`}>
      <div className="h-4 bg-gray-800 rounded w-full" />
      <div className="h-4 bg-gray-800 rounded w-5/6" />
    </div>
  );
}

const SECTION_HEADING =
  "text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2";
const SECTION_DIVIDER = "border-t border-gray-800 pt-4 mt-4";

export default function WikiPageView({
  page,
  allPages,
  onNavigate,
  canGoBack = false,
  onNavigateBack,
  isSkeletonMode = false,
  revealedSections,
  changedSections,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<RelatedData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!page) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setData(null);

    const supabase = createClient();

    async function fetchRelated() {
      if (!page) return;

      const [linksRes, sourcesRes, backlinksRes] = await Promise.all([
        supabase
          .from("page_links")
          .select("target_page_id, relationship_type")
          .eq("source_page_id", page.id),
        supabase.from("sources").select("*").eq("page_id", page.id),
        supabase
          .from("page_links")
          .select("source_page_id")
          .eq("target_page_id", page.id),
      ]);

      const linksWithType = (linksRes.data ?? []) as Array<{
        target_page_id: string;
        relationship_type: RelationshipType;
      }>;
      const targetIds = linksWithType.map((r) => r.target_page_id);
      const sourceIds = (backlinksRes.data ?? []).map(
        (r) => (r as { source_page_id: string }).source_page_id,
      );

      const [relatedPagesRes, backlinkPagesRes] = await Promise.all([
        targetIds.length > 0
          ? supabase
              .from("wiki_pages")
              .select("id, title")
              .in("id", targetIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        sourceIds.length > 0
          ? supabase.from("wiki_pages").select("title").in("id", sourceIds)
          : Promise.resolve({ data: [] as { title: string }[] }),
      ]);

      setData({
        relatedTopics: (relatedPagesRes.data ?? []).map((p) => {
          const typed = p as { id: string; title: string };
          const link = linksWithType.find((l) => l.target_page_id === typed.id);
          return {
            title: typed.title,
            relationshipType: link?.relationship_type ?? "related_to",
          };
        }),
        sources: (sourcesRes.data ?? []) as Source[],
        backlinks: (backlinkPagesRes.data ?? []).map(
          (p) => (p as { title: string }).title,
        ),
      });
      setLoading(false);
    }

    fetchRelated();
  }, [page?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoized so ReactMarkdown doesn't remount wiki links on unrelated re-renders
  const mdComponents = useMemo(
    () => ({
      a: ({
        href,
        children,
      }: {
        href?: string;
        children?: React.ReactNode;
      }) => {
        if (href?.startsWith("wiki:")) {
          return (
            <WikiLink
              title={href.slice(5)}
              allPages={allPages}
              onNavigate={onNavigate}
            >
              {children}
            </WikiLink>
          );
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      },
    }),
    [allPages, onNavigate],
  );

  if (!page && !isSkeletonMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-0">
        <div className="text-center px-8 space-y-3">
          <p className="text-4xl select-none">📖</p>
          <p className="text-base font-medium text-gray-300">Your wiki is empty</p>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            Tell me something you learned, paste an article, or upload a PDF — I&apos;ll
            turn it into a structured wiki page.
          </p>
        </div>
      </div>
    );
  }

  function sectionClass(key: SectionKey): string {
    if (!revealedSections) return "";
    const visible = revealedSections.has(key);
    return visible
      ? "transition-opacity duration-150 ease-out opacity-100"
      : "transition-opacity duration-150 ease-out opacity-0 pointer-events-none";
  }

  function flashClass(key: SectionKey): string {
    if (!changedSections?.has(key)) return "";
    return "bg-yellow-500/10 transition-colors duration-500 rounded";
  }

  const isRevealing = revealedSections !== undefined;

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-900 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full px-6 py-8">
        {isSkeletonMode && !page ? (
          <Skeleton />
        ) : loading && !isRevealing ? (
          <Skeleton />
        ) : page ? (
          // key change triggers remount → CSS fadeIn animation plays on each navigation
          <div key={page.id} className="animate-fadeIn">
            {/* Back navigation */}
            {canGoBack && (
              <button
                type="button"
                onClick={onNavigateBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-5 transition-colors group"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:-translate-x-0.5"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            )}

            {/* Title */}
            <div
              className={`mb-3 ${sectionClass("title")} ${flashClass("title")}`}
            >
              {isRevealing && !revealedSections?.has("title") ? (
                <div className="animate-pulse h-7 w-48 rounded bg-gray-800" />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl font-bold text-gray-100">
                    {page.title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => router.push(`/graph?focus=${page.id}`)}
                    className="shrink-0 text-xs text-gray-500 hover:text-blue-400 transition-colors mt-1.5 whitespace-nowrap"
                  >
                    View in graph →
                  </button>
                </div>
              )}
            </div>

            {/* Summary */}
            <div
              className={`mb-6 ${sectionClass("summary")} ${flashClass("summary")}`}
            >
              {isRevealing && !revealedSections?.has("summary") ? (
                <SectionSkeleton />
              ) : page.summary ? (
                <p className="text-gray-300 leading-relaxed">{page.summary}</p>
              ) : null}
            </div>

            {/* Body */}
            <div
              className={`mb-6 ${sectionClass("body")} ${flashClass("body")}`}
            >
              {isRevealing && !revealedSections?.has("body") ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-800 rounded w-4/5" />
                  <div className="h-4 bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                </div>
              ) : page.body ? (
                <div className="text-gray-300 leading-relaxed [&_h1]:text-gray-100 [&_h2]:text-gray-100 [&_h3]:text-gray-100 [&_h4]:text-gray-100 [&_a]:text-blue-400 [&_a:hover]:text-blue-300 [&_code]:bg-gray-800 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:p-3 [&_pre]:rounded [&_blockquote]:border-l-2 [&_blockquote]:border-gray-600 [&_blockquote]:pl-4 [&_blockquote]:text-gray-400 [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-gray-700 [&_th]:bg-gray-800 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-gray-200 [&_td]:border [&_td]:border-gray-700 [&_td]:px-3 [&_td]:py-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    urlTransform={(url) => url}
                    components={mdComponents}
                  >
                    {page.body}
                  </ReactMarkdown>
                </div>
              ) : null}
            </div>

            {/* Key Points */}
            <div
              className={`mb-6 ${sectionClass("key_points")} ${flashClass("key_points")}`}
            >
              {isRevealing && !revealedSections?.has("key_points") ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-24" />
                  <div className="h-4 bg-gray-800 rounded w-11/12" />
                  <div className="h-4 bg-gray-800 rounded w-4/5" />
                  <div className="h-4 bg-gray-800 rounded w-10/12" />
                </div>
              ) : page.key_points.length > 0 ? (
                <section>
                  <h2 className={SECTION_HEADING}>Key Points</h2>
                  <ul className="space-y-1.5">
                    {page.key_points.map((point, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
                      <li key={i} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-gray-500 select-none mt-0.5 shrink-0">
                          •
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            {/* Examples */}
            {page.examples.length > 0 && (
              <CollapsibleSection label="Examples">
                <ul className="space-y-1.5">
                  {page.examples.map((ex, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
                    <li key={i} className="flex gap-2 text-sm text-gray-300">
                      <span className="text-gray-500 select-none mt-0.5 shrink-0">
                        →
                      </span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}

            {/* Related Topics — with relationship type badges */}
            {data && data.relatedTopics.length > 0 && (
              <div className={SECTION_DIVIDER}>
                <p className={SECTION_HEADING}>Related Topics</p>
                <div className="flex flex-wrap gap-2">
                  {data.relatedTopics.map(({ title, relationshipType }) => {
                    const badge = REL_BADGE[relationshipType];
                    return (
                      <button
                        key={title}
                        type="button"
                        onClick={() => onNavigate(title)}
                        className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full px-3 py-1 text-sm cursor-pointer transition-colors"
                      >
                        {title}
                        {badge && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sources */}
            {data && data.sources.length > 0 && (
              <CollapsibleSection label="Sources">
                <ul className="space-y-3">
                  {data.sources.map((src) => (
                    <li key={src.id}>
                      <p className="text-sm font-medium text-gray-200">
                        {src.source_name}
                      </p>
                      {src.excerpt && (
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                          {src.excerpt}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}

            {/* Backlinks */}
            {data && data.backlinks.length > 0 && (
              <CollapsibleSection label="Backlinks">
                <div className="flex flex-wrap gap-2">
                  {data.backlinks.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => onNavigate(title)}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full px-3 py-1 text-sm cursor-pointer transition-colors"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
