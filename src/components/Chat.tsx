import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, LogOut, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/auth';
import { api } from '@/api';
import type { Conversation, Message, Attachment, GroqModel, ImageModel } from '@/types';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import Welcome from './Welcome';

export default function Chat() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [models, setModels] = useState<GroqModel[]>([]);
  const [imageModels, setImageModels] = useState<ImageModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChatModels().then(setModels).catch(() => {});
    api.getImageModels().then(setImageModels).catch(() => {});
    refreshConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function refreshConversations() {
    setLoading(true);
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(id: string) {
    try {
      const conv = await api.getConversation(id);
      setActiveId(id);
      setSelectedModel(conv.model || 'llama-3.3-70b-versatile');
      setMessages(conv.messages || []);
      setSidebarOpen(false);
    } catch (err) {
      alert('Failed to load conversation');
    }
  }

  async function handleNewChat() {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  async function ensureConversation(): Promise<string> {
    if (activeId) return activeId;
    const conv = await api.createConversation('New chat', selectedModel);
    setActiveId(conv.id);
    setConversations((prev) => [conv, ...prev]);
    return conv.id;
  }

  const handleSend = useCallback(
    async (text: string, attachments: Attachment[], options: { useWeb: boolean; useEntData: boolean }) => {
      if (sending) return;
      setSending(true);

      const userMessage: Message = { role: 'user', content: text, attachments };
      setMessages((prev) => [...prev, userMessage]);

      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const convId = await ensureConversation();

        const history = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        let firstChunk = true;
        await api.streamChat(
          {
            conversationId: convId,
            model: selectedModel,
            messages: history,
            useWeb: options.useWeb,
            useEntData: options.useEntData,
            attachments,
          },
          (chunk) => {
            if (firstChunk) {
              firstChunk = false;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], content: chunk };
                return next;
              });
            } else {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = { ...last, content: last.content + chunk };
                return next;
              });
            }
          }
        );

        refreshConversations();
      } catch (err) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
          };
          return next;
        });
      } finally {
        setSending(false);
      }
    },
    [sending, messages, selectedModel, activeId]
  );

  async function handleGenerateImage(prompt: string, model: string) {
    if (sending) return;
    setSending(true);

    const userMessage: Message = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMessage]);

    const assistantMessage: Message = { role: 'assistant', content: 'Generating image...' };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const convId = await ensureConversation();
      const result = await api.generateImage(prompt, model);

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: `Here's the generated image for: "${prompt}"`,
          image_url: result.image,
        };
        return next;
      });

      await api.addMessage(convId, { role: 'user', content: prompt });
      await api.addMessage(convId, {
        role: 'assistant',
        content: `Generated image for: "${prompt}"`,
        image_url: result.image,
        model: result.model,
      });
      refreshConversations();
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: `Image generation failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        };
        return next;
      });
    } finally {
      setSending(false);
    }
  }

  async function handleModelChange(model: string) {
    setSelectedModel(model);
    if (activeId) {
      try {
        await api.updateConversation(activeId, { model });
        refreshConversations();
      } catch {}
    }
  }

  return (
    <div className="h-screen flex bg-white dark:bg-gem-dark overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static z-30 h-full transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={loadConversation}
          onNew={handleNewChat}
          onRefresh={refreshConversations}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gem-border dark:border-gem-darkBorder">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-gem-blue" />
              <span className="text-lg font-medium stellar-gradient">Stellar AI</span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gem-darkSurface border border-gem-border dark:border-gem-darkBorder rounded-xl shadow-lg z-20 p-2">
                  <div className="px-3 py-2 border-b border-gem-border dark:border-gem-darkBorder mb-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <Welcome onSuggestion={(prompt) => {
              const textarea = document.querySelector('textarea');
              if (textarea) {
                textarea.focus();
              }
              handleSend(prompt, [], { useWeb: false, useEntData: false });
            }} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  message={msg}
                  userName={user?.name || user?.email || undefined}
                  isStreaming={sending && i === messages.length - 1 && msg.role === 'assistant'}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={sending}
          models={models}
          imageModels={imageModels}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onGenerateImage={handleGenerateImage}
        />
      </div>
    </div>
  );
}
