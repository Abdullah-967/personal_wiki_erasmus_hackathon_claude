"use client";

import type { WikiPage } from "@/types/database";
import type { ToolInvocation } from "ai";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import KnowledgeUpdateCard from "./KnowledgeUpdateCard";

interface Props {
  onNavigateToTitle: (title: string) => void;
  onRightPanelChange: (
    mode: "related" | "referenced",
    pages: WikiPage[],
  ) => void;
  onReferencedPageTitles: (titles: string[]) => void;
}

// Shape returned by our tool handlers
type ToolResultData =
  | {
      status: "ok";
      data: {
        title?: string;
        page_id?: string;
        links_created?: number;
        source_page_title?: string;
        pages?: unknown[];
      };
    }
  | { status: "empty" }
  | { status: "error"; message: string };

const TOOL_STATUS_LABELS: Record<string, string> = {
  create_wiki_page: "Creating page...",
  update_wiki_page: "Updating page...",
  link_related_pages: "Linking concepts...",
  query_personal_wiki: "Searching your wiki...",
  find_knowledge_gaps: "Finding gaps...",
};

function resolveActiveLabel(
  messages: ReturnType<typeof useChat>["messages"],
): string {
  // Walk backwards through messages to find the last in-call tool invocation
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    const invocations = msg.toolInvocations;
    if (!invocations?.length) continue;
    const callInvocations = invocations.filter((t) => t.state === "call");
    if (callInvocations.length) {
      const last = callInvocations[callInvocations.length - 1];
      return TOOL_STATUS_LABELS[last.toolName] ?? "Thinking...";
    }
  }
  return "Thinking...";
}

function KnowledgeCards({
  toolInvocations,
  onPageClick,
}: {
  toolInvocations: ToolInvocation[] | undefined;
  onPageClick: (title: string) => void;
}) {
  if (!toolInvocations?.length) return null;

  const cards = toolInvocations
    .filter((t) => t.state === "result")
    .flatMap((t) => {
      const result = t.result as ToolResultData;
      if (result.status !== "ok") return [];
      const { data } = result;

      if (t.toolName === "create_wiki_page" && data.title) {
        return [
          <KnowledgeUpdateCard
            key={t.toolCallId}
            action="Page Created"
            pageTitle={data.title}
            summary="Page added to your wiki."
            onPageClick={onPageClick}
          />,
        ];
      }
      if (t.toolName === "update_wiki_page" && data.title) {
        return [
          <KnowledgeUpdateCard
            key={t.toolCallId}
            action="Page Updated"
            pageTitle={data.title}
            summary="Wiki page updated."
            onPageClick={onPageClick}
          />,
        ];
      }
      if (t.toolName === "link_related_pages" && data.source_page_title) {
        return [
          <KnowledgeUpdateCard
            key={t.toolCallId}
            action="Pages Linked"
            pageTitle={data.source_page_title}
            summary={`${data.links_created ?? 0} link(s) created.`}
            onPageClick={onPageClick}
          />,
        ];
      }
      return [];
    });

  return <>{cards}</>;
}

export default function AgentPanel({
  onNavigateToTitle,
  onRightPanelChange: _onRightPanelChange,
  onReferencedPageTitles,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedQueryResults = useRef<Set<string>>(new Set());
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
  } = useChat({
    api: "/api/chat",
    maxSteps: 5,
    onError: (err) => {
      setChatError(err.message ?? "Something went wrong. Please try again.");
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm your personal wiki companion. Share something you've learned — a concept, a paper, or a rough note — and I'll structure it into a wiki page, link it to what you already know, and help you spot what you might be missing.",
      },
    ],
  });

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Detect completed query_personal_wiki results and surface referenced pages
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== "assistant" || !msg.toolInvocations) continue;
      for (const t of msg.toolInvocations) {
        if (
          t.toolName !== "query_personal_wiki" ||
          t.state !== "result" ||
          processedQueryResults.current.has(t.toolCallId)
        )
          continue;
        processedQueryResults.current.add(t.toolCallId);
        const result = t.result as ToolResultData;
        if (result.status === "ok" && result.data.pages) {
          const titles = (result.data.pages as { title: string }[]).map(
            (p) => p.title,
          );
          if (titles.length > 0) onReferencedPageTitles(titles);
        }
      }
    }
  }, [messages, onReferencedPageTitles]);

  const activeToolLabel = isLoading ? resolveActiveLabel(messages) : null;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so same file can be selected again
    e.target.value = "";
    if (!file) return;

    const supported = ["application/pdf", "text/plain", "text/markdown"];
    if (!supported.includes(file.type)) {
      setFileError(
        `Unsupported file type: "${file.type || "unknown"}". Use PDF, TXT, or MD.`,
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File exceeds the 10 MB limit.");
      return;
    }

    setFileError(null);
    setFileStatus("Processing your file...");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/ingest", { method: "POST", body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      const { text } = (await res.json()) as { text: string };
      setFileStatus(null);

      await append({
        role: "user",
        content: `From file '${file.name}':\n\n${text}`,
      });
    } catch (err) {
      setFileStatus(null);
      setFileError(
        err instanceof Error ? err.message : "Failed to process file.",
      );
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-950 border-r border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <p className="text-sm font-semibold text-gray-100">Knowledge Agent</p>
        <p className="text-xs text-gray-500 mt-0.5">Tell me what you learned</p>
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
      >
        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 text-sm max-w-[85%] whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            );
          }

          if (msg.role === "assistant") {
            return (
              <div key={msg.id} className="flex flex-col items-start gap-1">
                {msg.content && (
                  <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 text-sm max-w-[90%] break-words prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h2]:text-gray-100 [&_h3]:text-gray-200 [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:mb-1 [&_hr]:border-gray-700 [&_strong]:text-gray-100 [&_code]:text-blue-300 [&_pre]:bg-gray-900 [&_pre]:rounded [&_pre]:p-2 [&_pre]:overflow-x-auto">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
                <KnowledgeCards
                  toolInvocations={msg.toolInvocations}
                  onPageClick={onNavigateToTitle}
                />
              </div>
            );
          }

          return null;
        })}

        {/* File processing status (transient, not a chat message) */}
        {fileStatus && (
          <p className="text-xs text-gray-400 text-center animate-pulse px-2">
            {fileStatus}
          </p>
        )}

        {/* Chat API error */}
        {chatError && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-3 py-2 text-xs text-red-400">
            {chatError}
            <button
              type="button"
              onClick={() => setChatError(null)}
              className="ml-2 underline hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 p-3 shrink-0 space-y-2">
        {fileError && <p className="text-xs text-red-400 px-1">{fileError}</p>}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Paperclip */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40 flex-shrink-0 pb-2"
            aria-label="Attach file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={handleFileChange}
          />

          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Tell me something you learned..."
            rows={1}
            className="w-full bg-gray-800 text-gray-100 placeholder-gray-500 rounded-xl resize-none px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gray-600 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-50 flex-shrink-0 transition-colors"
          >
            Send
          </button>
        </form>

        {/* In-progress indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
            </div>
            <span className="text-xs text-gray-500">{activeToolLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
