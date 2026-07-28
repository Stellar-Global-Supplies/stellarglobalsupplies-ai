import { useState, useRef, useCallback } from "react";
import { useChatStore } from "../lib/store.js";
import { useAuthStore } from "../lib/store.js";
import {
  Send, Paperclip, Globe, Database, Image as ImageIcon,
  X, FileText, Table, ChevronDown
} from "lucide-react";
import clsx from "clsx";

const API = import.meta.env.VITE_API_URL || "/api";

export default function ChatInput({ onSend, onImageGenerate, disabled }) {
  const [value, setValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showImageModelMenu, setShowImageModelMenu] = useState(false);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const {
    useWeb, setUseWeb, useEnt, setUseEnt,
    models, selectedModel, setSelectedModel,
    selectedImageModel, setSelectedImageModel,
    fileContext, filePreview, setFileContext, clearFile,
    streaming,
  } = useChatStore();

  const { getAuthHeader } = useAuthStore();

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/files/parse`, {
        method: "POST",
        headers: getAuthHeader(),
        body: fd,
      });
      const data = await res.json();
      if (res.ok) setFileContext(data.text, { ...data.preview, filename: data.filename });
      else alert("File error: " + data.error);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = value.trim();
    if (!text || disabled || streaming) return;
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(text);
  }

  const selectedModelName = models.llm.find((m) => m.id === selectedModel)?.name || selectedModel;
  const selectedImageModelName = models.image.find((m) => m.id === selectedImageModel)?.name || "Image Model";

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* File preview chip */}
      {filePreview && (
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-full px-3 py-1.5 text-xs text-text-secondary">
            {filePreview.type === "table" ? <Table size={12} /> : <FileText size={12} />}
            <span className="max-w-[200px] truncate">{filePreview.filename}</span>
            <button onClick={clearFile} className="ml-1 hover:text-text-primary transition-colors">
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Main input container */}
      <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-lg focus-within:border-surface-3 transition-colors">
        {/* Toggles row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-border/50">
          <Toggle active={useWeb} onClick={() => setUseWeb(!useWeb)} icon={<Globe size={13} />} label="Web" />
          <Toggle active={useEnt} onClick={() => setUseEnt(!useEnt)} icon={<Database size={13} />} label="Ent data" />

          {/* LLM Model picker */}
          <div className="relative ml-auto">
            <button
              onClick={() => { setShowModelMenu(!showModelMenu); setShowImageModelMenu(false); }}
              className="toggle-pill text-xs"
            >
              <span className="max-w-[120px] truncate">{selectedModelName}</span>
              <ChevronDown size={12} />
            </button>
            {showModelMenu && (
              <ModelMenu
                models={models.llm}
                selected={selectedModel}
                onSelect={(m) => { setSelectedModel(m); setShowModelMenu(false); }}
                onClose={() => setShowModelMenu(false)}
                label="Chat model"
              />
            )}
          </div>

          {/* Image Model picker */}
          <div className="relative">
            <button
              onClick={() => { setShowImageModelMenu(!showImageModelMenu); setShowModelMenu(false); }}
              className="toggle-pill text-xs"
            >
              <ImageIcon size={12} />
              <span className="max-w-[100px] truncate">{selectedImageModelName}</span>
              <ChevronDown size={12} />
            </button>
            {showImageModelMenu && (
              <ModelMenu
                models={models.image}
                selected={selectedImageModel}
                onSelect={(m) => { setSelectedImageModel(m); setShowImageModelMenu(false); }}
                onClose={() => setShowImageModelMenu(false)}
                label="Image model"
                align="right"
              />
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Stellar AI"
          rows={1}
          className="w-full bg-transparent px-4 py-3 text-text-primary placeholder-text-disabled
                     text-sm resize-none focus:outline-none leading-relaxed"
          style={{ maxHeight: "200px" }}
        />

        {/* Action row */}
        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
          {/* File attach */}
          <input ref={fileRef} type="file" className="hidden"
            accept=".csv,.xlsx,.xls,.docx,.doc,.txt,.pdf"
            onChange={handleFile}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-xl text-text-disabled hover:text-text-primary hover:bg-surface-2 transition-all"
            title="Attach file (CSV, Excel, Word, PDF, TXT)"
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-text-disabled border-t-gem-blue rounded-full animate-spin" />
              : <Paperclip size={17} />
            }
          </button>

          <span className="text-xs text-text-disabled ml-1">CSV · Excel · Word · PDF</span>

          <div className="flex-1" />

          {/* Send */}
          <button
            onClick={submit}
            disabled={!value.trim() || streaming || disabled}
            className={clsx(
              "p-2.5 rounded-xl transition-all",
              value.trim() && !streaming && !disabled
                ? "bg-gem-accent text-white hover:bg-gem-accent/90 shadow-md"
                : "bg-surface-2 text-text-disabled cursor-not-allowed"
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-text-disabled mt-2">
        Stellar AI can make mistakes. Always verify critical procurement details.
      </p>
    </div>
  );
}

function Toggle({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={clsx("toggle-pill text-xs", active && "active")}>
      {icon}
      {label}
    </button>
  );
}

function ModelMenu({ models, selected, onSelect, onClose, label, align = "left" }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className={clsx(
        "absolute z-20 mt-1 w-56 bg-surface-1 border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in",
        align === "right" ? "right-0" : "left-0"
      )}>
        <p className="text-xs text-text-disabled font-medium px-3 pt-2.5 pb-1 uppercase tracking-wider">{label}</p>
        {models.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={clsx(
              "w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
              selected === m.id
                ? "bg-gem-blue/10 text-gem-blue"
                : "text-text-primary hover:bg-surface-2"
            )}
          >
            <span className="flex-1">{m.name}</span>
            {m.context && <span className="text-xs text-text-disabled">{m.context}</span>}
            {m.speed && <span className="text-xs text-gem-teal">{m.speed}</span>}
          </button>
        ))}
      </div>
    </>
  );
}
