import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User as UserIcon, Sparkles, FileText, ImageIcon, Loader2 } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  userName?: string;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, userName, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-medium">
            {userName?.charAt(0).toUpperCase() || 'U'}
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full stellar-gradient-bg flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`text-sm font-medium mb-1 ${isUser ? 'text-gray-600 dark:text-gray-300' : 'stellar-gradient'}`}>
          {isUser ? userName || 'You' : 'Stellar AI'}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : ''}`}>
            {message.attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gem-darkSurface border border-gem-border dark:border-gem-darkBorder text-xs text-gray-600 dark:text-gray-300"
              >
                <FileText className="w-4 h-4 text-gem-blue" />
                <span className="truncate max-w-32">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Image */}
        {message.image_url && (
          <div className="mb-2">
            <img
              src={message.image_url}
              alt="Generated"
              className="max-w-sm rounded-xl border border-gem-border dark:border-gem-darkBorder shadow-sm"
            />
          </div>
        )}

        {/* Content */}
        <div
          className={`prose-chat rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gem-blue text-white'
              : 'bg-white dark:bg-gem-darkSurface border border-gem-border dark:border-gem-darkBorder text-gray-800 dark:text-gray-100'
          }`}
        >
          {isStreaming && !message.content ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          )}
          {isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 bg-gem-blue ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
}
