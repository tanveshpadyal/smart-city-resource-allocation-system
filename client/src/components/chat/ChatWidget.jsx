import { useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import useAuthStore from "../../store/authStore";
import chatService from "../../services/chatService";

const starterPrompts = {
  CITIZEN: "Ask about your complaint status or delays",
  OPERATOR: "Ask about your assigned complaints or next actions",
  ADMIN: "Ask about pending complaints or operator workload",
};

const ChatWidget = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Smart City Assistant is ready. I can answer questions using your live complaint data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  if (!isAuthenticated || !user?.role) {
    return null;
  }

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const response = await chatService.sendMessage(trimmed);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text:
            response?.data?.response || "I don't have that information right now.",
        },
      ]);
    } catch (requestError) {
      const nextError =
        requestError.response?.data?.error ||
        "Unable to reach the assistant right now.";
      setError(nextError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-4">
      {isOpen ? (
        <div className="pointer-events-auto w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-950">
          <div className="bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-500 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-white/15 p-2 backdrop-blur">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Smart City Assistant</p>
                  <p className="mt-1 text-xs text-white/80">
                    {starterPrompts[user.role] || "Ask a question about your data"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Close assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[24rem] space-y-3 overflow-y-auto bg-slate-50/80 px-4 py-4 dark:bg-slate-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-md bg-blue-700 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-3xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <LoaderCircle size={16} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
            {error ? (
              <p className="mb-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-200">
                {error}
              </p>
            ) : null}

            <div className="flex items-end gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
              <textarea
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-700 text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="pointer-events-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-blue-600 to-cyan-500 text-white shadow-[0_18px_40px_rgba(37,99,235,0.45)]"
        aria-label="Open Smart City Assistant"
      >
        <MessageCircle size={26} />
      </button>
    </div>
  );
};

export default ChatWidget;
