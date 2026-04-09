"use client";

import { createClient } from "@/lib/supabase/client";
import type { Source, WikiPage } from "@/types/database";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type SectionKey = "title" | "summary" | "body" | "key_points";

interface Props {
  page: WikiPage | null;
  onNavigate: (title: string) => void;
  isSkeletonMode?: boolean;
  revealedSections?: Set<SectionKey>;
  changedSections?: Set<SectionKey>;
}

interface RelatedData {
  relatedTopics: string[];
  sources: Source[];
  backlinks: string[];
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

// Skeleton blocks to approximate real content while data loads
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* title */}
      <div className="h-8 bg-gray-700 rounded w-2/3" />
      {/* summary */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-5/6" />
      </div>
      {/* body */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-4/5" />
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-3/4" />
      </div>
      {/* key points */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-700 rounded w-24" />
        <div className="h-4 bg-gray-800 rounded w-11/12" />
        <div className="h-4 bg-gray-800 rounded w-4/5" />
        <div className="h-4 bg-gray-800 rounded w-10/12" />
      </div>
      {/* chip row */}
      <div className="border-t border-gray-800 pt-4 mt-4 flex gap-2">
        <div className="h-7 bg-gray-700 rounded-full w-20" />
        <div className="h-7 bg-gray-700 rounded-full w-24" />
        <div className="h-7 bg-gray-700 rounded-full w-16" />
      </div>
      {/* collapsible stubs */}
      <div className="border-t border-gray-800 pt-4 h-4 bg-gray-700 rounded w-28" />
      <div className="border-t border-gray-800 pt-4 h-4 bg-gray-700 rounded w-24" />
    </div>
  );
}

// Skeleton placeholder for a single section (used during reveal)
// Defined at module scope so React never remounts it between reveal timer ticks
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
  onNavigate,
  isSkeletonMode = false,
  revealedSections,
  changedSections,
}: Props) {
  const [data, setData] = useState<RelatedData | null>(null);
  // true while the async fetch for the current page.id is in flight
  const [loading, setLoading] = useState(false);

  // Reset + fetch whenever we navigate to a different page
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

      // Parallel fetches for related topics, sources, backlinks
      const [linksRes, sourcesRes, backlinksRes] = await Promise.all([
        supabase
          .from("page_links")
          .select("target_page_id")
          .eq("source_page_id", page.id),
        supabase.from("sources").select("*").eq("page_id", page.id),
        supabase
          .from("page_links")
          .select("source_page_id")
          .eq("target_page_id", page.id),
      ]);

      // Resolve target page titles for related topics
      const targetIds = (linksRes.data ?? []).map(
        (r) => (r as { target_page_id: string }).target_page_id,
      );
      const sourceIds = (backlinksRes.data ?? []).map(
        (r) => (r as { source_page_id: string }).source_page_id,
      );

      const [relatedPagesRes, backlinkPagesRes] = await Promise.all([
        targetIds.length > 0
          ? supabase.from("wiki_pages").select("title").in("id", targetIds)
          : Promise.resolve({ data: [] as { title: string }[] }),
        sourceIds.length > 0
          ? supabase.from("wiki_pages").select("title").in("id", sourceIds)
          : Promise.resolve({ data: [] as { title: string }[] }),
      ]);

      setData({
        relatedTopics: (relatedPagesRes.data ?? []).map(
          (p) => (p as { title: string }).title,
        ),
        sources: (sourcesRes.data ?? []) as Source[],
        backlinks: (backlinkPagesRes.data ?? []).map(
          (p) => (p as { title: string }).title,
        ),
      });
      setLoading(false);
    }

    fetchRelated();
  }, [page?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!page && !isSkeletonMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-0 text-gray-500">
        <p className="text-base text-center px-6">
          Your wiki is empty. Tell me something you learned.
        </p>
      </div>
    );
  }

  // Helper: build per-section class for reveal animation
  function sectionClass(key: SectionKey): string {
    if (!revealedSections) return ""; // normal render, no animation
    const visible = revealedSections.has(key);
    return visible
      ? "transition-opacity duration-150 ease-out opacity-100"
      : "transition-opacity duration-150 ease-out opacity-0 pointer-events-none";
  }

  // Helper: build per-section flash class for update highlight
  function flashClass(key: SectionKey): string {
    if (!changedSections?.has(key)) return "";
    return "bg-yellow-500/10 transition-colors duration-500 rounded";
  }

  // Whether we're in the section-by-section reveal sequence
  const isRevealing = revealedSections !== undefined;

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-900 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full px-6 py-8">
        {/* Full skeleton — shown while isSkeletonMode before any Realtime event */}
        {isSkeletonMode && !page ? (
          <Skeleton />
        ) : loading && !isRevealing ? (
          <Skeleton />
        ) : page ? (
          <>
            {/* Title */}
            <div
              className={`mb-3 ${sectionClass("title")} ${flashClass("title")}`}
            >
              {isRevealing && !revealedSections?.has("title") ? (
                <div className="animate-pulse h-7 w-48 rounded bg-gray-800" />
              ) : (
                <h1 className="text-2xl font-bold text-gray-100">
                  {page.title}
                </h1>
              )}
            </div>

            {/* Summary + Body + Key Points */}
            <div>
              {/* Summary */}
              <div
                className={`mb-6 ${sectionClass("summary")} ${flashClass("summary")}`}
              >
                {isRevealing && !revealedSections?.has("summary") ? (
                  <SectionSkeleton />
                ) : page.summary ? (
                  <p className="text-gray-300 leading-relaxed">
                    {page.summary}
                  </p>
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
                  <div className="text-gray-300 prose-headings:text-gray-100 leading-relaxed [&_h1]:text-gray-100 [&_h2]:text-gray-100 [&_h3]:text-gray-100 [&_h4]:text-gray-100 [&_a]:text-blue-400 [&_a:hover]:text-blue-300 [&_code]:bg-gray-800 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:p-3 [&_pre]:rounded [&_blockquote]:border-l-2 [&_blockquote]:border-gray-600 [&_blockquote]:pl-4 [&_blockquote]:text-gray-400">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => {
                          if (href?.startsWith("wiki:")) {
                            const title = href.slice(5);
                            return (
                              <button
                                type="button"
                                onClick={() => onNavigate(title)}
                                className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                              >
                                {children}
                              </button>
                            );
                          }
                          return (
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          );
                        },
                      }}
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
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-gray-300"
                        >
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
            </div>

            {/* Examples — collapsible, hidden when empty */}
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

            {/* Related Topics */}
            {data && data.relatedTopics.length > 0 && (
              <div className={SECTION_DIVIDER}>
                <p className={SECTION_HEADING}>Related Topics</p>
                <div className="flex flex-wrap gap-2">
                  {data.relatedTopics.map((title) => (
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
              </div>
            )}

            {/* Sources — collapsible */}
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

            {/* Backlinks — collapsible */}
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
          </>
        ) : null}
      </div>
    </div>
  );
}
