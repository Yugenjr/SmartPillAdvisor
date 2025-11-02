"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";

type Message = { role: "user" | "assistant"; content: string; timestamp: number };
type ChatSession = { id: string; title: string; messages: Message[]; createdAt: number; userId: string; sessionId: string };

export default function ChatPage() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from MongoDB
  useEffect(() => {
    if (!user?.uid) return;

    const loadSessions = async () => {
      try {
        const res = await fetch(`/api/chat/sessions?userId=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem("chatSessions");
          if (stored) {
            try {
              setSessions(JSON.parse(stored));
            } catch {}
          }
        }
      } catch (error) {
        console.warn("MongoDB load error - using local storage fallback:", error);
        const stored = localStorage.getItem("chatSessions");
        if (stored) {
          try {
            setSessions(JSON.parse(stored));
          } catch {}
        }
      }
    };

    loadSessions();
  }, [user?.uid]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewSession = async () => {
    if (!user?.uid) return;

    const sessionId = `session_${Date.now()}`;
    const newSession = {
      sessionId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      userId: user.uid,
    };

    try {
      // Create session in MongoDB via API
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });

      if (res.ok) {
        setCurrentSessionId(sessionId);
        setMessages([]);
        // Reload sessions
        const sessionsRes = await fetch(`/api/chat/sessions?userId=${user.uid}`);
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSessions(data.sessions || []);
        }
      } else {
        throw new Error("Failed to create session");
      }
    } catch (error) {
      // Fallback to localStorage
      const id = sessionId;
      const sessionWithId = { id, ...newSession };
      const stored = localStorage.getItem("chatSessions");
      const existing = stored ? JSON.parse(stored) : [];
      existing.unshift(sessionWithId);
      localStorage.setItem("chatSessions", JSON.stringify(existing));
      setSessions(existing);
      setCurrentSessionId(id);
      setMessages([]);
    }
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.sessionId);
    setMessages(session.messages || []);
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    // Create session if none exists
    if (!currentSessionId) {
      await createNewSession();
    }

    const userMsg: Message = { role: "user", content: text, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userId: user?.uid,
          sessionId: currentSessionId
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat error");

      const assistantMsg: Message = { role: "assistant", content: data.reply, timestamp: Date.now() };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      // Update session in MongoDB
      if (currentSessionId && user?.uid) {
        try {
          await fetch("/api/chat/session", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: currentSessionId,
              userId: user.uid,
              messages: finalMessages,
              title: text.slice(0, 50),
            }),
          });
        } catch (error) {
          // Fallback to localStorage
          const stored = localStorage.getItem("chatSessions");
          const existing = stored ? JSON.parse(stored) : [];
          const index = existing.findIndex((s: ChatSession) => s.sessionId === currentSessionId);
          if (index >= 0) {
            existing[index].messages = finalMessages;
            existing[index].title = text.slice(0, 50);
            localStorage.setItem("chatSessions", JSON.stringify(existing));
            setSessions(existing);
          }
        }
      }
    } catch (e: any) {
      const errorMsg: Message = { role: "assistant", content: `Error: ${e.message}`, timestamp: Date.now() };
      setMessages([...updatedMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format message content with rich formatting
  const formatMessage = (content: string, role: "user" | "assistant") => {
    let formatted = content;

    // For assistant messages, apply rich formatting
    if (role === "assistant") {
      // Code blocks with syntax highlighting style
      formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre class="bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto border border-gray-300"><code class="text-xs font-mono text-gray-800">${code.trim()}</code></pre>`;
      });

      // Inline code
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-purple-700">$1</code>');

      // Bold text
      formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');

      // Italic text
      formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

      // Numbered lists
      formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
      formatted = formatted.replace(/(<li class="ml-4 mb-1">.*<\/li>\n?)+/g, '<ol class="list-decimal list-inside my-2 space-y-1">$&</ol>');

      // Bullet lists
      formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
      formatted = formatted.replace(/(<li class="ml-4 mb-1">.*<\/li>\n?)+/g, (match) => {
        if (!match.includes('list-decimal')) {
          return `<ul class="list-disc list-inside my-2 space-y-1">${match}</ul>`;
        }
        return match;
      });

      // Tables (markdown format)
      formatted = formatted.replace(/\n\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
        const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => `<th class="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">${h.trim()}</th>`).join('');
        const rowsHtml = rows.trim().split('\n').map((row: string) => {
          const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="border border-gray-300 px-3 py-2">${c.trim()}</td>`).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
        return `<div class="overflow-x-auto my-3"><table class="min-w-full border-collapse border border-gray-300 text-sm"><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
      });

      // Headers
      formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-2 text-gray-900">$1</h3>');
      formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-3 mb-2 text-gray-900">$1</h2>');
      formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-2 text-gray-900">$1</h1>');

      // Paragraphs (double line breaks)
      formatted = formatted.replace(/\n\n/g, '</p><p class="mb-2">');
      formatted = `<p class="mb-2">${formatted}</p>`;

      // Single line breaks
      formatted = formatted.replace(/\n/g, '<br/>');
    } else {
      // For user messages, simple formatting
      formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>');
      formatted = formatted.replace(/\n/g, '<br/>');
    }
    return formatted;
  };

  return (
    <div className="flex h-[calc(100vh-73px)] bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Chat Sessions Sidebar */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 border-r border-gray-200 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Chat Sessions</h3>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={createNewSession}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>+</span>
              <span>New Chat</span>
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => loadSession(session)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all hover:bg-gray-50 ${
                  currentSessionId === session.sessionId
                    ? "bg-purple-100 border-2 border-purple-300 shadow-sm"
                    : "border border-transparent"
                }`}
              >
                <div className="font-medium text-sm text-gray-900 truncate">
                  {session.title || "New Chat"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(session.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Medical Assistant
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Powered by AI • For informational purposes only</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">How can I help you today?</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Ask me about medicine dosages, drug interactions, side effects, symptoms, or general health guidance.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {["Paracetamol dosage?", "Typhoid symptoms?", "Drug interactions?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-4 py-2 bg-white border border-purple-200 rounded-full text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${m.role === "user" ? "text-purple-100" : "text-purple-600"}`}>
                  {m.role === "user" ? "You" : "Medical Assistant"}
                </div>
                <div
                  className={`text-sm leading-relaxed ${
                    m.role === "user" ? "text-white" : "text-gray-800"
                  } formatted-content`}
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(m.content, m.role),
                  }}
                />
                <div className={`text-xs mt-2 ${m.role === "user" ? "text-purple-200" : "text-gray-400"}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t shadow-lg px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 resize-none transition-colors"
                  placeholder="Ask about dosage, timing, side effects, symptoms..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
              </div>
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              ⚠️ This is for general information only. Always consult a healthcare professional for medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
