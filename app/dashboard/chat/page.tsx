"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New features state
  const [renamingSession, setRenamingSession] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [speakingMessage, setSpeakingMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

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
      console.log("Chat API response:", data);

      if (!res.ok) throw new Error(data.error || "Chat error");

      const replyText = data.reply || "";
      console.log("AI Reply:", replyText);

      if (!replyText.trim()) {
        console.warn("Empty AI response received");
      }

      const assistantMsg: Message = { role: "assistant", content: replyText, timestamp: Date.now() };
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
  const speakMessage = (messageId: string, text: string) => {
    // Validate input
    if (!text || text.trim() === '') {
      console.warn('Cannot speak empty message');
      return;
    }

    // Check text length (limit to reasonable size to prevent timeouts)
    let cleanText = text.trim();
    if (cleanText.length > 5000) {
      console.warn('Text too long for speech synthesis, truncating');
      cleanText = cleanText.substring(0, 5000) + '...';
    }

    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      // Could show a user notification here if needed
      return;
    }

    // Check if already speaking
    if (window.speechSynthesis.speaking) {
      console.warn('Speech synthesis already in progress');
      return;
    }

    // Check if TTS is enabled
    if (!isTTSEnabled) {
      console.warn('TTS is disabled');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Configure voice settings with error handling
      utterance.rate = Math.max(0.1, Math.min(10, 0.9)); // Clamp rate between 0.1-10
      utterance.pitch = Math.max(0, Math.min(2, 1)); // Clamp pitch between 0-2
      utterance.volume = isMuted ? 0 : Math.max(0, Math.min(1, 0.8)); // Clamp volume between 0-1

      // Try to find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try to find English voices first, then fallback to any available voice
        const englishVoice = voices.find(voice =>
          voice.lang.startsWith('en') &&
          (voice.name.toLowerCase().includes('female') ||
           voice.name.toLowerCase().includes('male'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];

        if (englishVoice) {
          utterance.voice = englishVoice;
          console.log('Using voice:', englishVoice.name, englishVoice.lang);
        }
      }

      // Set up event handlers
      utterance.onstart = () => {
        setSpeakingMessage(messageId);
        console.log('Started speaking message:', messageId);
      };

      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn('Speech synthesis timeout, cancelling');
        window.speechSynthesis.cancel();
        setSpeakingMessage(null);
      }, 30000); // 30 second timeout

      utterance.onend = () => {
        clearTimeout(timeoutId);
        setSpeakingMessage(null);
        console.log('Finished speaking message:', messageId);
      };

      utterance.onerror = (event) => {
        clearTimeout(timeoutId);
        console.error('Speech synthesis error:', {
          error: event.error,
          message: event.message || 'Unknown error',
          charIndex: event.charIndex,
          elapsedTime: event.elapsedTime
        });
        setSpeakingMessage(null);
      };

      utterance.onpause = () => {
        console.log('Speech paused');
      };

      utterance.onresume = () => {
        console.log('Speech resumed');
      };

      // Speak the utterance
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('TTS setup error:', error);
      setSpeakingMessage(null);
    }
  };

  const stopSpeaking = () => {
    try {
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } catch (error) {
      console.error('Error stopping speech:', error);
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
      console.warn(`Invalid content for ${role}:`, content);
      return content || '<em class="text-slate-400">No content available</em>';
    }

    let formatted = content.trim();

    // For assistant messages, apply rich formatting
    if (role === "assistant") {
      try {
        // Code blocks with syntax highlighting style
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
          const cleanCode = code.trim();
          return `<pre class="bg-slate-800 rounded-lg p-3 my-3 overflow-x-auto border border-cyan-500/20"><code class="text-xs font-mono text-slate-200">${cleanCode || ' '}</code></pre>`;
        });

        // Inline code
        formatted = formatted.replace(/`([^`\n]+)`/g, '<code class="bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-300">$1</code>');

        // Bold text
        formatted = formatted.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-bold text-slate-100">$1</strong>');

        // Italic text
        formatted = formatted.replace(/\*([^*\n]+)\*/g, '<em class="italic text-slate-200">$1</em>');

        // Numbered lists
        formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 mb-1 text-slate-200">$1</li>');
        formatted = formatted.replace(/(<li class="ml-4 mb-1 text-slate-200">.*<\/li>\n?)+/g, '<ol class="list-decimal list-inside my-2 space-y-1 text-slate-200">$&</ol>');

        // Bullet lists
        formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4 mb-1 text-slate-200">$1</li>');
        formatted = formatted.replace(/(<li class="ml-4 mb-1 text-slate-200">.*<\/li>\n?)+/g, (match) => {
          if (!match.includes('list-decimal')) {
            return `<ul class="list-disc list-inside my-2 space-y-1 text-slate-200">${match}</ul>`;
          }
          return match;
        });

        // Tables (markdown format)
        formatted = formatted.replace(/\n\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
          try {
            const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => `<th class="border border-white/30 px-3 py-2 bg-slate-700/80 font-semibold text-left text-slate-200">${h.trim()}</th>`).join('');
            const rowsHtml = rows.trim().split('\n').map((row: string) => {
              const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="border border-white/30 px-3 py-2 bg-slate-700/80 text-slate-200">${c.trim()}</td>`).join('');
              return `<tr>${cells}</tr>`;
            }).join('');
            return `<div class="overflow-x-auto my-3"><table class="min-w-full border-collapse border border-white/30 text-sm bg-slate-700/80"><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
          } catch (e) {
            return `<pre class="bg-slate-800 p-3 rounded text-slate-200 border border-white/30">${match}</pre>`;
          }
        });

        // Headers
        formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-2 text-slate-100">$1</h3>');
        formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-3 mb-2 text-slate-100">$1</h2>');
        formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-2 text-slate-100">$1</h1>');
        formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-3 mb-2 text-slate-100">$1</h2>');
        formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-2 text-slate-100">$1</h1>');

        // Paragraphs (double line breaks)
        if (formatted.includes('\n\n')) {
          formatted = formatted.replace(/\n\n/g, '</p><p class="mb-2 text-slate-200">');
          formatted = `<p class="mb-2 text-slate-200">${formatted}</p>`;
        }

        // Single line breaks (only if no paragraphs were created)
        if (!formatted.includes('<p>')) {
          formatted = formatted.replace(/\n/g, '<br/>');
        }

        // Ensure we have valid HTML
        if (!formatted.trim()) {
          formatted = '<span class="text-slate-200">Empty response</span>';
        }

      } catch (error) {
        console.error('Error formatting message:', error);
        formatted = `<pre class="bg-red-900/20 p-3 rounded border border-red-500/20 text-red-300">${content}</pre>`;
      }
    } else {
      // For user messages, simple formatting
      formatted = formatted.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-bold">$1</strong>');
      formatted = formatted.replace(/\n/g, '<br/>');
      if (!formatted.trim()) {
        formatted = '<span class="text-slate-200">Empty message</span>';
      }
    }

    console.log(`Formatted content for ${role}:`, formatted.substring(0, 100) + '...');
    return formatted;
  };

  return (
    <div className="h-full flex">
      {/* Left Side - Chat Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="h-16 bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="text-2xl p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/25"
            >
              🤖
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Medical Assistant
              </h1>
              <p className="text-sm text-slate-400">Your intelligent healthcare companion</p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-700/60 rounded-xl p-2 border border-slate-600/50">
              <span className="text-sm text-slate-300">🔊 TTS</span>
              <button
                onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isTTSEnabled ? 'bg-cyan-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isTTSEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isTTSEnabled && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-xl transition-all duration-300 shadow-lg border ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-400/20'
                    : 'bg-slate-700/60 hover:bg-slate-600/60 text-cyan-400 border-slate-600/50'
                }`}
                title={isMuted ? "Unmute voice" : "Mute voice"}
              >
                {isMuted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 5.586L19.414 19.414M9.172 9.172L12 12m-2.828 2.828L9.172 14.828m5.656-5.656L14.828 9.172M12 2.25a.75.75 0 00-.75.75v1.5a.75.75 0 01-.75.75 4.5 4.5 0 00-4.5 4.5v.75a.75.75 0 01-.75.75H2.25a.75.75 0 100 1.5H4.5a.75.75 0 00.75-.75v-.75a6 6 0 016-6 .75.75 0 00.75-.75V3a.75.75 0 00-.75-.75z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.114 5.636l-3.51 3.51M12 2.25a.75.75 0 00-.75.75v1.5a.75.75 0 01-.75.75 4.5 4.5 0 00-4.5 4.5v.75a.75.75 0 01-.75.75H2.25a.75.75 0 100 1.5H4.5a.75.75 0 00.75-.75v-.75a6 6 0 016-6 .75.75 0 00.75-.75V3a.75.75 0 00-.75-.75z" />
                  </svg>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="w-full max-w-none">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-center py-20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                  className="inline-block p-8 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full mb-8 shadow-2xl shadow-cyan-500/10 border border-cyan-500/20"
                >
                  <div className="text-7xl">🤖</div>
                </motion.div>
                <h2 className="text-4xl font-bold text-slate-200 mb-6">How can I help you today?</h2>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
                  Ask me about medicine dosages, drug interactions, side effects, symptoms, or general health guidance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {[
                    { text: "Paracetamol dosage?", icon: "💊" },
                    { text: "Typhoid symptoms?", icon: "🤒" },
                    { text: "Drug interactions?", icon: "⚠️" }
                  ].map((suggestion, idx) => (
                    <motion.button
                      key={suggestion.text}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + idx * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setInput(suggestion.text)}
                      className="p-6 bg-slate-800/60 backdrop-blur-xl border-2 border-cyan-500/20 rounded-2xl text-left hover:bg-slate-700/60 hover:border-cyan-400/40 transition-all duration-300 shadow-lg hover:shadow-xl shadow-cyan-500/10 group"
                    >
                      <div className="text-2xl mb-3">{suggestion.icon}</div>
                      <div className="text-base text-slate-200 font-medium group-hover:text-cyan-300 transition-colors">
                        {suggestion.text}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <div className="space-y-8">
              {messages.filter(m => m && m.role && typeof m.content !== 'undefined').map((m, i) => {
                const messageId = `${m.role}-${m.timestamp || Date.now()}`;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} group`}
                  >
                    <div
                      className={`max-w-[90%] lg:max-w-[85%] rounded-3xl px-6 py-5 shadow-2xl relative ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-500/25 border border-blue-400/20"
                          : "bg-slate-700/80 backdrop-blur-xl border border-slate-600/50 text-slate-100"
                      }`}
                    >
                      <div className={`text-sm font-bold mb-4 ${m.role === "user" ? "text-cyan-100" : "text-cyan-400"} flex items-center justify-between`}>
                        <span className="flex items-center gap-2">
                          {m.role === "user" ? "👤 You" : "🤖 Medical Assistant"}
                        </span>
                        {isTTSEnabled && m.role === "assistant" && m.content && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => speakMessage(messageId, m.content)}
                            disabled={speakingMessage === messageId}
                            className={`p-2 rounded-xl transition-all duration-300 ${
                              speakingMessage === messageId
                                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
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
                          </motion.button>
                        )}
                      </div>
                      <div
                        className={`text-base leading-relaxed ${
                          m.role === "user" ? "text-white" : "text-slate-100"
                        } formatted-content prose prose-invert max-w-none max-h-96 overflow-y-auto`}
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(m.content || '', m.role),
                        }}
                      />
                      <div className={`text-xs mt-4 ${m.role === "user" ? "text-cyan-200" : "text-slate-400"} font-medium`}>
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-800/60 backdrop-blur-xl border-2 border-cyan-500/20 rounded-3xl px-6 py-5 shadow-2xl shadow-cyan-500/10">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-4 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-4 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-4 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-base text-slate-300 font-semibold">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area - Bottom */}
        <div className="bg-slate-800/90 backdrop-blur-xl border-t border-slate-700/50 p-4">
          <div className="w-full">
            <div className="flex gap-4 items-end">
              {messages.length > 0 && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => createNewSession(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-emerald-400/20 text-sm"
                  title="Create new chat from current conversation"
                >
                  ➕ New Chat
                </motion.button>
              )}

              <div className="flex-1 relative">
                <textarea
                  className="w-full px-6 py-4 pr-16 border-2 border-cyan-500/20 rounded-3xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 resize-none transition-all duration-300 bg-slate-700/60 backdrop-blur-sm shadow-lg text-slate-200 placeholder-slate-400 text-base"
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
                  style={{ minHeight: "50px", maxHeight: "120px" }}
                />
              </div>

              {isTTSEnabled && speakingMessage && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopSpeaking}
                  className="p-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-lg border border-red-400/20"
                  title="Stop speaking"
                >
                  🔇
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={send}
                disabled={!input.trim() || loading}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-3xl font-bold hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl border border-cyan-400/20"
              >
                Send
              </motion.button>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center font-medium">
              ⚠️ This is for general information only. Always consult a healthcare professional for medical advice.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Chat History */}
      <div className="w-80 bg-slate-800/95 backdrop-blur-xl border-l border-slate-700/50 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-200">Chat History</h3>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border-2 border-slate-600/50 rounded-2xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400"
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-6 border-b border-slate-700/50">
          <button
            onClick={() => createNewSession()}
            className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3 border border-cyan-400/20"
          >
            <span className="text-xl">+</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-slate-400 text-sm">No conversations yet</p>
              <p className="text-slate-500 text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredSessions.map((session) => (
                <div key={session.sessionId} className="group relative">
                  {renamingSession === session.sessionId ? (
                    <div className="bg-slate-700/60 backdrop-blur-sm rounded-2xl p-4 border-2 border-cyan-400 shadow-lg">
                      <input
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveRename()}
                        className="w-full px-3 py-2 border-2 border-cyan-400 rounded-xl focus:outline-none focus:border-cyan-300 mb-3 bg-slate-600 text-slate-200"
                        placeholder="Enter new title..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveRename}
                          className="flex-1 px-3 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors text-sm font-medium"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={cancelRename}
                          className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => loadSession(session)}
                        className={`w-full text-left px-4 py-4 rounded-2xl transition-all duration-300 transform hover:scale-102 ${
                          currentSessionId === session.sessionId
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white shadow-xl scale-105 border border-cyan-500/30"
                            : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 shadow-lg border border-transparent hover:border-cyan-500/20"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-slate-200 truncate flex-1 min-w-0 mb-1">
                              {session.title || "New Chat"}
                            </div>
                            <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                              <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{session.messages?.length || 0} messages</span>
                            </div>
                            {/* Preview of first message */}
                            {session.messages && session.messages.length > 0 && session.messages[0]?.content && (
                              <div className="text-xs text-slate-500 mt-2 line-clamp-2">
                                {session.messages[0].content.substring(0, 60)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Rename Button */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenaming(session.sessionId, session.title || "New Chat");
                          }}
                          className="p-2 hover:bg-slate-500/50 rounded-lg transition-colors bg-slate-800/80 backdrop-blur-sm border border-slate-600/50"
                          title="Rename chat"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Session Info */}
        {currentSessionId && (
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
            <div className="text-xs text-slate-400 text-center">
              Current: {sessions.find(s => s.sessionId === currentSessionId)?.title || "New Chat"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
