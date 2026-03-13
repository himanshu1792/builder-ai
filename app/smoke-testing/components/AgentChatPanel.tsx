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
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface-dim overflow-hidden">
      <style>{`
        @keyframes header-slide {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes message-appear {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typing-dots {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }

        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(167, 139, 250, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(167, 139, 250, 0);
          }
        }

        .chat-header {
          animation: header-slide 0.4s ease-out;
        }

        .message-bubble {
          animation: message-appear 0.3s ease-out;
        }

        .typing-indicator span {
          animation: typing-dots 1.4s infinite;
        }

        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        .status-pulse-ring {
          animation: pulse-ring 2s infinite;
        }
      `}</style>
      
      {/* Header */}
      <div className="chat-header flex items-center gap-2 border-b border-border px-4 py-3 bg-gradient-to-r from-surface-dim to-surface-dim/50">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary/30 to-accent/30">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary">
            <path
              d="M7 1C3.68 1 1 3.68 1 7C1 10.32 3.68 13 7 13C10.32 13 13 10.32 13 7C13 3.68 10.32 1 7 1Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path d="M5 7H9M7 5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-text-primary">Agent Activity</span>
        {isRunning && (
          <span className="ml-auto flex items-center gap-2 text-xs text-accent font-medium">
            <div className="status-pulse-ring h-2 w-2 rounded-full bg-accent" />
            Processing
          </span>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 bg-gradient-to-b from-surface-dim via-surface-dim to-surface-inset/50">
        {messages.length === 0 && !isRunning && (
          <div className="flex h-full items-center justify-center animate-fade-in">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-float">
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
              <p className="text-sm font-semibold text-text-primary">Ready to generate</p>
              <p className="mt-1 text-xs text-text-secondary">
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
        <div className="message-bubble flex gap-3">
          <AgentAvatar agent={message.agent} />
          <div className="max-w-[85%] rounded-lg rounded-tl-none bg-surface-inset border border-border/50 px-3 py-2 hover:border-border transition-colors duration-200">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              {formatAgentName(message.agent)}
            </p>
            <p className="text-sm text-text-primary leading-relaxed">{message.text}</p>
          </div>
        </div>
      );

    case "user":
      return (
        <div className="message-bubble flex justify-end">
          <div className="max-w-[85%] rounded-lg rounded-tr-none bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 px-3 py-2">
            <p className="text-sm text-text-primary font-medium">{message.text}</p>
          </div>
        </div>
      );

    case "status":
      return (
        <div className="message-bubble flex items-center gap-2 py-2">
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          <span className="flex items-center gap-1.5 text-xs text-text-muted font-medium px-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-blink-pulse" />
            {message.text}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </div>
      );

    case "script":
      return (
        <div className="message-bubble rounded-lg border border-border bg-surface-inset overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface-dim px-4 py-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Generated Script</span>
          </div>
          <pre className="max-h-64 overflow-auto bg-surface-dim p-4 text-xs text-text-secondary font-mono">
            <code>{message.code}</code>
          </pre>
        </div>
      );

    case "pr_link":
      return (
        <div className="message-bubble rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 text-center">
          <p className="mb-3 text-sm font-bold text-emerald-400 uppercase tracking-wider">Pull Request Created</p>
          <a
            href={message.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
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
        <div className="message-bubble rounded-lg border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5 px-4 py-3">
          <p className="text-sm font-medium text-red-400">{message.text}</p>
        </div>
      );

    case "prompt":
      return (
        <div className="message-bubble rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-400">
            Accepted Prompt
          </p>
          <div className="prose prose-sm max-w-none text-text-primary prose-headings:text-text-primary prose-strong:text-primary prose-li:text-text-primary prose-code:text-amber-400 prose-code:bg-surface-dim prose-code:rounded prose-code:px-1">
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
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    analyst: {
      bg: "bg-gradient-to-br from-violet-500/20 to-violet-600/10",
      text: "text-violet-400",
      border: "border-violet-500/30",
    },
    prompt_builder: {
      bg: "bg-gradient-to-br from-blue-500/20 to-cyan-600/10",
      text: "text-blue-400",
      border: "border-blue-500/30",
    },
    script_generator: {
      bg: "bg-gradient-to-br from-amber-500/20 to-orange-600/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
    },
    reviewer: {
      bg: "bg-gradient-to-br from-emerald-500/20 to-green-600/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    pr_creator: {
      bg: "bg-gradient-to-br from-indigo-500/20 to-purple-600/10",
      text: "text-indigo-400",
      border: "border-indigo-500/30",
    },
  };

  const style = colors[agent] || {
    bg: "bg-gradient-to-br from-gray-500/20 to-gray-600/10",
    text: "text-gray-400",
    border: "border-gray-500/30",
  };

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase border ${style.bg} ${style.text} ${style.border} transition-all duration-200 hover:scale-110`}
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
