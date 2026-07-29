import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Sparkles, RotateCcw, ChevronRight, ChevronDown, Send, ArrowLeft } from "lucide-react";
import {
  getChatbotMenu,
  getChatbotHealth,
  createChatbotSession,
  sendChatbotMessage,
  type ChatbotMenu,
  type MenuOption,
  type Flow,
  type FlowStep,
} from "../../api/chatbotService";
import "./ChatBot.css";

// ─── Types ───────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  options?: MenuOption[];
  flow?: Flow;
  timestamp: number;
  /** "sent" the moment it's added, promoted to "delivered" once the bot replies */
  status?: "sent" | "delivered";
}

interface FlowState {
  flow: Flow;
  currentStepIndex: number;
  answers: Record<string, string | number | null>;
}

// ─── Helpers ─────────────────────────────────────────────

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Random delay between min and max (ms) — makes replies feel considered, not instant */
function randomDelay(min = 600, max = 1800): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** How far (px) the user can be from the bottom and still count as "at bottom" */
const NEAR_BOTTOM_THRESHOLD = 120;

/** Two messages count as "grouped" (same sender, close together) so the UI
 *  can tighten spacing/avatar the way real chat apps (Zalo/Messenger) do. */
const GROUP_WINDOW_MS = 60_000;

// ─── Small presentational pieces ─────────────────────────

function BotAvatar({ size = 28, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${
        thinking ? "chatbot-avatar-thinking" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: "var(--cta-gradient)",
        boxShadow: "var(--cta-shadow)",
        animation: "chatbot-avatar-in 0.3s var(--ease-spring)",
      }}
    >
      <Sparkles
        style={{ width: size * 0.5, height: size * 0.5, color: "#fff" }}
        strokeWidth={2.25}
      />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center px-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="chatbot-thinking-dot"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [menu, setMenu] = useState<ChatbotMenu | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [inputText, setInputText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [sendPulse, setSendPulse] = useState(false);
  const [mode, setMode] = useState<string>("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  // Always scroll to bottom when messages or thinking state change
  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    });
  }, [messages.length, thinking, scrollToBottom]);

  // Track scroll position to toggle the "jump to latest" button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollToBottom(distanceFromBottom > NEAR_BOTTOM_THRESHOLD);
  }, []);

  // Initialize: fetch health + menu + create session
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoading(true);

        const health = await getChatbotHealth();
        if (cancelled) return;
        setMode(health.mode);

        const menuData = await getChatbotMenu();
        if (cancelled) return;
        setMenu(menuData);

        const session = await createChatbotSession();
        if (cancelled) return;
        setSessionId(session.sessionId);

        setMessages([
          {
            id: generateId(),
            role: "bot",
            text: menuData.greeting,
            options: menuData.options,
            timestamp: Date.now(),
          },
        ]);
      } catch (err) {
        if (cancelled) return;
        console.error("Chatbot init error:", err);
        toast.error("Không thể kết nối chatbot. Vui lòng thử lại sau.");
        setMessages([
          {
            id: generateId(),
            role: "bot",
            text: "Xin lỗi, hiện tại chatbot không khả dụng. Vui lòng thử lại sau.",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Core send function with thinking delay ──────────────

  const sendWithThinking = useCallback(
    async (
      message: string,
      action: string,
      answers: Record<string, string | number | null>,
    ) => {
      if (!sessionId) return;

      setSending(true);
      setThinking(true);

      // Simulate thinking delay (600ms–1.8s) so replies feel considered
      await new Promise((r) => setTimeout(r, randomDelay()));

      try {
        const res = await sendChatbotMessage({
          sessionId,
          message,
          action,
          answers,
        });

        setThinking(false);

        const botMsg: ChatMessage = {
          id: generateId(),
          role: "bot",
          text: res.data.reply,
          options: res.data.options,
          flow: res.data.flow,
          timestamp: Date.now(),
        };
        // Promote the message(s) that triggered this reply from "sent" to
        // "delivered" — the little checkmark that makes a chat feel alive.
        setMessages((prev) => [
          ...prev.map((m) => (m.role === "user" && m.status === "sent" ? { ...m, status: "delivered" as const } : m)),
          botMsg,
        ]);

        if (res.data.flow) {
          setFlowState({
            flow: res.data.flow,
            currentStepIndex: 0,
            answers: {},
          });
        } else {
          setFlowState(null);
        }
      } catch (err) {
        setThinking(false);
        console.error("Send message error:", err);
        toast.error("Gửi tin nhắn thất bại. Vui lòng thử lại.");
      } finally {
        setSending(false);
      }
    },
    [sessionId],
  );

  // Handle selecting a main menu option
  const handleMenuOption = useCallback(
    async (option: MenuOption) => {
      if (!sessionId || sending) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        text: option.label,
        timestamp: Date.now(),
        status: "sent",
      };
      setMessages((prev) => [...prev, userMsg]);
      // Immediate scroll fallback for user actions (before React commits)
      setTimeout(() => scrollToBottom(), 30);

      await sendWithThinking(option.label, option.action, {});
    },
    [sessionId, sending, sendWithThinking],
  );

  // Handle selecting a flow step option
  const handleFlowOption = useCallback(
    async (step: FlowStep, value: string | number | null) => {
      if (!sessionId || !flowState || sending) return;

      const newAnswers = {
        ...flowState.answers,
        [step.id]: value,
      };

      const selectedLabel =
        step.options.find((o) => o.value === value)?.label ?? String(value);

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        text: selectedLabel,
        timestamp: Date.now(),
        status: "sent",
      };
      setMessages((prev) => [...prev, userMsg]);
      setTimeout(() => scrollToBottom(), 30);

      const nextStepIndex = flowState.currentStepIndex + 1;
      const isLastStep = nextStepIndex >= flowState.flow.steps.length;

      if (isLastStep) {
        await sendWithThinking(
          `[${flowState.flow.submitAction}]`,
          flowState.flow.submitAction,
          newAnswers,
        );
        setFlowState(null);
      } else {
        // Show thinking indicator before advancing to next step
        setSending(true);
        setThinking(true);
        await new Promise((r) => setTimeout(r, randomDelay()));
        setThinking(false);
        setSending(false);

        setMessages((prev) =>
          prev.map((m) => (m.id === userMsg.id ? { ...m, status: "delivered" } : m)),
        );
        setFlowState({
          ...flowState,
          currentStepIndex: nextStepIndex,
          answers: newAnswers,
        });

        const nextStep = flowState.flow.steps[nextStepIndex];
        const botMsg: ChatMessage = {
          id: generateId(),
          role: "bot",
          text: nextStep.label,
          flow: {
            ...flowState.flow,
            steps: [nextStep],
          },
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    },
    [sessionId, flowState, sending, sendWithThinking],
  );

  // Handle free text input
  const handleSendText = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !sessionId || sending) return;

    setInputText("");

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        text,
        timestamp: Date.now(),
        status: "sent",
      };
      setMessages((prev) => [...prev, userMsg]);
      setTimeout(() => scrollToBottom(), 30);

      // Focus input immediately so user can keep typing without re-clicking
      inputRef.current?.focus();

      await sendWithThinking(text, "FREE_TEXT", flowState?.answers ?? {});
  }, [inputText, sessionId, sending, flowState, sendWithThinking]);

  // Small spring "pop" on the send button whenever it becomes usable, so
  // typing the first character feels like the UI is reacting to you.
  const prevCanSendRef = useRef(false);
  useEffect(() => {
    const canSend = inputText.trim().length > 0 && !sending && !!sessionId;
    if (canSend && !prevCanSendRef.current) {
      setSendPulse(true);
      const t = setTimeout(() => setSendPulse(false), 320);
      return () => clearTimeout(t);
    }
    prevCanSendRef.current = canSend;
  }, [inputText, sending, sessionId]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Reset conversation
  const handleReset = useCallback(async () => {
    try {
      setLoading(true);
      setFlowState(null);
      setMessages([]);

      const session = await createChatbotSession();
      setSessionId(session.sessionId);

      if (menu) {
        setMessages([
          {
            id: generateId(),
            role: "bot",
            text: menu.greeting,
            options: menu.options,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err) {
      console.error("Reset error:", err);
      toast.error("Không thể reset chatbot.");
    } finally {
      setLoading(false);
    }
  }, [menu]);

  // ─── Render ─────────────────────────────────────────────

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: "var(--cta-gradient)",
              boxShadow: "var(--shadow-glow-primary)",
              animation: "chatbot-breathe 1.6s ease-in-out infinite",
            }}
          >
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <p className="text-muted-foreground text-sm chatbot-loading-text">
            Đang kết nối chatbot...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col relative" style={{ background: "var(--bg-gradient-160)" }}>
      {/* Header — fixed at top */}
      <header className="shrink-0 bg-card/80 backdrop-blur-md border-b border-border z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              title="Quay lại"
              className="chatbot-back-btn w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-border/50"
              style={{ background: "var(--card)", boxShadow: "var(--shadow-sm)" }}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "var(--cta-gradient)", boxShadow: "var(--cta-shadow)" }}
                >
                  <Sparkles className="w-4 h-4 text-white" strokeWidth={2.25} />
                </div>
                <span
                  className="chatbot-online-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                  style={{ background: "#22c55e", borderColor: "var(--card)" }}
                />
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-sm leading-tight">
                  Yarn Shop Assistant
                </h1>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  {mode === "GUIDED_FALLBACK" ? "Hướng dẫn chọn sản phẩm" : "Đang hoạt động"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={loading}
            title="Bắt đầu lại"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-accent disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {loading ? "Đang reset..." : "Bắt đầu lại"}
            </span>
          </button>
        </div>
      </header>

      {/* Messages — scrollable area, fills remaining space */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="chatbot-scroll flex-1 overflow-y-auto min-h-0"
      >
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
          {messages.map((msg, idx) => {
            const prevMsg = messages[idx - 1];
            const isGrouped =
              !!prevMsg &&
              prevMsg.role === msg.role &&
              msg.timestamp - prevMsg.timestamp < GROUP_WINDOW_MS &&
              !prevMsg.options &&
              !prevMsg.flow;
            return (
              <div
                key={msg.id}
                className={`chatbot-msg-row flex items-end gap-2 ${isGrouped ? "is-grouped" : ""} ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "bot" && (
                  <div className="w-7 flex-shrink-0">{!isGrouped && <BotAvatar />}</div>
                )}

                <div className="flex flex-col max-w-[85%] sm:max-w-[70%]">
                  <div
                    className={`chatbot-bubble rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? `chatbot-bubble-user text-primary-foreground rounded-br-md ${isGrouped ? "is-grouped" : ""}`
                        : `chatbot-bubble-bot bg-card border border-border rounded-bl-md shadow-sm ${isGrouped ? "is-grouped" : ""}`
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: "var(--cta-gradient)", boxShadow: "var(--cta-shadow)" }
                        : undefined
                    }
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {/* Main menu options */}
                    {msg.options && msg.options.length > 0 && !msg.flow && (
                      <div className="mt-3 space-y-1.5">
                        {msg.options.map((opt, idx2) => (
                          <button
                            key={opt.id}
                            onClick={() => handleMenuOption(opt)}
                            disabled={sending}
                            style={{ animation: `chatbot-option-in 0.3s ease-out ${idx2 * 60}ms both` }}
                            className="chatbot-option-btn group w-full flex items-center justify-between gap-2 text-left text-sm px-3 py-2 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 hover:border-primary/40 disabled:opacity-50"
                          >
                            <span>{opt.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Flow step options */}
                    {msg.flow && msg.flow.steps.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {msg.flow.steps[0].options.map((opt, idx2) => (
                          <button
                            key={`${msg.flow!.id}-${msg.flow!.steps[0].id}-${idx2}`}
                            onClick={() => handleFlowOption(msg.flow!.steps[0], opt.value)}
                            disabled={sending}
                            style={{ animation: `chatbot-option-in 0.3s ease-out ${idx2 * 60}ms both` }}
                            className="chatbot-option-btn group w-full flex items-center justify-between gap-2 text-left text-sm px-3 py-2 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 hover:border-primary/40 disabled:opacity-50"
                          >
                            <span>{opt.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Thinking indicator — shown while waiting for API response */}
          {thinking && (
            <div className="chatbot-msg-row flex items-end gap-2 justify-start">
              <BotAvatar thinking />
              <div className="chatbot-thinking-bubble bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jump to latest — appears once the user has scrolled up */}
      {showScrollToBottom && (
        <button
          onClick={() => scrollToBottom()}
          title="Đến tin nhắn mới nhất"
          className="absolute right-4 bottom-24 w-9 h-9 rounded-full flex items-center justify-center border border-border bg-card hover:bg-accent transition-colors"
          style={{ boxShadow: "var(--shadow-float)", animation: "chatbot-fab-in 0.25s var(--ease-spring)" }}
        >
          <ChevronDown className="w-4 h-4 text-foreground" />
        </button>
      )}

      {/* Input bar — fixed at bottom */}
      <div className="shrink-0 bg-card/80 backdrop-blur-md border-t border-border z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div
            className={`chatbot-input-wrap flex items-center gap-2 bg-background border border-border rounded-2xl px-4 py-2 ${
              inputFocused ? "is-focused border-primary/50" : ""
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Nhập tin nhắn..."
              disabled={!sessionId}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none disabled:opacity-50"
            />
            <button
              onClick={handleSendText}
              disabled={!inputText.trim() || sending || !sessionId}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105 active:scale-95 ${
                sendPulse ? "chatbot-send-ready chatbot-send-pulse" : ""
              }`}
              style={{ background: "var(--cta-gradient)", boxShadow: "var(--cta-shadow)" }}
            >
              <Send className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}