interface Props {
  onNavigateToTitle: (title: string) => void;
  onRightPanelChange: (
    mode: "related" | "referenced",
    pages: import("@/types/database").WikiPage[],
  ) => void;
  onReferencedPageTitles: (titles: string[]) => void;
}

export default function AgentPanel(_props: Props) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-950 border-r border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <p className="text-sm font-semibold text-gray-100">Knowledge Agent</p>
        <p className="text-xs text-gray-500 mt-0.5">Tell me what you learned</p>
      </div>

      {/* Static notice */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-200">
            This is a demo build
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            The chat agent is disabled in this deployment. Clone the repository,
            add your own API keys, and run it locally to use the full experience.
          </p>
        </div>
        <a
          href="https://github.com/Abdullah-967/personal_wiki_erasmus_claude_hackathon"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          View on GitHub
        </a>
      </div>

      {/* Disabled input area */}
      <div className="border-t border-gray-800 p-3 shrink-0">
        <div className="flex items-end gap-2 opacity-40 pointer-events-none">
          <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-500">
            Chat disabled in demo mode
          </div>
          <div className="bg-gray-700 text-gray-500 rounded-lg px-3 py-2 text-sm">
            Send
          </div>
        </div>
      </div>
    </div>
  );
}
