import { create } from "zustand";

const API = "/api";

// ── Auth Store ───────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: true,

  init: async () => {
    const token = localStorage.getItem("token");
    if (!token) return set({ loading: false });
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        set({ user, token, loading: false });
      } else {
        localStorage.removeItem("token");
        set({ user: null, token: null, loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem("token", data.token);
    set({ user: data.user, token: data.token });
    return data.user;
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  getHeaders: () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${get().token}`,
  }),

  getAuthHeader: () => ({
    Authorization: `Bearer ${get().token}`,
  }),
}));

// ── Chat Store ───────────────────────────────────────────────
export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConvId: null,
  messages: [],
  streaming: false,
  streamBuffer: "",

  models: { llm: [], image: [] },
  selectedModel: "llama-3.3-70b-versatile",
  selectedImageModel: "black-forest-labs/FLUX.1-schnell",

  useWeb: false,
  useEnt: false,

  fileContext: null,
  filePreview: null,

  setUseWeb: (v) => set({ useWeb: v }),
  setUseEnt: (v) => set({ useEnt: v }),
  setSelectedModel: (m) => set({ selectedModel: m }),
  setSelectedImageModel: (m) => set({ selectedImageModel: m }),
  setFileContext: (ctx, preview) => set({ fileContext: ctx, filePreview: preview }),
  clearFile: () => set({ fileContext: null, filePreview: null }),

  fetchModels: async () => {
    const { getHeaders } = useAuthStore.getState();
    const res = await fetch(`${API}/models`, { headers: getHeaders() });
    if (res.ok) set({ models: await res.json() });
  },

  fetchConversations: async () => {
    const { getHeaders } = useAuthStore.getState();
    const res = await fetch(`${API}/chat/conversations`, { headers: getHeaders() });
    if (res.ok) set({ conversations: await res.json() });
  },

  newConversation: async () => {
    const { getHeaders } = useAuthStore.getState();
    const res = await fetch(`${API}/chat/conversations`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title: "New Chat" }),
    });
    if (res.ok) {
      const conv = await res.json();
      set((s) => ({ conversations: [conv, ...s.conversations], activeConvId: conv.id, messages: [] }));
      return conv;
    }
  },

  selectConversation: async (id) => {
    const { getHeaders } = useAuthStore.getState();
    set({ activeConvId: id, messages: [], streaming: false });
    const res = await fetch(`${API}/chat/conversations/${id}/messages`, { headers: getHeaders() });
    if (res.ok) set({ messages: await res.json() });
  },

  deleteConversation: async (id) => {
    const { getHeaders } = useAuthStore.getState();
    await fetch(`${API}/chat/conversations/${id}`, { method: "DELETE", headers: getHeaders() });
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      const activeConvId = s.activeConvId === id ? null : s.activeConvId;
      const messages = activeConvId === null ? [] : s.messages;
      return { conversations, activeConvId, messages };
    });
  },

  sendMessage: async (content) => {
    const { getHeaders, getAuthHeader } = useAuthStore.getState();
    const { activeConvId, selectedModel, fileContext, useWeb, useEnt, selectedImageModel } = get();

    let convId = activeConvId;
    if (!convId) {
      const conv = await get().newConversation();
      convId = conv.id;
    }

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    set((s) => ({
      messages: [...s.messages, { id: tempId, role: "user", content, metadata: {} }],
    }));

    // Fetch web context if enabled
    let webContext = null;
    if (useWeb) {
      try {
        const wr = await fetch(`${API}/search?q=${encodeURIComponent(content)}`, { headers: getHeaders() });
        if (wr.ok) ({ context: webContext } = await wr.json());
      } catch {}
    }

    // Fetch ent context if enabled (uses last selected table from store)
    let entContext = null;
    if (useEnt && get().entTable) {
      try {
        const [schema = "public", table] = (get().entTable || "").split(".");
        const er = await fetch(`${API}/ent/context?table=${table}&schema=${schema}`, { headers: getHeaders() });
        if (er.ok) ({ context: entContext } = await er.json());
      } catch {}
    }

    // Send to backend
    const res = await fetch(`${API}/chat/conversations/${convId}/send`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content, model: selectedModel, fileContext, webContext, entContext }),
    });

    // Check if backend wants image generation
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await res.json();
      if (json.action === "generate_image") {
        set({ streaming: false });
        return { action: "generate_image", prompt: json.prompt, imageModel: selectedImageModel };
      }
    }

    // Stream SSE
    set({ streaming: true, streamBuffer: "" });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = "";
    const assistantId = `assistant-${Date.now()}`;

    set((s) => ({
      messages: [...s.messages, { id: assistantId, role: "assistant", content: "", metadata: { model: selectedModel } }],
    }));

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.delta) {
              assistantContent += json.delta;
              set((s) => ({
                messages: s.messages.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                ),
              }));
            }
            if (json.done || json.error) {
              set({ streaming: false });
              // Refresh conversations to update title
              get().fetchConversations();
            }
          } catch {}
        }
      }
    } catch {
      set({ streaming: false });
    }

    set({ streaming: false, fileContext: null, filePreview: null });
  },

  setEntTable: (t) => set({ entTable: t }),
  entTable: null,
}));
