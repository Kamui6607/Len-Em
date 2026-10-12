// ============================================================
// ChatBot Page — route /chatbot
// Trợ lý Len&em: menu chủ đề + các "flow" hỏi từng bước từ
// /chatbot/menu, gửi tin qua /chatbot/messages.
// Giao diện theo ngôn ngữ craft (craft.css + chatbot.css).
// ============================================================

import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  RotateCcw,
  ChevronDown,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  ShoppingBag,
  BookOpen,
  Palette,
  Package,
  ArrowUpRight,
} from "lucide-react";
import {
  getChatbotMenu,
  getChatbotHealth,
  createChatbotSession,
  sendChatbotMessage,
  type ChatbotMenu,
  type MenuOption,
  type Flow,
  type FlowStep,
} from "../../shared/api/chatbotService";
import { YarnBallIcon } from "../../features/shop/shopMeta";
import { cn } from "../../shared/components/ui/utils";
import "../../styles/craft.css";
import "../../styles/chatbot.css";

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

const BOT_NAME = "Trợ lý Len&em";

/** Lối tắt sang các khu vực chính — hiện ở cột bên (desktop). */
const QUICK_LINKS = [
  { to: "/shop", label: "Cửa hàng", Icon: ShoppingBag },
  { to: "/learn", label: "Khoá học", Icon: BookOpen },
  { to: "/diy", label: "Góc sáng tạo", Icon: Palette },
  { to: "/purchased", label: "Đơn hàng của tôi", Icon: Package },
];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// ─── Small presentational pieces ─────────────────────────

function BotAvatar({ size = 32, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <div
      className={cn("chatbot-avatar", thinking && "chatbot-avatar-thinking")}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <YarnBallIcon size={size * 0.55} strokeWidth={2} />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center px-0.5" aria-label="Đang trả lời">
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

/** Nút chọn dạng chip — dùng cho menu chủ đề và các bước của flow. */
function OptionChip({
  label,
  onClick,
  disabled,
  index,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="chatbot-chip"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {label}
    </button>
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

  // ─── Derived ────────────────────────────────────────────

  const lastBotIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "bot") return i;
    return -1;
  })();
  const lastUserIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "user") return i;
    return -1;
  })();
  const hasUserMessage = lastUserIndex >= 0;
  const statusLabel =
    mode === "GUIDED_FALLBACK" ? "Trả lời theo chủ đề có sẵn" : "Đang hoạt động";

  /** Vị trí bước hiện tại trong flow đầy đủ (lấy từ menu) — để hiện "Bước x/y". */
  const getStepProgress = (flow: Flow) => {
    const full = menu?.flows?.[flow.id];
    const stepId = flow.steps[0]?.id;
    if (!full || !stepId) return null;
    const index = full.steps.findIndex((s) => s.id === stepId);
    return index >= 0 ? { current: index + 1, total: full.steps.length, title: full.title } : null;
  };

  const sidebar = (
    <aside className="chatbot-side" aria-label="Giới thiệu trợ lý">
      <div className="chatbot-side-card">
        <BotAvatar size={56} />
        <p className="craft-eyebrow mt-4">Xin chào bạn</p>
        <h2 className="chatbot-side-title">{BOT_NAME}</h2>
        <p className="chatbot-side-desc">
          Hỏi mình về khoá học, chọn len, dự án DIY hay đơn hàng — mình chỉ đường cho bạn.
        </p>
        <span className="chatbot-mode">
          <span className="chatbot-online-dot" />
          {statusLabel}
        </span>
      </div>

      {menu && menu.options.length > 0 && (
        <div className="chatbot-side-card">
          <p className="chatbot-side-label">Chủ đề nhanh</p>
          <div className="chatbot-side-topics">
            {menu.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMenuOption(opt)}
                disabled={sending || !sessionId}
                className="chatbot-side-topic"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chatbot-side-card">
        <p className="chatbot-side-label">Đi tới</p>
        <nav className="chatbot-side-links">
          {QUICK_LINKS.map(({ to, label, Icon }) => (
            <Link key={to} to={to} className="chatbot-side-link">
              <Icon className="w-4 h-4" />
              {label}
              <ArrowUpRight className="ml-auto w-3.5 h-3.5" />
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );

  // ─── Render ─────────────────────────────────────────────

  if (loading && messages.length === 0) {
    return (
      <div className="chatbot-page min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="chatbot-loading-ball">
            <YarnBallIcon size={30} strokeWidth={2} />
          </div>
          <p className="chatbot-loading-text">Đang cuộn len, chờ mình chút nhé…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-page h-dvh flex flex-col relative">
      {/* ── Header ── */}
      <header className="chatbot-header">
        <div className="chatbot-header-inner">
          <button
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            className="chatbot-icon-btn"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.25} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative shrink-0">
              <BotAvatar size={40} />
              <span className="chatbot-online-dot is-badge" />
            </div>
            <div className="min-w-0">
              <h1 className="chatbot-title">{BOT_NAME}</h1>
              <p className="chatbot-subtitle">
                {thinking ? "Đang soạn trả lời…" : statusLabel}
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={loading}
            aria-label="Bắt đầu cuộc trò chuyện mới"
            className="chatbot-reset-btn"
          >
            <RotateCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">{loading ? "Đang làm mới…" : "Bắt đầu lại"}</span>
          </button>
        </div>
      </header>

      <div className="chatbot-body">
        {sidebar}

        <section className="chatbot-main">
          {/* ── Tin nhắn ── */}
          <div className="chatbot-scroll-wrap">
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="chatbot-scroll"
            role="log"
            aria-live="polite"
            aria-label="Cuộc trò chuyện"
          >
            <div className="chatbot-thread">
              <div className="chatbot-day" aria-hidden>
                <span>Hôm nay</span>
              </div>

              {messages.map((msg, idx) => {
                const prevMsg = messages[idx - 1];
                const nextMsg = messages[idx + 1];
                const isGrouped =
                  !!prevMsg &&
                  prevMsg.role === msg.role &&
                  msg.timestamp - prevMsg.timestamp < GROUP_WINDOW_MS &&
                  !prevMsg.options &&
                  !prevMsg.flow;
                // giờ chỉ hiện ở tin cuối của mỗi cụm cùng người gửi
                const isGroupEnd =
                  !nextMsg ||
                  nextMsg.role !== msg.role ||
                  nextMsg.timestamp - msg.timestamp >= GROUP_WINDOW_MS ||
                  !!msg.options ||
                  !!msg.flow;
                const isUser = msg.role === "user";
                const flowStep = msg.flow?.steps[0];
                const progress = msg.flow ? getStepProgress(msg.flow) : null;
                // Chỉ bước flow của tin bot MỚI NHẤT còn bấm được — bấm lại bước cũ
                // sẽ lệch với flowState hiện tại.
                const flowActive = idx === lastBotIndex && !!flowState;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "chatbot-msg-row",
                      isGrouped && "is-grouped",
                      isUser ? "is-user" : "is-bot",
                    )}
                  >
                    {!isUser && (
                      <div className="chatbot-avatar-slot">{!isGrouped && <BotAvatar />}</div>
                    )}

                    <div className="chatbot-msg-col">
                      <div
                        className={cn(
                          "chatbot-bubble",
                          isUser ? "chatbot-bubble-user" : "chatbot-bubble-bot",
                          isGrouped && "is-grouped",
                        )}
                      >
                        {progress && (
                          <p className="chatbot-step">
                            {progress.title} · Bước {progress.current}/{progress.total}
                          </p>
                        )}
                        <p className="chatbot-text">{msg.text}</p>
                      </div>

                      {/* Menu chủ đề */}
                      {msg.options && msg.options.length > 0 && !msg.flow && (
                        <div className="chatbot-chips">
                          {msg.options.map((opt, i) => (
                            <OptionChip
                              key={opt.id}
                              label={opt.label}
                              index={i}
                              disabled={sending}
                              onClick={() => handleMenuOption(opt)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Lựa chọn của bước flow */}
                      {flowStep && flowStep.options.length > 0 && (
                        <div className={cn("chatbot-chips", !flowActive && "is-past")}>
                          {flowStep.options.map((opt, i) => (
                            <OptionChip
                              key={`${msg.flow!.id}-${flowStep.id}-${i}`}
                              label={opt.label}
                              index={i}
                              disabled={sending || !flowActive}
                              onClick={() => handleFlowOption(flowStep, opt.value)}
                            />
                          ))}
                        </div>
                      )}

                      {isGroupEnd && (
                        <p className="chatbot-meta">
                          {formatTime(msg.timestamp)}
                          {isUser && idx === lastUserIndex && msg.status && (
                            <span className="chatbot-status">
                              {msg.status === "delivered" ? (
                                <>
                                  <CheckCheck className="w-3.5 h-3.5" /> Đã nhận
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Đã gửi
                                </>
                              )}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Thinking indicator — shown while waiting for API response */}
              {thinking && (
                <div className="chatbot-msg-row is-bot">
                  <div className="chatbot-avatar-slot">
                    <BotAvatar thinking />
                  </div>
                  <div className="chatbot-bubble chatbot-bubble-bot chatbot-thinking-bubble">
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
              aria-label="Đến tin nhắn mới nhất"
              className="chatbot-jump"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
          </div>

          {/* ── Ô nhập ── */}
          <div className="chatbot-composer">
            <div className="chatbot-composer-inner">
              {/* Chủ đề nhanh trên mobile/tablet sau khi đã bắt đầu trò chuyện
                  (desktop đã có ở cột bên). Ẩn khi đang trong flow để không rối. */}
              {menu && hasUserMessage && !flowState && (
                <div className="chatbot-quick" aria-label="Chủ đề nhanh">
                  {menu.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleMenuOption(opt)}
                      disabled={sending}
                      className="chatbot-quick-chip"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className={cn("chatbot-input-wrap", inputFocused && "is-focused")}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={flowState ? "Chọn một đáp án ở trên, hoặc gõ câu hỏi…" : "Nhắn cho trợ lý Len&em…"}
                  aria-label="Tin nhắn"
                  disabled={!sessionId}
                  className="chatbot-input"
                />
                <button
                  onClick={handleSendText}
                  disabled={!inputText.trim() || sending || !sessionId}
                  aria-label="Gửi"
                  className={cn("chatbot-send", sendPulse && "chatbot-send-ready chatbot-send-pulse")}
                >
                  <Send className="w-4 h-4" strokeWidth={2.25} />
                </button>
              </div>
              <p className="chatbot-hint">
                Trợ lý có thể chưa trả lời hết mọi câu hỏi — cần gấp, hãy chọn “Liên hệ admin”.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
