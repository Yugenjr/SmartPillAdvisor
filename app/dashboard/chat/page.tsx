"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";

type Message = { role: "user" | "assistant"; content: string; timestamp: number; id?: string };
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

  // New features state
  const [renamingSession, setRenamingSession] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [speakingMessage, setSpeakingMessage] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

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

  const createNewSession = async (fromExistingSession = false) => {
    if (!user?.uid) return;

    const sessionId = `session_${Date.now()}`;

    // If creating from existing session, auto-generate title based on current messages
    let title = "New Chat";
    if (fromExistingSession && messages.length > 0) {
      title = await generateSessionTitle(messages);
    }

    const newSession = {
      sessionId,
      title,
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
          // Auto-generate title if this is the first meaningful conversation and title is still "New Chat"
          let titleToUse = text.slice(0, 50);
          const currentSession = sessions.find(s => s.sessionId === currentSessionId);
          if (currentSession && (currentSession.title === "New Chat" || currentSession.title === "Medical Chat")) {
            titleToUse = await generateSessionTitle(finalMessages);
          }

          await fetch("/api/chat/session", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: currentSessionId,
              userId: user.uid,
              messages: finalMessages,
              title: titleToUse,
            }),
          });

          // Update local sessions
          setSessions(sessions.map(s =>
            s.sessionId === currentSessionId
              ? { ...s, title: titleToUse, messages: finalMessages }
              : s
          ));
        } catch (error) {
          // Fallback to localStorage
          const stored = localStorage.getItem("chatSessions");
          const existing = stored ? JSON.parse(stored) : [];
          const index = existing.findIndex((s: ChatSession) => s.sessionId === currentSessionId);
          if (index >= 0) {
            const titleToUse = text.slice(0, 50);
            existing[index].messages = finalMessages;
            existing[index].title = titleToUse;
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

  // TTS Functions
  const speakMessage = async (messageId: string, content: string) => {
    if (!isTTSEnabled) return;

    try {
      setSpeakingMessage(messageId);

      // Stop any currently playing audio
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }

      const response = await fetch('/api/chat/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, voice: 'alloy' })
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('audio/')) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          setAudioRef(audio);

          audio.onended = () => {
            setSpeakingMessage(null);
            URL.revokeObjectURL(audioUrl);
          };

          await audio.play();
        } else {
          // Handle JSON error response
          const errorData = await response.json();
          console.error('TTS error:', errorData.message);
          alert(`TTS: ${errorData.message}`);
          setSpeakingMessage(null);
        }
      } else {
        const errorData = await response.json();
        console.error('TTS failed:', errorData);
        alert(`TTS: ${errorData.message || 'Service temporarily unavailable'}`);
        setSpeakingMessage(null);
      }
    } catch (error) {
      console.error('TTS error:', error);
      alert('Text-to-speech is currently unavailable. This feature will be available soon!');
      setSpeakingMessage(null);
    }
  };

  const stopSpeaking = () => {
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
    setSpeakingMessage(null);
  };

  // Session Renaming Functions
  const startRenaming = (sessionId: string, currentTitle: string) => {
    setRenamingSession(sessionId);
    setRenameInput(currentTitle);
  };

  const saveRename = async () => {
    if (!renamingSession || !renameInput.trim() || !user?.uid) return;

    try {
      const response = await fetch('/api/chat/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: renamingSession,
          userId: user.uid,
          title: renameInput.trim()
        })
      });

      if (response.ok) {
        // Update local sessions
        setSessions(sessions.map(s =>
          s.sessionId === renamingSession
            ? { ...s, title: renameInput.trim() }
            : s
        ));
        setRenamingSession(null);
        setRenameInput("");
      } else {
        console.error('Failed to rename session');
      }
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };

  const cancelRename = () => {
    setRenamingSession(null);
    setRenameInput("");
  };

  // Auto-generate title for session
  const generateSessionTitle = async (sessionMessages: Message[]) => {
    if (sessionMessages.length === 0) return "New Chat";

    try {
      const response = await fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: sessionMessages })
      });

      if (response.ok) {
        const data = await response.json();
        return data.title || "Medical Chat";
      }
    } catch (error) {
      console.error('Error generating title:', error);
    }

    return "Medical Chat";
  };

  // Format message content with rich formatting
  const formatMessage = (content: string, role: "user" | "assistant") => {
    if (!content || typeof content !== 'string') {
      return content || '';
    }

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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Chat Sessions Sidebar */}
      <div
        className={`bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-500 ease-in-out border-r border-white/20 ${
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Chat Sessions</h3>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* TTS Toggle */}
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <span className="text-sm font-medium">🔊 TTS</span>
              <button
                onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isTTSEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isTTSEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-6 border-b border-gray-100/50">
            <button
              onClick={() => createNewSession()}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <span className="text-xl">+</span>
              <span>New Chat</span>
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-100/50">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm"
            />
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredSessions.map((session) => (
              <div key={session.sessionId} className="group relative">
                {renamingSession === session.sessionId ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-blue-300 shadow-lg">
                    <input
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveRename()}
                      className="w-full px-3 py-2 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500 mb-3"
                      placeholder="Enter new title..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveRename}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={cancelRename}
                        className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => loadSession(session)}
                    className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 transform hover:scale-102 ${
                      currentSessionId === session.sessionId
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl scale-105"
                        : "bg-white/60 hover:bg-white/80 shadow-lg hover:shadow-xl border border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-base text-gray-900 truncate flex-1 min-w-0">
                        {session.title || "New Chat"}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenaming(session.sessionId, session.title || "New Chat");
                          }}
                          className="p-1 hover:bg-white/50 rounded-lg transition-colors cursor-pointer"
                          title="Rename chat"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 font-medium mt-1">
                      {new Date(session.createdAt).toLocaleDateString()} • {session.messages?.length || 0} messages
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg px-8 py-6 flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-3 hover:bg-gray-100/80 rounded-2xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Medical Assistant
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Powered by AI • For informational purposes only</p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={() => createNewSession(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                title="Create new chat from current conversation"
              >
                ➕ New Chat
              </button>
            )}

            {isTTSEnabled && speakingMessage && (
              <button
                onClick={stopSpeaking}
                className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-lg"
                title="Stop speaking"
              >
                🔇
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-8 shadow-xl">
                <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How can I help you today?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 font-medium">
                Ask me about medicine dosages, drug interactions, side effects, symptoms, or general health guidance.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {["Paracetamol dosage?", "Typhoid symptoms?", "Drug interactions?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-6 py-4 bg-white/80 backdrop-blur-xl border-2 border-white/50 rounded-2xl text-base text-blue-600 hover:bg-blue-50/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => {
            const messageId = `${m.role}-${m.timestamp}`;
            return (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} group`}>
                <div
                  className={`max-w-[80%] rounded-3xl px-6 py-4 shadow-xl border-2 border-white/20 relative ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-blue-500/25"
                      : "bg-white/90 backdrop-blur-xl border-white/50"
                  }`}
                >
                  <div className={`text-base font-bold mb-2 ${m.role === "user" ? "text-blue-100" : "text-blue-600"} flex items-center justify-between`}>
                    <span>{m.role === "user" ? "You" : "Medical Assistant"}</span>
                    {isTTSEnabled && m.role === "assistant" && (
                      <button
                        onClick={() => speakMessage(messageId, m.content)}
                        disabled={speakingMessage === messageId}
                        className={`p-2 rounded-xl transition-all duration-300 ${
                          speakingMessage === messageId
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30'
                        }`}
                        title={speakingMessage === messageId ? "Speaking..." : "Listen to this message"}
                      >
                        {speakingMessage === messageId ? (
                          <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 7v10l8-5z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div
                    className={`text-base leading-relaxed ${
                      m.role === "user" ? "text-white" : "text-gray-800"
                    } formatted-content`}
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(m.content, m.role),
                    }}
                  />
                  <div className={`text-sm mt-3 ${m.role === "user" ? "text-blue-200" : "text-gray-400"} font-medium`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/90 backdrop-blur-xl border-2 border-white/50 rounded-3xl px-6 py-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-base text-gray-500 font-semibold">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-lg px-8 py-6 flex-shrink-0">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  className="w-full px-6 py-4 pr-16 border-2 border-gray-200/50 rounded-3xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 resize-none transition-all duration-300 bg-white/50 backdrop-blur-sm shadow-lg text-base"
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
                  style={{ minHeight: "60px", maxHeight: "150px" }}
                />
              </div>
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl font-bold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Send
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center font-medium">
              ⚠️ This is for general information only. Always consult a healthcare professional for medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
