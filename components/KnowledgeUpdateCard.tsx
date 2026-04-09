"use client";

type WriteAction = "Page Created" | "Page Updated" | "Pages Linked";
type ReadAction = "Wiki Searched" | "Gaps Analyzed";

interface Props {
  action: WriteAction | ReadAction;
  pageTitle: string;
  linksAdded?: string[];
  summary?: string;
  onPageClick: (title: string) => void;
}

const ACTION_COLOR: Record<WriteAction | ReadAction, string> = {
  "Page Created": "text-green-400",
  "Page Updated": "text-green-400",
  "Pages Linked": "text-green-400",
  "Wiki Searched": "text-blue-400",
  "Gaps Analyzed": "text-amber-400",
};

export default function KnowledgeUpdateCard({
  action,
  pageTitle,
  linksAdded,
  summary,
  onPageClick,
}: Props) {
  const isReadAction = action === "Wiki Searched" || action === "Gaps Analyzed";

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 mt-2 text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className={`${ACTION_COLOR[action]} font-medium`}>✓ {action}</span>
        {isReadAction ? (
          <span className="text-gray-500 text-xs">{pageTitle}</span>
        ) : (
          <button
            type="button"
            onClick={() => onPageClick(pageTitle)}
            className="text-blue-400 hover:text-blue-300 transition-colors truncate max-w-[160px] text-right"
          >
            {pageTitle}
          </button>
        )}
      </div>
      {linksAdded && linksAdded.length > 0 && (
        <div className={`flex flex-wrap gap-1 ${summary ? "mb-1" : ""}`}>
          {linksAdded.map((link) => (
            <button
              key={link}
              type="button"
              onClick={() => onPageClick(link)}
              className="text-xs px-2 py-0.5 rounded-full border border-blue-800 text-blue-400 hover:text-blue-300 hover:border-blue-600 transition-colors"
            >
              {link}
            </button>
          ))}
        </div>
      )}
      {summary && <p className="text-gray-400">{summary}</p>}
    </div>
  );
}
