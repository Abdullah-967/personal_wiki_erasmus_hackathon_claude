"use client";

import type { WikiPage } from "@/types/database";
import { useState } from "react";

interface Props {
  mode: "pages" | "related" | "referenced";
  pages: WikiPage[];
  onPageSelect: (page: WikiPage) => void;
}

const EMPTY_STATES: Record<Props["mode"], string> = {
  pages: "No pages yet. Start a conversation.",
  related: "No related pages found.",
  referenced: "No pages were cited.",
};

export default function RightPanel({ mode, pages, onPageSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered =
    mode === "pages" && search.trim()
      ? pages.filter((p) =>
          p.title.toLowerCase().includes(search.toLowerCase()),
        )
      : pages;

  return (
    <div className="flex flex-col h-full min-h-0 border-l border-gray-800 bg-gray-950">
      <div className="px-3 py-3 border-b border-gray-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {mode === "pages"
            ? "All Pages"
            : mode === "related"
              ? "Related Pages"
              : "Pages Referenced"}
        </p>
      </div>

      {mode === "pages" && (
        <div className="px-3 py-2 border-b border-gray-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="w-full bg-gray-800 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-gray-600"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-6">
            {mode === "pages" && search.trim()
              ? "No pages match your search."
              : EMPTY_STATES[mode]}
          </p>
        ) : (
          filtered.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onPageSelect(page)}
              className="w-full text-left bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <p className="text-sm font-medium text-gray-100 truncate">
                {page.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                {page.summary}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
