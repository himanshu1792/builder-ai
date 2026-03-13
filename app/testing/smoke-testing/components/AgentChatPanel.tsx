"use client";

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

/** Strip wrapping ```markdown ... ``` code fences from AI output */
function stripCodeFence(text: string): string {
  return text.replace(/^```(?:markdown)?\s*\n?/, "").replace(/\n?```\s*$/, "");
}

// --- Message Types ---

export type ChatMessage =
  | { type: "agent"; agent: string; text: string }
  | { type: "user"; text: string }
  | { type: "question"; agent: string; text: string; questionType: "text" | "choices"; choices?: string[] }
  | { type: "prompt"; text: string }
  | { type: "status"; agent: string; text: string }
  | { type: "script"; code: string }
  | { type: "pr_link"; url: string }
  | { type: "error"; text: string };

interface AgentChatPanelProps {
  messages: ChatMessage[];
  /** Current pending question awaiting user response */
  pendingQuestion: Extract<ChatMessage, { type: "question" }> | null;
  /** Current prompt awaiting accept/reject */
  pendingPrompt: string | null;
  onAnswer: (answer: string) => void;
  onAcceptPrompt: () => void;
  onRejectPrompt: (reason: string) => void;
  onRetry: () => void;
  isRunning: boolean;
}

export function AgentChatPanel({
  messages,
  pendingQuestion,
  pendingPrompt,
  onAnswer,
  onAcceptPrompt,
  onRejectPrompt,
  onRetry,
  isRunning,
}: AgentChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingQuestion, pendingPrompt]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary">
            <path
              d="M7 1C3.68 1 1 3.68 1 7C1 10.32 3.68 13 7 13C10.32 13 13 10.32 13 7C13 3.68 10.32 1 7 1Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path d="M5 7H9M7 5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-sm font-medium text-text-primary">Agent Activity</span>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
            Running
          </span>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && !isRunning && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-primary">Ready to generate</p>
              <p className="mt-1 text-xs text-text-muted">
                Fill in the scenario details and submit to start the agent pipeline.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Pending question input */}
        {pendingQuestion && (
          <QuestionInput question={pendingQuestion} onAnswer={onAnswer} />
        )}

        {/* Pending prompt approval */}
        {pendingPrompt && (
          <PromptApproval
            prompt={pendingPrompt}
            onAccept={onAcceptPrompt}
            onReject={onRejectPrompt}
          />
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function MessageBubble({ message }: { message: ChatMessage }) {
  switch (message.type) {
    case "agent":
      return (
        <div className="flex gap-2">
          <AgentAvatar agent={message.agent} />
          <div className="max-w-[85%] rounded-lg rounded-tl-none bg-surface-inset px-3 py-2">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {formatAgentName(message.agent)}
            </p>
            <p className="text-sm text-text-primary">{message.text}</p>
          </div>
        </div>
      );

    case "user":
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg rounded-tr-none bg-primary/10 px-3 py-2">
            <p className="text-sm text-text-primary">{message.text}</p>
          </div>
        </div>
      );

    case "status":
      return (
        <div className="flex items-center gap-2 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            {message.text}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      );

    case "script":
      return (
        <div className="rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border bg-surface-dim px-3 py-1.5">
            <span className="text-xs font-medium text-text-muted">Generated Script</span>
          </div>
          <pre className="max-h-64 overflow-auto bg-gray-900 p-3 text-xs text-gray-100">
            <code>{message.code}</code>
          </pre>
        </div>
      );

    case "pr_link":
      return (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="mb-2 text-sm font-medium text-emerald-800">Pull Request Created</p>
          <a
            href={message.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            View Pull Request
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5.25 2.33H2.33V11.67H11.67V8.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.58 1.17H12.83V6.42" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.83 1.17L5.83 8.17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      );

    case "error":
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{message.text}</p>
        </div>
      );

    case "prompt":
      return (
        <div className="rounded-lg border border-border bg-surface-inset p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Accepted Prompt
          </p>
          <div className="prose prose-sm max-w-none text-text-primary prose-headings:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary">
            <ReactMarkdown>{stripCodeFence(message.text)}</ReactMarkdown>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function QuestionInput({
  question,
  onAnswer,
}: {
  question: Extract<ChatMessage, { type: "question" }>;
  onAnswer: (answer: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <AgentAvatar agent={question.agent} />
        <div className="max-w-[85%] rounded-lg rounded-tl-none bg-surface-inset px-3 py-2">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {formatAgentName(question.agent)}
          </p>
          <p className="text-sm text-text-primary">{question.text}</p>
        </div>
      </div>

      {question.questionType === "choices" && question.choices ? (
        <div className="ml-8 flex flex-wrap gap-2">
          {question.choices.map((choice) => (
            <button
              key={choice}
              onClick={() => onAnswer(choice)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              {choice}
            </button>
          ))}
        </div>
      ) : (
        <TextAnswerInput onSubmit={onAnswer} />
      )}
    </div>
  );
}

function TextAnswerInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (value) {
      onSubmit(value);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ml-8 flex gap-2">
      <input
        ref={inputRef}
        type="text"
        placeholder="Type your answer..."
        className="flex-1 rounded-lg border border-border bg-surface-inset px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        autoFocus
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Send
      </button>
    </form>
  );
}

function PromptApproval({
  prompt,
  onAccept,
  onReject,
}: {
  prompt: string;
  onAccept: () => void;
  onReject: (reason: string) => void;
}) {
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  function handleReject() {
    const reason = reasonRef.current?.value.trim();
    if (!reason) {
      reasonRef.current?.focus();
      return;
    }
    onReject(reason);
    if (reasonRef.current) reasonRef.current.value = "";
  }

  return (
    <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
        Review Generated Prompt
      </p>
      <div className="prose prose-sm max-w-none rounded-lg bg-white p-3 text-text-primary shadow-sm prose-headings:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary">
        <ReactMarkdown>{stripCodeFence(prompt)}</ReactMarkdown>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Accept
        </button>
        <button
          onClick={() => {
            const el = document.getElementById("reject-reason");
            if (el) el.classList.toggle("hidden");
          }}
          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
        >
          Reject
        </button>
      </div>
      <div id="reject-reason" className="hidden space-y-2">
        <textarea
          ref={reasonRef}
          placeholder="Provide a reason for rejection (required)..."
          className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          rows={2}
        />
        <button
          onClick={handleReject}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Submit Rejection
        </button>
      </div>
    </div>
  );
}

function AgentAvatar({ agent }: { agent: string }) {
  const colors: Record<string, string> = {
    analyst: "bg-violet-100 text-violet-600",
    prompt_builder: "bg-blue-100 text-blue-600",
    script_generator: "bg-amber-100 text-amber-600",
    reviewer: "bg-emerald-100 text-emerald-600",
    pr_creator: "bg-indigo-100 text-indigo-600",
  };

  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase ${
        colors[agent] || "bg-gray-100 text-gray-600"
      }`}
    >
      {agent.charAt(0).toUpperCase()}
    </div>
  );
}

function formatAgentName(agent: string): string {
  return agent
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
