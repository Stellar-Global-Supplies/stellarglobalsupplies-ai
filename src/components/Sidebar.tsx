import { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from 'lucide-react';
import type { Conversation } from '@/types';
import { api } from '@/api';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRefresh: () => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, onRefresh }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await api.deleteConversation(id);
      onRefresh();
    } catch (err) {
      alert('Failed to delete conversation');
    }
  }

  function startEdit(conv: Conversation, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  }

  async function saveEdit(id: string) {
    try {
      await api.updateConversation(id, { title: editTitle });
      setEditingId(null);
      onRefresh();
    } catch {
      alert('Failed to rename conversation');
    }
  }

  return (
    <aside className="w-64 h-full bg-gem-bg dark:bg-gem-dark border-r border-gem-border dark:border-gem-darkBorder flex flex-col">
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-full bg-gem-blue text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8 px-4">
            No conversations yet
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <div
                  onClick={() => editingId !== conv.id && onSelect(conv.id)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition ${
                    activeId === conv.id
                      ? 'bg-gem-blue/10 dark:bg-gem-blue/20 text-gem-blue dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gem-darkSurface'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
                  {editingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        ref={editRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(conv.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 min-w-0 px-1.5 py-0.5 text-sm rounded border border-gem-blue bg-white dark:bg-gem-dark text-gray-900 dark:text-gray-100 focus:outline-none"
                      />
                      <button onClick={(e) => { e.stopPropagation(); saveEdit(conv.id); }} className="p-1 hover:bg-gem-blue/20 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate">{conv.title}</span>
                      <button
                        onClick={(e) => startEdit(conv, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
