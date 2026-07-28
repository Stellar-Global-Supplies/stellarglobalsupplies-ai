import { useEffect, useState } from "react";
import { useChatStore, useAuthStore } from "../lib/store.js";
import clsx from "clsx";
import {
  Plus, MessageSquare, Trash2, LogOut, ChevronLeft,
} from "lucide-react";
import StellarGearLogo from "./StellarGearLogo.jsx";

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuthStore();
  const {
    conversations, fetchConversations, newConversation,
    activeConvId, selectConversation, deleteConversation,
  } = useChatStore();
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => { fetchConversations(); }, []);

  const grouped = groupByDate(conversations);

  return (
    <aside
      className={clsx(
        "flex flex-col h-full bg-surface border-r border-border transition-all duration-300 overflow-hidden",
        collapsed ? "w-0 opacity-0" : "w-[280px] opacity-100"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <StellarLogoMark />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-text-primary text-base tracking-tight gem-gradient">Stellar AI</span>
            <span className="text-[10px] text-text-disabled tracking-wide">by Stellar Global Supplies</span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 mb-2 shrink-0">
        <button
          onClick={newConversation}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full
                     bg-surface-2 hover:bg-surface-3 border border-border
                     text-text-primary text-sm font-medium transition-all group"
        >
          <Plus size={18} className="text-text-secondary group-hover:text-gem-blue transition-colors" />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
        {Object.entries(grouped).map(([label, convs]) => (
          <div key={label}>
            <p className="text-xs text-text-disabled font-medium px-3 mb-1 uppercase tracking-wider">{label}</p>
            {convs.map((conv) => (
              <div
                key={conv.id}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={clsx(
                  "group relative flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all",
                  activeConvId === conv.id
                    ? "bg-surface-2 text-text-primary"
                    : "text-text-secondary hover:bg-surface-1 hover:text-text-primary"
                )}
                onClick={() => selectConversation(conv.id)}
              >
                <MessageSquare size={15} className="shrink-0 opacity-60" />
                <span className="text-sm truncate flex-1">{conv.title}</span>
                {hoveredId === conv.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="p-1 rounded-lg hover:bg-surface-3 text-text-disabled hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
        {conversations.length === 0 && (
          <div className="text-center py-8 text-text-disabled text-sm">No conversations yet</div>
        )}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gem-blue/20 flex items-center justify-center text-gem-blue text-sm font-semibold">
            {(user?.name || user?.email || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name || "User"}</p>
            <p className="text-xs text-text-disabled truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-surface-2 text-text-disabled hover:text-text-primary transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function StellarLogoMark() {
  return <StellarGearLogo size={26} />;
}

function groupByDate(convs) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today - 86400000);
  const week = new Date(today - 7 * 86400000);
  const month = new Date(today - 30 * 86400000);
  const groups = { Today: [], Yesterday: [], "Previous 7 days": [], "Previous 30 days": [], Older: [] };
  for (const c of convs) {
    const d = new Date(c.updated_at);
    if (d >= today) groups["Today"].push(c);
    else if (d >= yesterday) groups["Yesterday"].push(c);
    else if (d >= week) groups["Previous 7 days"].push(c);
    else if (d >= month) groups["Previous 30 days"].push(c);
    else groups["Older"].push(c);
  }
  return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
}
