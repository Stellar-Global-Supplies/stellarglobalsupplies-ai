import { useState } from "react";
import { useAuthStore } from "../lib/store.js";
import { Image as ImageIcon, Download, RefreshCw, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

export default function ImagePanel({ prompt, imageModel, onClose, onInsert }) {
  const { getHeaders } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [customPrompt, setCustomPrompt] = useState(prompt || "");

  async function generate(p = customPrompt) {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const res = await fetch(`${API}/image/generate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ prompt: p, model: imageModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.image);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate on mount if prompt given
  useState(() => { if (prompt) generate(prompt); }, []);

  function download() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "gemini-image.png";
    a.click();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-1 border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gem-purple/20 flex items-center justify-center">
              <ImageIcon size={16} className="text-gem-purple" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Stellar Image Generation</p>
              <p className="text-xs text-text-disabled">{imageModel?.split("/").pop()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-disabled hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Prompt input */}
        <div className="p-5">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe the image you want to generate…"
            rows={3}
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3
                       text-text-primary placeholder-text-disabled text-sm resize-none
                       focus:outline-none focus:border-gem-blue transition-colors"
          />

          {/* Image output */}
          <div className="mt-4 rounded-xl overflow-hidden border border-border bg-surface-2 aspect-square flex items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-3 text-text-secondary">
                <div className="gem-logo animate-gem-spin" style={{ width: 36, height: 36 }} />
                <p className="text-sm">Generating image…</p>
              </div>
            )}
            {imageUrl && !loading && (
              <img src={imageUrl} alt={customPrompt} className="w-full h-full object-cover" />
            )}
            {error && !loading && (
              <div className="text-center px-6">
                <p className="text-red-400 text-sm mb-1">Generation failed</p>
                <p className="text-text-disabled text-xs">{error}</p>
              </div>
            )}
            {!loading && !imageUrl && !error && (
              <div className="text-center text-text-disabled">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click Generate to create an image</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => generate()}
              disabled={loading || !customPrompt.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                         bg-gem-accent hover:bg-gem-accent/90 text-white text-sm font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                : <><RefreshCw size={14} /> Generate</>
              }
            </button>

            {imageUrl && (
              <>
                <button
                  onClick={download}
                  className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-text-secondary hover:text-text-primary transition-all"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => { onInsert(imageUrl, customPrompt); onClose(); }}
                  className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-sm text-text-primary transition-all"
                >
                  Insert
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
