import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Globe,
  Database,
  ImageIcon,
  X,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import type { GroqModel, ImageModel, Attachment } from '@/types';
import { api } from '@/api';

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[], options: ToolOptions) => void;
  disabled: boolean;
  models: GroqModel[];
  imageModels: ImageModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  onGenerateImage: (prompt: string, model: string) => void;
}

interface ToolOptions {
  useWeb: boolean;
  useEntData: boolean;
  generateImage: boolean;
  imageModel: string;
}

export default function ChatInput({
  onSend,
  disabled,
  models,
  imageModels,
  selectedModel,
  onModelChange,
  onGenerateImage,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useWeb, setUseWeb] = useState(false);
  const [useEntData, setUseEntData] = useState(false);
  const [generateImage, setGenerateImage] = useState(false);
  const [imageModel, setImageModel] = useState(imageModels[0]?.id || '');
  const [uploading, setUploading] = useState(false);
  const [modelDropdown, setModelDropdown] = useState(false);
  const [imageModelDropdown, setImageModelDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (imageModels.length > 0 && !imageModel) setImageModel(imageModels[0].id);
  }, [imageModels, imageModel]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [text]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const parsed = await Promise.all(Array.from(files).map((f) => api.parseFile(f)));
      setAttachments((prev) => [...prev, ...parsed]);
    } catch (err) {
      alert('Failed to parse file: ' + (err instanceof Error ? err.message : 'unknown error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleSend() {
    if (!text.trim() || disabled) return;
    if (generateImage) {
      onGenerateImage(text.trim(), imageModel);
    } else {
      onSend(text.trim(), attachments, { useWeb, useEntData, generateImage, imageModel });
    }
    setText('');
    setAttachments([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-4">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gem-darkSurface border border-gem-border dark:border-gem-darkBorder text-xs"
            >
              <Paperclip className="w-3.5 h-3.5 text-gem-blue" />
              <span className="truncate max-w-32 text-gray-600 dark:text-gray-300">{att.name}</span>
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gem-darkSurface rounded-2xl border border-gem-border dark:border-gem-darkBorder shadow-sm focus-within:ring-2 focus-within:ring-gem-blue/30 transition">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={generateImage ? 'Describe an image to generate...' : 'Enter a prompt here'}
          className="w-full px-4 pt-4 pb-2 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1.5">
            {/* Attach */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled || generateImage}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition disabled:opacity-40"
              title="Attach file"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.docx,.pdf,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Web search toggle */}
            <button
              onClick={() => setUseWeb((v) => !v)}
              disabled={disabled || generateImage}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition disabled:opacity-40 ${
                useWeb
                  ? 'bg-gem-blue/10 dark:bg-gem-blue/20 text-gem-blue dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Search the web"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Web</span>
            </button>

            {/* Enterprise data toggle */}
            <button
              onClick={() => setUseEntData((v) => !v)}
              disabled={disabled || generateImage}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition disabled:opacity-40 ${
                useEntData
                  ? 'bg-gem-purple/10 dark:bg-gem-purple/20 text-gem-purple dark:text-purple-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Use enterprise data"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Ent data</span>
            </button>

            {/* Image generation toggle */}
            <button
              onClick={() => setGenerateImage((v) => !v)}
              disabled={disabled}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                generateImage
                  ? 'bg-gem-pink/10 dark:bg-gem-pink/20 text-gem-pink dark:text-pink-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Generate image"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Image</span>
            </button>

            {/* Image model selector (only when image mode on) */}
            {generateImage && imageModels.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setImageModelDropdown((v) => !v)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="truncate max-w-28">
                    {imageModels.find((m) => m.id === imageModel)?.label || 'Select model'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {imageModelDropdown && (
                  <div className="absolute bottom-full mb-1 left-0 w-56 bg-white dark:bg-gem-darkSurface border border-gem-border dark:border-gem-darkBorder rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                    {imageModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setImageModel(m.id); setImageModelDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          imageModel === m.id ? 'text-gem-blue font-medium' : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Model selector */}
            {!generateImage && models.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setModelDropdown((v) => !v)}
                  disabled={disabled}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <span className="truncate max-w-32">
                    {models.find((m) => m.id === selectedModel)?.label || selectedModel}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {modelDropdown && (
                  <div className="absolute bottom-full mb-1 right-0 w-56 bg-white dark:bg-gem-darkSurface border border-gem-border dark:border-gem-darkBorder rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { onModelChange(m.id); setModelDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          selectedModel === m.id ? 'text-gem-blue font-medium' : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              className="p-2.5 rounded-full stellar-gradient-bg text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
        Stellar AI may produce inaccurate information. Verify important details.
      </p>
    </div>
  );
}
