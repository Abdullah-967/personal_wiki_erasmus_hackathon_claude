"use client";

interface Props {
  action: "Page Created" | "Page Updated" | "Pages Linked";
  pageTitle: string;
  linksAdded?: string[];
  summary: string;
  onPageClick: (title: string) => void;
}

export default function KnowledgeUpdateCard({
  action,
  pageTitle,
  linksAdded,
  summary,
  onPageClick,
}: Props) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 mt-2 text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-green-400 font-medium">✓ {action}</span>
        <button
          type="button"
          onClick={() => onPageClick(pageTitle)}
          className="text-blue-400 underline hover:text-blue-300 transition-colors"
        >
          {pageTitle}
        </button>
      </div>
      {linksAdded && linksAdded.length > 0 && (
        <p className="text-gray-400 mb-1">
          Linked to:{" "}
          {linksAdded.map((link, i) => (
            <span key={link}>
              <button
                type="button"
                onClick={() => onPageClick(link)}
                className="text-blue-400 underline hover:text-blue-300 transition-colors"
              >
                {link}
              </button>
              {i < linksAdded.length - 1 && ", "}
            </span>
          ))}
        </p>
      )}
      <p className="text-gray-400">{summary}</p>
    </div>
  );
}
