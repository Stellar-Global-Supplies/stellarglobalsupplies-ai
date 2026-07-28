import { useEffect, useRef, useState } from "react";
import { useChatStore, useAuthStore } from "../lib/store.js";
import Sidebar from "../components/Sidebar.jsx";
import Message from "../components/Message.jsx";
import ChatInput from "../components/ChatInput.jsx";
import ImagePanel from "../components/ImagePanel.jsx";
import EntDataPanel from "../components/EntDataPanel.jsx";
import { Menu, Database, Zap, Package, Wrench, BarChart3 } from "lucide-react";

export default function ChatPage() {
  const { messages, sendMessage, streaming, fetchModels, useEnt } = useChatStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [imageState, setImageState] = useState(null);
  const [showEntPanel, setShowEntPanel] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { fetchModels(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (useEnt) setShowEntPanel(true); }, [useEnt]);

  async function handleSend(text) {
    const result = await sendMessage(text);
    if (result?.action === "generate_image") {
      setImageState({ prompt: result.prompt, imageModel: result.imageModel });
    }
  }

  function handleInsertImage(imageUrl, prompt) {
    useChatStore.setState((s) => ({
      messages: [
        ...s.messages,
        { id: `img-${Date.now()}`, role: "assistant", content: `Here's the generated image for: *${prompt}*`, metadata: { imageUrl } },
      ],
    }));
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full bg-surface overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-1.5 rounded-lg hover:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Menu size={18} />
            </button>
          )}
          <StellarWordmark />
          <div className="flex-1" />
          <button
            onClick={() => setShowEntPanel(!showEntPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${showEntPanel
                ? "border-gem-blue bg-gem-blue/10 text-gem-blue"
                : "border-border bg-surface-1 text-text-secondary hover:text-text-primary"}`}
          >
            <Database size={13} />
            Ent data
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <WelcomeScreen onSuggest={handleSend} />
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((msg) => <Message key={msg.id} message={msg} />)}
              {streaming && messages[messages.length - 1]?.role !== "assistant" && (
                <Message message={{ id: "streaming", role: "assistant", content: "", metadata: {} }} />
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        <div className="shrink-0 pt-2">
          <ChatInput
            onSend={handleSend}
            onImageGenerate={(p, m) => setImageState({ prompt: p, imageModel: m })}
            disabled={streaming}
          />
        </div>
      </div>

      {showEntPanel && <EntDataPanel onClose={() => setShowEntPanel(false)} />}
      {imageState && (
        <ImagePanel
          prompt={imageState.prompt}
          imageModel={imageState.imageModel}
          onClose={() => setImageState(null)}
          onInsert={handleInsertImage}
        />
      )}
    </div>
  );
}

function StellarWordmark() {
  return (
    <div className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="hw2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00B98E" />
            <stop offset="100%" stopColor="#00d4a4" />
          </linearGradient>
        </defs>
        <path
          d="M20 4 L22.9 14.6 L34 14.6 L25.5 21.4 L28.5 32 L20 25.2 L11.5 32 L14.5 21.4 L6 14.6 L17.1 14.6 Z"
          fill="url(#hw2)"
        />
      </svg>
      <span className="text-base font-medium gem-gradient">Stellar AI</span>
    </div>
  );
}

// Stellar-relevant suggestion chips
const SUGGESTIONS = [
  { icon: Package,  label: "Check stock availability",   prompt: "What stainless steel grades do we currently have in stock?" },
  { icon: BarChart3,label: "Analyse order trends",       prompt: "Show me our top selling products and order trends this quarter" },
  { icon: Wrench,   label: "Material specifications",    prompt: "What are the specifications for SS 304 vs SS 316 grade stainless steel?" },
  { icon: Zap,      label: "Draft a quote",              prompt: "Help me draft a quote for MS Angles and Channels for a construction project" },
  { icon: Database, label: "Query enterprise data",      prompt: "Show me customer orders from the last 30 days" },
  { icon: Package,  label: "Generate product image",     prompt: "Generate an image of stainless steel pipes in an industrial warehouse setting" },
];

function WelcomeScreen({ onSuggest }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 animate-fade-in">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <svg width="56" height="56" viewBox="0 0 40 40" fill="none">
            <defs>
              <linearGradient id="wg2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00B98E" />
                <stop offset="100%" stopColor="#00d4a4" />
              </linearGradient>
            </defs>
            <path
              d="M20 4 L22.9 14.6 L34 14.6 L25.5 21.4 L28.5 32 L20 25.2 L11.5 32 L14.5 21.4 L6 14.6 L17.1 14.6 Z"
              fill="url(#wg2)"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">
          <span className="gem-gradient">Hello there</span>
        </h1>
        <p className="text-text-secondary text-lg">How can I help Stellar Global Supplies today?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.prompt}
            onClick={() => onSuggest(s.prompt)}
            className="flex items-start gap-2 p-4 rounded-2xl bg-surface-1 border border-border
                       text-left text-sm text-text-secondary hover:text-text-primary
                       hover:bg-surface-2 hover:border-surface-3 transition-all group"
          >
            <s.icon size={14} className="mt-0.5 shrink-0 text-gem-blue group-hover:text-gem-purple transition-colors" />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
